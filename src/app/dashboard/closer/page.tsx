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
  Phone, 
  DollarSign, 
  Target, 
  TrendingUp,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CloserDashboardData {
  chamadasHoje: number
  chamadasSemana: number
  chamadaMes: number
  vendasHoje: number
  vendasSemana: number
  vendasMes: number
  faturamentoHoje: number
  faturamentoSemana: number
  faturamentoMes: number
  ticketMedio: number
  taxaFechamento: number
  tempoMedioChamada: number
  chamadasRecentes: Array<{
    id: string
    lead_nome: string
    valor: number | null
    resultado: string
    duracao_minutos: number | null
    data_chamada: string
  }>
}

export default function CloserDashboard() {
  // Proteção de acesso - apenas closers
  const { hasAccess, loading: authLoading } = useRoleProtection({ 
    allowedRoles: ['closer'] 
  })
  
  const { user } = useAuth()
  const [data, setData] = useState<CloserDashboardData | null>(null)
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

      // Carregar chamadas por período
      const [
        { count: chamadasHoje },
        { count: chamadasSemana },
        { count: chamadaMes },
        { count: vendasHoje },
        { count: vendasSemana },
        { count: vendasMes }
      ] = await Promise.all([
        // Chamadas hoje
        supabase.from('chamadas')
          .select('*', { count: 'exact', head: true })
          .eq('closer_id', user.id)
          .gte('data_chamada', hoje.toISOString().split('T')[0]),
        
        // Chamadas semana
        supabase.from('chamadas')
          .select('*', { count: 'exact', head: true })
          .eq('closer_id', user.id)
          .gte('data_chamada', inicioSemana.toISOString()),
        
        // Chamadas mês
        supabase.from('chamadas')
          .select('*', { count: 'exact', head: true })
          .eq('closer_id', user.id)
          .gte('data_chamada', inicioMes.toISOString()),

        // Vendas hoje
        supabase.from('chamadas')
          .select('*', { count: 'exact', head: true })
          .eq('closer_id', user.id)
          .eq('resultado', 'venda')
          .gte('data_chamada', hoje.toISOString().split('T')[0]),

        // Vendas semana
        supabase.from('chamadas')
          .select('*', { count: 'exact', head: true })
          .eq('closer_id', user.id)
          .eq('resultado', 'venda')
          .gte('data_chamada', inicioSemana.toISOString()),

        // Vendas mês
        supabase.from('chamadas')
          .select('*', { count: 'exact', head: true })
          .eq('closer_id', user.id)
          .eq('resultado', 'venda')
          .gte('data_chamada', inicioMes.toISOString())
      ])

      // Carregar faturamento por período
      const [
        { data: faturamentoHojeData },
        { data: faturamentoSemanaData },
        { data: faturamentoMesData },
        { data: chamadasRecentes }
      ] = await Promise.all([
        // Faturamento hoje
        supabase.from('chamadas')
          .select('valor')
          .eq('closer_id', user.id)
          .eq('resultado', 'venda')
          .gte('data_chamada', hoje.toISOString().split('T')[0]),

        // Faturamento semana
        supabase.from('chamadas')
          .select('valor')
          .eq('closer_id', user.id)
          .eq('resultado', 'venda')
          .gte('data_chamada', inicioSemana.toISOString()),

        // Faturamento mês
        supabase.from('chamadas')
          .select('valor')
          .eq('closer_id', user.id)
          .eq('resultado', 'venda')
          .gte('data_chamada', inicioMes.toISOString()),

        // Chamadas recentes
        supabase.from('chamadas')
          .select(`
            id,
            valor,
            resultado,
            duracao_minutos,
            data_chamada,
            leads!inner(nome)
          `)
          .eq('closer_id', user.id)
          .order('data_chamada', { ascending: false })
          .limit(5)
      ])

      // Calcular faturamentos
      const faturamentoHoje = faturamentoHojeData?.reduce((acc, c) => acc + (c.valor || 0), 0) || 0
      const faturamentoSemana = faturamentoSemanaData?.reduce((acc, c) => acc + (c.valor || 0), 0) || 0
      const faturamentoMes = faturamentoMesData?.reduce((acc, c) => acc + (c.valor || 0), 0) || 0

      // Calcular métricas
      const ticketMedio = vendasMes && vendasMes > 0 ? faturamentoMes / vendasMes : 0
      const taxaFechamento = chamadaMes && chamadaMes > 0 ? (vendasMes / chamadaMes) * 100 : 0

      // Carregar tempo médio de chamadas
      const { data: tempoMedioData } = await supabase
        .from('chamadas')
        .select('duracao_minutos')
        .eq('closer_id', user.id)
        .gte('data_chamada', inicioMes.toISOString())
        .not('duracao_minutos', 'is', null)

      const tempoMedioChamada = tempoMedioData && tempoMedioData.length > 0
        ? tempoMedioData.reduce((acc, c) => acc + (c.duracao_minutos || 0), 0) / tempoMedioData.length
        : 0

      setData({
        chamadasHoje: chamadasHoje || 0,
        chamadasSemana: chamadasSemana || 0,
        chamadaMes: chamadaMes || 0,
        vendasHoje: vendasHoje || 0,
        vendasSemana: vendasSemana || 0,
        vendasMes: vendasMes || 0,
        faturamentoHoje,
        faturamentoSemana,
        faturamentoMes,
        ticketMedio,
        taxaFechamento,
        tempoMedioChamada,
        chamadasRecentes: chamadasRecentes?.map(c => ({
          id: c.id,
          lead_nome: (c.leads as any)?.nome || 'Lead não encontrado',
          valor: c.valor,
          resultado: c.resultado,
          duracao_minutos: c.duracao_minutos,
          data_chamada: c.data_chamada
        })) || []
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard Closer:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Closer">
        <div className="text-center">
          <div className="animate-pulse text-slate-400">Carregando dados...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout title="Dashboard Closer">
        <div className="text-center">
          <div className="text-red-400">Erro ao carregar dados</div>
        </div>
      </DashboardLayout>
    )
  }

  const getResultIcon = (resultado: string) => {
    switch (resultado) {
      case 'venda': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'perda': return <XCircle className="h-4 w-4 text-red-400" />
      case 'reagendamento': return <Clock className="h-4 w-4 text-yellow-400" />
      default: return <Phone className="h-4 w-4 text-slate-400" />
    }
  }

  const getResultLabel = (resultado: string) => {
    switch (resultado) {
      case 'venda': return 'Venda'
      case 'perda': return 'Perda'
      case 'reagendamento': return 'Reagendamento'
      default: return resultado
    }
  }

  const getResultColor = (resultado: string) => {
    switch (resultado) {
      case 'venda': return 'bg-green-900 text-green-300'
      case 'perda': return 'bg-red-900 text-red-300'
      case 'reagendamento': return 'bg-yellow-900 text-yellow-300'
      default: return 'bg-slate-700 text-slate-300'
    }
  }

  return (
    <DashboardLayout title="Dashboard Closer">
      <div className="space-y-6">
        {/* Bandeira de Performance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">Sua Performance</h2>
            <PerformanceFlag 
              conversaoPercent={data.taxaFechamento} 
              dataCadastro={user?.data_cadastro || new Date().toISOString()} 
            />
          </div>
          <div className="flex space-x-3">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Chamada
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard/closer/leads-disponiveis">
                <Users className="h-4 w-4 mr-2" />
                Leads Disponíveis
              </a>
            </Button>
          </div>
        </div>


        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Chamadas Hoje"
            value={data.chamadasHoje}
            icon={Phone}
            subtitle={`${data.vendasHoje} vendas`}
          />
          <KPICard
            title="Chamadas Semana"
            value={data.chamadasSemana}
            icon={TrendingUp}
            subtitle={`${data.vendasSemana} vendas`}
          />
          <KPICard
            title="Chamadas Mês"
            value={data.chamadaMes}
            icon={Phone}
            subtitle={`${data.vendasMes} vendas`}
          />
          <KPICard
            title="Taxa de Fechamento"
            value={data.taxaFechamento}
            type="percent"
            icon={Target}
            subtitle="Mês atual"
          />
        </div>

        {/* Faturamento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Faturamento Hoje"
            value={data.faturamentoHoje}
            type="currency"
            icon={DollarSign}
            subtitle={`${data.vendasHoje} vendas`}
          />
          <KPICard
            title="Faturamento Semana"
            value={data.faturamentoSemana}
            type="currency"
            icon={DollarSign}
            subtitle={`${data.vendasSemana} vendas`}
          />
          <KPICard
            title="Faturamento Mês"
            value={data.faturamentoMes}
            type="currency"
            icon={DollarSign}
            subtitle={`${data.vendasMes} vendas`}
          />
          <KPICard
            title="Ticket Médio"
            value={data.ticketMedio}
            type="currency"
            icon={TrendingUp}
            subtitle={`${Math.round(data.tempoMedioChamada)} min/chamada`}
          />
        </div>

        {/* Gráfico Motivacional */}
        <MotivationalGoalsChart />

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Metas */}
          <div className="lg:col-span-1">
            <MetasViewer userRole="closer" />
          </div>

          {/* Ranking */}
          <div className="lg:col-span-1">
            <RankingBoard userRole="closer" />
          </div>

          {/* Chamadas Recentes */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>Chamadas Recentes</span>
                  </span>
                  <Button variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.chamadasRecentes.length > 0 ? (
                  <div className="space-y-4">
                    {data.chamadasRecentes.map((chamada) => (
                      <div key={chamada.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            {getResultIcon(chamada.resultado)}
                            <span className="text-white font-medium">{chamada.lead_nome}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getResultColor(chamada.resultado)}`}>
                              {getResultLabel(chamada.resultado)}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400 mt-1 flex items-center space-x-4">
                            <span>{new Date(chamada.data_chamada).toLocaleDateString('pt-BR')}</span>
                            {chamada.duracao_minutos && (
                              <span>{chamada.duracao_minutos} min</span>
                            )}
                            {chamada.valor && (
                              <span className="text-green-400 font-medium">
                                {chamada.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma chamada realizada ainda</p>
                    <p className="text-sm">Comece registrando sua primeira chamada!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}