'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  ArrowRight,
  Eye,
  Edit,
  Loader2,
  GripVertical,
  CheckCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface PipelineLead {
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

const statusFlow = [
  { key: 'novo', label: 'Novo', color: 'bg-blue-900 text-blue-300 border-blue-700' },
  { key: 'qualificado', label: 'Qualificado', color: 'bg-yellow-900 text-yellow-300 border-yellow-700' },
  { key: 'agendado', label: 'Agendado', color: 'bg-green-900 text-green-300 border-green-700' },
  { key: 'convertido', label: 'Convertido', color: 'bg-emerald-900 text-emerald-300 border-emerald-700' },
  { key: 'perdido', label: 'Perdido', color: 'bg-red-900 text-red-300 border-red-700' }
]

export default function SDRPipelinePage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<PipelineLead[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedLead, setDraggedLead] = useState<PipelineLead | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)
  const [updatingLead, setUpdatingLead] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadPipelineData()
    }
  }, [user])

  const loadPipelineData = async () => {
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
      console.error('Erro ao carregar pipeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const moveLeadToStatus = async (leadId: string, newStatus: string) => {
    try {
      setUpdatingLead(leadId)
      
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      }
      
      if (newStatus === 'qualificado') {
        updateData.data_qualificacao = new Date().toISOString()
      }
      
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

      console.log(`✅ Lead movido para ${newStatus}`)
    } catch (error) {
      console.error('Erro ao mover lead:', error)
    } finally {
      setUpdatingLead(null)
    }
  }

  const moveLeadToNextStage = async (leadId: string, currentStatus: string) => {
    const statusIndex = statusFlow.findIndex(s => s.key === currentStatus)
    if (statusIndex >= statusFlow.length - 2) return

    const nextStatus = statusFlow[statusIndex + 1].key
    await moveLeadToStatus(leadId, nextStatus)
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, lead: PipelineLead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
  }

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStatus(status)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverStatus(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    setDragOverStatus(null)
    
    if (!draggedLead || draggedLead.status === targetStatus) {
      setDraggedLead(null)
      return
    }

    await moveLeadToStatus(draggedLead.id, targetStatus)
    setDraggedLead(null)
  }

  const handleDragEnd = () => {
    setDraggedLead(null)
    setDragOverStatus(null)
  }

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status)
  }

  const getPipelineStats = () => {
    return {
      total: leads.length,
      novos: leads.filter(l => l.status === 'novo').length,
      qualificados: leads.filter(l => l.status === 'qualificado').length,
      agendados: leads.filter(l => l.status === 'agendado').length,
      convertidos: leads.filter(l => l.status === 'convertido').length,
      perdidos: leads.filter(l => l.status === 'perdido').length
    }
  }

  const stats = getPipelineStats()

  if (loading) {
    return (
      <DashboardLayout title="Pipeline de Leads">
        <div className="text-center">
          <div className="animate-pulse text-slate-400">Carregando pipeline...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Pipeline de Leads">
      <div className="space-y-6">
        {/* Stats do Pipeline */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-400" />
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
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <div>
                  <p className="text-xs text-slate-400">Novos</p>
                  <p className="text-lg font-bold text-blue-400">{stats.novos}</p>
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
                  <p className="text-lg font-bold text-yellow-400">{stats.qualificados}</p>
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
                  <p className="text-lg font-bold text-green-400">{stats.agendados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <div>
                  <p className="text-xs text-slate-400">Convertidos</p>
                  <p className="text-lg font-bold text-emerald-400">{stats.convertidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <div>
                  <p className="text-xs text-slate-400">Perdidos</p>
                  <p className="text-lg font-bold text-red-400">{stats.perdidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Kanban */}
        <div className="text-sm text-slate-400 mb-4">
          💡 Dica: Arraste e solte os leads entre as colunas para alterar o status
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-x-auto">
          {statusFlow.map((stage, index) => {
            const stageLeads = getLeadsByStatus(stage.key)
            
            return (
              <Card 
                key={stage.key} 
                className={`bg-slate-900 border-slate-800 min-w-80 transition-all duration-200 ${
                  dragOverStatus === stage.key ? 'border-blue-500 bg-blue-950/50' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, stage.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full bg-${stage.color.split('-')[1]}-400`}></div>
                      <span className="text-white text-sm">{stage.label}</span>
                    </div>
                    <Badge variant="outline" className="text-slate-300">
                      {stageLeads.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 min-h-32">
                  {stageLeads.map((lead) => (
                    <div 
                      key={lead.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all duration-200 cursor-move ${
                        draggedLead?.id === lead.id ? 'opacity-50 scale-95' : ''
                      } ${
                        updatingLead === lead.id ? 'animate-pulse' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <GripVertical className="h-3 w-3 text-slate-500" />
                          <h4 className="font-medium text-white text-sm">{lead.nome}</h4>
                          {updatingLead === lead.id && (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-blue-400">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-green-400">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs text-slate-400">
                        <p>Origem: {lead.origem}</p>
                        {lead.email && <p>Email: {lead.email}</p>}
                        {lead.telefone && <p>Tel: {lead.telefone}</p>}
                        <p>Criado: {formatDate(lead.created_at)}</p>
                        {lead.data_agendamento && (
                          <p className="text-green-400">
                            Agendado: {formatDate(lead.data_agendamento)}
                          </p>
                        )}
                      </div>

                      {lead.observacoes && (
                        <p className="text-xs text-slate-500 mt-2 italic truncate">
                          "{lead.observacoes}"
                        </p>
                      )}

                      {/* Botões de Ação */}
                      <div className="flex items-center justify-between mt-3">
                        {lead.valor_estimado && (
                          <span className="text-xs text-green-400 font-medium">
                            R$ {lead.valor_estimado.toLocaleString()}
                          </span>
                        )}
                        
                        <div className="flex space-x-1">
                          {index < statusFlow.length - 2 && stage.key !== 'convertido' && stage.key !== 'perdido' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-6 text-xs text-green-400 hover:text-green-300"
                              onClick={() => moveLeadToNextStage(lead.id, lead.status)}
                              disabled={updatingLead === lead.id}
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Avançar
                            </Button>
                          )}
                          
                          {stage.key === 'agendado' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-6 text-xs text-emerald-400 hover:text-emerald-300"
                              onClick={() => moveLeadToStatus(lead.id, 'convertido')}
                              disabled={updatingLead === lead.id}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Converter
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className={`text-center text-slate-500 py-8 border-2 border-dashed border-slate-700 rounded-lg transition-all duration-200 ${
                      dragOverStatus === stage.key ? 'border-blue-500 bg-blue-950/20' : ''
                    }`}>
                      <div className={`w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2`}>
                        <div className={`w-3 h-3 rounded-full bg-${stage.color.split('-')[1]}-400`}></div>
                      </div>
                      <p className="text-xs">
                        {dragOverStatus === stage.key 
                          ? 'Solte aqui para mover o lead'
                          : 'Nenhum lead neste estágio'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}