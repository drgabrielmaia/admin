'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface RealEstateStats {
  total_imoveis: number
  imoveis_disponiveis: number
  imoveis_vendidos: number
  total_investido: number
  total_vendido: number
  lucro_realizado: number
  total_gastos: number
  margem_lucro: number
}

export function RealEstateDashboard() {
  const [stats, setStats] = useState<RealEstateStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      console.log('🏠 Carregando estatísticas de Real Estate...')

      // Primeiro tentar buscar dados diretamente da tabela imoveis
      const { data: imoveisData, error: imoveisError } = await supabase
        .from('imoveis')
        .select('*')

      console.log('📊 Dados dos imóveis:', imoveisData)

      if (imoveisError) {
        console.error('❌ Erro ao buscar imóveis:', imoveisError)
      }

      // Se tem dados diretos, calcular manualmente
      if (imoveisData && imoveisData.length > 0) {
        const total_imoveis = imoveisData.length
        const imoveis_disponiveis = imoveisData.filter(i => i.status === 'disponivel').length
        const imoveis_em_negociacao = imoveisData.filter(i => i.status === 'em_negociacao').length
        const imoveis_vendidos = imoveisData.filter(i => i.status === 'vendido').length
        const total_investido = imoveisData.reduce((acc, i) => acc + (i.valor_compra || 0), 0)
        const total_vendido = imoveisData
          .filter(i => i.status === 'vendido')
          .reduce((acc, i) => acc + (i.valor_venda_final || 0), 0)
        const lucro_realizado = total_vendido - total_investido

        // Buscar gastos
        const { data: gastosData } = await supabase
          .from('imoveis_gastos')
          .select('valor')
        
        const total_gastos = gastosData?.reduce((acc, g) => acc + (g.valor || 0), 0) || 0

        setStats({
          total_imoveis,
          imoveis_disponiveis,
          imoveis_em_negociacao,
          imoveis_vendidos,
          total_investido,
          total_vendido,
          lucro_realizado,
          total_gastos,
          margem_lucro: total_vendido > 0 ? (lucro_realizado / total_vendido) * 100 : 0
        })

        console.log('✅ Estatísticas calculadas:', {
          total_imoveis,
          imoveis_vendidos,
          total_vendido
        })
        return
      }

      // Fallback: tentar RPC ou view
      try {
        const { data, error } = await supabase
          .rpc('get_real_estate_stats')
          .single()

        if (error) throw error
        setStats(data)
        console.log('✅ Dados da RPC:', data)
      } catch (rpcError) {
        console.log('⚠️ RPC não disponível, tentando view...')
        
        const { data, error } = await supabase
          .from('vw_real_estate_dashboard')
          .select('*')
          .single()

        if (error) {
          console.error('❌ Erro na view:', error)
          // Usar dados vazios como fallback final
          setStats({
            total_imoveis: 0,
            imoveis_disponiveis: 0,
            imoveis_vendidos: 0,
            total_investido: 0,
            total_vendido: 0,
            lucro_realizado: 0,
            total_gastos: 0,
            margem_lucro: 0
          })
          return
        }

        setStats({
          ...data,
          margem_lucro: data.total_vendido > 0 ? (data.lucro_realizado / data.total_vendido) * 100 : 0
        })
        console.log('✅ Dados da view:', data)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      // Usar dados vazios como fallback
      setStats({
        total_imoveis: 0,
        imoveis_disponiveis: 0,
        imoveis_vendidos: 0,
        total_investido: 0,
        total_vendido: 0,
        lucro_realizado: 0,
        total_gastos: 0,
        margem_lucro: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0'
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  }

  if (loading) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse text-muted-foreground">
            Carregando estatísticas de Real Estate...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.total_imoveis === 0) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center space-x-2">
              <Package className="w-5 h-5 text-orange-400" />
              <span>Real Estate</span>
            </CardTitle>
            <Link href="/dashboard/admin/real-estate">
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Gerenciar
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum imóvel cadastrado
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Comece cadastrando seu primeiro imóvel para acompanhar seu portfólio de Real Estate.
            </p>
            <Link href="/dashboard/admin/real-estate/novo">
              <Button className="bg-primary hover:bg-primary/90">
                <Package className="w-4 h-4 mr-2" />
                Cadastrar Imóvel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center space-x-2">
            <Package className="w-5 h-5 text-orange-400" />
            <span>Real Estate - Portfólio</span>
          </CardTitle>
          <Link href="/dashboard/admin/real-estate">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Todos
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total de Imóveis */}
          <Card className="border-0 bg-blue-500/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Imóveis</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total_imoveis}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disponíveis */}
          <Card className="border-0 bg-green-500/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Disponíveis</p>
                  <p className="text-2xl font-bold text-foreground">{stats.imoveis_disponiveis}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendidos */}
          <Card className="border-0 bg-purple-500/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Target className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Vendidos</p>
                  <p className="text-2xl font-bold text-foreground">{stats.imoveis_vendidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Margem de Lucro */}
          <Card className="border-0 bg-emerald-500/10 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Margem Lucro</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {stats.margem_lucro.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Financeiro Detalhado */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-500/10">
            <p className="text-xs text-muted-foreground mb-1">Total Investido</p>
            <p className="text-lg font-bold text-blue-400">
              {formatCurrency(stats.total_investido)}
            </p>
          </div>

          <div className="text-center p-4 rounded-lg bg-red-500/10">
            <p className="text-xs text-muted-foreground mb-1">Total Gastos</p>
            <p className="text-lg font-bold text-red-400">
              {formatCurrency(stats.total_gastos)}
            </p>
          </div>

          <div className="text-center p-4 rounded-lg bg-orange-500/10">
            <p className="text-xs text-muted-foreground mb-1">Custo Total</p>
            <p className="text-lg font-bold text-orange-400">
              {formatCurrency(stats.total_investido + stats.total_gastos)}
            </p>
          </div>

          <div className="text-center p-4 rounded-lg bg-emerald-500/10">
            <p className="text-xs text-muted-foreground mb-1">Total Vendido</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(stats.total_vendido)}
            </p>
          </div>

          <div className="text-center p-4 rounded-lg bg-purple-500/10">
            <p className="text-xs text-muted-foreground mb-1">Lucro Líquido</p>
            <p className={`text-lg font-bold ${(stats.total_vendido - stats.total_investido - stats.total_gastos) >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
              {formatCurrency(stats.total_vendido - stats.total_investido - stats.total_gastos)}
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-6 flex items-center justify-center">
          <Link href="/dashboard/admin/real-estate/novo">
            <Button className="bg-primary hover:bg-primary/90">
              <Package className="w-4 h-4 mr-2" />
              Adicionar Novo Imóvel
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}