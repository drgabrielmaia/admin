'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  TrendingUp, 
  Zap, 
  Phone,
  Users,
  Calendar,
  Star,
  Trophy,
  Flame,
  Plus,
  ArrowRight,
  Gift,
  Award,
  Rocket
} from 'lucide-react'
import { BirthdayIcon } from '@/components/ui/birthday-icon'

interface SDRStats {
  leadsHoje: number
  leadsSemana: number
  leadsMes: number
  metaDiaria: number
  metaSemanal: number
  metaMensal: number
  taxaConversao: number
  posicaoRanking: number
  pontosTotal: number
  proximoNivel: number
  agendamentosHoje: number
  chamadas: number
  streak: number
}

export function ModernSDRDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<SDRStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      const hoje = new Date()
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - hoje.getDay())
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

      // Simular dados por enquanto (você pode conectar com o banco depois)
      setStats({
        leadsHoje: 8,
        leadsSemana: 32,
        leadsMes: 127,
        metaDiaria: 10,
        metaSemanal: 50,
        metaMensal: 200,
        taxaConversao: 15.5,
        posicaoRanking: 2,
        pontosTotal: 2350,
        proximoNivel: 500,
        agendamentosHoje: 3,
        chamadas: 15,
        streak: 7
      })
      
    } catch (error) {
      console.error('Erro ao carregar stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          <p className="text-purple-300 animate-pulse">Carregando seu desempenho...</p>
        </div>
      </div>
    )
  }

  const progressoDiario = Math.min((stats.leadsHoje / stats.metaDiaria) * 100, 100)
  const progressoSemanal = Math.min((stats.leadsSemana / stats.metaSemanal) * 100, 100)
  const progressoMensal = Math.min((stats.leadsMes / stats.metaMensal) * 100, 100)
  const progressoNivel = ((stats.pontosTotal % 1000) / 10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-6 lg:p-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">
                    Olá, {user?.nome?.split(' ')[0]}! 👋
                  </h1>
                  <BirthdayIcon 
                    birthDate={user?.data_nascimento || null} 
                    userName={user?.nome}
                    size="lg"
                    className="text-yellow-300"
                  />
                </div>
                <p className="text-white/80 text-lg">
                  Você está na posição #{stats.posicaoRanking} do ranking
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.streak}</div>
                <div className="text-white/80 text-sm">dias consecutivos</div>
              </div>
              <Flame className="w-8 h-8 text-orange-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Metas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Meta Diária */}
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                  HOJE
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-white">{stats.leadsHoje}</span>
                  <span className="text-green-400 font-medium">/ {stats.metaDiaria}</span>
                </div>
                
                <div className="w-full bg-slate-800 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                    style={{ width: `${progressoDiario}%` }}
                  >
                    {progressoDiario >= 100 && <Star className="w-3 h-3 text-white" />}
                  </div>
                </div>
                
                <p className="text-slate-400 text-sm">
                  {progressoDiario >= 100 ? '🎉 Meta batida!' : `Faltam ${stats.metaDiaria - stats.leadsHoje} leads`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Meta Semanal */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  SEMANA
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-white">{stats.leadsSemana}</span>
                  <span className="text-blue-400 font-medium">/ {stats.metaSemanal}</span>
                </div>
                
                <div className="w-full bg-slate-800 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                    style={{ width: `${progressoSemanal}%` }}
                  >
                    {progressoSemanal >= 100 && <Trophy className="w-3 h-3 text-white" />}
                  </div>
                </div>
                
                <p className="text-slate-400 text-sm">
                  {progressoSemanal >= 100 ? '🏆 Semana dominada!' : `${progressoSemanal.toFixed(1)}% completo`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Meta Mensal */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                  MÊS
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-white">{stats.leadsMes}</span>
                  <span className="text-purple-400 font-medium">/ {stats.metaMensal}</span>
                </div>
                
                <div className="w-full bg-slate-800 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                    style={{ width: `${progressoMensal}%` }}
                  >
                    {progressoMensal >= 100 && <Award className="w-3 h-3 text-white" />}
                  </div>
                </div>
                
                <p className="text-slate-400 text-sm">
                  {progressoMensal >= 100 ? '🥇 Mês épico!' : `${progressoMensal.toFixed(1)}% do mês`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300">
            <CardContent className="p-4 text-center">
              <Phone className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.agendamentosHoje}</div>
              <div className="text-slate-400 text-sm">Agendamentos hoje</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.chamadas}</div>
              <div className="text-slate-400 text-sm">Chamadas hoje</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.taxaConversao}%</div>
              <div className="text-slate-400 text-sm">Conversão</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300">
            <CardContent className="p-4 text-center">
              <Gift className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.pontosTotal}</div>
              <div className="text-slate-400 text-sm">XP Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 hover:from-green-500 hover:to-emerald-500 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Adicionar Lead</h3>
                  <p className="text-green-100 text-sm">Capture um novo lead agora</p>
                </div>
                <Plus className="w-8 h-8 text-white" />
              </div>
              <Button className="w-full mt-4 bg-white text-green-600 hover:bg-green-50 font-semibold">
                Novo Lead <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-0 hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Pipeline</h3>
                  <p className="text-blue-100 text-sm">Gerencie seus leads ativos</p>
                </div>
                <Users className="w-8 h-8 text-white" />
              </div>
              <Button className="w-full mt-4 bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                Ver Pipeline <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Nível e Progresso */}
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-600/10 border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Nível {Math.floor(stats.pontosTotal / 1000) + 1}</h3>
                  <p className="text-slate-400 text-sm">Faltam {stats.proximoNivel} XP para o próximo nível</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                {stats.pontosTotal} XP
              </Badge>
            </div>
            
            <div className="w-full bg-slate-800 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-4 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                style={{ width: `${progressoNivel}%` }}
              >
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}