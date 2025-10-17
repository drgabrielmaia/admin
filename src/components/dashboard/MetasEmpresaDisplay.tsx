'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  Clock,
  Calendar,
  Award,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'

interface MetaEmpresa {
  id: string
  tipo: 'diaria' | 'semanal' | 'mensal' | 'anual'
  categoria: 'vendas' | 'faturamento' | 'leads' | 'equipe'
  valor_meta: number
  valor_atual: number
  percentual_progresso: number
  data_inicio: string
  data_fim: string
  descricao: string
}

export function MetasEmpresaDisplay() {
  const [metas, setMetas] = useState<MetaEmpresa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetasEmpresa()
  }, [])

  const loadMetasEmpresa = async () => {
    try {
      setLoading(true)
      
      // Buscar metas de equipe da tabela 'metas'
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('tipo', 'equipe')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar metas da empresa:', error)
        return
      }

      // Transformar dados para o formato esperado
      const metasTransformadas = (data || []).map(meta => ({
        id: meta.id,
        tipo: mapearPeriodo(meta.periodo),
        categoria: meta.categoria,
        valor_meta: meta.valor_meta,
        valor_atual: 0, // TODO: calcular valor atual baseado em dados reais
        percentual_progresso: 0, // TODO: calcular percentual baseado em valor atual
        data_inicio: meta.data_inicio,
        data_fim: meta.data_fim,
        descricao: `Meta ${meta.categoria} ${meta.periodo} para ${meta.funcao || 'toda equipe'}`
      }))

      setMetas(metasTransformadas)
    } catch (error) {
      console.error('Erro ao buscar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  const mapearPeriodo = (periodo: string) => {
    const mapeamento = {
      'diario': 'diaria' as const,
      'semanal': 'semanal' as const,
      'mensal': 'mensal' as const,
      'anual': 'anual' as const
    }
    return mapeamento[periodo as keyof typeof mapeamento] || 'mensal' as const
  }

  const getMetasPorTipo = (tipo: string) => {
    return metas.filter(meta => meta.tipo === tipo)
  }

  const formatValue = (value: number, categoria: string) => {
    if (categoria === 'faturamento') {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    }
    return value.toLocaleString('pt-BR')
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-emerald-500'
    if (percentage >= 80) return 'bg-yellow-500'
    if (percentage >= 60) return 'bg-blue-500'
    return 'bg-slate-500'
  }

  const getTextColor = (percentage: number) => {
    if (percentage >= 100) return 'text-emerald-400'
    if (percentage >= 80) return 'text-yellow-400'
    if (percentage >= 60) return 'text-blue-400'
    return 'text-slate-400'
  }

  const tiposConfig = [
    {
      tipo: 'diaria',
      label: 'Meta Diária',
      icon: Clock,
      color: 'orange',
      badge: 'Hoje'
    },
    {
      tipo: 'semanal',
      label: 'Meta Semanal',
      icon: Calendar,
      color: 'blue',
      badge: 'Esta Semana'
    },
    {
      tipo: 'mensal',
      label: 'Meta Mensal',
      icon: Target,
      color: 'emerald',
      badge: 'Este Mês'
    },
    {
      tipo: 'anual',
      label: 'Meta Anual',
      icon: Award,
      color: 'purple',
      badge: '2024'
    }
  ]

  if (loading) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse text-muted-foreground">
            Carregando metas da empresa...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span>Metas da Empresa - Progresso em Tempo Real</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhamento das metas corporativas diárias, semanais, mensais e anuais
            </p>
          </div>
          <Link href="/dashboard/admin/metas">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Gerenciar Metas
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {tiposConfig.map((config) => {
            const metasTipo = getMetasPorTipo(config.tipo)
            const Icon = config.icon

            return (
              <div key={config.tipo} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 text-${config.color}-400`} />
                    <span className="text-sm font-medium text-foreground">{config.label}</span>
                  </div>
                  <Badge variant="outline" className={`bg-${config.color}-500/10 text-${config.color}-400 border-${config.color}-500/20`}>
                    {config.badge}
                  </Badge>
                </div>

                {metasTipo.length > 0 ? (
                  metasTipo.map((meta) => (
                    <div key={meta.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{meta.categoria}</span>
                        <span className="font-semibold">
                          {formatValue(meta.valor_atual, meta.categoria)} / {formatValue(meta.valor_meta, meta.categoria)}
                        </span>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2">
                        <div 
                          className={clsx("h-2 rounded-full transition-all duration-700", getProgressColor(meta.percentual_progresso))}
                          style={{ width: `${Math.min(meta.percentual_progresso, 100)}%` }} 
                        />
                      </div>
                      <div className="text-right">
                        <span className={clsx("text-xs font-medium", getTextColor(meta.percentual_progresso))}>
                          {meta.percentual_progresso.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma meta configurada
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {metas.length === 0 && (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma meta da empresa configurada
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Configure metas para a empresa através do painel de administração para acompanhar o progresso em tempo real.
            </p>
            <Link href="/dashboard/admin/metas">
              <Button className="bg-primary hover:bg-primary/90">
                <Target className="w-4 h-4 mr-2" />
                Configurar Metas
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}