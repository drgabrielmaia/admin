'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Phone, X } from 'lucide-react'

interface Lead {
  id: string
  nome: string
  email?: string
  telefone?: string
  origem: string
  status: string
}

interface Produto {
  id: string
  nome: string
  tipo: string
  preco: number
}

interface RegistrarChamadaFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function RegistrarChamadaForm({ onSuccess, onCancel }: RegistrarChamadaFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  
  const [formData, setFormData] = useState({
    lead_id: '',
    duracao_minutos: '',
    resultado: '',
    produto_id: '',
    valor: '',
    observacoes: ''
  })

  useEffect(() => {
    loadLeadsAndProducts()
  }, [])

  const loadLeadsAndProducts = async () => {
    try {
      // Carregar apenas leads atribuídos a este closer
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, nome, email, telefone, origem, status')
        .eq('closer_id', user?.id)
        .eq('status_atribuicao', 'atribuido')
        .in('status', ['qualificado', 'agendado'])
        .order('nome')

      setLeads(leadsData || [])

      // Carregar produtos
      const { data: produtosData } = await supabase
        .from('produtos')
        .select('id, nome, tipo, preco')
        .eq('status', 'ativo')
        .order('nome')

      setProdutos(produtosData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || user.funcao !== 'closer') {
      setError('Apenas closers podem registrar chamadas')
      return
    }

    if (!formData.lead_id || !formData.duracao_minutos || !formData.resultado) {
      setError('Lead, duração e resultado são obrigatórios')
      return
    }

    if (formData.resultado === 'venda' && (!formData.produto_id || !formData.valor)) {
      setError('Para vendas, produto e valor são obrigatórios')
      return
    }

    setLoading(true)
    setError('')

    try {
      const chamadaData = {
        lead_id: formData.lead_id,
        closer_id: user.id,
        duracao_minutos: parseInt(formData.duracao_minutos),
        resultado: formData.resultado,
        produto_id: formData.produto_id || null,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        observacoes: formData.observacoes.trim() || null,
        data_chamada: new Date().toISOString()
      }

      const { data, error: insertError } = await supabase
        .from('chamadas')
        .insert(chamadaData)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Se foi uma venda, atualizar status do lead para convertido e gerar comissões
      if (formData.resultado === 'venda' && formData.produto_id && formData.valor) {
        // Atualizar status do lead
        await supabase
          .from('leads')
          .update({ 
            status: 'convertido',
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.lead_id)

        // Buscar dados do lead para obter o SDR
        const { data: leadData } = await supabase
          .from('leads')
          .select('sdr_id')
          .eq('id', formData.lead_id)
          .single()

        // Buscar dados do produto para calcular comissões e tipo de motor
        const { data: produtoData } = await supabase
          .from('produtos')
          .select('comissao_sdr_percent, comissao_closer_percent, tipo, nome')
          .eq('id', formData.produto_id)
          .single()

        if (leadData && produtoData) {
          const valor = parseFloat(formData.valor)
          const comissaoSdr = (valor * (produtoData.comissao_sdr_percent || 0)) / 100
          const comissaoCloser = (valor * (produtoData.comissao_closer_percent || 0)) / 100

          // Inserir comissão para o SDR
          if (comissaoSdr > 0 && leadData.sdr_id) {
            await supabase
              .from('comissoes')
              .insert({
                sdr_id: leadData.sdr_id,
                closer_id: null,
                lead_id: formData.lead_id,
                produto_id: formData.produto_id,
                chamada_id: data.id,
                tipo_comissao: 'sdr',
                valor_venda: valor,
                comissao_sdr: comissaoSdr,
                comissao_closer: 0,
                data_venda: new Date().toISOString(),
                status: 'pendente'
              })
          }

          // Inserir comissão para o Closer
          if (comissaoCloser > 0) {
            await supabase
              .from('comissoes')
              .insert({
                sdr_id: leadData.sdr_id,
                closer_id: user.id,
                lead_id: formData.lead_id,
                produto_id: formData.produto_id,
                chamada_id: data.id,
                tipo_comissao: 'closer',
                valor_venda: valor,
                comissao_sdr: 0,
                comissao_closer: comissaoCloser,
                data_venda: new Date().toISOString(),
                status: 'pendente'
              })
          }

          // Registrar entrada no BPO do motor correspondente
          const motorMap: Record<string, string> = {
            'mentoria': 'mentoria',
            'infoproduto': 'infoproduto', 
            'saas': 'saas',
            'fisico': 'fisico',
            'parceria': 'parceria',
            'clinica': 'clinica',
            'evento': 'evento'
          }

          const motorType = motorMap[produtoData.tipo]
          if (motorType) {
            await supabase
              .from('movimentacoes_bpo')
              .insert({
                motor: motorType,
                tipo: 'entrada',
                categoria: 'Vendas',
                valor: valor,
                descricao: `Venda: ${produtoData.nome} - Lead: ${leadData.sdr_id ? 'SDR+Closer' : 'Closer'}`,
                data_movimento: new Date().toISOString(),
                origem_venda: 'lead_conversion',
                lead_id: formData.lead_id,
                produto_id: formData.produto_id,
                usuario_id: user.id
              })
          }
        }
      } else if (formData.resultado === 'nao_interessado') {
        // Se não teve interesse, marcar como perdido
        await supabase
          .from('leads')
          .update({ 
            status: 'perdido',
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.lead_id)
      }

      console.log('✅ Chamada registrada com sucesso:', data)
      
      // Limpar formulário
      setFormData({
        lead_id: '',
        duracao_minutos: '',
        resultado: '',
        produto_id: '',
        valor: '',
        observacoes: ''
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('Erro ao registrar chamada:', err)
      setError(err.message || 'Erro ao registrar chamada')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Se mudou o produto, atualizar o valor automaticamente
      if (field === 'produto_id' && value) {
        const produto = produtos.find(p => p.id === value)
        if (produto) {
          newData.valor = produto.preco.toString()
        }
      }
      
      // Se resultado não é venda, limpar produto e valor
      if (field === 'resultado' && value !== 'venda') {
        newData.produto_id = ''
        newData.valor = ''
      }
      
      return newData
    })
  }

  const getLeadInfo = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    return lead ? `${lead.nome} (${lead.origem})` : ''
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-green-400" />
            <span>Registrar Chamada</span>
          </span>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead_id" className="text-slate-300">
                Lead *
              </Label>
              <Select value={formData.lead_id} onValueChange={(value) => handleChange('lead_id', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione o lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.nome} - {lead.origem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao_minutos" className="text-slate-300">
                Duração (minutos) *
              </Label>
              <Input
                id="duracao_minutos"
                type="number"
                min="1"
                max="300"
                value={formData.duracao_minutos}
                onChange={(e) => handleChange('duracao_minutos', e.target.value)}
                placeholder="30"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resultado" className="text-slate-300">
                Resultado *
              </Label>
              <Select value={formData.resultado} onValueChange={(value) => handleChange('resultado', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Venda Fechada</SelectItem>
                  <SelectItem value="interessado">Interessado - Reagendar</SelectItem>
                  <SelectItem value="nao_interessado">Não Interessado</SelectItem>
                  <SelectItem value="nao_atendeu">Não Atendeu</SelectItem>
                  <SelectItem value="reagendar">Reagendar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.resultado === 'venda' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="produto_id" className="text-slate-300">
                    Produto Vendido *
                  </Label>
                  <Select value={formData.produto_id} onValueChange={(value) => handleChange('produto_id', value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome} - R$ {produto.preco.toLocaleString()} ({produto.tipo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-slate-300">
                    Valor da Venda (R$) *
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={(e) => handleChange('valor', e.target.value)}
                    placeholder="2500.00"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-slate-300">
              Observações
            </Label>
            <textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Detalhes da chamada, objeções, próximos passos..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Registrar Chamada
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={loading}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}