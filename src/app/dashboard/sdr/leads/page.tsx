'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NovoLeadForm } from '@/components/sdr/NovoLeadForm'
import { LeadsParaLiberacao } from '@/components/sdr/LeadsParaLiberacao'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Users, 
  Eye, 
  Edit,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Filter,
  Search,
  Trash2,
  X,
  Check,
  Loader2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Lead {
  id: string
  nome: string
  email?: string
  telefone?: string
  origem: string
  status: string
  valor_estimado?: number
  observacoes?: string
  data_qualificacao?: string
  data_agendamento?: string
  created_at: string
  updated_at: string
}

export default function LeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovoLead, setShowNovoLead] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    loadLeads()
  }, [user])

  const loadLeads = async () => {
    if (!user || user.funcao !== 'sdr') return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('sdr_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() }
      
      // Se mudou para qualificado, salvar data
      if (newStatus === 'qualificado') {
        updateData.data_qualificacao = new Date().toISOString()
      }
      
      // Se mudou para agendado, salvar data
      if (newStatus === 'agendado') {
        updateData.data_agendamento = new Date().toISOString()
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)

      if (error) throw error

      // Atualizar lista local
      setLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, ...updateData }
          : lead
      ))

      showAlert('success', 'Status do lead atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar lead:', error)
      showAlert('error', 'Erro ao atualizar status do lead')
    }
  }

  const updateLead = async (leadId: string, updatedData: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ ...updatedData, updated_at: new Date().toISOString() })
        .eq('id', leadId)

      if (error) throw error

      setLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, ...updatedData }
          : lead
      ))

      setEditingLead(null)
      showAlert('success', 'Lead atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar lead:', error)
      showAlert('error', 'Erro ao atualizar lead')
    }
  }

  const deleteLead = async (leadId: string) => {
    try {
      setDeletingLeadId(leadId)
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)

      if (error) throw error

      setLeads(prev => prev.filter(lead => lead.id !== leadId))
      showAlert('success', 'Lead excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir lead:', error)
      showAlert('error', 'Erro ao excluir lead')
    } finally {
      setDeletingLeadId(null)
    }
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo': return 'bg-blue-900 text-blue-300 border-blue-700'
      case 'qualificado': return 'bg-yellow-900 text-yellow-300 border-yellow-700'
      case 'agendado': return 'bg-green-900 text-green-300 border-green-700'
      case 'perdido': return 'bg-red-900 text-red-300 border-red-700'
      case 'convertido': return 'bg-emerald-900 text-emerald-300 border-emerald-700'
      default: return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'novo': return 'Novo'
      case 'qualificado': return 'Qualificado'
      case 'agendado': return 'Agendado'
      case 'perdido': return 'Perdido'
      case 'convertido': return 'Convertido'
      default: return status
    }
  }

  const leadsStats = {
    total: leads.length,
    novos: leads.filter(l => l.status === 'novo').length,
    qualificados: leads.filter(l => l.status === 'qualificado').length,
    agendados: leads.filter(l => l.status === 'agendado').length,
    convertidos: leads.filter(l => l.status === 'convertido').length,
    valorEstimadoTotal: leads.reduce((acc, l) => acc + (l.valor_estimado || 0), 0)
  }

  // Filtrar leads
  const leadsFiltrados = leads.filter(lead => {
    const matchStatus = filtroStatus === 'todos' || lead.status === filtroStatus
    const matchBusca = !busca || lead.nome.toLowerCase().includes(busca.toLowerCase()) || 
                      lead.email?.toLowerCase().includes(busca.toLowerCase()) ||
                      lead.origem.toLowerCase().includes(busca.toLowerCase())
    return matchStatus && matchBusca
  })

  if (loading) {
    return (
      <DashboardLayout title="Gestão de Leads">
        <div className="text-center">
          <div className="animate-pulse text-slate-400">Carregando leads...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gestão de Leads">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-lg font-bold text-white">{leadsStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <div>
                  <p className="text-xs text-slate-400">Novos</p>
                  <p className="text-lg font-bold text-blue-400">{leadsStats.novos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <div>
                  <p className="text-xs text-slate-400">Qualificados</p>
                  <p className="text-lg font-bold text-yellow-400">{leadsStats.qualificados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <div>
                  <p className="text-xs text-slate-400">Agendados</p>
                  <p className="text-lg font-bold text-green-400">{leadsStats.agendados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs text-slate-400">Valor Est.</p>
                  <p className="text-sm font-bold text-emerald-400">
                    {formatCurrency(leadsStats.valorEstimadoTotal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar leads..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-64 bg-slate-800 border-slate-700"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="novo">Novos</SelectItem>
                  <SelectItem value="qualificado">Qualificados</SelectItem>
                  <SelectItem value="agendado">Agendados</SelectItem>
                  <SelectItem value="perdido">Perdidos</SelectItem>
                  <SelectItem value="convertido">Convertidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={() => setShowNovoLead(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>

        {/* Formulário Novo Lead */}
        {/* Alert Messages */}
        {alert && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-6">
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {showNovoLead && (
          <NovoLeadForm 
            onSuccess={() => {
              setShowNovoLead(false)
              loadLeads()
            }}
            onCancel={() => setShowNovoLead(false)}
          />
        )}

        {/* Edit Lead Dialog */}
        {editingLead && (
          <EditLeadDialog 
            lead={editingLead}
            onUpdate={(updatedData) => updateLead(editingLead.id, updatedData)}
            onCancel={() => setEditingLead(null)}
          />
        )}

        {/* Lista de Leads */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              Pipeline de Leads ({leadsFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsFiltrados.length > 0 ? (
              <div className="space-y-4">
                {leadsFiltrados.map((lead) => (
                  <div key={lead.id} className="p-4 border border-slate-700 rounded-lg bg-slate-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{lead.nome}</h3>
                          <Badge variant="outline" className={getStatusColor(lead.status)}>
                            {getStatusLabel(lead.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-1">
                            {lead.email && (
                              <div className="flex items-center space-x-2 text-slate-300">
                                <Mail className="h-3 w-3" />
                                <span>{lead.email}</span>
                              </div>
                            )}
                            {lead.telefone && (
                              <div className="flex items-center space-x-2 text-slate-300">
                                <Phone className="h-3 w-3" />
                                <span>{lead.telefone}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-slate-400">Origem: <span className="text-slate-300">{lead.origem}</span></p>
                            <p className="text-slate-400">
                              Cadastrado: <span className="text-slate-300">{formatDate(lead.created_at)}</span>
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            {lead.valor_estimado && (
                              <p className="text-slate-400">
                                Valor: <span className="text-green-400 font-medium">
                                  {formatCurrency(lead.valor_estimado)}
                                </span>
                              </p>
                            )}
                            {lead.data_agendamento && (
                              <p className="text-slate-400">
                                Agendado: <span className="text-green-400">{formatDate(lead.data_agendamento)}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {lead.observacoes && (
                          <p className="mt-2 text-sm text-slate-400 italic">"{lead.observacoes}"</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Select 
                          value={lead.status} 
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="novo">Novo</SelectItem>
                            <SelectItem value="qualificado">Qualificado</SelectItem>
                            <SelectItem value="agendado">Agendado</SelectItem>
                            <SelectItem value="perdido">Perdido</SelectItem>
                            <SelectItem value="convertido">Convertido</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingLead(lead)}
                          className="text-slate-400 hover:text-blue-400"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteLead(lead.id)}
                          disabled={deletingLeadId === lead.id}
                          className="text-slate-400 hover:text-red-400"
                        >
                          {deletingLeadId === lead.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">Nenhum lead encontrado</h3>
                <p className="text-slate-500 mb-4">
                  {busca || filtroStatus !== 'todos' 
                    ? 'Ajuste os filtros ou limpe a busca'
                    : 'Cadastre seu primeiro lead para começar'
                  }
                </p>
                <Button onClick={() => setShowNovoLead(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Lead
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de Liberação de Leads */}
        <LeadsParaLiberacao />
      </div>
    </DashboardLayout>
  )
}

// Componente para editar lead
function EditLeadDialog({ lead, onUpdate, onCancel }: {
  lead: Lead;
  onUpdate: (data: Partial<Lead>) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: lead.nome,
    email: lead.email || '',
    telefone: lead.telefone || '',
    origem: lead.origem,
    valor_estimado: lead.valor_estimado?.toString() || '',
    observacoes: lead.observacoes || ''
  })

  const origens = [
    'Facebook Ads', 'Google Ads', 'Instagram', 'LinkedIn', 'YouTube', 
    'TikTok', 'Indicação', 'WhatsApp', 'Site/Landing Page', 'Evento', 
    'Cold Email', 'Cold Call', 'Outro'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) return

    setLoading(true)
    
    const updatedData = {
      nome: formData.nome.trim(),
      email: formData.email.trim() || null,
      telefone: formData.telefone.trim() || null,
      origem: formData.origem,
      valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : null,
      observacoes: formData.observacoes.trim() || null
    }

    onUpdate(updatedData)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-slate-900 border-slate-800 w-full max-w-2xl mx-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <span className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-blue-400" />
              <span>Editar Lead</span>
            </span>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome" className="text-slate-300">Nome Completo *</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-slate-300">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telefone" className="text-slate-300">Telefone</Label>
                <Input
                  id="edit-telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-origem" className="text-slate-300">Origem *</Label>
                <Select 
                  value={formData.origem} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, origem: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {origens.map((origem) => (
                      <SelectItem key={origem} value={origem}>{origem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-valor" className="text-slate-300">Valor Estimado (R$)</Label>
                <Input
                  id="edit-valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_estimado}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor_estimado: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-observacoes" className="text-slate-300">Observações</Label>
              <textarea
                id="edit-observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={loading}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}