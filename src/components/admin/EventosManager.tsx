'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { MovimentacaoModal } from '@/components/modals/MovimentacaoModal'
import { 
  AlertCircle, 
  Plus, 
  Calendar,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Save,
  X
} from 'lucide-react'

interface Evento {
  id: string
  nome: string
  descricao?: string
  data_evento: string
  local_evento?: string
  preco_ticket: number
  vagas_totais: number
  vagas_vendidas: number
  status: string
  responsavel_nome?: string
  receita_total?: number
  gastos_totais?: number
  lucro_estimado?: number
  margem_lucro_percentual?: number
  tickets_vendidos?: number
}

interface FormData {
  nome: string
  descricao: string
  data_evento: string
  local_evento: string
  preco_ticket: string
  vagas_totais: string
  status: string
}

export function EventosManager() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [eventos, setEventos] = useState<Evento[]>([])
  const [editando, setEditando] = useState<string | null>(null)
  const [novoEvento, setNovoEvento] = useState(false)
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    descricao: '',
    data_evento: '',
    local_evento: '',
    preco_ticket: '',
    vagas_totais: '',
    status: 'planejamento'
  })

  const statusOptions = [
    { value: 'planejamento', label: 'Planejamento' },
    { value: 'vendas_abertas', label: 'Vendas Abertas' },
    { value: 'esgotado', label: 'Esgotado' },
    { value: 'realizado', label: 'Realizado' },
    { value: 'cancelado', label: 'Cancelado' }
  ]

  const loadEventos = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('vw_eventos_dashboard')
        .select('*')
        .order('data_evento', { ascending: true })

      if (error) throw error
      setEventos(data || [])

    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error)
      setError(error.message || 'Erro ao carregar eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEventos()
  }, [])

  const handleSave = async (eventoId?: string) => {
    try {
      setError('')
      setSuccess('')

      // Validações
      if (!formData.nome || !formData.data_evento || !formData.preco_ticket || !formData.vagas_totais) {
        setError('Preencha todos os campos obrigatórios')
        return
      }

      const precoTicket = parseFloat(formData.preco_ticket)
      const vagasTotais = parseInt(formData.vagas_totais)

      if (precoTicket <= 0) {
        setError('Preço do ticket deve ser maior que zero')
        return
      }

      if (vagasTotais <= 0) {
        setError('Quantidade de vagas deve ser maior que zero')
        return
      }

      const dadosParaSalvar = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        data_evento: formData.data_evento,
        local_evento: formData.local_evento || null,
        preco_ticket: precoTicket,
        vagas_totais: vagasTotais,
        status: formData.status,
        responsavel_id: user?.id
      }

      if (eventoId) {
        // Atualizar
        const { error } = await supabase
          .from('eventos')
          .update(dadosParaSalvar)
          .eq('id', eventoId)

        if (error) throw error
        setSuccess('Evento atualizado com sucesso!')
      } else {
        // Criar
        const { error } = await supabase
          .from('eventos')
          .insert(dadosParaSalvar)

        if (error) throw error
        setSuccess('Evento criado com sucesso!')
      }

      // Resetar formulário
      setFormData({
        nome: '',
        descricao: '',
        data_evento: '',
        local_evento: '',
        preco_ticket: '',
        vagas_totais: '',
        status: 'planejamento'
      })
      setEditando(null)
      setNovoEvento(false)
      
      await loadEventos()

      // Auto-hide success message
      setTimeout(() => setSuccess(''), 3000)

    } catch (error: any) {
      console.error('Erro ao salvar evento:', error)
      setError(error.message || 'Erro ao salvar evento')
    }
  }

  const handleEdit = (evento: Evento) => {
    setFormData({
      nome: evento.nome,
      descricao: evento.descricao || '',
      data_evento: evento.data_evento,
      local_evento: evento.local_evento || '',
      preco_ticket: evento.preco_ticket.toString(),
      vagas_totais: evento.vagas_totais.toString(),
      status: evento.status
    })
    setEditando(evento.id)
    setNovoEvento(false)
  }

  const handleDelete = async (eventoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return

    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventoId)

      if (error) throw error
      
      setSuccess('Evento excluído com sucesso!')
      await loadEventos()

      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      console.error('Erro ao excluir evento:', error)
      setError(error.message || 'Erro ao excluir evento')
    }
  }

  const cancelEdit = () => {
    setEditando(null)
    setNovoEvento(false)
    setFormData({
      nome: '',
      descricao: '',
      data_evento: '',
      local_evento: '',
      preco_ticket: '',
      vagas_totais: '',
      status: 'planejamento'
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      planejamento: 'bg-gray-100 text-gray-800',
      vendas_abertas: 'bg-green-100 text-green-800',
      esgotado: 'bg-red-100 text-red-800',
      realizado: 'bg-blue-100 text-blue-800',
      cancelado: 'bg-red-100 text-red-800'
    }

    const labels = {
      planejamento: 'Planejamento',
      vendas_abertas: 'Vendas Abertas',
      esgotado: 'Esgotado',
      realizado: 'Realizado',
      cancelado: 'Cancelado'
    }

    return (
      <Badge className={styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (user?.funcao !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Acesso restrito a administradores
        </AlertDescription>
      </Alert>
    )
  }

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
        <h1 className="text-3xl font-bold">Gerenciamento de Eventos</h1>
        <p className="text-gray-600">Gerencie eventos com controle financeiro completo</p>
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

      {/* Formulário */}
      {(novoEvento || editando) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editando ? 'Editar Evento' : 'Novo Evento'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Evento *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome do evento"
                />
              </div>

              <div className="space-y-2">
                <Label>Data do Evento *</Label>
                <Input
                  type="date"
                  value={formData.data_evento}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_evento: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Local do Evento</Label>
                <Input
                  value={formData.local_evento}
                  onChange={(e) => setFormData(prev => ({ ...prev, local_evento: e.target.value }))}
                  placeholder="Local onde será realizado"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, status: value }))
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preço do Ticket *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_ticket}
                  onChange={(e) => setFormData(prev => ({ ...prev, preco_ticket: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Total de Vagas *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.vagas_totais}
                  onChange={(e) => setFormData(prev => ({ ...prev, vagas_totais: e.target.value }))}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do evento"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => handleSave(editando || undefined)}>
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

      {/* Lista de Eventos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Eventos</CardTitle>
              <CardDescription>
                Gerencie todos os seus eventos
              </CardDescription>
            </div>
            {!novoEvento && !editando && (
              <div className="flex space-x-3">
                <Button 
                  onClick={() => window.location.href = '/dashboard/admin/produtos/eventos/bpo'}
                  variant="outline"
                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  BPO Eventos
                </Button>
                <Button 
                  onClick={() => setShowMovimentacaoModal(true)}
                  variant="outline"
                  className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Nova Movimentação
                </Button>
                <Button onClick={() => setNovoEvento(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Evento
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {eventos.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum evento encontrado</p>
              <p className="text-sm text-gray-400">Crie seu primeiro evento para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventos.map((evento) => (
                <Card key={evento.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{evento.nome}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{formatDate(evento.data_evento)}</span>
                        </div>
                        {evento.local_evento && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{evento.local_evento}</span>
                          </div>
                        )}
                      </div>
                      {getStatusBadge(evento.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Informações básicas */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Preço:</span>
                        <p className="font-medium">{formatCurrency(evento.preco_ticket)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Vagas:</span>
                        <p className="font-medium">{evento.vagas_vendidas}/{evento.vagas_totais}</p>
                      </div>
                    </div>

                    {/* Financeiro */}
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Receita:</span>
                          <span className="font-medium">{formatCurrency(evento.receita_total || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gastos:</span>
                          <span className="font-medium">{formatCurrency(evento.gastos_totais || 0)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-900 font-medium">Lucro:</span>
                          <span className={`font-bold ${(evento.lucro_estimado || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(evento.lucro_estimado || 0)}
                          </span>
                        </div>
                        {(evento.margem_lucro_percentual || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Margem:</span>
                            <span className="font-medium">{evento.margem_lucro_percentual}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(evento)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/dashboard/admin/eventos/${evento.id}`}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(evento.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Movimentação */}
      <MovimentacaoModal 
        isOpen={showMovimentacaoModal}
        onClose={() => setShowMovimentacaoModal(false)}
        motorType="evento"
        motorName="Eventos"
        onSuccess={() => {
          // Pode adicionar lógica de refresh aqui se necessário
        }}
      />
    </div>
  )
}