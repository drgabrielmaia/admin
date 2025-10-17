'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { forceUpdateLeadsMetas } from '@/lib/metas-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, X } from 'lucide-react'

interface NovoLeadFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function NovoLeadForm({ onSuccess, onCancel }: NovoLeadFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [produtos, setProdutos] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    origem: '',
    valor_estimado: '',
    observacoes: '',
    ja_vendeu: false,  // Novo campo para indicar se é uma venda direta
    produto_id: ''     // Produto selecionado quando já vendeu
  })

  const origens = [
    'Facebook Ads',
    'Google Ads',
    'Instagram',
    'LinkedIn',
    'YouTube',
    'TikTok',
    'Indicação',
    'WhatsApp',
    'Site/Landing Page',
    'Evento',
    'Cold Email',
    'Cold Call',
    'Outro'
  ]

  // Carregar produtos ao montar componente
  useEffect(() => {
    loadProdutos()
  }, [])

  const loadProdutos = async () => {
    try {
      // Buscar produtos organizados por motor/tipo
      const { data, error } = await supabase
        .from('produtos')
.select('id, nome, tipo, preco, custo, descricao')
        .eq('status', 'ativo')
        .order('tipo', { ascending: true })
        .then(result => {
          if (result.error) throw result.error
          
          // Agrupar produtos por motor para melhor organização
          const produtosAgrupados = (result.data || []).map(produto => ({
            ...produto,
            valor_exibicao: produto.preco || 0,
            motor_display: getMotorDisplayName(produto.tipo)
          }))
          
          return { data: produtosAgrupados, error: null }
        })

      if (error) throw error
      setProdutos(data || [])
      console.log('📦 Produtos carregados por motor:', data)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const getMotorDisplayName = (tipo: string) => {
    const motores = {
      'mentoria': '🎯 Mentoria',
      'infoproduto': '💻 Infoproduto', 
      'evento': '🎪 Evento',
      'clinica': '🏥 Clínica',
      'saas': '☁️ SaaS',
      'fisico': '📦 Produto Físico',
      'parceria': '🤝 Parceria'
    }
    return motores[tipo] || `📋 ${tipo}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || user.funcao !== 'sdr') {
      setError('Apenas SDRs podem cadastrar leads')
      return
    }

    if (!formData.nome.trim() || !formData.origem) {
      setError('Nome e origem são obrigatórios')
      return
    }

    if (formData.ja_vendeu && !formData.produto_id) {
      setError('Selecione o produto vendido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const leadData = {
        nome: formData.nome.trim(),
        email: formData.email.trim() || null,
        telefone: formData.telefone.trim() || null,
        origem: formData.origem,
        valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : null,
        observacoes: formData.observacoes.trim() || null,
        sdr_id: user.id,
        status: formData.ja_vendeu ? 'convertido' : 'novo',
        produto_id: formData.ja_vendeu ? formData.produto_id : null
      }

      const { data, error: insertError } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      console.log('✅ Lead criado com sucesso:', data)
      
      // Atualizar metas para refletir o novo lead (apenas se não for convertido)
      if (!formData.ja_vendeu) {
        try {
          console.log('🔄 Atualizando metas após novo lead...')
          
          const result = await forceUpdateLeadsMetas(user.id)
          console.log('✅ Resultado da atualização de metas:', result)
          
        } catch (metaError) {
          console.warn('⚠️ Erro ao atualizar metas:', metaError)
          // Não bloquear o sucesso por causa das metas
        }
      } else {
        console.log('📋 Lead marcado como convertido - aguardando aprovação administrativa')
        console.log('🚫 Metas NÃO foram atualizadas - lead deve ser aprovado primeiro')
      }
      
      // Limpar formulário
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        origem: '',
        valor_estimado: '',
        observacoes: '',
        ja_vendeu: false,
        produto_id: ''
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      console.error('Erro ao criar lead:', err)
      setError(err.message || 'Erro ao cadastrar lead')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'ja_vendeu' ? value : value
    }))
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-400" />
            <span>Novo Lead</span>
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
              <Label htmlFor="nome" className="text-slate-300">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Nome do lead"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplo.com"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-slate-300">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem" className="text-slate-300">
                Origem *
              </Label>
              <Select value={formData.origem} onValueChange={(value) => handleChange('origem', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  {origens.map((origem) => (
                    <SelectItem key={origem} value={origem}>
                      {origem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_estimado" className="text-slate-300">
                Valor Estimado (R$)
              </Label>
              <Input
                id="valor_estimado"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_estimado}
                onChange={(e) => handleChange('valor_estimado', e.target.value)}
                placeholder="2500.00"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Opção para marcar como venda direta */}
          <div className="flex items-center space-x-2 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <Switch
              id="ja_vendeu"
              checked={formData.ja_vendeu}
              onCheckedChange={(checked) => handleChange('ja_vendeu', checked)}
            />
            <div>
              <Label htmlFor="ja_vendeu" className="text-slate-300 font-medium">
                Lead já fechou venda
              </Label>
              <p className="text-sm text-slate-400">
                Marque esta opção se o lead já confirmou a compra. Ele ficará pendente de aprovação administrativa e não contará nas metas até ser aprovado.
              </p>
            </div>
          </div>

          {/* Seleção de produto quando já vendeu */}
          {formData.ja_vendeu && (
            <div className="space-y-2 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <Label htmlFor="produto_id" className="text-slate-300">
                Produto Vendido *
              </Label>
              <Select value={formData.produto_id} onValueChange={(value) => handleChange('produto_id', value)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Selecione o produto vendido" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.length > 0 ? (
                    produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <span className="font-medium">{produto.nome}</span>
                            <span className="text-xs text-slate-500">{produto.motor_display}</span>
                          </div>
                          <span className="text-xs text-emerald-400 ml-2 font-semibold">
                            R$ {produto.valor_exibicao?.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_loading" disabled>
                      Carregando produtos...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Este produto será associado à venda após aprovação
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-slate-300">
              Observações
            </Label>
            <textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Informações adicionais sobre o lead..."
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
                  Cadastrando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Lead
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