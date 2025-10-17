'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Trophy, Medal, Target, TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { BirthdayIcon } from '@/components/ui/birthday-icon'

interface UserRanking {
  id: string
  nome: string
  funcao: 'sdr' | 'closer'
  data_nascimento?: string | null
  leads_mes?: number
  conversoes_mes?: number
  vendas_mes?: number
  taxa_conversao: number
  comissao_mes: number
  posicao: number
  is_current_user: boolean
}

interface RankingBoardProps {
  userRole: 'sdr' | 'closer'
}

export function RankingBoard({ userRole }: RankingBoardProps) {
  const { user } = useAuth()
  const [ranking, setRanking] = useState<UserRanking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
  }, [userRole])

  const loadRanking = async () => {
    try {
      setLoading(true)
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      
      if (userRole === 'sdr') {
        // Ranking de SDRs baseado em conversão e leads qualificados
        const { data: sdrs } = await supabase
          .from('users')
          .select('id, nome, funcao, data_nascimento')
          .eq('funcao', 'sdr')

        if (!sdrs) return

        const rankingData = await Promise.all(
          sdrs.map(async (sdr) => {
            // Leads do mês
            const { count: leadsMes } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('sdr_id', sdr.id)
              .gte('created_at', inicioMes.toISOString())

            // Conversões do mês (leads convertidos)
            const { count: conversoesMes } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('sdr_id', sdr.id)
              .eq('status', 'convertido')
              .gte('created_at', inicioMes.toISOString())

            // Comissão do mês
            const { data: comissoes } = await supabase
              .from('comissoes')
              .select('comissao_sdr')
              .eq('sdr_id', sdr.id)
              .gte('data_venda', inicioMes.toISOString())

            const comissaoMes = comissoes?.reduce((acc, c) => acc + c.comissao_sdr, 0) || 0
            const taxaConversao = leadsMes && leadsMes > 0 
              ? Math.round(((conversoesMes || 0) / leadsMes) * 100)
              : 0

            return {
              id: sdr.id,
              nome: sdr.nome,
              funcao: sdr.funcao as 'sdr',
              data_nascimento: sdr.data_nascimento,
              leads_mes: leadsMes || 0,
              conversoes_mes: conversoesMes || 0,
              taxa_conversao: taxaConversao,
              comissao_mes: comissaoMes,
              posicao: 0, // Será definido depois
              is_current_user: sdr.id === user?.id
            }
          })
        )

        // Ordenar por taxa de conversão (maior) e depois por leads qualificados
        const sorted = rankingData
          .sort((a, b) => {
            if (b.taxa_conversao !== a.taxa_conversao) {
              return b.taxa_conversao - a.taxa_conversao
            }
            return (b.conversoes_mes || 0) - (a.conversoes_mes || 0)
          })
          .map((item, index) => ({ ...item, posicao: index + 1 }))

        setRanking(sorted)

      } else if (userRole === 'closer') {
        // Ranking de Closers baseado em vendas e comissões
        const { data: closers } = await supabase
          .from('users')
          .select('id, nome, funcao, data_nascimento')
          .eq('funcao', 'closer')

        if (!closers) return

        const rankingData = await Promise.all(
          closers.map(async (closer) => {
            // Vendas do mês
            const { count: vendasMes } = await supabase
              .from('chamadas')
              .select('*', { count: 'exact', head: true })
              .eq('closer_id', closer.id)
              .eq('resultado', 'venda')
              .gte('data_chamada', inicioMes.toISOString())

            // Chamadas totais do mês
            const { count: chamadasTotais } = await supabase
              .from('chamadas')
              .select('*', { count: 'exact', head: true })
              .eq('closer_id', closer.id)
              .gte('data_chamada', inicioMes.toISOString())

            // Comissão do mês
            const { data: comissoes } = await supabase
              .from('comissoes')
              .select('comissao_closer')
              .eq('closer_id', closer.id)
              .gte('data_venda', inicioMes.toISOString())

            const comissaoMes = comissoes?.reduce((acc, c) => acc + c.comissao_closer, 0) || 0
            const taxaConversao = chamadasTotais && chamadasTotais > 0 
              ? Math.round(((vendasMes || 0) / chamadasTotais) * 100)
              : 0

            return {
              id: closer.id,
              nome: closer.nome,
              funcao: closer.funcao as 'closer',
              data_nascimento: closer.data_nascimento,
              vendas_mes: vendasMes || 0,
              taxa_conversao: taxaConversao,
              comissao_mes: comissaoMes,
              posicao: 0, // Será definido depois
              is_current_user: closer.id === user?.id
            }
          })
        )

        // Ordenar por comissão (maior) e depois por taxa de conversão
        const sorted = rankingData
          .sort((a, b) => {
            if (b.comissao_mes !== a.comissao_mes) {
              return b.comissao_mes - a.comissao_mes
            }
            return b.taxa_conversao - a.taxa_conversao
          })
          .map((item, index) => ({ ...item, posicao: index + 1 }))

        setRanking(sorted)
      }

    } catch (error) {
      console.error('Erro ao carregar ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPositionIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />
      case 2:
        return <Trophy className="h-5 w-5 text-slate-300" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-slate-400 font-bold">{posicao}º</span>
    }
  }

  const getConversionFlag = (taxa: number) => {
    if (taxa < 10) {
      return <div className="w-3 h-3 rounded-full bg-red-500"></div>
    } else if (taxa < 15) {
      return <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
    } else {
      return <div className="w-3 h-3 rounded-full bg-green-500"></div>
    }
  }

  const getConversionColor = (taxa: number) => {
    if (taxa < 10) return 'text-red-400'
    if (taxa < 15) return 'text-yellow-400'
    return 'text-green-400'
  }

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Ranking {userRole.toUpperCase()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-400">
            <div className="animate-pulse">Carregando ranking...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Ranking {userRole.toUpperCase()}</span>
          </div>
          <TrendingUp className="h-4 w-4 text-green-400" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ranking.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-all ${
                item.is_current_user
                  ? 'bg-slate-800 border-green-600 ring-1 ring-green-600/20'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getPositionIcon(item.posicao)}
                    {item.posicao === 1 && (
                      <div className="text-yellow-400 font-bold text-sm">TOP</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold ${
                        item.is_current_user ? 'text-green-400' : 'text-white'
                      }`}>
                        {item.nome}
                      </h3>
                      <BirthdayIcon 
                        birthDate={item.data_nascimento} 
                        userName={item.nome}
                        size="sm"
                      />
                      {item.is_current_user && (
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          Você
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      {userRole === 'sdr' ? (
                        <>
                          <span>Leads: {item.leads_mes}</span>
                          <span>Convertidos: {item.conversoes_mes}</span>
                        </>
                      ) : (
                        <>
                          <span>Vendas: {item.vendas_mes}</span>
                        </>
                      )}
                      <span>Comissão: R$ {item.comissao_mes.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getConversionFlag(item.taxa_conversao)}
                    <span className={`font-bold ${getConversionColor(item.taxa_conversao)}`}>
                      {item.taxa_conversao}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {ranking.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum {userRole} encontrado</p>
            <p className="text-sm">O ranking aparecerá conforme a atividade</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}