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
  ArrowDown, 
  Mail, 
  Phone, 
  DollarSign,
  Clock,
  User,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Lead {
  id: string
  nome: string
  email?: string
  telefone?: string
  origem: string
  status: string
  status_atribuicao: string
  sdr_id: string
  valor_estimado?: number
  observacoes?: string
  data_qualificacao?: string
  data_agendamento?: string
  created_at: string
  users?: {
    nome_completo: string
  }
}

export function LeadsDisponiveis() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [pegandoId, setPegandoId] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadLeadsDisponiveis()
    }
  }, [user])

  const loadLeadsDisponiveis = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status_atribuicao', 'disponivel')
        .in('status', ['qualificado', 'agendado'])
        .order('updated_at', { ascending: false })

      if (error) throw error

      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao carregar leads disponíveis:', error)
      showAlert('error', 'Erro ao carregar leads disponíveis')
    } finally {
      setLoading(false)
    }
  }

  const pegarLead = async (leadId: string) => {
    try {
      setPegandoId(leadId)
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          status_atribuicao: 'atribuido',
          closer_id: user!.id,
          data_atribuicao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

      if (error) throw error

      // Remover da lista local
      setLeads(prev => prev.filter(lead => lead.id !== leadId))
      showAlert('success', 'Lead atribuído com sucesso! Agora você pode fazer chamadas.')
      
    } catch (error) {
      console.error('Erro ao pegar lead:', error)
      showAlert('error', 'Erro ao pegar lead')
    } finally {
      setPegandoId(null)
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
            <span className="ml-2 text-slate-400">Carregando leads disponíveis...</span>
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
            <Users className="h-5 w-5 text-green-400" />
            <span>Leads Disponíveis para Trabalhar ({leads.length})</span>
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Leads qualificados pelos SDRs que estão prontos para serem trabalhados por closers
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
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="h-3 w-3 text-blue-400" />
                          <span className="text-blue-400">
                            SDR ID: {lead.sdr_id}
                          </span>
                        </div>
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
                        onClick={() => pegarLead(lead.id)}
                        disabled={pegandoId === lead.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        {pegandoId === lead.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Pegando...
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-4 w-4 mr-2" />
                            Pegar Lead
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
                Nenhum lead disponível no momento
              </h3>
              <p className="text-slate-500">
                Aguarde os SDRs liberarem leads qualificados
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}