'use client'

import { useState, useEffect, memo, useMemo, useCallback } from 'react'
import { useRoleProtection } from '@/hooks/useRoleProtection'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { BirthdayIcon } from '@/components/ui/birthday-icon'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Phone,
  Crown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Star,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  Sparkles,
  LineChart,
  PieChart,
  Building2,
  Wallet,
  UserCheck
} from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'
import { measurePerformance, createApiCache } from '@/lib/performance'

interface DashboardData {
  totalUsuarios: number
  totalLeads: number
  totalVendas: number
  faturamentoTotal: number
  ticketMedio: number
  taxaConversaoGeral: number
  topPerformers: Array<{
    id: string
    nome: string
    funcao: string
    vendas: number
    faturamento: number
    taxa_conversao: number
    data_nascimento?: string
  }>
  metricasPorFuncao: {
    sdrs: { total: number, leads: number, conversoes: number }
    closers: { total: number, chamadas: number, vendas: number }
  }
  metasGerais: {
    metaMensalVendas: number
    metaMensalFaturamento: number
    progressoVendas: number
    progressoFaturamento: number
  }
  dadosBPO?: Array<{
    motor: string
    vendas: number
    faturamento: number
    custos: number
    lucro: number
  }>
}

// Componente Premium Dark KPI Card - Memorizado para performance
const PremiumDarkKPICard = memo(({ 
  title, 
  value, 
  change, 
  changeType = 'increase', 
  icon: Icon, 
  color = 'blue',
  subtitle,
}: {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: React.ElementType
  color?: 'blue' | 'green' | 'purple' | 'orange'
  subtitle?: string
}) => {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400'
  }

  return (
    <Card className="bg-[#1A1C20] border-[#2E3138] rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-slate-800/50">
            <Icon className={clsx('h-5 w-5', colorClasses[color])} />
          </div>
          {change !== undefined && (
            <div className={clsx(
              'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
              changeType === 'increase' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/20 text-red-400'
            )}>
              {changeType === 'increase' ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>+{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#94A3B8]">{title}</p>
          <p className="text-2xl font-bold text-[#F1F5F9] group-hover:text-white transition-colors">
            {typeof value === 'number' && title.includes('Faturamento') 
              ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : typeof value === 'number' && title.includes('Taxa')
              ? `${value.toFixed(1)}%`
              : value.toLocaleString('pt-BR')
            }
          </p>
          {subtitle && (
            <p className="text-xs text-[#64748B]">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

// Componente de Gráfico Dark Placeholder - Memorizado para performance
const DarkChart = memo(({ type, title, description, height = 280 }: {
  type: 'line' | 'bar' | 'pie'
  title: string
  description: string
  height?: number
}) => {
  return (
    <Card className="bg-[#1A1C20] border-[#2E3138] rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-[#F1F5F9]">{title}</CardTitle>
            <p className="text-sm text-[#94A3B8] mt-1">{description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-slate-800/50"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-slate-800/50"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="flex items-center justify-center bg-[#16181D] rounded-xl border border-[#2E3138]"
          style={{ height }}
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800/50 flex items-center justify-center">
              {type === 'line' && <LineChart className="h-6 w-6 text-[#64748B]" />}
              {type === 'bar' && <BarChart3 className="h-6 w-6 text-[#64748B]" />}
              {type === 'pie' && <PieChart className="h-6 w-6 text-[#64748B]" />}
            </div>
            <p className="text-sm text-[#94A3B8] font-medium">{title}</p>
            <p className="text-xs text-[#64748B] mt-1">Dados em tempo real</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

// Componente de Progress Bar Dark - Memorizado para performance
const DarkProgressBar = memo(({ 
  title, 
  current, 
  target, 
  percentage, 
  color = 'blue',
  icon: Icon 
}: {
  title: string
  current: number | string
  target: number | string
  percentage: number
  color?: 'blue' | 'green'
  icon: React.ElementType
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600'
  }

  const textColors = {
    blue: 'text-blue-400',
    green: 'text-emerald-400'
  }

  return (
    <Card className="bg-[#1A1C20] border-[#2E3138] rounded-2xl shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-slate-800/50">
            <Icon className={clsx('h-5 w-5', textColors[color])} />
          </div>
          <span className="text-[#F1F5F9] font-semibold">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-[#F1F5F9]">
              {typeof current === 'number' && title.includes('Faturamento')
                ? current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : current
              }
            </span>
            <span className="text-sm text-[#94A3B8]">
              de {typeof target === 'number' && title.includes('Faturamento')
                ? target.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : target
              }
            </span>
          </div>
          <div className="w-full bg-[#16181D] rounded-full h-2">
            <div 
              className={clsx('h-2 rounded-full bg-gradient-to-r transition-all duration-1000', colorClasses[color])}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#94A3B8]">Progresso</span>
            <span className={clsx('font-medium', textColors[color])}>{percentage.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default function AdminDashboard() {
  const { hasAccess, loading: authLoading } = useRoleProtection({ 
    allowedRoles: ['admin'] 
  })
  const { user } = useAuth()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Cache para dados do dashboard (5 minutos)
  const dashboardCache = createApiCache<DashboardData>(5 * 60 * 1000)

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Verificar cache primeiro
      const cacheKey = `dashboard-${user?.id || 'anonymous'}`
      const cachedData = dashboardCache.get(cacheKey)
      if (cachedData) {
        console.log('📦 Dados carregados do cache')
        setData(cachedData)
        setLoading(false)
        return
      }
      
      // Se não houver cache, carregar dados com medição de performance
      const dashboardData = await measurePerformance(async () => {
        const [
          { count: totalUsuarios },
          { count: totalLeads },
          { count: totalVendas },
          { data: vendas }
        ] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('chamadas').select('*', { count: 'exact', head: true }).eq('resultado', 'venda').eq('status_aprovacao', 'aprovada'),
        supabase.from('chamadas').select('valor').eq('resultado', 'venda').eq('status_aprovacao', 'aprovada')
      ])

        const faturamentoTotal = vendas?.reduce((acc, v) => acc + (v.valor || 0), 0) || 0
        const ticketMedio = (totalVendas || 0) > 0 ? faturamentoTotal / (totalVendas || 1) : 0
        const taxaConversaoGeral = (totalLeads || 0) > 0 ? ((totalVendas || 0) / (totalLeads || 1)) * 100 : 0

        const { data: comissoes } = await supabase
        .from('vw_comissoes_por_usuario')
        .select('*')
        .order('total_comissao_geral', { ascending: false })
        .limit(5)

        const topPerformers = comissoes?.map(c => ({
          id: c.user_id,
          nome: c.nome,
          funcao: c.funcao,
          data_nascimento: c.data_nascimento,
          vendas: c.total_vendas_sdr + c.total_vendas_closer,
          faturamento: c.total_comissao_geral,
          taxa_conversao: c.total_vendas_sdr + c.total_vendas_closer
        })) || []

        const { count: totalSDRs } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .eq('funcao', 'sdr')

        const { count: totalClosers } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .eq('funcao', 'closer')

        const { count: totalChamadas } = await supabase
          .from('chamadas')
          .select('*', { count: 'exact', head: true })

        const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
      
        const { data: metasVendas } = await supabase
          .from('metas')
          .select('*')
          .eq('tipo', 'equipe')
          .eq('categoria', 'vendas')
          .eq('status', 'ativa')
          .lte('data_inicio', fimMes)
          .gte('data_fim', inicioMes)
          .single()

        const { data: metasFaturamento } = await supabase
          .from('metas')
          .select('*')
          .eq('tipo', 'equipe')
          .eq('categoria', 'faturamento')
          .eq('status', 'ativa')
          .lte('data_inicio', fimMes)
          .gte('data_fim', inicioMes)
          .single()

        const metasGerais = {
          metaMensalVendas: metasVendas?.valor_meta || 50,
          metaMensalFaturamento: metasFaturamento?.valor_meta || 100000,
          progressoVendas: metasVendas ? ((totalVendas || 0) / metasVendas.valor_meta) * 100 : 0,
          progressoFaturamento: metasFaturamento ? (faturamentoTotal / metasFaturamento.valor_meta) * 100 : 0
        }

        // CARREGAR DADOS REAIS DOS BPOs POR MOTOR
        const motores = ['mentoria', 'infoproduto', 'saas', 'fisico', 'parceria', 'clinica', 'evento']
        const dadosBPO = await Promise.all(
          motores.map(async (motor) => {
            // Vendas do motor
            const { data: vendasMotor } = await supabase
              .from('chamadas')
              .select(`
                valor,
                created_at,
                produtos!inner(tipo, custo)
              `)
              .eq('resultado', 'venda')
              .eq('status_aprovacao', 'aprovada')
              .eq('produtos.tipo', motor)

            // Movimentações do motor
            const { data: movimentacoesMotor } = await supabase
              .from('movimentacoes_financeiras')
              .select('*')
              .eq('negocio', motor)
              .eq('status', 'realizado')

            if (vendasMotor) {
              const faturamentoVendas = vendasMotor.reduce((acc, v) => acc + (v.valor || 0), 0)
              const custoVendas = vendasMotor.reduce((acc, v) => {
                const produto = v.produtos as any
                return acc + (produto?.custo || 0)
              }, 0)

              const entradasExtras = movimentacoesMotor?.filter(mov => mov.tipo === 'entrada')
                .reduce((sum, mov) => sum + mov.valor, 0) || 0
              
              const saidasExtras = movimentacoesMotor?.filter(mov => mov.tipo === 'saida')
                .reduce((sum, mov) => sum + mov.valor, 0) || 0

              const faturamentoTotal = faturamentoVendas + entradasExtras
              const custoTotal = custoVendas + saidasExtras

              return {
                motor,
                vendas: vendasMotor.length,
                faturamento: faturamentoTotal,
                custos: custoTotal,
                lucro: faturamentoTotal - custoTotal
              }
            }
            
            return { motor, vendas: 0, faturamento: 0, custos: 0, lucro: 0 }
          })
        )

      return {
        totalUsuarios: totalUsuarios || 0,
        totalLeads: totalLeads || 0,
        totalVendas: totalVendas || 0,
        faturamentoTotal,
        ticketMedio,
        taxaConversaoGeral,
        topPerformers,
        metricasPorFuncao: {
          sdrs: { total: totalSDRs || 0, leads: totalLeads || 0, conversoes: totalVendas || 0 },
          closers: { total: totalClosers || 0, chamadas: totalChamadas || 0, vendas: totalVendas || 0 }
        },
        metasGerais,
        dadosBPO: dadosBPO || []
      }
    }, 'Dashboard Data Loading')
      
      // Salvar no cache e definir dados
      dashboardCache.set(cacheKey, dashboardData)
      setData(dashboardData)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasAccess && !authLoading) {
      loadDashboardData()
    }
  }, [hasAccess, authLoading, loadDashboardData])

  if (authLoading || !hasAccess) {
    return (
      <div className="min-h-screen bg-[#0E0E10] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#1A1C20] border border-[#2E3138] flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
          </div>
          <p className="text-[#94A3B8] font-medium">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E10]">
        <DashboardLayout title="Dashboard">
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-[#1A1C20] rounded-2xl border border-[#2E3138]" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-[#1A1C20] rounded-2xl border border-[#2E3138]" />
              <div className="h-80 bg-[#1A1C20] rounded-2xl border border-[#2E3138]" />
            </div>
          </div>
        </DashboardLayout>
      </div>
    )
  }

  // Memoizar cálculos pesados para performance
  const sortedMotorsByFaturamento = useMemo(() => {
    if (!data?.dadosBPO) return []
    return data.dadosBPO
      .filter(motor => motor.faturamento > 0)
      .sort((a, b) => b.faturamento - a.faturamento)
  }, [data?.dadosBPO])

  const sortedMotorsByLucro = useMemo(() => {
    if (!data?.dadosBPO) return []
    return data.dadosBPO
      .filter(motor => motor.lucro > 0)
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 5)
  }, [data?.dadosBPO])

  const totalLucro = useMemo(() => {
    if (!data?.dadosBPO) return 1
    return data.dadosBPO.reduce((acc, m) => acc + m.lucro, 0) || 1
  }, [data?.dadosBPO])

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0E0E10]">
        <DashboardLayout title="Dashboard">
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#1A1C20] border border-[#2E3138] flex items-center justify-center">
              <Activity className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">Erro ao carregar dados</h3>
            <Button 
              onClick={loadDashboardData} 
              variant="outline"
              className="bg-[#1A1C20] border-[#2E3138] text-[#F1F5F9] hover:bg-[#16181D]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </DashboardLayout>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0E0E10]">
      <DashboardLayout title="Dashboard">
        <div className="space-y-8 pb-8">
          {/* Header Dark Premium */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full" />
                <h1 className="text-3xl font-bold text-[#F1F5F9] tracking-tight">
                  Dashboard Executivo
                </h1>
              </div>
              <p className="text-[#94A3B8] ml-4 font-medium">
                Performance em tempo real • Gestão high-ticket
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-[#1A1C20] border-[#2E3138] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#16181D]"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Este mês
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-[#1A1C20] border-[#2E3138] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#16181D]"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
                <Activity className="h-4 w-4 mr-2" />
                Análise Completa
              </Button>
            </div>
          </div>

          {/* Quick Actions Dark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link 
              href="/dashboard/admin/metas"
              className="group relative overflow-hidden rounded-2xl bg-[#1A1C20] border border-[#2E3138] p-6 transition-all duration-200 hover:shadow-xl hover:scale-[1.01] hover:border-blue-500/50"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F1F5F9] text-lg">Metas Empresariais</h3>
                  <p className="text-sm text-[#94A3B8]">Gestão estratégica</p>
                </div>
              </div>
              <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="/dashboard/admin/produtos/eventos"
              className="group relative overflow-hidden rounded-2xl bg-[#1A1C20] border border-[#2E3138] p-6 transition-all duration-200 hover:shadow-xl hover:scale-[1.01] hover:border-yellow-500/50"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-yellow-500/20">
                  <Calendar className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F1F5F9] text-lg">Eventos</h3>
                  <p className="text-sm text-[#94A3B8]">Motor de eventos</p>
                </div>
              </div>
              <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="/dashboard/admin/comissoes-personalizadas"
              className="group relative overflow-hidden rounded-2xl bg-[#1A1C20] border border-[#2E3138] p-6 transition-all duration-200 hover:shadow-xl hover:scale-[1.01] hover:border-emerald-500/50"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <Wallet className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F1F5F9] text-lg">Comissões Pro</h3>
                  <p className="text-sm text-[#94A3B8]">Estruturas otimizadas</p>
                </div>
              </div>
              <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="/dashboard/admin/bpo-financeiro"
              className="group relative overflow-hidden rounded-2xl bg-[#1A1C20] border border-[#2E3138] p-6 transition-all duration-200 hover:shadow-xl hover:scale-[1.01] hover:border-purple-500/50"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <Building2 className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F1F5F9] text-lg">BPO Analytics</h3>
                  <p className="text-sm text-[#94A3B8]">Business intelligence</p>
                </div>
              </div>
              <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* KPIs Dark Premium - VALORES REAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PremiumDarkKPICard
              title="Usuários Ativos"
              value={data.totalUsuarios}
              icon={Users}
              color="blue"
              subtitle={`${data.metricasPorFuncao.sdrs.total} SDRs • ${data.metricasPorFuncao.closers.total} Closers`}
            />
            <PremiumDarkKPICard
              title="Leads Qualificados"
              value={data.totalLeads}
              icon={TrendingUp}
              color="green"
              subtitle="Pipeline qualificado"
            />
            <PremiumDarkKPICard
              title="Faturamento Total"
              value={data.faturamentoTotal}
              icon={DollarSign}
              color="purple"
              subtitle={`${data.totalVendas} vendas realizadas`}
            />
            <PremiumDarkKPICard
              title="Taxa de Conversão"
              value={data.taxaConversaoGeral}
              icon={Target}
              color="orange"
              subtitle={`Ticket: ${data.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            />
          </div>

          {/* Progresso das Metas Dark */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DarkProgressBar
              title="Meta de Vendas"
              current={data.totalVendas}
              target={data.metasGerais.metaMensalVendas}
              percentage={data.metasGerais.progressoVendas}
              color="blue"
              icon={Target}
            />
            <DarkProgressBar
              title="Meta de Faturamento"
              current={data.faturamentoTotal}
              target={data.metasGerais.metaMensalFaturamento}
              percentage={data.metasGerais.progressoFaturamento}
              color="green"
              icon={DollarSign}
            />
          </div>

          {/* BPO Performance por Motor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-[#1A1C20] border-[#2E3138] rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-[#F1F5F9]">Performance por Motor</CardTitle>
                  <p className="text-sm text-[#94A3B8] mt-1">Faturamento real • Dados dos BPOs</p>
                </CardHeader>
                <CardContent>
                  {sortedMotorsByFaturamento.length > 0 ? (
                    <div className="space-y-4">
                      {sortedMotorsByFaturamento.map((motor, index) => (
                        <div key={motor.motor} className="flex items-center justify-between p-4 rounded-xl bg-[#16181D] border border-[#2E3138]">
                          <div className="flex items-center space-x-4">
                            <div className={clsx(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                              index === 0 && "bg-yellow-500/20 text-yellow-400",
                              index === 1 && "bg-emerald-500/20 text-emerald-400",
                              index === 2 && "bg-blue-500/20 text-blue-400",
                              index > 2 && "bg-slate-500/20 text-slate-400"
                            )}>
                              #{index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-[#F1F5F9] capitalize">{motor.motor}</p>
                              <p className="text-sm text-[#94A3B8]">{motor.vendas} vendas</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#F1F5F9]">
                              {motor.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <p className="text-sm text-emerald-400">
                              +{motor.lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#94A3B8]">Dados sendo carregados...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <Card className="bg-[#1A1C20] border-[#2E3138] rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-[#F1F5F9]">Distribuição de Lucros</CardTitle>
                <p className="text-sm text-[#94A3B8] mt-1">Por motor de negócio</p>
              </CardHeader>
              <CardContent>
                {sortedMotorsByLucro.length > 0 ? (
                  <div className="space-y-3">
                    {sortedMotorsByLucro.map((motor, index) => {
                        const percentual = (motor.lucro / totalLucro) * 100
                        
                        return (
                          <div key={motor.motor} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#F1F5F9] capitalize">{motor.motor}</span>
                              <span className="text-[#94A3B8]">{percentual.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-[#16181D] rounded-full h-2">
                              <div 
                                className={clsx(
                                  "h-2 rounded-full transition-all duration-1000",
                                  index === 0 && "bg-gradient-to-r from-yellow-400 to-orange-500",
                                  index === 1 && "bg-gradient-to-r from-emerald-400 to-emerald-600",
                                  index === 2 && "bg-gradient-to-r from-blue-400 to-blue-600",
                                  index === 3 && "bg-gradient-to-r from-purple-400 to-purple-600",
                                  index === 4 && "bg-gradient-to-r from-pink-400 to-pink-600"
                                )}
                                style={{ width: `${percentual}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#94A3B8]">Aguardando dados...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance da Equipe Dark */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1A1C20] border-[#2E3138] rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="text-[#F1F5F9] font-semibold">Performance SDRs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Total SDRs', value: data.metricasPorFuncao.sdrs.total, color: 'text-[#F1F5F9]' },
                    { label: 'Leads Gerados', value: data.metricasPorFuncao.sdrs.leads, color: 'text-[#F1F5F9]' },
                    { label: 'Conversões', value: data.metricasPorFuncao.sdrs.conversoes, color: 'text-[#F1F5F9]' },
                    { 
                      label: 'Taxa Média', 
                      value: data.metricasPorFuncao.sdrs.leads > 0 
                        ? `${((data.metricasPorFuncao.sdrs.conversoes / data.metricasPorFuncao.sdrs.leads) * 100).toFixed(1)}%`
                        : '0%', 
                      color: 'text-emerald-400 font-semibold' 
                    },
                  ].map((metric) => (
                    <div key={metric.label} className="flex justify-between items-center py-2 border-b border-[#2E3138] last:border-0">
                      <span className="text-sm text-[#94A3B8]">{metric.label}</span>
                      <span className={clsx("font-medium", metric.color)}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1C20] border-[#2E3138] rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Phone className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-[#F1F5F9] font-semibold">Performance Closers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Total Closers', value: data.metricasPorFuncao.closers.total, color: 'text-[#F1F5F9]' },
                    { label: 'Chamadas Realizadas', value: data.metricasPorFuncao.closers.chamadas, color: 'text-[#F1F5F9]' },
                    { label: 'Vendas Fechadas', value: data.metricasPorFuncao.closers.vendas, color: 'text-[#F1F5F9]' },
                    { 
                      label: 'Taxa de Fechamento', 
                      value: data.metricasPorFuncao.closers.chamadas > 0 
                        ? `${((data.metricasPorFuncao.closers.vendas / data.metricasPorFuncao.closers.chamadas) * 100).toFixed(1)}%`
                        : '0%', 
                      color: 'text-emerald-400 font-semibold' 
                    },
                  ].map((metric) => (
                    <div key={metric.label} className="flex justify-between items-center py-2 border-b border-[#2E3138] last:border-0">
                      <span className="text-sm text-[#94A3B8]">{metric.label}</span>
                      <span className={clsx("font-medium", metric.color)}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hall da Fama Dark Premium */}
          <Card className="bg-[#1A1C20] border-[#2E3138] rounded-2xl shadow-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20">
                    <Crown className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-[#F1F5F9]">Elite Performance</CardTitle>
                    <p className="text-sm text-[#94A3B8] mt-1">Top performers • High-ticket closers</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Hall da Fama
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {data.topPerformers.length > 0 ? (
                <div className="space-y-4">
                  {data.topPerformers.map((performer, index) => (
                    <div key={performer.id} className={clsx(
                      "flex items-center p-5 rounded-2xl border transition-all duration-200 hover:shadow-lg group",
                      index === 0 && "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30",
                      index === 1 && "bg-gradient-to-r from-slate-800/50 to-slate-700/30 border-slate-600/30",
                      index === 2 && "bg-gradient-to-r from-amber-600/10 to-amber-700/10 border-amber-600/30",
                      index > 2 && "bg-[#16181D] border-[#2E3138] hover:border-blue-500/30"
                    )}>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className={clsx(
                            "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg",
                            index === 0 && "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg",
                            index === 1 && "bg-gradient-to-br from-slate-400 to-slate-500 text-slate-900 shadow-lg",
                            index === 2 && "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg",
                            index > 2 && "bg-[#2E3138] text-[#94A3B8]"
                          )}>
                            #{index + 1}
                          </div>
                          {index === 0 && (
                            <Crown className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400" />
                          )}
                          {index < 3 && index > 0 && (
                            <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-bold text-[#F1F5F9] text-lg">{performer.nome}</span>
                            <BirthdayIcon 
                              birthDate={performer.data_nascimento} 
                              userName={performer.nome}
                              size="sm"
                            />
                            <Badge 
                              variant="outline"
                              className={performer.funcao === 'sdr' 
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }
                            >
                              {performer.funcao === 'sdr' ? 'SDR' : 'CLOSER'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-[#94A3B8]">
                            <span className="font-medium">{performer.vendas} vendas</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">
                              {performer.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#F1F5F9] group-hover:text-blue-400 transition-colors">
                          {performer.taxa_conversao || 0}
                        </div>
                        <div className="text-xs text-[#64748B] font-medium">
                          pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-[#94A3B8] py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#16181D] border border-[#2E3138] flex items-center justify-center">
                    <UserCheck className="h-8 w-8 text-[#64748B]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">
                    Elite Aguardando
                  </h3>
                  <p className="text-sm max-w-sm mx-auto">
                    Os primeiros performers elite aparecerão aqui
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </div>
  )
}