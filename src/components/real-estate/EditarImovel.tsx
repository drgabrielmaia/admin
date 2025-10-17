'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Save,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface ImovelData {
  id: string
  nome: string
  tipo: string
  endereco: string
  cidade: string
  estado: string
  cep: string | null
  metragem: number | null
  quartos: number | null
  banheiros: number | null
  vagas_garagem: number | null
  descricao: string | null
  valor_compra: number
  valor_venda_pretendido: number
  valor_venda_final: number | null
  status: string
  data_compra: string
  data_venda: string | null
}

interface EditarImovelProps {
  imovelId: string
}

export function EditarImovel({ imovelId }: EditarImovelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imovel, setImovel] = useState<ImovelData | null>(null)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    loadImovel()
  }, [imovelId])

  const loadImovel = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', imovelId)
        .single()

      if (error) {
        console.error('Erro ao carregar imóvel:', error)
        return
      }

      setImovel(data)
      setFormData({
        nome: data.nome,
        tipo: data.tipo,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep || '',
        metragem: data.metragem?.toString() || '',
        quartos: data.quartos?.toString() || '',
        banheiros: data.banheiros?.toString() || '',
        vagas_garagem: data.vagas_garagem?.toString() || '',
        descricao: data.descricao || '',
        valor_compra: data.valor_compra.toString(),
        valor_venda_pretendido: data.valor_venda_pretendido.toString(),
        valor_venda_final: data.valor_venda_final?.toString() || '',
        status: data.status,
        data_compra: data.data_compra,
        data_venda: data.data_venda || ''
      })
    } catch (error) {
      console.error('Erro ao buscar imóvel:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.endereco || !formData.cidade || !formData.valor_compra || !formData.valor_venda_pretendido) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Se está mudando para 'vendido', validar campos obrigatórios de venda
    if (formData.status === 'vendido' && (!formData.valor_venda_final || parseFloat(formData.valor_venda_final) <= 0)) {
      alert('Para marcar como vendido, é necessário informar o valor de venda final.')
      return
    }

    try {
      setSaving(true)

      const updateData: any = {
        nome: formData.nome,
        tipo: formData.tipo,
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep || null,
        metragem: formData.metragem ? parseFloat(formData.metragem) : null,
        quartos: formData.quartos ? parseInt(formData.quartos) : null,
        banheiros: formData.banheiros ? parseInt(formData.banheiros) : null,
        vagas_garagem: formData.vagas_garagem ? parseInt(formData.vagas_garagem) : null,
        descricao: formData.descricao || null,
        valor_compra: parseFloat(formData.valor_compra),
        valor_venda_pretendido: parseFloat(formData.valor_venda_pretendido),
        data_compra: formData.data_compra
      }

      // Se está mudando de status para 'vendido' e não estava vendido antes
      const isChangingToSold = formData.status === 'vendido' && imovel?.status !== 'vendido'
      
      if (isChangingToSold) {
        // Usar a função finalizar_venda_imovel para registrar a venda corretamente
        const valorVendaFinal = parseFloat(formData.valor_venda_final)
        const dataVenda = formData.data_venda || new Date().toISOString().split('T')[0]

        // Chamar a função que registra a venda no sistema de faturamento
        // Passando responsavel_id como null para usar o admin padrão
        const { error } = await supabase.rpc('finalizar_venda_imovel', {
          p_imovel_id: imovelId,
          p_valor_venda_final: valorVendaFinal,
          p_data_venda: dataVenda,
          p_responsavel_id: null
        })

        if (error) {
          console.error('Erro ao finalizar venda do imóvel:', error)
          alert('Erro ao finalizar venda do imóvel. Verifique o console.')
          return
        }

        alert('Venda registrada com sucesso! O imóvel agora aparecerá no faturamento.')
      } else {
        // Para outros casos, apenas atualizar normalmente
        if (formData.status === 'vendido') {
          updateData.valor_venda_final = formData.valor_venda_final ? parseFloat(formData.valor_venda_final) : null
          updateData.data_venda = formData.data_venda || new Date().toISOString().split('T')[0]
        } else {
          updateData.valor_venda_final = null
          updateData.data_venda = null
        }
        updateData.status = formData.status

        const { error } = await supabase
          .from('imoveis')
          .update(updateData)
          .eq('id', imovelId)

        if (error) {
          console.error('Erro ao atualizar imóvel:', error)
          alert('Erro ao atualizar imóvel. Verifique o console.')
          return
        }

        alert('Imóvel atualizado com sucesso!')
      }

      router.push('/dashboard/admin/real-estate')
    } catch (error) {
      console.error('Erro ao atualizar imóvel:', error)
      alert('Erro interno. Verifique o console.')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'em_negociacao':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'vendido':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'indisponivel':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível'
      case 'em_negociacao':
        return 'Em Negociação'
      case 'vendido':
        return 'Vendido'
      case 'indisponivel':
        return 'Indisponível'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!imovel) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Imóvel não encontrado
        </h3>
        <Link href="/dashboard/admin/real-estate">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Lista
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/admin/real-estate">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
            Editar Imóvel
          </h2>
          <p className="text-muted-foreground mt-1 flex items-center space-x-2">
            <span>{imovel.nome}</span>
            <Badge variant="outline" className={getStatusColor(imovel.status)}>
              {getStatusLabel(imovel.status)}
            </Badge>
          </p>
        </div>
      </div>

      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-primary" />
            <span>Informações do Imóvel</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Imóvel *</Label>
                <Input
                  id="nome"
                  value={formData.nome || ''}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Ex: Casa Centro - Lote 01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <select
                  id="tipo"
                  value={formData.tipo || ''}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="terreno">Terreno</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="consultorio">Consultório</option>
                  <option value="sala_comercial">Sala Comercial</option>
                  <option value="loja">Loja</option>
                  <option value="galpao">Galpão</option>
                  <option value="predio">Prédio</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Status e Data de Venda */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={formData.status || ''}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  required
                >
                  <option value="disponivel">Disponível</option>
                  <option value="em_negociacao">Em Negociação</option>
                  <option value="vendido">Vendido</option>
                  <option value="indisponivel">Indisponível</option>
                </select>
              </div>

              {formData.status === 'vendido' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="valor_venda_final">Valor de Venda Final *</Label>
                    <Input
                      id="valor_venda_final"
                      type="number"
                      step="0.01"
                      value={formData.valor_venda_final || ''}
                      onChange={(e) => handleInputChange('valor_venda_final', e.target.value)}
                      placeholder="280000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_venda">Data de Venda</Label>
                    <Input
                      id="data_venda"
                      type="date"
                      value={formData.data_venda || ''}
                      onChange={(e) => handleInputChange('data_venda', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco || ''}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade || ''}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Input
                    id="estado"
                    value={formData.estado || ''}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    placeholder="SP"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep || ''}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metragem">Metragem (m²)</Label>
                <Input
                  id="metragem"
                  type="number"
                  step="0.01"
                  value={formData.metragem || ''}
                  onChange={(e) => handleInputChange('metragem', e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quartos">Quartos</Label>
                <Input
                  id="quartos"
                  type="number"
                  value={formData.quartos || ''}
                  onChange={(e) => handleInputChange('quartos', e.target.value)}
                  placeholder="3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banheiros">Banheiros</Label>
                <Input
                  id="banheiros"
                  type="number"
                  value={formData.banheiros || ''}
                  onChange={(e) => handleInputChange('banheiros', e.target.value)}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vagas_garagem">Vagas de Garagem</Label>
                <Input
                  id="vagas_garagem"
                  type="number"
                  value={formData.vagas_garagem || ''}
                  onChange={(e) => handleInputChange('vagas_garagem', e.target.value)}
                  placeholder="2"
                />
              </div>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_compra">Valor de Compra *</Label>
                <Input
                  id="valor_compra"
                  type="number"
                  step="0.01"
                  value={formData.valor_compra || ''}
                  onChange={(e) => handleInputChange('valor_compra', e.target.value)}
                  placeholder="150000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_venda_pretendido">Valor de Venda Pretendido *</Label>
                <Input
                  id="valor_venda_pretendido"
                  type="number"
                  step="0.01"
                  value={formData.valor_venda_pretendido || ''}
                  onChange={(e) => handleInputChange('valor_venda_pretendido', e.target.value)}
                  placeholder="220000"
                  required
                />
              </div>
            </div>

            {/* Data de Compra */}
            <div className="space-y-2">
              <Label htmlFor="data_compra">Data de Compra *</Label>
              <Input
                id="data_compra"
                type="date"
                value={formData.data_compra || ''}
                onChange={(e) => handleInputChange('data_compra', e.target.value)}
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ''}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descrição detalhada do imóvel..."
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3">
              <Link href="/dashboard/admin/real-estate">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}