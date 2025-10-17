'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  BarChart3,
  Target,
  Activity
} from 'lucide-react'
import clsx from 'clsx'

interface RevenueCategory {
  categoria: string
  clinica_nome: string
  total_vendas: number
  faturamento_total: number
  ticket_medio: number
  custo_total: number
  lucro_total: number
  faturamento_hoje: number
  faturamento_semana: number
  faturamento_mes: number
  faturamento_ano: number
}

export function RevenueByCategory() {
  const [categories, setCategories] = useState<RevenueCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRevenueData()
  }, [])

  const loadRevenueData = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('vw_faturamento_por_categoria')
        .select('*')
        .order('faturamento_total', { ascending: false })

      if (error) {
        console.error('Erro ao buscar dados de faturamento:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      maximumFractionDigits: 0 
    })
  }

  const getCategoryColor = (categoria: string, index: number) => {
    const colors = [
      { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
      { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
      { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
      { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
      { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' }
    ]
    return colors[index % colors.length]
  }

  const getTotalsByCategory = () => {
    const categoryTotals = new Map()
    
    categories.forEach(item => {
      if (categoryTotals.has(item.categoria)) {
        const current = categoryTotals.get(item.categoria)
        categoryTotals.set(item.categoria, {
          ...current,
          total_vendas: current.total_vendas + item.total_vendas,
          faturamento_total: current.faturamento_total + item.faturamento_total,
          lucro_total: current.lucro_total + item.lucro_total,
          faturamento_mes: current.faturamento_mes + item.faturamento_mes
        })
      } else {
        categoryTotals.set(item.categoria, {
          categoria: item.categoria,
          total_vendas: item.total_vendas,
          faturamento_total: item.faturamento_total,
          lucro_total: item.lucro_total,
          faturamento_mes: item.faturamento_mes
        })
      }
    })

    return Array.from(categoryTotals.values()).sort((a, b) => b.faturamento_total - a.faturamento_total)
  }

  if (loading) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Faturamento por Categoria</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const categoryTotals = getTotalsByCategory()

  return (
    <div className="space-y-6">
      {/* Resumo por Categoria */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Faturamento por Categoria</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Desempenho por tipo de produto/serviço
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <Activity className="w-3 h-3 mr-1" />
              {categoryTotals.length} categorias
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTotals.map((category, index) => {
              const colors = getCategoryColor(category.categoria, index)
              const margemLucro = category.faturamento_total > 0 
                ? (category.lucro_total / category.faturamento_total) * 100 
                : 0

              return (
                <Card 
                  key={category.categoria}
                  className={clsx(
                    "border-0 transition-all duration-200 hover:shadow-lg hover:scale-105",
                    colors.bg, colors.border, "border"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={clsx("p-2 rounded-lg", colors.bg)}>
                        <Package className={clsx("w-5 h-5", colors.text)} />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={clsx(colors.bg, colors.text, colors.border)}
                      >
                        {category.total_vendas} vendas
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg capitalize text-foreground">
                          {category.categoria}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Faturamento total acumulado
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="font-bold text-foreground text-lg">
                            {formatCurrency(category.faturamento_total)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Este Mês</span>
                          <span className={clsx("font-semibold", colors.text)}>
                            {formatCurrency(category.faturamento_mes)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Margem</span>
                          <span className={clsx(
                            "font-semibold text-sm",
                            margemLucro > 70 ? "text-emerald-400" :
                            margemLucro > 50 ? "text-yellow-400" : "text-red-400"
                          )}>
                            {margemLucro.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {categoryTotals.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Nenhum dado de faturamento encontrado
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Os dados aparecerão quando houverem vendas registradas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhamento por Produto */}
      {categories.length > 0 && (
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Detalhamento por Produto</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((product, index) => {
                const colors = getCategoryColor(product.categoria, index)
                
                return (
                  <div 
                    key={`${product.categoria}-${(product as any).produto_nome}`}
                    className={clsx(
                      "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                      "bg-muted/20 border-border/50 hover:border-primary/20 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", colors.bg)}>
                        <Package className={clsx("w-5 h-5", colors.text)} />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {product.clinica_nome}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {product.categoria} • {product.total_vendas} vendas
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-bold text-foreground">
                        {formatCurrency(product.faturamento_total)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Ticket: {formatCurrency(product.ticket_medio)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}