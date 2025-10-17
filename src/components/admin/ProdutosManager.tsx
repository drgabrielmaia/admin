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
  DollarSign, 
  Package, 
  X,
  BookOpen,
  Monitor,
  Users,
  Calendar,
  Laptop,
  Handshake
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PageSkeleton } from '@/components/ui/loading-spinner'

interface Produto {
  id: string
  nome: string
  tipo: string
  descricao?: string
  preco: number
  custo: number
  margem_lucro: number
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at: string
}

const tiposClinica = [
  { value: 'clinica', label: 'Clínica', icon: BookOpen },
  { value: 'geral', label: 'Geral', icon: Package },
  { value: 'mentoria', label: 'Mentoria', icon: Users },
  { value: 'evento', label: 'Evento', icon: Calendar },
  { value: 'digital', label: 'Digital', icon: Laptop },
  { value: 'parceria', label: 'Parceria', icon: Handshake },
  { value: 'real-estate', label: 'Real Estate', icon: Package }
]

export function ProdutosManager() {
  const { user } = useAuth()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [error, setError] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    descricao: '',
    preco: '',
    custo: '',
    status: 'ativo'
  })

  useEffect(() => {
    loadProdutos()
  }, [])

  const loadProdutos = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Converter dados da clínica para o formato de produtos
      const clinicasConvertidas = (data || []).map(clinica => ({
        id: clinica.id,
        nome: clinica.nome,
        tipo: clinica.tipo,
        descricao: clinica.descricao || '',
        preco: clinica.entrada || 0,
        custo: clinica.saida || 0,
        margem_lucro: clinica.margem_lucro || 0,
        status: clinica.status,
        created_at: clinica.created_at,
        updated_at: clinica.updated_at
      }))

      setProdutos(clinicasConvertidas)
    } catch (error) {
      console.error('Erro ao carregar clínica:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: '',
      descricao: '',
      preco: '',
      custo: '',
      status: 'ativo'
    })
    setEditingProduto(null)
    setShowForm(false)
    setError('')
  }

  const handleEdit = (produto: Produto) => {
    setFormData({
      nome: produto.nome,
      tipo: produto.tipo,
      descricao: produto.descricao || '',
      preco: produto.preco.toString(),
      custo: produto.custo.toString(),
      status: produto.status
    })
    setEditingProduto(produto)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || user.funcao !== 'admin') {
      setError('Apenas admins podem gerenciar produtos')
      return
    }

    if (!formData.nome || !formData.tipo || !formData.preco || !formData.custo) {
      setError('Nome, tipo, preço e custo são obrigatórios')
      return
    }

    const preco = parseFloat(formData.preco)
    const custo = parseFloat(formData.custo)

    if (preco <= 0 || custo <= 0) {
      setError('Preço e custo devem ser maiores que zero')
      return
    }

    setError('')

    try {
      const clinicaData = {
        nome: formData.nome.trim(),
        tipo: formData.tipo,
        descricao: formData.descricao.trim() || null,
        entrada: preco,
        saida: custo,
        status: formData.status as 'ativo' | 'inativo',
        updated_at: new Date().toISOString()
      }

      if (editingProduto) {
        // Atualizar clínica existente
        const { data, error } = await supabase
          .from('clinicas')
          .update(clinicaData)
          .eq('id', editingProduto.id)
          .select()
          .single()

        if (error) throw error

        // Converter para formato de produto
        const produtoAtualizado = {
          id: data.id,
          nome: data.nome,
          tipo: data.tipo,
          descricao: data.descricao || '',
          preco: data.entrada || 0,
          custo: data.saida || 0,
          margem_lucro: data.margem_lucro || 0,
          status: data.status,
          created_at: data.created_at,
          updated_at: data.updated_at
        }

        setProdutos(prev => prev.map(p => p.id === editingProduto.id ? produtoAtualizado : p))
        console.log('✅ Clínica atualizada com sucesso')
      } else {
        // Criar nova clínica
        const { data, error } = await supabase
          .from('clinicas')
          .insert(clinicaData)
          .select()
          .single()

        if (error) throw error

        // Converter para formato de produto
        const novoProduto = {
          id: data.id,
          nome: data.nome,
          tipo: data.tipo,
          descricao: data.descricao || '',
          preco: data.entrada || 0,
          custo: data.saida || 0,
          margem_lucro: data.margem_lucro || 0,
          status: data.status,
          created_at: data.created_at,
          updated_at: data.updated_at
        }

        setProdutos(prev => [novoProduto, ...prev])
        console.log('✅ Clínica criada com sucesso')
      }

      resetForm()
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err)
      setError(err.message || 'Erro ao salvar produto')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta clínica?')) return

    try {
      const { error } = await supabase
        .from('clinicas')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProdutos(prev => prev.filter(p => p.id !== id))
      console.log('✅ Clínica excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir clínica:', error)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getTipoIcon = (tipo: string) => {
    const tipoInfo = tiposClinica.find(t => t.value === tipo)
    const Icon = tipoInfo?.icon || Package
    return <Icon className="h-4 w-4" />
  }

  const getTipoLabel = (tipo: string) => {
    const tipoInfo = tiposClinica.find(t => t.value === tipo)
    return tipoInfo?.label || tipo
  }

  const getMargemColor = (margem: number) => {
    if (margem >= 80) return 'text-green-400'
    if (margem >= 60) return 'text-yellow-400' 
    if (margem >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    return filtroTipo === 'todos' || produto.tipo === filtroTipo
  })

  // Estatísticas
  const stats = {
    total: produtos.length,
    ativos: produtos.filter(p => p.status === 'ativo').length,
    receita_potencial: produtos.filter(p => p.status === 'ativo').reduce((acc, p) => acc + p.preco, 0),
    margem_media: produtos.length > 0 
      ? Math.round(produtos.reduce((acc, p) => acc + p.margem_lucro, 0) / produtos.length)
      : 0
  }

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-lg font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <div>
                <p className="text-xs text-slate-400">Ativos</p>
                <p className="text-lg font-bold text-green-400">{stats.ativos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400">Receita Potencial</p>
                <p className="text-lg font-bold text-emerald-400">
                  {formatCurrency(stats.receita_potencial)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-yellow-400" />
              <div>
                <p className="text-xs text-slate-400">Margem Média</p>
                <p className="text-lg font-bold text-yellow-400">{stats.margem_media}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              {tiposClinica.map(tipo => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Clínica
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-green-400" />
                <span>{editingProduto ? 'Editar Clínica' : 'Nova Clínica'}</span>
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
                  <Label htmlFor="nome" className="text-slate-300">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder="Nome da clínica"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-slate-300">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposClinica.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          <div className="flex items-center space-x-2">
                            <tipo.icon className="h-4 w-4" />
                            <span>{tipo.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco" className="text-slate-300">Entrada (R$) *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco}
                    onChange={(e) => handleChange('preco', e.target.value)}
                    placeholder="150000.00"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo" className="text-slate-300">Saída (R$) *</Label>
                  <Input
                    id="custo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custo}
                    onChange={(e) => handleChange('custo', e.target.value)}
                    placeholder="45000.00"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-300">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Margem calculada */}
                {formData.preco && formData.custo && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Margem de Lucro</Label>
                    <div className="p-3 bg-slate-800 rounded-md border border-slate-700">
                      <span className={`text-lg font-bold ${getMargemColor(
                        Math.round(((parseFloat(formData.preco) - parseFloat(formData.custo)) / parseFloat(formData.preco)) * 100)
                      )}`}>
                        {Math.round(((parseFloat(formData.preco) - parseFloat(formData.custo)) / parseFloat(formData.preco)) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-slate-300">Descrição</Label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  placeholder="Descrição do produto..."
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
                  <Package className="mr-2 h-4 w-4" />
                  {editingProduto ? 'Atualizar Clínica' : 'Criar Clínica'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Produtos */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            Clínicas ({produtosFiltrados.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {produtosFiltrados.length > 0 ? (
            <div className="space-y-4">
              {produtosFiltrados.map((produto) => (
                <div key={produto.id} className="p-4 border border-slate-700 rounded-lg bg-slate-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {getTipoIcon(produto.tipo)}
                          <h3 className="text-lg font-semibold text-white">{produto.nome}</h3>
                        </div>
                        <Badge variant="outline" className={
                          produto.status === 'ativo' 
                            ? 'bg-green-900 text-green-300 border-green-700'
                            : 'bg-gray-900 text-gray-300 border-gray-700'
                        }>
                          {produto.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-900 text-blue-300 border-blue-700">
                          {getTipoLabel(produto.tipo)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-slate-400">
                            Entrada: <span className="text-green-400 font-medium">
                              {formatCurrency(produto.preco)}
                            </span>
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-slate-400">
                            Saída: <span className="text-red-400 font-medium">
                              {formatCurrency(produto.custo)}
                            </span>
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-slate-400">
                            Lucro: <span className="text-emerald-400 font-medium">
                              {formatCurrency(produto.preco - produto.custo)}
                            </span>
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-slate-400">
                            Margem: <span className={`font-bold ${getMargemColor(produto.margem_lucro)}`}>
                              {produto.margem_lucro}%
                            </span>
                          </p>
                        </div>
                      </div>

                      {produto.descricao && (
                        <p className="mt-2 text-sm text-slate-400 italic">"{produto.descricao}"</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(produto)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(produto.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">Nenhuma clínica encontrada</h3>
              <p className="text-slate-500 mb-4">
                {filtroTipo !== 'todos' 
                  ? 'Ajuste os filtros ou cadastre uma nova clínica'
                  : 'Cadastre sua primeira clínica para começar'
                }
              </p>
              <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeira Clínica
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}