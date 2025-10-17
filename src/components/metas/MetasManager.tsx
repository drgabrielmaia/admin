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
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Target, 
  X,
  Users,
  User,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { forceUpdateAllMetas } from '@/lib/metas-utils'

interface Meta {
  id: string
  user_id?: string
  tipo: 'individual' | 'equipe'
  categoria: 'leads' | 'vendas' | 'faturamento' | 'comissao' | 'conversao'
  valor_meta: number
  periodo: 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'anual'
  data_inicio: string
  data_fim: string
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada'
  funcao?: 'sdr' | 'closer'
  observacoes?: string
  created_at: string
  updated_at: string
  
  // From view
  usuario_nome?: string
  usuario_funcao?: string
  valor_atual?: number
  percentual_atingido?: number
  status_dia?: string
  nome_exibicao?: string
}

interface Usuario {
  id: string
  nome: string
  funcao: 'sdr' | 'closer' | 'admin'
}

const categorias = [
  { value: 'leads', label: 'Leads Gerados', icon: Users, suffix: '' },
  { value: 'vendas', label: 'Vendas Fechadas', icon: Target, suffix: '' },
  { value: 'faturamento', label: 'Faturamento', icon: DollarSign, suffix: 'R$' },
  { value: 'comissao', label: 'Comissão', icon: TrendingUp, suffix: 'R$' },
  { value: 'conversao', label: 'Taxa de Conversão', icon: TrendingUp, suffix: '%' },
  { value: 'evento', label: 'Motor Evento', icon: Calendar, suffix: '' }
]

const periodos = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'anual', label: 'Anual' }
]

export function MetasManager() {
  const { user } = useAuth()
  const [metas, setMetas] = useState<Meta[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null)
  const [error, setError] = useState('')
  const [updatingMetas, setUpdatingMetas] = useState(false)
  
  const [formData, setFormData] = useState({
    user_id: '',
    tipo: 'individual',
    categoria: 'leads',
    valor_meta: '',
    periodo: 'mensal',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    funcao: 'sdr',
    observacoes: ''
  })

  useEffect(() => {
    loadMetas()
    loadUsuarios()
  }, [])

  const loadMetas = async () => {
    try {
      setLoading(true)
      
      // Primeiro forçar atualização dos dados das metas baseado nos dados reais
      await supabase.rpc('atualizar_metas_com_dados_reais')
      
      const { data, error } = await supabase
        .from('vw_metas_com_progresso')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setMetas(data || [])
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nome, funcao')
        .in('funcao', ['sdr', 'closer'])
        .order('nome')

      if (error) throw error

      setUsuarios(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      user_id: '',
      tipo: 'individual',
      categoria: 'leads',
      valor_meta: '',
      periodo: 'mensal',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
      funcao: 'sdr',
      observacoes: ''
    })
    setEditingMeta(null)
    setShowForm(false)
    setError('')
  }

  const handleEdit = (meta: Meta) => {
    setFormData({
      user_id: meta.user_id || '',
      tipo: meta.tipo,
      categoria: meta.categoria,
      valor_meta: meta.valor_meta ? meta.valor_meta.toString() : '',
      periodo: meta.periodo,
      data_inicio: meta.data_inicio,
      data_fim: meta.data_fim,
      funcao: meta.funcao || 'sdr',
      observacoes: meta.observacoes || ''
    })
    setEditingMeta(meta)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || user.funcao !== 'admin') {
      setError('Apenas admins podem gerenciar metas')
      return
    }

    if (!formData.categoria || !formData.valor_meta || !formData.periodo) {
      setError('Categoria, valor e período são obrigatórios')
      return
    }

    if (formData.tipo === 'individual' && !formData.user_id) {
      setError('Para metas individuais, selecione o usuário')
      return
    }

    if (formData.tipo === 'equipe' && !formData.funcao) {
      setError('Para metas de equipe, selecione a função')
      return
    }

    const valorMeta = parseFloat(formData.valor_meta)
    if (valorMeta <= 0) {
      setError('Valor da meta deve ser maior que zero')
      return
    }

    if (!formData.data_fim) {
      setError('Data fim é obrigatória')
      return
    }

    setError('')

    try {
      const metaData = {
        user_id: formData.tipo === 'individual' ? formData.user_id : null,
        tipo: formData.tipo,
        categoria: formData.categoria,
        valor_meta: valorMeta,
        periodo: formData.periodo,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        funcao: formData.tipo === 'equipe' ? formData.funcao : null,
        observacoes: formData.observacoes.trim() || null,
        status: 'ativa',
        updated_at: new Date().toISOString()
      }

      if (editingMeta) {
        // Atualizar meta existente
        const { data, error } = await supabase
          .from('metas')
          .update(metaData)
          .eq('id', editingMeta.id)
          .select()
          .single()

        if (error) throw error

        console.log('✅ Meta atualizada com sucesso')
      } else {
        // Criar nova meta
        const { data, error } = await supabase
          .from('metas')
          .insert(metaData)
          .select()
          .single()

        if (error) throw error

        console.log('✅ Meta criada com sucesso')
      }

      await loadMetas()
      resetForm()
    } catch (err: any) {
      console.error('Erro ao salvar meta:', err)
      setError(err.message || 'Erro ao salvar meta')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return

    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadMetas()
      console.log('✅ Meta excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir meta:', error)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleForceUpdateMetas = async () => {
    if (!user || user.funcao !== 'admin') return

    setUpdatingMetas(true)
    try {
      console.log('🔄 Forçando atualização de todas as metas...')
      await forceUpdateAllMetas()
      await loadMetas()
      alert('✅ Todas as metas foram atualizadas com dados reais!')
    } catch (error) {
      console.error('❌ Erro ao atualizar metas:', error)
      alert('❌ Erro ao atualizar metas. Verifique o console.')
    } finally {
      setUpdatingMetas(false)
    }
  }

  const getCategoriaInfo = (categoria: string) => {
    return categorias.find(c => c.value === categoria)
  }

  const getProgressColor = (percentual?: number) => {
    if (!percentual) return 'bg-slate-600'
    if (percentual >= 100) return 'bg-green-500'
    if (percentual >= 80) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getStatusDiaIcon = (status?: string) => {
    switch (status) {
      case 'atingido': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'nao_atingido': return <AlertCircle className="h-4 w-4 text-red-400" />
      case 'em_andamento': return <Clock className="h-4 w-4 text-yellow-400" />
      default: return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  const formatValor = (valor: number | null | undefined, categoria: string) => {
    if (!valor && valor !== 0) return '0'
    
    const info = getCategoriaInfo(categoria)
    if (categoria === 'faturamento' || categoria === 'comissao') {
      return formatCurrency(valor)
    }
    if (categoria === 'conversao') {
      return `${valor.toFixed(1)}%`
    }
    return valor.toString()
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-pulse text-slate-400">Carregando metas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Metas Empresariais</h2>
          <p className="text-slate-400">Configure metas empresariais individuais e de equipe</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={handleForceUpdateMetas}
            disabled={updatingMetas}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
          >
            {updatingMetas ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Atualizar Metas
              </>
            )}
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-400" />
                <span>{editingMeta ? 'Editar Meta' : 'Nova Meta'}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-slate-300">Tipo de Meta *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Individual</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="equipe">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Equipe</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo === 'individual' && (
                  <div className="space-y-2">
                    <Label htmlFor="user_id" className="text-slate-300">Usuário *</Label>
                    <Select value={formData.user_id} onValueChange={(value) => handleChange('user_id', value)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Selecione o usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {usuarios.map(usuario => (
                          <SelectItem key={usuario.id} value={usuario.id}>
                            {usuario.nome} ({usuario.funcao.toUpperCase()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.tipo === 'equipe' && (
                  <div className="space-y-2">
                    <Label htmlFor="funcao" className="text-slate-300">Função *</Label>
                    <Select value={formData.funcao} onValueChange={(value) => handleChange('funcao', value)}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sdr">SDR</SelectItem>
                        <SelectItem value="closer">Closer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-slate-300">Categoria *</Label>
                  <Select value={formData.categoria} onValueChange={(value) => handleChange('categoria', value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(categoria => (
                        <SelectItem key={categoria.value} value={categoria.value}>
                          <div className="flex items-center space-x-2">
                            <categoria.icon className="h-4 w-4" />
                            <span>{categoria.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_meta" className="text-slate-300">Valor da Meta *</Label>
                  <Input
                    id="valor_meta"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_meta}
                    onChange={(e) => handleChange('valor_meta', e.target.value)}
                    placeholder="100"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodo" className="text-slate-300">Período *</Label>
                  <Select value={formData.periodo} onValueChange={(value) => handleChange('periodo', value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.map(periodo => (
                        <SelectItem key={periodo.value} value={periodo.value}>
                          {periodo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_inicio" className="text-slate-300">Data Início *</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => handleChange('data_inicio', e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fim" className="text-slate-300">Data Fim *</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => handleChange('data_fim', e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-slate-300">Observações</Label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  placeholder="Detalhes sobre a meta..."
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
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  <Target className="mr-2 h-4 w-4" />
                  {editingMeta ? 'Atualizar Meta' : 'Criar Meta'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metas.map((meta) => {
          const categoriaInfo = getCategoriaInfo(meta.categoria)
          const Icon = categoriaInfo?.icon || Target

          return (
            <Card key={meta.id} className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-green-400" />
                    <span className="text-white">{meta.nome_exibicao}</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(meta)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(meta.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Informações da Meta */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Categoria</p>
                      <p className="text-white font-medium">{categoriaInfo?.label}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Período</p>
                      <p className="text-white font-medium capitalize">{meta.periodo}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Meta</p>
                      <p className="text-white font-medium">{formatValor(meta.valor_meta, meta.categoria)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Status</p>
                      <div className="flex items-center space-x-2">
                        {getStatusDiaIcon(meta.status_dia)}
                        <p className="text-white font-medium capitalize">{meta.status}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progresso */}
                  {meta.valor_atual !== undefined && meta.percentual_atingido !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">Progresso</p>
                        <p className="text-sm font-medium text-white">
                          {formatValor(meta.valor_atual, meta.categoria)} / {formatValor(meta.valor_meta, meta.categoria)}
                        </p>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${getProgressColor(meta.percentual_atingido)}`}
                          style={{ width: `${Math.min(meta.percentual_atingido || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          {meta.data_inicio} - {meta.data_fim}
                        </p>
                        <Badge variant="outline" className={
                          (meta.percentual_atingido || 0) >= 100 
                            ? 'bg-green-900 text-green-300 border-green-700'
                            : (meta.percentual_atingido || 0) >= 80
                            ? 'bg-yellow-900 text-yellow-300 border-yellow-700'
                            : 'bg-blue-900 text-blue-300 border-blue-700'
                        }>
                          {(meta.percentual_atingido || 0).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  {meta.observacoes && (
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Observações</p>
                      <p className="text-sm text-slate-300">{meta.observacoes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {metas.length === 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">Nenhuma meta cadastrada</h3>
            <p className="text-slate-500 mb-4">
              Crie metas individuais e de equipe para acompanhar performance
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}