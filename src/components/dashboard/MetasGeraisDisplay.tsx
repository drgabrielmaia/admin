'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Target,
  DollarSign,
  TrendingUp,
  Calendar,
  Building,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import clsx from 'clsx'

interface MetaGeral {
  id: string
  categoria: 'leads' | 'vendas' | 'faturamento' | 'comissao' | 'conversao'
  valor_meta: number
  periodo: 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'anual'
  data_inicio: string
  data_fim: string
  progresso_atual: number
  percentual: number
}

export function MetasGeraisDisplay() {
  const [metas, setMetas] = useState<MetaGeral[]>([])
  const [loading, setLoading] = useState(true)

  const categorias = {
    leads: { label: 'Leads', icon: Target, color: 'blue' },
    vendas: { label: 'Vendas', icon: TrendingUp, color: 'green' },
    faturamento: { label: 'Faturamento', icon: DollarSign, color: 'emerald' },
    comissao: { label: 'Comissões', icon: Building, color: 'purple' },
    conversao: { label: 'Conversão', icon: Target, color: 'orange' }
  }

  const periodos = {
    diario: 'Diário',
    semanal: 'Semanal', 
    mensal: 'Mensal',
    trimestral: 'Trimestral',
    anual: 'Anual'
  }

  useEffect(() => {
    loadMetas()
  }, [])

  const loadMetas = async () => {
    try {
      setLoading(true)
      
      // Buscar metas gerais da equipe
      const { data: metasData, error } = await supabase
        .from('metas')
        .select('*')
        .eq('tipo', 'equipe')
        .eq('status', 'ativa')
        .order('periodo', { ascending: true })

      if (error) {
        console.error('Erro ao buscar metas gerais:', error)
        return
      }

      // Calcular progresso atual para cada meta
      const metasComProgresso = await Promise.all(
        (metasData || []).map(async (meta) => {
          let progresso_atual = 0

          // Calcular progresso baseado na categoria e período
          const dataInicio = new Date(meta.data_inicio)
          const dataFim = new Date(meta.data_fim)
          const hoje = new Date()

          if (meta.categoria === 'faturamento') {
            // Buscar faturamento total no período
            const { data: vendas } = await supabase
              .from('chamadas')
              .select('valor')
              .eq('resultado', 'venda')
              .gte('data_chamada', dataInicio.toISOString())
              .lte('data_chamada', dataFim.toISOString())

            progresso_atual = vendas?.reduce((sum, v) => sum + (v.valor || 0), 0) || 0

          } else if (meta.categoria === 'vendas') {
            // Contar vendas no período
            const { count } = await supabase
              .from('chamadas')
              .select('*', { count: 'exact', head: true })
              .eq('resultado', 'venda')
              .gte('data_chamada', dataInicio.toISOString())
              .lte('data_chamada', dataFim.toISOString())

            progresso_atual = count || 0

          } else if (meta.categoria === 'leads') {
            // Contar leads no período
            const { count } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', dataInicio.toISOString())
              .lte('created_at', dataFim.toISOString())

            progresso_atual = count || 0
          }

          const percentual = meta.valor_meta > 0 ? (progresso_atual / meta.valor_meta) * 100 : 0

          return {
            ...meta,
            progresso_atual,
            percentual: Math.round(percentual * 10) / 10
          }
        })
      )

      setMetas(metasComProgresso)
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: number, categoria: string) => {
    if (categoria === 'faturamento' || categoria === 'comissao') {
      return value.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        maximumFractionDigits: 0 
      })
    }
    if (categoria === 'conversao') {
      return `${value}%`
    }
    return value.toLocaleString('pt-BR')
  }

  const getStatusColor = (percentual: number) => {
    if (percentual >= 100) return 'text-emerald-400'
    if (percentual >= 80) return 'text-yellow-400'
    if (percentual >= 60) return 'text-blue-400'
    return 'text-slate-400'
  }

  const getStatusIcon = (percentual: number) => {
    if (percentual >= 100) return <CheckCircle className="w-4 h-4 text-emerald-400" />
    if (percentual >= 80) return <Zap className="w-4 h-4 text-yellow-400" />
    return <AlertTriangle className="w-4 h-4 text-slate-400" />
  }

  const getProgressBg = (percentual: number) => {
    if (percentual >= 100) return 'bg-emerald-500'
    if (percentual >= 80) return 'bg-yellow-500'
    if (percentual >= 60) return 'bg-blue-500'
    return 'bg-slate-500'
  }

  if (loading) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (metas.length === 0) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Nenhuma meta geral configurada
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Configure metas gerais da empresa no painel administrativo
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">
          Metas da Empresa
        </h2>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          {metas.length} meta{metas.length !== 1 ? 's' : ''} ativa{metas.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Metas em linha horizontal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metas.map((meta) => {
          const categoria = categorias[meta.categoria]
          const Icon = categoria.icon

          return (
            <Card 
              key={meta.id}
              className={clsx(
                "border-0 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg",
                meta.percentual >= 100 && "ring-2 ring-emerald-500/20 bg-emerald-500/5",
                meta.percentual < 50 && "ring-2 ring-red-500/20 bg-red-500/5"
              )}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header da meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={clsx(
                        "p-2 rounded-xl",
                        `bg-${categoria.color}-500/10`
                      )}>
                        <Icon className={`w-5 h-5 text-${categoria.color}-400`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {categoria.label}
                        </h3>
                        <Badge variant="outline" className="text-xs capitalize">
                          {periodos[meta.periodo]}
                        </Badge>
                      </div>
                    </div>
                    {getStatusIcon(meta.percentual)}
                  </div>

                  {/* Progresso */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className={clsx("font-semibold", getStatusColor(meta.percentual))}>
                        {meta.percentual.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                      <div 
                        className={clsx(
                          "h-2 rounded-full transition-all duration-700 ease-out",
                          getProgressBg(meta.percentual)
                        )}
                        style={{ width: `${Math.min(meta.percentual, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Atual</span>
                      <span className="font-bold text-foreground">
                        {formatValue(meta.progresso_atual, meta.categoria)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Meta</span>
                      <span className="font-semibold text-muted-foreground">
                        {formatValue(meta.valor_meta, meta.categoria)}
                      </span>
                    </div>
                  </div>

                  {/* Período */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(meta.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <span>
                      até {new Date(meta.data_fim).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}