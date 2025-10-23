'use client'

import { useState, useEffect, useCallback } from 'react'
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
  TrendingUp,
  X,
  Stethoscope,
  ArrowUp,
  ArrowDown,
  Calculator,
  FileText
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PageSkeleton } from '@/components/ui/loading-spinner'
import { MovimentacaoModal } from '@/components/modals/MovimentacaoModal'

interface ClinicaTransacao {
  id: string
  tipo: 'entrada' | 'saida'
  descricao: string
  categoria?: string
  valor: number
  data_transacao: string
  observacoes?: string
  created_at: string
  updated_at: string
}

interface ClinicaResumo {
  total_entradas: number
  total_saidas: number
  lucro_total: number
  margem_lucro: number
  total_transacoes: number
  total_entradas_count: number
  total_saidas_count: number
}

const categorias = {
  entrada: [
    'consulta',
    'exame',
    'procedimento',
    'cirurgia',
    'medicamento',
    'outros'
  ],
  saida: [
    'salario',
    'aluguel',
    'equipamento',
    'medicamento',
    'material',
    'marketing',
    'outros'
  ]
}

export function ClinicaManager() {
  const { user } = useAuth()
  const [transacoes, setTransacoes] = useState<ClinicaTransacao[]>([])
  const [resumo, setResumo] = useState<ClinicaResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransacao, setEditingTransacao] = useState<ClinicaTransacao | null>(null)
  const [error, setError] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos')
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false)
  
  const [formData, setFormData] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    descricao: '',
    categoria: '',
    valor: '',
    data_transacao: new Date().toISOString().split('T')[0],
    observacoes: ''
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      // Carregar transações
      const { data: transacoesData, error: transacoesError } = await supabase
        .from('clinica_transacoes')
        .select('*')
        .order('data_transacao', { ascending: false })

      if (transacoesError) throw transacoesError

      // Carregar resumo
      const { data: resumoData, error: resumoError } = await supabase
        .from('vw_clinica_resumo')
        .select('*')
        .single()

      if (resumoError) throw resumoError

      setTransacoes(transacoesData || [])
      setResumo(resumoData)
    } catch (error) {
      console.error('Erro ao carregar dados da clínica:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const resetForm = () => {
    setFormData({
      tipo: 'entrada',
      descricao: '',
      categoria: '',
      valor: '',
      data_transacao: new Date().toISOString().split('T')[0],
      observacoes: ''
    })
    setEditingTransacao(null)
    setShowForm(false)
    setError('')
  }

  const handleEdit = (transacao: ClinicaTransacao) => {
    setFormData({
      tipo: transacao.tipo,
      descricao: transacao.descricao,
      categoria: transacao.categoria || '',
      valor: transacao.valor.toString(),
      data_transacao: transacao.data_transacao,
      observacoes: transacao.observacoes || ''
    })
    setEditingTransacao(transacao)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || user.funcao !== 'admin') {
      setError('Apenas admins podem gerenciar transações da clínica')
      return
    }

    if (!formData.descricao || !formData.valor) {
      setError('Descrição e valor são obrigatórios')
      return
    }

    const valor = parseFloat(formData.valor)

    if (valor <= 0) {
      setError('Valor deve ser maior que zero')
      return
    }

    setError('')

    try {
      const transacaoData = {
        tipo: formData.tipo,
        descricao: formData.descricao.trim(),
        categoria: formData.categoria || null,
        valor,
        data_transacao: formData.data_transacao,
        observacoes: formData.observacoes.trim() || null,
        updated_at: new Date().toISOString()
      }

      if (editingTransacao) {
        // Atualizar transação existente
        const { data, error } = await supabase
          .from('clinica_transacoes')
          .update(transacaoData)
          .eq('id', editingTransacao.id)
          .select()
          .single()

        if (error) throw error

        setTransacoes(prev => prev.map(t => t.id === editingTransacao.id ? data : t))
        console.log('✅ Transação atualizada com sucesso')
      } else {
        // Criar nova transação
        const { data, error } = await supabase
          .from('clinica_transacoes')
          .insert(transacaoData)
          .select()
          .single()

        if (error) throw error

        setTransacoes(prev => [data, ...prev])
        console.log('✅ Transação criada com sucesso')
      }

      // Recarregar resumo
      loadData()
      resetForm()
    } catch (err: unknown) {
      console.error('Erro ao salvar transação:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar transação'
      setError(errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      const { error } = await supabase
        .from('clinica_transacoes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTransacoes(prev => prev.filter(t => t.id !== id))
      loadData() // Recarregar resumo
      console.log('✅ Transação excluída com sucesso')
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getLucroColor = (lucro: number) => {
    if (lucro > 0) return 'text-green-400'
    if (lucro === 0) return 'text-slate-400'
    return 'text-red-400'
  }

  const getMargemColor = (margem: number) => {
    if (margem >= 50) return 'text-green-400'
    if (margem >= 30) return 'text-yellow-400' 
    if (margem >= 10) return 'text-orange-400'
    return 'text-red-400'
  }

  // Filtrar transações
  const transacoesFiltradas = transacoes.filter(transacao => {
    return filtroTipo === 'todos' || transacao.tipo === filtroTipo
  })

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-rose-400" />
            Gestão Financeira da Clínica
          </h1>
          <p className="text-slate-400 mt-2">Controle de entradas e saídas da sua clínica</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => window.location.href = '/dashboard/admin/produtos/clinicas/bpo'}
            variant="outline"
            className="border-rose-600 text-rose-400 hover:bg-rose-600 hover:text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            BPO Clínica
          </Button>
          <Button 
            onClick={() => setShowMovimentacaoModal(true)}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
          <Button onClick={() => setShowForm(true)} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowUp className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-xs text-slate-400">Total Entradas</p>
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(resumo.total_entradas)}
                  </p>
                  <p className="text-xs text-slate-500">{resumo.total_entradas_count} transações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowDown className="h-4 w-4 text-red-400" />
                <div>
                  <p className="text-xs text-slate-400">Total Saídas</p>
                  <p className="text-lg font-bold text-red-400">
                    {formatCurrency(resumo.total_saidas)}
                  </p>
                  <p className="text-xs text-slate-500">{resumo.total_saidas_count} transações</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs text-slate-400">Lucro Total</p>
                  <p className={`text-lg font-bold ${getLucroColor(resumo.lucro_total)}`}>
                    {formatCurrency(resumo.lucro_total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
                <div>
                  <p className="text-xs text-slate-400">Margem de Lucro</p>
                  <p className={`text-lg font-bold ${getMargemColor(resumo.margem_lucro)}`}>
                    {resumo.margem_lucro}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Total Transações</p>
                  <p className="text-lg font-bold text-blue-400">{resumo.total_transacoes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <Select value={filtroTipo} onValueChange={(value: 'todos' | 'entrada' | 'saida') => setFiltroTipo(value)}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Transações</SelectItem>
              <SelectItem value="entrada">Apenas Entradas</SelectItem>
              <SelectItem value="saida">Apenas Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-rose-400" />
                <span>{editingTransacao ? 'Editar Transação' : 'Nova Transação'}</span>
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
                  <Label htmlFor="tipo" className="text-slate-300">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value: 'entrada' | 'saida') => handleChange('tipo', value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4 text-green-400" />
                          Entrada
                        </div>
                      </SelectItem>
                      <SelectItem value="saida">
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-4 w-4 text-red-400" />
                          Saída
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-slate-300">Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(value) => handleChange('categoria', value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias[formData.tipo].map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-slate-300">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    placeholder="Ex: Consulta particular, Compra de material..."
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-slate-300">Valor (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.valor}
                    onChange={(e) => handleChange('valor', e.target.value)}
                    placeholder="0.00"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_transacao" className="text-slate-300">Data da Transação</Label>
                  <Input
                    id="data_transacao"
                    type="date"
                    value={formData.data_transacao}
                    onChange={(e) => handleChange('data_transacao', e.target.value)}
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
                  placeholder="Observações adicionais sobre a transação..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3">
                <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700">
                  <DollarSign className="mr-2 h-4 w-4" />
                  {editingTransacao ? 'Atualizar' : 'Adicionar'} Transação
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Transações */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            Histórico de Transações ({transacoesFiltradas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transacoesFiltradas.length > 0 ? (
            <div className="space-y-4">
              {transacoesFiltradas.map((transacao) => (
                <div key={transacao.id} className="p-4 border border-slate-700 rounded-lg bg-slate-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {transacao.tipo === 'entrada' ? (
                            <ArrowUp className="h-4 w-4 text-green-400" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-400" />
                          )}
                          <h3 className="text-lg font-semibold text-white">{transacao.descricao}</h3>
                        </div>
                        <Badge variant="outline" className={
                          transacao.tipo === 'entrada' 
                            ? 'bg-green-900 text-green-300 border-green-700'
                            : 'bg-red-900 text-red-300 border-red-700'
                        }>
                          {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </Badge>
                        {transacao.categoria && (
                          <Badge variant="outline" className="bg-blue-900 text-blue-300 border-blue-700">
                            {transacao.categoria}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-slate-400">
                            Valor: <span className={`font-medium ${transacao.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(transacao.valor)}
                            </span>
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-slate-400">
                            Data: <span className="text-slate-300">
                              {new Date(transacao.data_transacao).toLocaleDateString('pt-BR')}
                            </span>
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-slate-400">
                            Criado: <span className="text-slate-300">
                              {new Date(transacao.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </p>
                        </div>
                      </div>

                      {transacao.observacoes && (
                        <p className="mt-3 text-sm text-slate-400 italic">&ldquo;{transacao.observacoes}&rdquo;</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(transacao)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(transacao.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Stethoscope className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">Nenhuma transação encontrada</h3>
              <p className="text-slate-500 mb-4">
                {filtroTipo !== 'todos' 
                  ? `Nenhuma ${filtroTipo} registrada ainda`
                  : 'Registre sua primeira transação para começar o controle financeiro'
                }
              </p>
              <Button onClick={() => setShowForm(true)} className="bg-rose-600 hover:bg-rose-700">
                <Plus className="h-4 w-4 mr-2" />
                Primeira Transação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Movimentação */}
      <MovimentacaoModal 
        isOpen={showMovimentacaoModal}
        onClose={() => setShowMovimentacaoModal(false)}
        motorType="clinica"
        motorName="Clínica"
        onSuccess={() => {
          // Pode adicionar lógica de refresh aqui se necessário
        }}
      />
    </div>
  )
}