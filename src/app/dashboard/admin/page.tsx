'use client'

import { useState, useEffect, memo, useMemo, useCallback } from 'react'
import { useRoleProtection } from '@/hooks/useRoleProtection'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  RefreshCw,
  Calendar,
  Gift,
  MapPin,
  Cake,
  Filter
} from 'lucide-react'
import { measurePerformance, createApiCache } from '@/lib/performance'
import { CelebracaoAniversario, AniversarioBadge } from '@/components/ui/aniversario-badge'
import { useAniversarios } from '@/hooks/useAniversarios'

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
    data_nascimento?: string
    vendas: number
    faturamento: number
    taxa_conversao: number
  }>
  metricasPorFuncao: {
    sdrs: { total: number; leads: number; conversoes: number }
    closers: { total: number; chamadas: number; vendas: number }
  }
  metasGerais: {
    metaMensalVendas: number
    metaMensalFaturamento: number
    progressoVendas: number
    progressoFaturamento: number
  }
  dadosBPO: Array<{
    motor: string
    vendas: number
    faturamento: number
    custos: number
    lucro: number
  }>
}

const MetricCard = memo(({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = 'up',
  className = '' 
}: {
  title: string
  value: string | number
  change?: string
  icon: any
  trend?: 'up' | 'down'
  className?: string
}) => (
  <Card className={`bg-[#1A1C20] border-[#2E3138] hover:border-[#3E4148] transition-all duration-200 ${className}`}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#94A3B8] text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {trend === 'up' ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${trend === 'up' ? 'bg-[#10B981]/20' : 'bg-[#3B82F6]/20'}`}>
          <Icon className={`h-6 w-6 ${trend === 'up' ? 'text-[#10B981]' : 'text-[#3B82F6]'}`} />
        </div>
      </div>
    </CardContent>
  </Card>
))

const TopPerformerCard = memo(({ performer, index }: { performer: any; index: number }) => {
  return (
    <Card className="bg-[#1A1C20] border-[#2E3138] hover:border-[#3E4148] transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {index === 0 && <Crown className="h-6 w-6 text-yellow-400" />}
              {index === 1 && <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs font-bold text-white">2</div>}
              {index === 2 && <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center text-xs font-bold text-white">3</div>}
              {index > 2 && <div className="w-6 h-6 rounded-full bg-[#374151] flex items-center justify-center text-xs font-bold text-[#94A3B8]">{index + 1}</div>}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-white">{performer.nome}</h3>
                <AniversarioBadge userId={performer.id} variant="icon-only" />
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {performer.funcao?.toUpperCase()}
                </Badge>
                <AniversarioBadge userId={performer.id} variant="small" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-[#10B981]">
              R$ {performer.faturamento?.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-[#94A3B8]">
              {performer.vendas} vendas
            </div>
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
  const { temAniversarianteHoje, aniversariantesHoje } = useAniversarios()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroTemporal, setFiltroTemporal] = useState<'dia' | 'semana' | 'mes' | 'ano'>('mes')
  
  // Cache para dados do dashboard (5 minutos)
  const dashboardCache = createApiCache<DashboardData>(5 * 60 * 1000)

  const getDateRange = useCallback((filtro: 'dia' | 'semana' | 'mes' | 'ano') => {
    const hoje = new Date()
    let dataInicio: Date
    let dataFim: Date = hoje

    switch (filtro) {
      case 'dia':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
        break
      case 'semana':
        const diaDaSemana = hoje.getDay()
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diaDaSemana)
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + (6 - diaDaSemana), 23, 59, 59)
        break
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)
        break
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1)
        dataFim = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59)
        break
    }

    return {
      inicio: dataInicio.toISOString(),
      fim: dataFim.toISOString()
    }
  }, [])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Obter range de datas baseado no filtro
      const dateRange = getDateRange(filtroTemporal)
      
      // Verificar cache primeiro (incluir filtro temporal no cache)
      const cacheKey = `dashboard-${filtroTemporal}-${user?.id || 'anonymous'}`
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
          supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', dateRange.inicio).lte('created_at', dateRange.fim),
          supabase.from('chamadas').select('*', { count: 'exact', head: true }).eq('resultado', 'venda').eq('status_aprovacao', 'aprovada').gte('data_chamada', dateRange.inicio).lte('data_chamada', dateRange.fim),
          supabase.from('chamadas').select('valor').eq('resultado', 'venda').eq('status_aprovacao', 'aprovada').gte('data_chamada', dateRange.inicio).lte('data_chamada', dateRange.fim)
        ])

        const faturamentoTotal = vendas?.reduce((acc, v) => acc + (v.valor || 0), 0) || 0
        const ticketMedio = (totalVendas || 0) > 0 ? faturamentoTotal / (totalVendas || 1) : 0
        const taxaConversaoGeral = (totalLeads || 0) > 0 ? ((totalVendas || 0) / (totalLeads || 1)) * 100 : 0

        // Buscar comissões no período filtrado
        const { data: comissoesRaw } = await supabase
          .from('comissoes')
          .select(`
            *,
            sdr:sdr_id(id, nome, funcao, data_nascimento),
            closer:closer_id(id, nome, funcao, data_nascimento)
          `)
          .gte('data_venda', dateRange.inicio)
          .lte('data_venda', dateRange.fim)

        // Processar comissões para criar top performers
        const usuariosComissoes = new Map()
        comissoesRaw?.forEach(comissao => {
          // Processar SDR
          if (comissao.sdr_id) {
            const key = comissao.sdr_id
            if (!usuariosComissoes.has(key)) {
              usuariosComissoes.set(key, {
                id: key,
                nome: comissao.sdr?.nome || 'SDR',
                funcao: 'sdr',
                data_nascimento: comissao.sdr?.data_nascimento,
                vendas: 0,
                faturamento: 0
              })
            }
            const user = usuariosComissoes.get(key)
            user.vendas += 1
            user.faturamento += comissao.comissao_sdr || 0
          }
          
          // Processar Closer
          if (comissao.closer_id) {
            const key = comissao.closer_id
            if (!usuariosComissoes.has(key)) {
              usuariosComissoes.set(key, {
                id: key,
                nome: comissao.closer?.nome || 'Closer',
                funcao: 'closer',
                data_nascimento: comissao.closer?.data_nascimento,
                vendas: 0,
                faturamento: 0
              })
            }
            const user = usuariosComissoes.get(key)
            user.vendas += 1
            user.faturamento += comissao.comissao_closer || 0
          }
        })

        const topPerformers = Array.from(usuariosComissoes.values())
          .sort((a, b) => b.faturamento - a.faturamento)
          .slice(0, 5)
          .map(p => ({ ...p, taxa_conversao: p.vendas }))

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
          .gte('data_chamada', dateRange.inicio)
          .lte('data_chamada', dateRange.fim)
      
        const { data: metasVendas } = await supabase
          .from('metas')
          .select('*')
          .eq('tipo', 'equipe')
          .eq('categoria', 'vendas')
          .eq('status', 'ativa')
          .lte('data_inicio', dateRange.fim)
          .gte('data_fim', dateRange.inicio)
          .single()

        const { data: metasFaturamento } = await supabase
          .from('metas')
          .select('*')
          .eq('tipo', 'equipe')
          .eq('categoria', 'faturamento')
          .eq('status', 'ativa')
          .lte('data_inicio', dateRange.fim)
          .gte('data_fim', dateRange.inicio)
          .single()

        const metasGerais = {
          metaMensalVendas: metasVendas?.valor_meta || 50,
          metaMensalFaturamento: metasFaturamento?.valor_meta || 100000,
          progressoVendas: metasVendas ? ((totalVendas || 0) / metasVendas.valor_meta) * 100 : 0,
          progressoFaturamento: metasFaturamento ? (faturamentoTotal / metasFaturamento.valor_meta) * 100 : 0
        }

        // CARREGAR DADOS REAIS DOS BPOs POR MOTOR
        const motores = ['mentoria', 'infoproduto', 'saas', 'fisico', 'parceria', 'clinica', 'evento', 'real-estate']
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
              .gte('data_chamada', dateRange.inicio)
              .lte('data_chamada', dateRange.fim)

            // Calcular vendas se existirem
            const faturamentoVendas = vendasMotor?.reduce((acc, v) => acc + (v.valor || 0), 0) || 0
            const custoVendas = vendasMotor?.reduce((acc, v) => acc + ((v as any).produtos?.custo || 0), 0) || 0

            // Buscar entradas e saídas adicionais do BPO (sempre, mesmo sem vendas)
            const { data: entradas } = await supabase
              .from('movimentacoes_financeiras')
              .select('valor')
              .eq('negocio', motor)
              .eq('tipo', 'entrada')
              .eq('status', 'realizado')
              .gte('data_movimentacao', dateRange.inicio)
              .lte('data_movimentacao', dateRange.fim)

            const { data: saidas } = await supabase
              .from('movimentacoes_financeiras')
              .select('valor')
              .eq('negocio', motor)
              .eq('tipo', 'saida')
              .eq('status', 'realizado')
              .gte('data_movimentacao', dateRange.inicio)
              .lte('data_movimentacao', dateRange.fim)

            const entradasExtras = entradas?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0
            const saidasExtras = saidas?.reduce((acc, s) => acc + (s.valor || 0), 0) || 0

            const faturamentoTotal = faturamentoVendas + entradasExtras
            const custoTotal = custoVendas + saidasExtras

            return {
              motor,
              vendas: vendasMotor?.length || 0,
              faturamento: faturamentoTotal,
              custos: custoTotal,
              lucro: faturamentoTotal - custoTotal,
              margemLucro: faturamentoTotal > 0 ? ((faturamentoTotal - custoTotal) / faturamentoTotal) * 100 : 0
            }
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
  }, [dashboardCache, user?.id, filtroTemporal, getDateRange])

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

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0E0E10]">
        <DashboardLayout title="Dashboard">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A1C20] border border-[#2E3138] flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-[#94A3B8]" />
              </div>
              <p className="text-[#94A3B8] text-lg mb-4">Nenhum dado encontrado</p>
              <Button 
                onClick={loadDashboardData}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0E0E10]">
      <DashboardLayout title="Dashboard Administrativo">
        <div className="space-y-8">
          {/* Celebração de Aniversário */}
          {temAniversarianteHoje && (
            <CelebracaoAniversario className="animate-pulse" />
          )}

          {/* Filtros Temporais */}
          <Card className="bg-[#1A1C20] border-[#2E3138]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-[#94A3B8]" />
                    <span className="text-white font-medium">Filtrar Período:</span>
                  </div>
                  <Select value={filtroTemporal} onValueChange={(value: 'dia' | 'semana' | 'mes' | 'ano') => setFiltroTemporal(value)}>
                    <SelectTrigger className="w-[180px] bg-[#0E0E10] border-[#2E3138] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1C20] border-[#2E3138]">
                      <SelectItem value="dia" className="text-white hover:bg-[#2E3138]">
                        📅 Hoje
                      </SelectItem>
                      <SelectItem value="semana" className="text-white hover:bg-[#2E3138]">
                        📊 Esta Semana
                      </SelectItem>
                      <SelectItem value="mes" className="text-white hover:bg-[#2E3138]">
                        📈 Este Mês
                      </SelectItem>
                      <SelectItem value="ano" className="text-white hover:bg-[#2E3138]">
                        📋 Este Ano
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-[#94A3B8]">
                  {filtroTemporal === 'dia' && 'Dados de hoje'}
                  {filtroTemporal === 'semana' && 'Dados desta semana'}
                  {filtroTemporal === 'mes' && 'Dados deste mês'}
                  {filtroTemporal === 'ano' && 'Dados deste ano'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total de Usuários"
              value={data.totalUsuarios}
              icon={Users}
              trend="up"
            />
            <MetricCard
              title="Total de Leads"
              value={data.totalLeads}
              icon={Target}
              trend="up"
            />
            <MetricCard
              title="Vendas Aprovadas"
              value={data.totalVendas}
              icon={TrendingUp}
              trend="up"
            />
            <MetricCard
              title="Faturamento Total"
              value={`R$ ${data.faturamentoTotal.toLocaleString('pt-BR')}`}
              icon={DollarSign}
              trend="up"
            />
          </div>

          {/* Métricas Secundárias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Ticket Médio"
              value={`R$ ${data.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              trend="up"
            />
            <MetricCard
              title="Taxa de Conversão"
              value={`${data.taxaConversaoGeral.toFixed(1)}%`}
              icon={Target}
              trend="up"
            />
            <MetricCard
              title="Total de Chamadas"
              value={data.metricasPorFuncao.closers.chamadas}
              icon={Phone}
              trend="up"
            />
          </div>

          {/* Top Performers */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">🏆 Top Performers</h2>
              <Button 
                onClick={loadDashboardData}
                variant="outline"
                size="sm"
                className="border-[#2E3138] hover:bg-[#1A1C20]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
            <div className="space-y-4">
              {data.topPerformers.map((performer, index) => (
                <TopPerformerCard 
                  key={performer.id} 
                  performer={performer} 
                  index={index} 
                />
              ))}
            </div>
          </div>

          {/* BPO por Motor */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">📊 BPO por Motor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.dadosBPO.map((bpo) => (
                <Card key={bpo.motor} className="bg-[#1A1C20] border-[#2E3138]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white capitalize text-lg">
                      {bpo.motor}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#94A3B8]">Vendas:</span>
                        <span className="text-white font-medium">{bpo.vendas}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#94A3B8]">Faturamento:</span>
                        <span className="text-[#10B981] font-medium">
                          R$ {bpo.faturamento.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#94A3B8]">Custos:</span>
                        <span className="text-[#EF4444] font-medium">
                          R$ {bpo.custos.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-[#2E3138] pt-2">
                        <span className="text-[#94A3B8] font-medium">Lucro:</span>
                        <span className={`font-bold ${bpo.lucro >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          R$ {bpo.lucro.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </div>
  )
}