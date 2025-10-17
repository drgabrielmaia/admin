'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Target,
  Phone,
  Users,
  Filter,
  Award,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ComissaoCard } from './ComissaoCard'

interface Comissao {
  id: string
  chamada_id: string
  lead_id: string
  sdr_id: string
  closer_id: string
  valor_venda: number
  percentual_sdr: number
  percentual_closer: number
  comissao_sdr: number
  comissao_closer: number
  status: 'pendente' | 'paga' | 'cancelada'
  data_venda: string
  data_pagamento: string | null
  observacoes: string | null
  created_at: string
  
  // Joins
  lead: {
    nome: string
    origem: string
  }
  sdr: {
    nome: string
  }
  closer: {
    nome: string
  }
}

interface ComissaoStats {
  totalVendas: number
  comissaoTotal: number
  comissaoPendente: number
  comissaoPaga: number
  comissaoCancelada: number
  mediaTicket: number
  melhorMes: string
}

export function ComissoesDashboard() {
  const { user } = useAuth()
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [stats, setStats] = useState<ComissaoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroMes, setFiltroMes] = useState('todos')

  useEffect(() => {
    if (user) {
      loadComissoes()
    }
  }, [user])

  const loadComissoes = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Query baseada no tipo de usuário
      let query = supabase
        .from('comissoes')
        .select(`
          *,
          lead:leads(nome, origem),
          sdr:sdr_id(nome),
          closer:closer_id(nome)
        `)
        .order('data_venda', { ascending: false })

      // Filtrar por usuário baseado no papel
      if (user.funcao === 'sdr') {
        query = query.eq('sdr_id', user.id)
      } else if (user.funcao === 'closer') {
        query = query.eq('closer_id', user.id)
      }
      // Admin pode ver todas

      const { data, error } = await query

      if (error) throw error

      setComissoes(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Erro ao carregar comissões:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: Comissao[]) => {
    if (!data.length) {
      setStats(null)
      return
    }

    // Filtrar comissões relevantes para o usuário atual
    let relevantCommissions = data
    if (user?.funcao === 'sdr') {
      relevantCommissions = data.filter(c => c.sdr_id === user.id)
    } else if (user?.funcao === 'closer') {
      relevantCommissions = data.filter(c => c.closer_id === user.id)
    }

    const totalVendas = relevantCommissions.length
    
    // Calcular comissão total baseada no papel do usuário
    const comissaoTotal = relevantCommissions.reduce((acc, c) => {
      if (user?.funcao === 'sdr') {
        return acc + c.comissao_sdr
      } else if (user?.funcao === 'closer') {
        return acc + c.comissao_closer
      } else {
        // Admin vê total geral
        return acc + c.comissao_sdr + c.comissao_closer
      }
    }, 0)

    const comissaoPendente = relevantCommissions
      .filter(c => c.status === 'pendente')
      .reduce((acc, c) => {
        if (user?.funcao === 'sdr') return acc + c.comissao_sdr
        if (user?.funcao === 'closer') return acc + c.comissao_closer
        return acc + c.comissao_sdr + c.comissao_closer
      }, 0)

    const comissaoPaga = relevantCommissions
      .filter(c => c.status === 'paga')
      .reduce((acc, c) => {
        if (user?.funcao === 'sdr') return acc + c.comissao_sdr
        if (user?.funcao === 'closer') return acc + c.comissao_closer
        return acc + c.comissao_sdr + c.comissao_closer
      }, 0)

    const comissaoCancelada = relevantCommissions
      .filter(c => c.status === 'cancelada')
      .reduce((acc, c) => {
        if (user?.funcao === 'sdr') return acc + c.comissao_sdr
        if (user?.funcao === 'closer') return acc + c.comissao_closer
        return acc + c.comissao_sdr + c.comissao_closer
      }, 0)

    const mediaTicket = totalVendas > 0 
      ? relevantCommissions.reduce((acc, c) => acc + c.valor_venda, 0) / totalVendas
      : 0

    // Encontrar melhor mês
    const vendasPorMes = relevantCommissions.reduce((acc, c) => {
      const mes = new Date(c.data_venda).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      acc[mes] = (acc[mes] || 0) + (user?.funcao === 'sdr' ? c.comissao_sdr : c.comissao_closer)
      return acc
    }, {} as Record<string, number>)

    const melhorMes = Object.keys(vendasPorMes).reduce((best, mes) => 
      vendasPorMes[mes] > (vendasPorMes[best] || 0) ? mes : best, 
      Object.keys(vendasPorMes)[0] || 'N/A'
    )

    setStats({
      totalVendas,
      comissaoTotal,
      comissaoPendente,
      comissaoPaga,
      comissaoCancelada,
      mediaTicket,
      melhorMes: melhorMes || 'N/A'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-900 text-yellow-300 border-yellow-700'
      case 'paga': return 'bg-green-900 text-green-300 border-green-700'
      case 'cancelada': return 'bg-red-900 text-red-300 border-red-700'
      default: return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="h-3 w-3" />
      case 'paga': return <CheckCircle className="h-3 w-3" />
      case 'cancelada': return <XCircle className="h-3 w-3" />
      default: return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente'
      case 'paga': return 'Paga'
      case 'cancelada': return 'Cancelada'
      default: return status
    }
  }

  // Filtrar comissões
  const comissoesFiltradas = comissoes.filter(comissao => {
    const matchStatus = filtroStatus === 'todos' || comissao.status === filtroStatus
    const matchMes = filtroMes === 'todos' || 
      new Date(comissao.data_venda).toLocaleDateString('pt-BR', { month: 'numeric', year: 'numeric' }) === filtroMes
    return matchStatus && matchMes
  })

  // Obter meses únicos para o filtro
  const mesesUnicos = [...new Set(comissoes.map(c => 
    new Date(c.data_venda).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  ))].sort()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-pulse text-slate-400">Carregando comissões...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Total Vendas</p>
                  <p className="text-lg font-bold text-white">{stats.totalVendas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-xs text-slate-400">Total Comissões</p>
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(stats.comissaoTotal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <div>
                  <p className="text-xs text-slate-400">Pendente</p>
                  <p className="text-lg font-bold text-yellow-400">
                    {formatCurrency(stats.comissaoPendente)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs text-slate-400">Recebido</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatCurrency(stats.comissaoPaga)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-400">Ticket Médio</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(stats.mediaTicket)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-yellow-400" />
                <div>
                  <p className="text-xs text-slate-400">Melhor Mês</p>
                  <p className="text-sm font-bold text-white">{stats.melhorMes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="paga">Paga</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <Select value={filtroMes} onValueChange={setFiltroMes}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Meses</SelectItem>
              {mesesUnicos.map(mes => (
                <SelectItem key={mes} value={mes}>
                  {mes}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Comissões */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            Minhas Comissões ({comissoesFiltradas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comissoesFiltradas.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {comissoesFiltradas.map((comissao, index) => (
                <ComissaoCard 
                  key={comissao.id} 
                  comissao={comissao}
                  userRole={user?.funcao as 'sdr' | 'closer' | 'admin'}
                  isHighlight={index < 2} // Destacar as 2 primeiras (mais recentes)
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">Nenhuma comissão encontrada</h3>
              <p className="text-slate-500">
                {filtroStatus !== 'todos' || filtroMes !== 'todos' 
                  ? 'Ajuste os filtros para ver mais resultados'
                  : user?.funcao === 'sdr' 
                    ? 'Continue qualificando leads para gerar comissões'
                    : 'Continue fechando vendas para gerar comissões'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}