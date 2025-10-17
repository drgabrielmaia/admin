'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  ArrowRight, 
  Mail, 
  Phone, 
  DollarSign,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Lead {
  id: string
  nome: string
  email?: string
  telefone?: string
  origem: string
  status: string
  status_atribuicao?: string
  valor_estimado?: number
  observacoes?: string
  data_qualificacao?: string
  data_agendamento?: string
  created_at: string
}

export function LeadsParaLiberacao() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [liberandoId, setLiberandoId] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadLeadsQualificados()
    }
  }, [user])

  const loadLeadsQualificados = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('sdr_id', user!.id)
        .in('status', ['qualificado', 'agendado'])
        .is('status_atribuicao', null) // Apenas leads não atribuídos
        .order('data_qualificacao', { ascending: false })

      if (error) throw error

      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
      showAlert('error', 'Erro ao carregar leads qualificados')
    } finally {
      setLoading(false)
    }
  }

  const liberarLead = async (leadId: string) => {
    try {
      setLiberandoId(leadId)
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          status_atribuicao: 'disponivel',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      if (error) throw error

      // Remover da lista local
      setLeads(prev => prev.filter(lead => lead.id !== leadId))
      showAlert('success', 'Lead liberado para closers com sucesso!')
      
    } catch (error) {
      console.error('Erro ao liberar lead:', error)
      showAlert('error', 'Erro ao liberar lead')
    } finally {
      setLiberandoId(null)
    }
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualificado': return 'bg-yellow-900 text-yellow-300 border-yellow-700'
      case 'agendado': return 'bg-green-900 text-green-300 border-green-700'
      default: return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'qualificado': return 'Qualificado'
      case 'agendado': return 'Agendado'
      default: return status
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="ml-2 text-slate-400">Carregando leads...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Users className="h-5 w-5 text-blue-400" />
            <span>Leads Qualificados para Liberação ({leads.length})</span>
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Leads qualificados ou agendados que podem ser liberados para os closers trabalharem
          </p>
        </CardHeader>
        <CardContent>
          {leads.length > 0 ? (
            <div className="space-y-4">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 border border-slate-700 rounded-lg bg-slate-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{lead.nome}</h3>
                        <Badge variant="outline" className={getStatusColor(lead.status)}>
                          {getStatusLabel(lead.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                          <p className="text-slate-400">
                            Origem: <span className="text-slate-300">{lead.origem}</span>
                          </p>
                          {lead.valor_estimado && (
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-3 w-3 text-green-400" />
                              <span className="text-green-400 font-medium">
                                {formatCurrency(lead.valor_estimado)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {lead.observacoes && (
                        <p className="mt-2 text-sm text-slate-400 italic">"{lead.observacoes}"</p>
                      )}
                      
                      <div className="mt-2 text-xs text-slate-500 flex items-center space-x-4">
                        <span>Criado: {formatDate(lead.created_at)}</span>
                        {lead.data_qualificacao && (
                          <span>Qualificado: {formatDate(lead.data_qualificacao)}</span>
                        )}
                        {lead.data_agendamento && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Agendado: {formatDate(lead.data_agendamento)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button 
                        onClick={() => liberarLead(lead.id)}
                        disabled={liberandoId === lead.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        {liberandoId === lead.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Liberando...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Liberar para Closers
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">
                Nenhum lead qualificado para liberar
              </h3>
              <p className="text-slate-500">
                Qualifique leads primeiro e eles aparecerão aqui para liberação
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}