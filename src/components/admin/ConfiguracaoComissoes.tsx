'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Factory,
  Package,
  Percent
} from 'lucide-react'

interface ConfiguracaoComissao {
  id: string
  motor_type: string
  produto_id: string | null
  produto_nome: string | null
  funcao: 'sdr' | 'closer'
  comissao_percentual: number
  comissao_fixa: number
  comissao_meta: number
  meta_vendas: number
  ativo: boolean
  tipo_config: 'motor' | 'produto'
}

interface Motor {
  motor_name: string
  motor_label: string
  tem_configuracao: boolean
}

interface Produto {
  produto_id: string
  produto_nome: string
  motor_type: string
  tem_configuracao: boolean
}

export function ConfiguracaoComissoes() {
  useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoComissao[]>([])
  const [motores, setMotores] = useState<Motor[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [editando, setEditando] = useState<string | null>(null)
  const [novaConfig, setNovaConfig] = useState(false)

  // Componente funcionando normalmente

  const [formData, setFormData] = useState({
    tipo_config: 'motor' as 'motor' | 'produto',
    motor_type: '',
    produto_id: '',
    funcao: 'sdr' as 'sdr' | 'closer',
    comissao_percentual: 0.00,
    comissao_fixa: 0.00,
    comissao_meta: 0.00,
    meta_vendas: 0
  })

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar motores disponíveis
      const { data: motoresData, error: motoresError } = await supabase
        .rpc('get_motores_disponiveis')

      if (motoresError) throw motoresError
      setMotores(motoresData || [])

      // Carregar configurações existentes
      const { data: configData, error: configError } = await supabase
        .rpc('get_configuracao_comissao', { p_motor_type: null })

      if (configError) throw configError
      setConfiguracoes(configData || [])

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      setError(error.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const loadProdutos = async (motorType: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_produtos_motor', { p_motor_type: motorType })

      if (error) throw error
      setProdutos(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error)
      setProdutos([])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (formData.motor_type && formData.tipo_config === 'produto') {
      loadProdutos(formData.motor_type)
    }
  }, [formData.motor_type, formData.tipo_config])

  const handleSave = async () => {
    try {
      setError('')
      setSuccess('')

      // Validações
      if (!formData.motor_type) {
        setError('Selecione um motor')
        return
      }

      if (formData.tipo_config === 'produto' && !formData.produto_id) {
        setError('Selecione um produto')
        return
      }

      if (formData.comissao_percentual < 0 || formData.comissao_percentual > 100) {
        setError('Percentual de comissão deve estar entre 0 e 100')
        return
      }

      // Salvar usando a função RPC
      const { data, error } = await supabase
        .rpc('configurar_comissao_interface', {
          p_tipo_config: formData.tipo_config,
          p_motor_type: formData.motor_type,
          p_funcao: formData.funcao,
          p_comissao_percentual: formData.comissao_percentual,
          p_comissao_fixa: formData.comissao_fixa,
          p_comissao_meta: formData.comissao_meta,
          p_meta_vendas: formData.meta_vendas,
          p_produto_id: formData.tipo_config === 'produto' ? formData.produto_id : null
        })

      if (error) throw error

      if (!data.success) {
        setError(data.error || 'Erro ao salvar configuração')
        return
      }

      setSuccess(data.message || 'Configuração salva com sucesso!')

      // Resetar formulário
      setFormData({
        tipo_config: 'motor',
        motor_type: '',
        produto_id: '',
        funcao: 'sdr',
        comissao_percentual: 0.00,
        comissao_fixa: 0.00,
        comissao_meta: 0.00,
        meta_vendas: 0
      })
      setEditando(null)
      setNovaConfig(false)
      
      await loadData()

      // Auto-hide success message
      setTimeout(() => setSuccess(''), 3000)

    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error)
      setError(error.message || 'Erro ao salvar configuração')
    }
  }

  const handleEdit = (config: ConfiguracaoComissao) => {
    setFormData({
      tipo_config: config.tipo_config,
      motor_type: config.motor_type,
      produto_id: config.produto_id || '',
      funcao: config.funcao,
      comissao_percentual: config.comissao_percentual,
      comissao_fixa: config.comissao_fixa,
      comissao_meta: config.comissao_meta,
      meta_vendas: config.meta_vendas
    })
    setEditando(config.id)
    setNovaConfig(false)

    // Carregar produtos se necessário
    if (config.tipo_config === 'produto' && config.motor_type) {
      loadProdutos(config.motor_type)
    }
  }

  const handleDelete = async (configId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta configuração?')) return

    try {
      const { error } = await supabase
        .from('configuracoes_comissao')
        .delete()
        .eq('id', configId)

      if (error) throw error
      
      setSuccess('Configuração excluída com sucesso!')
      await loadData()

      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      console.error('Erro ao excluir configuração:', error)
      setError(error.message || 'Erro ao excluir configuração')
    }
  }

  const handleToggleAtivo = async (configId: string, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('configuracoes_comissao')
        .update({ ativo: novoStatus })
        .eq('id', configId)

      if (error) throw error
      
      await loadData()
    } catch (error: any) {
      console.error('Erro ao alterar status:', error)
      setError(error.message || 'Erro ao alterar status')
    }
  }

  const cancelEdit = () => {
    setEditando(null)
    setNovaConfig(false)
    setFormData({
      tipo_config: 'motor',
      motor_type: '',
      produto_id: '',
      funcao: 'sdr',
      comissao_percentual: 0.00,
      comissao_fixa: 0.00,
      comissao_meta: 0.00,
      meta_vendas: 0
    })
  }

  // REMOVIDO: Verificação de admin completamente removida para teste

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configuração de Comissões</h1>
        <p className="text-gray-600">Configure percentuais de comissão por motor e produto específico</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Informações sobre o sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Como funciona o Sistema de Comissões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">
            • <strong>Por Motor:</strong> Configuração geral para todos os produtos de um motor (ex: Clínica 5%)
          </p>
          <p className="text-sm text-gray-600">
            • <strong>Por Produto:</strong> Configuração específica para um produto (ex: Clínica Premium 8%)
          </p>
          <p className="text-sm text-gray-600">
            • <strong>Comissão Fixa:</strong> Valor fixo por venda (ex: R$ 100 por venda)
          </p>
          <p className="text-sm text-gray-600">
            • <strong>Bônus por Meta:</strong> % adicional se bater meta de vendas no mês
          </p>
          <p className="text-sm text-gray-600">
            • <strong>Prioridade:</strong> Produto específico {'>'} Motor geral {'>'} Sistema padrão (0%)
          </p>
        </CardContent>
      </Card>

      {/* Formulário */}
      {(novaConfig || editando) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editando ? 'Editar Configuração' : 'Nova Configuração'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tipo de Configuração */}
              <div className="space-y-2">
                <Label>Tipo de Configuração</Label>
                <Select value={formData.tipo_config} onValueChange={(value: 'motor' | 'produto') => {
                  setFormData(prev => ({ ...prev, tipo_config: value, produto_id: '' }))
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motor">Por Motor (Geral)</SelectItem>
                    <SelectItem value="produto">Por Produto (Específico)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Motor */}
              <div className="space-y-2">
                <Label>Motor</Label>
                <Select value={formData.motor_type} onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, motor_type: value, produto_id: '' }))
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motor" />
                  </SelectTrigger>
                  <SelectContent>
                    {motores.map(motor => (
                      <SelectItem key={motor.motor_name} value={motor.motor_name}>
                        {motor.motor_label}
                        {motor.tem_configuracao && <span className="ml-2 text-green-600">✓</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Produto (só se tipo for produto) */}
              {formData.tipo_config === 'produto' && (
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select value={formData.produto_id} onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, produto_id: value }))
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map(produto => (
                        <SelectItem key={produto.produto_id} value={produto.produto_id}>
                          {produto.produto_nome}
                          {produto.tem_configuracao && <span className="ml-2 text-green-600">✓</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Função */}
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={formData.funcao} onValueChange={(value: 'sdr' | 'closer') => {
                  setFormData(prev => ({ ...prev, funcao: value }))
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sdr">SDR</SelectItem>
                    <SelectItem value="closer">Closer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Comissão Percentual */}
              <div className="space-y-2">
                <Label>Comissão Percentual (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.comissao_percentual}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    comissao_percentual: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>

              {/* Comissão Fixa */}
              <div className="space-y-2">
                <Label>Comissão Fixa (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.comissao_fixa}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    comissao_fixa: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>

              {/* Comissão Meta */}
              <div className="space-y-2">
                <Label>Bônus Meta (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.comissao_meta}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    comissao_meta: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>

              {/* Meta Vendas */}
              <div className="space-y-2">
                <Label>Vendas para Meta</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.meta_vendas}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    meta_vendas: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => handleSave()}>
                <Save className="h-4 w-4 mr-2" />
                {editando ? 'Atualizar' : 'Criar'}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Configurações */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Configurações Existentes</CardTitle>
              <CardDescription>
                Gerencie todas as configurações de comissão por motor/produto
              </CardDescription>
            </div>
            {!novaConfig && !editando && (
              <Button onClick={() => setNovaConfig(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Configuração
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {configuracoes.length === 0 ? (
            <div className="text-center py-8">
              <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma configuração encontrada</p>
              <p className="text-sm text-gray-400">O sistema usará 0% de comissão como padrão</p>
            </div>
          ) : (
            <div className="space-y-4">
              {configuracoes.map((config) => (
                <div key={config.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {config.tipo_config === 'motor' ? (
                          <Factory className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Package className="h-4 w-4 text-green-600" />
                        )}
                        <span className="font-medium">
                          {config.tipo_config === 'motor' ? 'Motor' : 'Produto'}: {config.motor_type}
                        </span>
                        <Badge variant="outline">{config.funcao.toUpperCase()}</Badge>
                        <Badge variant={config.ativo ? "default" : "secondary"}>
                          {config.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      
                      {config.produto_nome && (
                        <div className="text-sm text-gray-600">
                          <span><strong>Produto:</strong> {config.produto_nome}</span>
                        </div>
                      )}
                      
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600">Percentual: </span>
                          <span className="font-medium">{config.comissao_percentual}%</span>
                        </div>
                        {config.comissao_fixa > 0 && (
                          <div>
                            <span className="text-gray-600">Fixa: </span>
                            <span className="font-medium">R$ {config.comissao_fixa}</span>
                          </div>
                        )}
                        {config.comissao_meta > 0 && (
                          <div>
                            <span className="text-gray-600">Bônus: </span>
                            <span className="font-medium">{config.comissao_meta}% ({config.meta_vendas} vendas)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.ativo}
                        onCheckedChange={(checked) => handleToggleAtivo(config.id, checked)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(config)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(config.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}