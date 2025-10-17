'use client'

import { useState, useEffect } from 'react'
import { useRoleProtection } from '@/hooks/useRoleProtection'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { KPICard } from '@/components/dashboard/KPICard'
import { PerformanceFlag } from '@/components/dashboard/PerformanceFlag'
import { RankingBoard } from '@/components/dashboard/RankingBoard'
import { MetasViewer } from '@/components/metas/MetasViewer'
import { MotivationalGoalsChart } from '@/components/charts/MotivationalGoalsChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  Plus,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SDRDashboardData {
  leadsHoje: number
  leadsSemana: number
  leadsMes: number
  agendamentosHoje: number
  agendamentosSemana: number
  agendamentosMes: number
  taxaConversao: number
  metaDiaria: number
  metaSemanal: number
  metaMensal: number
  leadsRecentes: Array<{
    id: string
    nome: string
    origem: string
    status: string
    created_at: string
  }>
}

export default function SDRDashboard() {
  // Proteção de acesso - apenas SDRs
  const { hasAccess, loading: authLoading } = useRoleProtection({ 
    allowedRoles: ['sdr'] 
  })
  
  const { user } = useAuth()
  const [data, setData] = useState<SDRDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user])

  // Se ainda carregando auth ou sem acesso, não renderizar
  if (authLoading || !hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const loadDashboardData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      const hoje = new Date()
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - hoje.getDay())
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

      // Carregar leads por período
      const [
        { count: leadsHoje },
        { count: leadsSemana },
        { count: leadsMes },
        { count: agendamentosHoje },
        { count: agendamentosSemana },  
        { count: agendamentosMes },
        { data: leadsRecentes }
      ] = await Promise.all([
        // Leads hoje
        supabase.from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('sdr_id', user.id)
          .gte('created_at', hoje.toISOString().split('T')[0]),
        
        // Leads semana
        supabase.from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('sdr_id', user.id)
          .gte('created_at', inicioSemana.toISOString()),
        
        // Leads mês
        supabase.from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('sdr_id', user.id)
          .gte('created_at', inicioMes.toISOString()),

        // Agendamentos hoje
        supabase.from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('sdr_id', user.id)
          .eq('status', 'agendado')
          .gte('data_agendamento', hoje.toISOString().split('T')[0]),

        // Agendamentos semana
        supabase.from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('sdr_id', user.id)
          .eq('status', 'agendado')
          .gte('data_agendamento', inicioSemana.toISOString()),

        // Agendamentos mês
        supabase.from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('sdr_id', user.id)
          .eq('status', 'agendado')
          .gte('data_agendamento', inicioMes.toISOString()),

        // Leads recentes
        supabase.from('leads')
          .select('id, nome, origem, status, created_at')
          .eq('sdr_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      // Calcular taxa de conversão dinamicamente
      const { data: leadsConvertidos } = await supabase
        .from('leads')
        .select('id')
        .eq('sdr_id', user.id)
        .eq('status', 'convertido')
        .gte('created_at', inicioMes.toISOString())

      const taxaConversao = leadsMes > 0 
        ? Math.round(((leadsConvertidos?.length || 0) / leadsMes) * 100)
        : 0

      // Carregar metas
      const { data: metas } = await supabase
        .from('metas')
        .select('tipo, valor_meta')
        .eq('user_id', user.id)
        .eq('status', 'ativa')

      const metaDiaria = metas?.find(m => m.tipo === 'diaria')?.valor_meta || 0
      const metaSemanal = metas?.find(m => m.tipo === 'semanal')?.valor_meta || 0
      const metaMensal = metas?.find(m => m.tipo === 'mensal')?.valor_meta || 0

      setData({
        leadsHoje: leadsHoje || 0,
        leadsSemana: leadsSemana || 0,
        leadsMes: leadsMes || 0,
        agendamentosHoje: agendamentosHoje || 0,
        agendamentosSemana: agendamentosSemana || 0,
        agendamentosMes: agendamentosMes || 0,
        taxaConversao: taxaConversao || 0,
        metaDiaria: metaDiaria || 0,
        metaSemanal: metaSemanal || 0,
        metaMensal: metaMensal || 0,
        leadsRecentes: (leadsRecentes || []).map(lead => ({
          ...lead,
          nome: lead.nome || 'Nome não informado',
          origem: lead.origem || 'Origem não informada',
          status: lead.status || 'novo',
          created_at: lead.created_at || new Date().toISOString()
        }))
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard SDR:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard SDR">
        <div className="text-center">
          <div className="animate-pulse text-slate-400">Carregando dados...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout title="Dashboard SDR">
        <div className="text-center">
          <div className="text-red-400">Erro ao carregar dados</div>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo': return 'bg-blue-900 text-blue-300'
      case 'qualificado': return 'bg-yellow-900 text-yellow-300'
      case 'agendado': return 'bg-green-900 text-green-300'
      case 'perdido': return 'bg-red-900 text-red-300'
      case 'convertido': return 'bg-emerald-900 text-emerald-300'
      default: return 'bg-slate-700 text-slate-300'
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

  return (
    <DashboardLayout title="Dashboard SDR">
      <div className="space-y-6">
        {/* Bandeira de Performance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">Sua Performance</h2>
            <PerformanceFlag 
              conversaoPercent={data.taxaConversao} 
              dataCadastro={user?.data_cadastro || new Date().toISOString()} 
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Leads Hoje"
            value={data.leadsHoje}
            icon={Users}
            subtitle={`Meta: ${data.metaDiaria}`}
            trend={{
              value: data.metaDiaria > 0 ? ((data.leadsHoje / data.metaDiaria) * 100) - 100 : 0,
              isPositive: data.leadsHoje >= data.metaDiaria
            }}
          />
          <KPICard
            title="Leads Semana"
            value={data.leadsSemana}
            icon={TrendingUp}
            subtitle={`Meta: ${data.metaSemanal}`}
            trend={{
              value: data.metaSemanal > 0 ? ((data.leadsSemana / data.metaSemanal) * 100) - 100 : 0,
              isPositive: data.leadsSemana >= data.metaSemanal
            }}
          />
          <KPICard
            title="Leads Mês"
            value={data.leadsMes}
            icon={Calendar}
            subtitle={`Meta: ${data.metaMensal}`}
            trend={{
              value: data.metaMensal > 0 ? ((data.leadsMes / data.metaMensal) * 100) - 100 : 0,
              isPositive: data.leadsMes >= data.metaMensal
            }}
          />
          <KPICard
            title="Taxa de Conversão"
            value={data.taxaConversao}
            type="percent"
            icon={Target}
            subtitle="Mês atual"
          />
        </div>

        {/* Agendamentos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Agendamentos Hoje"
            value={data.agendamentosHoje}
            icon={Calendar}
            subtitle="Chamadas marcadas"
          />
          <KPICard
            title="Agendamentos Semana"
            value={data.agendamentosSemana}
            icon={Calendar}
            subtitle="Chamadas marcadas"
          />
          <KPICard
            title="Agendamentos Mês"
            value={data.agendamentosMes}
            icon={Calendar}
            subtitle="Chamadas marcadas"
          />
        </div>

        {/* Gráfico Motivacional */}
        <MotivationalGoalsChart />

        {/* Ranking Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RankingBoard userRole="sdr" />
          </div>
          <div className="lg:col-span-2">
            <MetasViewer userRole="sdr" />
          </div>
        </div>

        {/* Leads Recentes */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Leads Recentes</span>
              </span>
              <Button variant="outline" size="sm">
                Ver Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.leadsRecentes.length > 0 ? (
              <div className="space-y-4">
                {data.leadsRecentes.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-medium">{lead.nome}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead.status)}`}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Origem: {lead.origem} • {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum lead cadastrado ainda</p>
                <p className="text-sm">Comece cadastrando seu primeiro lead!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}