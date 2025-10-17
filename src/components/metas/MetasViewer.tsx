'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  Users, 
  User, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Trophy
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Meta {
  id: string
  tipo: 'individual' | 'equipe'
  categoria: 'leads' | 'vendas' | 'faturamento' | 'comissao' | 'conversao'
  valor_meta: number
  periodo: string
  nome_exibicao: string
  valor_atual?: number
  percentual_atingido?: number
  status_dia?: string
}

interface MetasViewerProps {
  userRole: 'sdr' | 'closer'
  showTeamGoals?: boolean
}

export function MetasViewer({ userRole, showTeamGoals = true }: MetasViewerProps) {
  const { user } = useAuth()
  const [metasIndividuais, setMetasIndividuais] = useState<Meta[]>([])
  const [metasEquipe, setMetasEquipe] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadMetas()
      
      // Configurar atualização automática das metas a cada 10 segundos
      const interval = setInterval(() => {
        loadMetas()
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  const loadMetas = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Forçar atualização com dados reais antes de carregar usando nossa função
      try {
        const { forceUpdateAllMetas } = await import('@/lib/metas-utils')
        await forceUpdateAllMetas()
      } catch (error) {
        console.warn('Erro ao forçar atualização de metas:', error)
      }

      // Carregar metas individuais
      const { data: individuais, error: errorIndividuais } = await supabase
        .from('vw_metas_com_progresso')
        .select('*')
        .eq('tipo', 'individual')
        .eq('user_id', user.id)
        .eq('status', 'ativa')

      if (errorIndividuais) throw errorIndividuais

      // Carregar metas de equipe baseadas na função do usuário
      const { data: equipe, error: errorEquipe } = await supabase
        .from('vw_metas_com_progresso')
        .select('*')
        .eq('tipo', 'equipe')
        .eq('funcao', userRole)
        .eq('status', 'ativa')

      if (errorEquipe) throw errorEquipe

      setMetasIndividuais(individuais || [])
      setMetasEquipe(equipe || [])
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoriaInfo = (categoria: string) => {
    switch (categoria) {
      case 'leads': return { icon: Users, label: 'Leads Gerados', suffix: '' }
      case 'vendas': return { icon: Target, label: 'Vendas Fechadas', suffix: '' }
      case 'faturamento': return { icon: DollarSign, label: 'Faturamento', suffix: 'R$' }
      case 'comissao': return { icon: TrendingUp, label: 'Comissão', suffix: 'R$' }
      case 'conversao': return { icon: TrendingUp, label: 'Conversão', suffix: '%' }
      default: return { icon: Target, label: categoria, suffix: '' }
    }
  }

  const getProgressColor = (percentual?: number) => {
    if (!percentual) return 'bg-slate-600'
    if (percentual >= 100) return 'bg-green-500'
    if (percentual >= 80) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getStatusIcon = (percentual?: number, statusDia?: string) => {
    if (percentual && percentual >= 100) return <CheckCircle className="h-4 w-4 text-green-400" />
    if (statusDia === 'nao_atingido') return <AlertCircle className="h-4 w-4 text-red-400" />
    return <Clock className="h-4 w-4 text-yellow-400" />
  }

  const formatValor = (valor: number, categoria: string) => {
    // Proteção contra null/undefined
    if (!valor && valor !== 0) {
      return '0'
    }
    
    if (categoria === 'faturamento' || categoria === 'comissao') {
      return formatCurrency(valor)
    }
    if (categoria === 'conversao') {
      return `${valor.toFixed(1)}%`
    }
    return valor.toString()
  }

  const renderMetaCard = (meta: Meta, isTeam = false) => {
    const categoriaInfo = getCategoriaInfo(meta.categoria)
    const Icon = categoriaInfo.icon

    return (
      <Card key={meta.id} className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isTeam ? 'bg-purple-600' : 'bg-blue-600'
              }`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">{categoriaInfo.label}</p>
                <p className="text-xs text-slate-400 capitalize">{meta.periodo}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {meta.percentual_atingido && meta.percentual_atingido >= 100 && (
                <Trophy className="h-4 w-4 text-yellow-400" />
              )}
              {getStatusIcon(meta.percentual_atingido, meta.status_dia)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Meta e Progresso */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">Meta {meta.tipo === 'equipe' ? 'da Equipe' : 'Individual'}</p>
                <p className="text-sm font-bold text-white">
                  {formatValor(meta.valor_meta, meta.categoria)}
                </p>
              </div>
              
              {meta.valor_atual !== undefined && meta.percentual_atingido !== undefined && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-400">Atual</p>
                    <p className="text-sm text-slate-300">
                      {formatValor(meta.valor_atual, meta.categoria)}
                    </p>
                  </div>
                  
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressColor(meta.percentual_atingido)}`}
                      style={{ width: `${Math.min(meta.percentual_atingido, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={
                      (meta.percentual_atingido || 0) >= 100 
                        ? 'bg-green-900 text-green-300 border-green-700'
                        : (meta.percentual_atingido || 0) >= 80
                        ? 'bg-yellow-900 text-yellow-300 border-yellow-700'
                        : 'bg-blue-900 text-blue-300 border-blue-700'
                    }>
                      {(meta.percentual_atingido || 0).toFixed(1)}%
                    </Badge>
                    
                    {(meta.percentual_atingido || 0) >= 100 && (
                      <span className="text-xs text-green-400 font-medium">META ATINGIDA! 🎉</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Tipo da Meta */}
            <div className="pt-2 border-t border-slate-700">
              <div className="flex items-center space-x-2">
                {meta.tipo === 'individual' ? (
                  <User className="h-3 w-3 text-blue-400" />
                ) : (
                  <Users className="h-3 w-3 text-purple-400" />
                )}
                <span className="text-xs text-slate-400">
                  {meta.nome_exibicao}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Minhas Metas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-400">
            <div className="animate-pulse">Carregando metas...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalMetas = metasIndividuais.length + (showTeamGoals ? metasEquipe.length : 0)

  if (totalMetas === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Minhas Metas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Nenhuma meta ativa</p>
            <p className="text-xs text-slate-500">Aguarde o admin configurar suas metas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Metas Individuais */}
      {metasIndividuais.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <User className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-medium text-white">Minhas Metas</h3>
            <Badge variant="outline" className="bg-blue-900 text-blue-300 border-blue-700">
              {metasIndividuais.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metasIndividuais.map(meta => renderMetaCard(meta, false))}
          </div>
        </div>
      )}

      {/* Metas de Equipe */}
      {showTeamGoals && metasEquipe.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-medium text-white">Metas da Equipe</h3>
            <Badge variant="outline" className="bg-purple-900 text-purple-300 border-purple-700">
              {metasEquipe.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metasEquipe.map(meta => renderMetaCard(meta, true))}
          </div>
        </div>
      )}
    </div>
  )
}