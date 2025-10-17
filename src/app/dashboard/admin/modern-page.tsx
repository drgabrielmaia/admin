'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ModernKPICard } from '@/components/dashboard/ModernKPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { 
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Phone,
  Calendar,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Crown,
  Star,
  Plus,
  Eye,
  MoreHorizontal
} from 'lucide-react'

interface AdminDashboardData {
  totalUsuarios: number
  usuariosNovos: number
  totalVendas: number
  vendasMes: number
  faturamentoTotal: number
  faturamentoMes: number
  mediaConversao: number
  metasAtivas: number
  topPerformers: Array<{
    id: string
    nome: string
    funcao: string
    vendas: number
    faturamento: number
    conversao: number
  }>
  vendasRecentes: Array<{
    id: string
    closer_nome: string
    lead_nome: string
    produto_nome: string
    valor: number
    data: string
  }>
  estatisticasGerais: {
    chamadas_hoje: number
    leads_novos: number
    agendamentos: number
    taxa_fechamento: number
  }
}

export default function ModernAdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    if (user?.funcao === 'admin') {
      loadDashboardData()
    }
  }, [user, timeframe])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const timeframeDays = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
      const dataInicio = new Date(hoje.getTime() - timeframeDays * 24 * 60 * 60 * 1000)

      // Carregar dados em paralelo
      const [
        { count: totalUsuarios },
        { count: usuariosNovos },
        { count: totalVendas },
        { count: vendasMes },
        { data: faturamentoData },
        { data: faturamentoMesData },
        { data: metasData },
        { data: vendasRecentes }
      ] = await Promise.all([
        // Total de usuários
        supabase.from('users').select('*', { count: 'exact', head: true }),
        
        // Usuários novos no período
        supabase.from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dataInicio.toISOString()),
          
        // Total de vendas
        supabase.from('chamadas')
          .select('*', { count: 'exact', head: true })
          .eq('resultado', 'venda'),
          
        // Vendas no mês
        supabase.from('chamadas')
          .select('*', { count: 'exact', head: true })
          .eq('resultado', 'venda')
          .gte('created_at', inicioMes.toISOString()),
          
        // Faturamento total
        supabase.from('chamadas')
          .select('valor')
          .eq('resultado', 'venda'),
          
        // Faturamento do mês
        supabase.from('chamadas')
          .select('valor')
          .eq('resultado', 'venda')
          .gte('created_at', inicioMes.toISOString()),
          
        // Metas ativas
        supabase.from('metas')
          .select('*')
          .eq('status', 'ativa'),
          
        // Vendas recentes
        supabase.from('chamadas')
          .select(`
            id,
            valor,
            created_at,
            users!closer_id(nome),
            leads!lead_id(nome),
            produtos!produto_id(nome)
          `)
          .eq('resultado', 'venda')
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      const faturamentoTotal = faturamentoData?.reduce((acc, c) => acc + (c.valor || 0), 0) || 0
      const faturamentoMes = faturamentoMesData?.reduce((acc, c) => acc + (c.valor || 0), 0) || 0

      // Calcular estatísticas adicionais
      const { data: estatisticasData } = await supabase.rpc('get_admin_stats')

      setData({
        totalUsuarios: totalUsuarios || 0,
        usuariosNovos: usuariosNovos || 0,
        totalVendas: totalVendas || 0,
        vendasMes: vendasMes || 0,
        faturamentoTotal,
        faturamentoMes,
        mediaConversao: 15.8, // Placeholder - calcular real
        metasAtivas: metasData?.length || 0,
        topPerformers: [], // Implementar depois
        vendasRecentes: vendasRecentes?.map((v: any) => ({
          id: v.id,
          closer_nome: v.users?.nome || 'Closer',
          lead_nome: v.leads?.nome || 'Lead',
          produto_nome: v.produtos?.nome || 'Produto',
          valor: v.valor || 0,
          data: v.created_at
        })) || [],
        estatisticasGerais: {
          chamadas_hoje: 12,
          leads_novos: 8,
          agendamentos: 5,
          taxa_fechamento: 23.5
        }
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (user?.funcao !== 'admin') {
    return (
      <DashboardLayout title="Dashboard Admin">
        <div className="text-center text-white/60">
          Acesso restrito para administradores
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Admin">
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/[0.05] rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout title="Dashboard Admin">
        <div className="text-center text-red-400">Erro ao carregar dados</div>
      </DashboardLayout>
    )
  }

  const getGrowthTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true }
    const growth = ((current - previous) / previous) * 100
    return {
      value: Math.abs(growth),
      isPositive: growth >= 0
    }
  }

  return (
    <DashboardLayout title="Dashboard Admin">
      <div className="space-y-8">
        {/* Header com controles de tempo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Visão Geral do Negócio
            </h2>
            <p className="text-white/60">Acompanhe o desempenho em tempo real</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {['7d', '30d', '90d'].map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(period as any)}
                className={cn(
                  "transition-all duration-200",
                  timeframe === period 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                    : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
              </Button>
            ))}
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernKPICard
            title="Total de Usuários"
            value={data.totalUsuarios}
            icon={Users}
            subtitle={`+${data.usuariosNovos} novos`}
            trend={getGrowthTrend(data.totalUsuarios, data.totalUsuarios - data.usuariosNovos)}
            iconColor="text-blue-400"
            gradientFrom="from-blue-500/20"
            gradientTo="to-indigo-500/20"
          />
          
          <ModernKPICard
            title="Vendas Realizadas"
            value={data.vendasMes}
            icon={Award}
            subtitle={`${data.totalVendas} total`}
            trend={{ value: 12.5, isPositive: true }}
            iconColor="text-emerald-400"
            gradientFrom="from-emerald-500/20"
            gradientTo="to-green-500/20"
          />
          
          <ModernKPICard
            title="Faturamento Mensal"
            value={data.faturamentoMes}
            type="currency"
            icon={DollarSign}
            subtitle="Mês atual"
            trend={{ value: 8.3, isPositive: true }}
            iconColor="text-green-400"
            gradientFrom="from-green-500/20"
            gradientTo="to-emerald-500/20"
          />
          
          <ModernKPICard
            title="Taxa de Conversão"
            value={data.mediaConversao}
            type="percent"
            icon={Target}
            subtitle="Média geral"
            trend={{ value: 2.1, isPositive: true }}
            iconColor="text-purple-400"
            gradientFrom="from-purple-500/20"
            gradientTo="to-pink-500/20"
          />
        </div>

        {/* Estatísticas Secundárias */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Chamadas Hoje', value: data.estatisticasGerais.chamadas_hoje, icon: Phone, color: 'text-cyan-400' },
            { label: 'Leads Novos', value: data.estatisticasGerais.leads_novos, icon: Users, color: 'text-orange-400' },
            { label: 'Agendamentos', value: data.estatisticasGerais.agendamentos, icon: Calendar, color: 'text-yellow-400' },
            { label: 'Taxa Fechamento', value: `${data.estatisticasGerais.taxa_fechamento}%`, icon: TrendingUp, color: 'text-rose-400' }
          ].map((stat, index) => (
            <Card key={index} className="bg-black/20 border-white/[0.08] backdrop-blur-xl hover:bg-white/[0.02] transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Seção de Vendas Recentes */}
        <Card className="bg-black/20 border-white/[0.08] backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-emerald-400" />
                  <span>Atividade Recente</span>
                </CardTitle>
                <p className="text-white/60 text-sm mt-1">Últimas vendas realizadas</p>
              </div>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                <Eye className="h-4 w-4 mr-2" />
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.vendasRecentes.length > 0 ? (
              <div className="space-y-3">
                {data.vendasRecentes.map((venda) => (
                  <div key={venda.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-xl flex items-center justify-center">
                        <Award className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{venda.lead_nome}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {venda.closer_nome}
                          </Badge>
                          <span className="text-white/40">•</span>
                          <span className="text-white/60 text-sm">{venda.produto_nome}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">
                        {venda.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-white/40 text-xs">
                        {new Date(venda.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">Nenhuma venda recente</p>
                <p className="text-white/40 text-sm">As vendas aparecerão aqui quando realizadas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20 backdrop-blur-xl group hover:from-emerald-500/20 hover:to-green-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">Gerenciar Produtos</h3>
                  <p className="text-white/60 text-sm mt-1">Adicione novos produtos e gerencie preços</p>
                </div>
                <Button className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Acessar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-xl group hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">Configurar Metas</h3>
                  <p className="text-white/60 text-sm mt-1">Defina objetivos para sua equipe</p>
                </div>
                <Button className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30">
                  <Target className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}