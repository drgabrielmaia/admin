'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModernChart } from './ModernChart'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Clock,
  Zap,
  Trophy,
  AlertTriangle
} from 'lucide-react'
import clsx from 'clsx'

interface GoalPeriod {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  label: string
  target: number
  current: number
  percentage: number
  daysLeft: number
  trend: number
  color: string
  icon: any
}

export function MotivationalGoalsChart() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<GoalPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGoalsFromDatabase()
  }, [user?.id])

  const loadGoalsFromDatabase = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Verificar se a tabela metas_individuais existe
      const { data: tablesCheck } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'metas_individuais')

      if (!tablesCheck || tablesCheck.length === 0) {
        console.log('Tabela metas_individuais não existe ainda')
        setLoading(false)
        return
      }

      // Buscar metas individuais do usuário atual
      const { data: metas, error } = await supabase
        .from('metas_individuais')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ativa')
        .order('periodo_ativo', { ascending: true })

      if (error) {
        console.error('Erro ao buscar metas:', error)
        setLoading(false)
        return
      }

      // Mapear os dados do banco para o formato esperado
      const goalsData = metas?.map((meta) => {
        const percentage = meta.valor_meta > 0 ? (meta.valor_atual / meta.valor_meta) * 100 : 0
        const today = new Date()
        const endDate = new Date(meta.data_fim)
        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
        
        // Calcular tendência (mock por enquanto - pode ser implementado com histórico)
        const trend = percentage > 70 ? Math.random() * 15 + 5 : 
                     percentage > 50 ? Math.random() * 10 - 5 : 
                     Math.random() * -10 - 5

        // Definir ícone e cor baseado no tipo
        let icon, color, label
        switch (meta.tipo) {
          case 'diaria':
            icon = Clock
            color = 'blue'
            label = user.funcao === 'admin' ? 'Meta Diária Equipe' : 'Meta Diária'
            break
          case 'semanal':
            icon = Calendar
            color = 'purple'
            label = user.funcao === 'admin' ? 'Meta Semanal Equipe' : 'Meta Semanal'
            break
          case 'mensal':
            icon = Target
            color = 'emerald'
            label = user.funcao === 'admin' ? 'Meta Mensal Equipe' : 'Meta Mensal'
            break
          case 'anual':
            icon = Trophy
            color = 'orange'
            label = user.funcao === 'admin' ? 'Meta Anual Equipe' : 'Meta Anual'
            break
          default:
            icon = Target
            color = 'blue'
            label = 'Meta'
        }

        return {
          type: meta.tipo as 'daily' | 'weekly' | 'monthly' | 'yearly',
          label,
          target: meta.valor_meta,
          current: meta.valor_atual,
          percentage,
          daysLeft,
          trend,
          color,
          icon
        }
      }) || []

      // Ordenar por tipo (diária, semanal, mensal, anual)
      const typeOrder = { daily: 0, weekly: 1, monthly: 2, yearly: 3 }
      const sortedGoals = goalsData.sort((a, b) => {
        const aOrder = typeOrder[a.type === 'daily' ? 'daily' : 
                                a.type === 'weekly' ? 'weekly' :
                                a.type === 'monthly' ? 'monthly' : 'yearly']
        const bOrder = typeOrder[b.type === 'daily' ? 'daily' : 
                                b.type === 'weekly' ? 'weekly' :
                                b.type === 'monthly' ? 'monthly' : 'yearly']
        return aOrder - bOrder
      })

      setGoals(sortedGoals)
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: goals.map(g => g.label),
    datasets: [
      {
        label: 'Progresso Atual (%)',
        data: goals.map(g => g.percentage),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 8,
        pointHoverRadius: 12,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointHoverBackgroundColor: '#059669',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 4
      },
      {
        label: 'Meta (100%)',
        data: [100, 100, 100, 100],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderDash: [10, 5],
        tension: 0,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600'
          },
          color: '#e2e8f0'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(148, 163, 184, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            if (context.datasetIndex === 0) {
              const goal = goals[context.dataIndex]
              return [
                `Progresso: ${goal.percentage.toFixed(1)}%`,
                `Atual: ${goal.current} / ${goal.target}`,
                `Faltam: ${goal.target - goal.current} para meta`
              ]
            }
            return 'Meta: 100%'
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      y: {
        beginAtZero: true,
        max: 120,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 12,
            weight: '500'
          },
          callback: function(value: any) {
            return value + '%'
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      }
    }
  }

  const getStatusIcon = (percentage: number, trend: number) => {
    if (percentage >= 100) return <Trophy className="w-5 h-5 text-yellow-400" />
    if (percentage >= 80) return <Target className="w-5 h-5 text-orange-400" />
    if (percentage >= 60) return <Zap className="w-5 h-5 text-blue-400" />
    if (trend < 0) return <AlertTriangle className="w-5 h-5 text-red-400" />
    return <TrendingUp className="w-5 h-5 text-emerald-400" />
  }

  const getStatusColor = (percentage: number, trend: number) => {
    if (percentage >= 100) return 'text-yellow-400'
    if (percentage >= 80) return 'text-orange-400' 
    if (percentage >= 60) return 'text-emerald-400'
    if (trend < 0) return 'text-red-400'
    return 'text-blue-400'
  }

  const getMotivationalMessage = (percentage: number) => {
    if (percentage >= 100) return "🏆 Meta Atingida! Parabéns!"
    if (percentage >= 90) return "🔥 Quase lá! Falta pouco!"
    if (percentage >= 70) return "💪 No caminho certo!"
    if (percentage >= 50) return "⚡ Acelere o ritmo!"
    return "🚨 ATENÇÃO: Meta em risco!"
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-yellow-500'
    if (percentage >= 80) return 'bg-orange-500'
    if (percentage >= 60) return 'bg-emerald-500'
    if (percentage >= 40) return 'bg-blue-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Carregando Metas...
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Buscando dados das suas metas
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80 w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Nenhuma Meta Encontrada
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Configure suas metas para visualizar o progresso
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {user?.funcao === 'admin' ? 'Progresso da Equipe' : 'Suas Metas'}
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {user?.funcao === 'admin' 
                    ? 'Acompanhamento geral da equipe em tempo real' 
                    : 'Seu progresso personalizado - Diário • Semanal • Mensal • Anual'
                  }
                </p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-400 border-emerald-500/30">
              <Zap className="w-3 h-3 mr-1" />
              Sistema Motivacional
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-80 w-full">
            <ModernChart
              type="line"
              data={chartData}
              height={320}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {goals.map((goal) => {
          const Icon = goal.icon
          return (
            <Card 
              key={goal.type}
              className={clsx(
                "border-0 bg-card/50 backdrop-blur-sm relative overflow-hidden group transition-all duration-300",
                goal.percentage >= 100 && "ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/10",
                goal.percentage < 50 && goal.trend < 0 && "ring-2 ring-red-500/50 shadow-lg shadow-red-500/10"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={clsx(
                    "p-2 rounded-lg",
                    goal.color === 'blue' && "bg-blue-500/10",
                    goal.color === 'purple' && "bg-purple-500/10", 
                    goal.color === 'emerald' && "bg-emerald-500/10",
                    goal.color === 'orange' && "bg-orange-500/10",
                    goal.color === 'green' && "bg-green-500/10"
                  )}>
                    <Icon className={clsx(
                      "w-5 h-5",
                      goal.color === 'blue' && "text-blue-400",
                      goal.color === 'purple' && "text-purple-400",
                      goal.color === 'emerald' && "text-emerald-400", 
                      goal.color === 'orange' && "text-orange-400",
                      goal.color === 'green' && "text-green-400"
                    )} />
                  </div>
                  {getStatusIcon(goal.percentage, goal.trend)}
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {goal.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {goal.current} / {goal.target} 
                      {goal.daysLeft > 0 && (
                        <span className="ml-2">• {goal.daysLeft} dias restantes</span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Progresso
                      </span>
                      <span className={clsx(
                        "text-lg font-bold",
                        getStatusColor(goal.percentage, goal.trend)
                      )}>
                        {goal.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                      <div 
                        className={clsx(
                          "h-3 rounded-full transition-all duration-1000 ease-out relative",
                          getProgressBarColor(goal.percentage)
                        )}
                        style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                      >
                        {goal.percentage >= 100 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={clsx(
                    "p-3 rounded-lg text-center text-sm font-medium border",
                    goal.percentage >= 100 && "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
                    goal.percentage >= 70 && goal.percentage < 100 && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                    goal.percentage >= 50 && goal.percentage < 70 && "bg-blue-500/10 border-blue-500/20 text-blue-400",
                    goal.percentage < 50 && "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                    {getMotivationalMessage(goal.percentage)}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tendência</span>
                    <span className={clsx(
                      "font-semibold flex items-center space-x-1",
                      goal.trend >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      <TrendingUp className={clsx(
                        "w-3 h-3",
                        goal.trend < 0 && "rotate-180"
                      )} />
                      <span>{Math.abs(goal.trend).toFixed(1)}%</span>
                    </span>
                  </div>
                </div>
              </CardContent>

              {goal.percentage >= 100 && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 animate-pulse" />
              )}
              
              {goal.percentage < 50 && goal.trend < 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 animate-pulse" />
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}