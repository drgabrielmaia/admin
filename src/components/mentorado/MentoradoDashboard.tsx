'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ModernKPICard } from '@/components/dashboard/ModernKPICard'
import { 
  AlertCircle, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowUpRight,
  Activity,
  Star,
  Sparkles,
  Edit3,
  MoreVertical,
  Trash2
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NovaIndicacaoForm } from './NovaIndicacaoForm'
import clsx from 'clsx'

interface DashboardData {
  total_indicacoes: number
  indicacoes_pendentes: number
  indicacoes_em_analise: number
  indicacoes_aceitas: number
  indicacoes_rejeitadas: number
  indicacoes_convertidas: number
  total_vendas_geradas: number
  total_comissoes_geradas: number
  total_comissoes_pagas: number
  comissoes_pendentes: number
  taxa_conversao_percentual: number
}

interface Indicacao {
  id: string
  nome: string
  email: string
  telefone: string
  status: string
  data_envio: string
  convertida: boolean
  valor_venda?: number
  valor_comissao?: number
  comissao_paga: boolean
}

export function MentoradoDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([])

  const loadDashboardData = async () => {
    if (!user || user.funcao !== 'mentorado') return

    try {
      setLoading(true)
      
      // Buscar dados do dashboard
      const { data: dashData, error: dashError } = await supabase
        .from('vw_mentorado_dashboard')
        .select('*')
        .eq('mentorado_id', user.id)
        .single()

      if (dashError && dashError.code !== 'PGRST116') {
        throw new Error(dashError.message)
      }

      // Buscar indicações
      const { data: indicacoesData, error: indicacoesError } = await supabase
        .from('indicacoes')
        .select('*')
        .eq('mentorado_id', user.id)
        .order('data_envio', { ascending: false })

      if (indicacoesError) {
        throw new Error(indicacoesError.message)
      }

      setDashboardData(dashData || {
        total_indicacoes: 0,
        indicacoes_pendentes: 0,
        indicacoes_em_analise: 0,
        indicacoes_aceitas: 0,
        indicacoes_rejeitadas: 0,
        indicacoes_convertidas: 0,
        total_vendas_geradas: 0,
        total_comissoes_geradas: 0,
        total_comissoes_pagas: 0,
        comissoes_pendentes: 0,
        taxa_conversao_percentual: 0
      })
      
      setIndicacoes(indicacoesData || [])

    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error)
      setError(error.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const updateIndicacaoStatus = async (indicacaoId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('indicacoes')
        .update({ status: novoStatus })
        .eq('id', indicacaoId)
        .eq('mentorado_id', user?.id) // Garantir que só pode alterar suas próprias indicações

      if (error) {
        console.error('Erro ao atualizar status:', error)
        alert('Erro ao atualizar status da indicação')
        return
      }

      // Recarregar dados
      await loadDashboardData()
      alert('Status atualizado com sucesso!')
      
    } catch (error) {
      console.error('Erro ao atualizar indicação:', error)
      alert('Erro interno ao atualizar indicação')
    }
  }

  const deleteIndicacao = async (indicacaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta indicação?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('indicacoes')
        .delete()
        .eq('id', indicacaoId)
        .eq('mentorado_id', user?.id) // Garantir que só pode excluir suas próprias indicações

      if (error) {
        console.error('Erro ao excluir indicação:', error)
        alert('Erro ao excluir indicação')
        return
      }

      // Recarregar dados
      await loadDashboardData()
      alert('Indicação excluída com sucesso!')
      
    } catch (error) {
      console.error('Erro ao excluir indicação:', error)
      alert('Erro interno ao excluir indicação')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      em_analise: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      aceita: 'bg-green-500/10 text-green-400 border-green-500/20',
      rejeitada: 'bg-red-500/10 text-red-400 border-red-500/20',
      convertida: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    }

    const icons = {
      pendente: <Clock className="h-3 w-3" />,
      em_analise: <AlertCircle className="h-3 w-3" />,
      aceita: <CheckCircle className="h-3 w-3" />,
      rejeitada: <XCircle className="h-3 w-3" />,
      convertida: <Star className="h-3 w-3" />
    }

    const labels = {
      pendente: 'Pendente',
      em_analise: 'Em Análise',
      aceita: 'Aceita',
      rejeitada: 'Rejeitada',
      convertida: 'Convertida'
    }

    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles] || 'bg-muted/10 text-muted-foreground border-muted/20'}>
        <div className="flex items-center gap-1">
          {icons[status as keyof typeof icons]}
          {labels[status as keyof typeof labels] || status}
        </div>
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

  if (user?.funcao !== 'mentorado') {
    return (
      <DashboardLayout title="Dashboard Mentorado">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso restrito a mentorados
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Mentorado">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard Mentorado">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard Mentorado">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-foreground tracking-tight">
              Painel do Mentorado
            </h2>
            <p className="text-muted-foreground mt-1">
              Acompanhe suas indicações e comissões geradas
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Nova Indicação
          </Button>
        </div>

        {/* KPIs Modernos */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernKPICard
              title="Total de Indicações"
              value={dashboardData.total_indicacoes}
              icon={Users}
              subtitle={`${dashboardData.indicacoes_pendentes} pendentes`}
              trend={{ value: 0, isPositive: true }}
            />
            <ModernKPICard
              title="Taxa de Conversão"
              value={dashboardData.taxa_conversao_percentual}
              type="percent"
              icon={TrendingUp}
              subtitle={`${dashboardData.indicacoes_convertidas} convertidas`}
              trend={{ value: 0, isPositive: true }}
            />
            <ModernKPICard
              title="Comissões Geradas"
              value={dashboardData.total_comissoes_geradas}
              type="currency"
              icon={DollarSign}
              subtitle={`Vendas: ${formatCurrency(dashboardData.total_vendas_geradas)}`}
              trend={{ value: 0, isPositive: true }}
            />
            <ModernKPICard
              title="Comissões Pendentes"
              value={dashboardData.comissoes_pendentes}
              type="currency"
              icon={Clock}
              subtitle={`Pagas: ${formatCurrency(dashboardData.total_comissoes_pagas)}`}
              trend={{ value: 0, isPositive: true }}
            />
          </div>
        )}

        {/* Nova Indicação Form */}
        <NovaIndicacaoForm onSuccess={loadDashboardData} />

        {/* Lista de Indicações */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">Minhas Indicações</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Histórico de todas as suas indicações enviadas
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                <Activity className="w-3 h-3 mr-1" />
                {indicacoes.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {indicacoes.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                  <Users className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhuma indicação enviada ainda
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Envie sua primeira indicação usando o formulário acima e comece a gerar comissões
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {indicacoes.map((indicacao, index) => (
                  <div key={indicacao.id} className={clsx(
                    "p-6 rounded-xl border transition-all duration-200 hover:shadow-lg",
                    "bg-muted/20 border-border/50 hover:border-primary/20"
                  )}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-lg">{indicacao.nome}</h4>
                          <p className="text-sm text-muted-foreground">{indicacao.email}</p>
                          <p className="text-sm text-muted-foreground">{indicacao.telefone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right space-y-2">
                          {getStatusBadge(indicacao.status)}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(indicacao.data_envio)}
                          </p>
                        </div>
                        
                        {/* Menu de ações */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => updateIndicacaoStatus(indicacao.id, 'pendente')}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Marcar como Pendente
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateIndicacaoStatus(indicacao.id, 'em_analise')}
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Marcar como Em Análise
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateIndicacaoStatus(indicacao.id, 'aceita')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como Aceita
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateIndicacaoStatus(indicacao.id, 'rejeitada')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Marcar como Rejeitada
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateIndicacaoStatus(indicacao.id, 'convertida')}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Marcar como Convertida
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteIndicacao(indicacao.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Indicação
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {indicacao.convertida && (
                      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-emerald-500/5 to-green-500/5 border border-emerald-500/20">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                              <Sparkles className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-emerald-400">Convertida! 🎉</p>
                              <p className="text-sm text-muted-foreground">
                                Valor da venda: {formatCurrency(indicacao.valor_venda || 0)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-400">
                              {formatCurrency(indicacao.valor_comissao || 0)}
                            </p>
                            <div className="flex items-center space-x-1 text-xs">
                              {indicacao.comissao_paga ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Paga</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-yellow-400" />
                                  <span className="text-yellow-400">Pendente</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}