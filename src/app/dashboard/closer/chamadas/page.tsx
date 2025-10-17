'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { RegistrarChamadaForm } from '@/components/closer/RegistrarChamadaForm'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Phone, 
  DollarSign, 
  Clock, 
  Target,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Chamada {
  id: string
  lead_id: string
  closer_id: string
  duracao_minutos: number
  resultado: string
  produto_id?: string
  valor?: number
  observacoes?: string
  data_chamada: string
  created_at: string
  
  // Joins
  lead: {
    nome: string
    origem: string
  }
  produto?: {
    nome: string
    tipo: string
  }
}

interface ChamadasStats {
  totalChamadas: number
  vendas: number
  valorTotal: number
  taxaConversao: number
  duracaoMedia: number
  chamadasHoje: number
  vendasHoje: number
}

export default function ChamadasPage() {
  const { user } = useAuth()
  const [chamadas, setChamadas] = useState<Chamada[]>([])
  const [stats, setStats] = useState<ChamadasStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRegistrarChamada, setShowRegistrarChamada] = useState(false)
  const [filtroResultado, setFiltroResultado] = useState('todos')

  useEffect(() => {
    if (user) {
      loadChamadas()
    }
  }, [user])

  const loadChamadas = async () => {
    if (!user || user.funcao !== 'closer') return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('chamadas')
        .select(`
          *,
          lead:leads(nome, origem),
          produto:produtos(nome, tipo)
        `)
        .eq('closer_id', user.id)
        .order('data_chamada', { ascending: false })

      if (error) throw error

      setChamadas(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Erro ao carregar chamadas:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: Chamada[]) => {
    const hoje = new Date().toISOString().split('T')[0]
    
    const totalChamadas = data.length
    const vendas = data.filter(c => c.resultado === 'venda').length
    const valorTotal = data.reduce((acc, c) => acc + (c.valor || 0), 0)
    const taxaConversao = totalChamadas > 0 ? Math.round((vendas / totalChamadas) * 100) : 0
    const duracaoMedia = totalChamadas > 0 
      ? Math.round(data.reduce((acc, c) => acc + c.duracao_minutos, 0) / totalChamadas)
      : 0
    
    const chamadasHoje = data.filter(c => 
      c.data_chamada.startsWith(hoje)
    ).length
    
    const vendasHoje = data.filter(c => 
      c.resultado === 'venda' && c.data_chamada.startsWith(hoje)
    ).length

    setStats({
      totalChamadas,
      vendas,
      valorTotal,
      taxaConversao,
      duracaoMedia,
      chamadasHoje,
      vendasHoje
    })
  }

  const getResultadoIcon = (resultado: string) => {
    switch (resultado) {
      case 'venda':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'nao_interessado':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'interessado':
      case 'reagendar':
        return <RotateCcw className="h-4 w-4 text-yellow-400" />
      case 'nao_atendeu':
        return <AlertCircle className="h-4 w-4 text-gray-400" />
      default:
        return <Phone className="h-4 w-4 text-slate-400" />
    }
  }

  const getResultadoColor = (resultado: string) => {
    switch (resultado) {
      case 'venda':
        return 'bg-green-900 text-green-300 border-green-700'
      case 'nao_interessado':
        return 'bg-red-900 text-red-300 border-red-700'
      case 'interessado':
      case 'reagendar':
        return 'bg-yellow-900 text-yellow-300 border-yellow-700'
      case 'nao_atendeu':
        return 'bg-gray-900 text-gray-300 border-gray-700'
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  const getResultadoLabel = (resultado: string) => {
    switch (resultado) {
      case 'venda': return 'Venda Fechada'
      case 'interessado': return 'Interessado'
      case 'nao_interessado': return 'Não Interessado'
      case 'nao_atendeu': return 'Não Atendeu'
      case 'reagendar': return 'Reagendar'
      default: return resultado
    }
  }

  // Filtrar chamadas
  const chamadasFiltradas = chamadas.filter(chamada => {
    const matchResultado = filtroResultado === 'todos' || chamada.resultado === filtroResultado
    return matchResultado
  })

  if (loading) {
    return (
      <DashboardLayout title="Minhas Chamadas">
        <div className="text-center">
          <div className="animate-pulse text-slate-400">Carregando chamadas...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Minhas Chamadas">
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-slate-400">Total Chamadas</p>
                    <p className="text-lg font-bold text-white">{stats.totalChamadas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-xs text-slate-400">Vendas</p>
                    <p className="text-lg font-bold text-green-400">{stats.vendas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-400">Faturamento</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {formatCurrency(stats.valorTotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-slate-400">Conversão</p>
                    <p className="text-lg font-bold text-yellow-400">{stats.taxaConversao}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Adicionais */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-slate-400">Duração Média</p>
                    <p className="text-lg font-bold text-white">{stats.duracaoMedia}min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-xs text-slate-400">Chamadas Hoje</p>
                    <p className="text-lg font-bold text-white">{stats.chamadasHoje}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-400">Vendas Hoje</p>
                    <p className="text-lg font-bold text-emerald-400">{stats.vendasHoje}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controles */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={filtroResultado} onValueChange={setFiltroResultado}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Resultados</SelectItem>
                  <SelectItem value="venda">Vendas</SelectItem>
                  <SelectItem value="interessado">Interessados</SelectItem>
                  <SelectItem value="nao_interessado">Não Interessados</SelectItem>
                  <SelectItem value="nao_atendeu">Não Atendeu</SelectItem>
                  <SelectItem value="reagendar">Reagendar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={() => setShowRegistrarChamada(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Chamada
          </Button>
        </div>

        {/* Formulário Nova Chamada */}
        {showRegistrarChamada && (
          <RegistrarChamadaForm 
            onSuccess={() => {
              setShowRegistrarChamada(false)
              loadChamadas()
            }}
            onCancel={() => setShowRegistrarChamada(false)}
          />
        )}

        {/* Lista de Chamadas */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              Histórico de Chamadas ({chamadasFiltradas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chamadasFiltradas.length > 0 ? (
              <div className="space-y-4">
                {chamadasFiltradas.map((chamada) => (
                  <div key={chamada.id} className="p-4 border border-slate-700 rounded-lg bg-slate-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {chamada.lead?.nome}
                          </h3>
                          <Badge variant="outline" className={getResultadoColor(chamada.resultado)}>
                            <div className="flex items-center space-x-1">
                              {getResultadoIcon(chamada.resultado)}
                              <span>{getResultadoLabel(chamada.resultado)}</span>
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-slate-400">
                              Origem: <span className="text-slate-300">{chamada.lead?.origem}</span>
                            </p>
                            <p className="text-slate-400">
                              Duração: <span className="text-slate-300">{chamada.duracao_minutos} min</span>
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-slate-400">
                              Data: <span className="text-slate-300">{formatDate(chamada.data_chamada)}</span>
                            </p>
                            {chamada.produto && (
                              <p className="text-slate-400">
                                Produto: <span className="text-slate-300">{chamada.produto.nome}</span>
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            {chamada.valor && (
                              <p className="text-slate-400">
                                Valor: <span className="text-green-400 font-medium">
                                  {formatCurrency(chamada.valor)}
                                </span>
                              </p>
                            )}
                            {chamada.produto && (
                              <p className="text-slate-400">
                                Tipo: <span className="text-slate-300">{chamada.produto.tipo}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {chamada.observacoes && (
                          <p className="mt-2 text-sm text-slate-400 italic">
                            "{chamada.observacoes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">Nenhuma chamada encontrada</h3>
                <p className="text-slate-500 mb-4">
                  {filtroResultado !== 'todos' 
                    ? 'Ajuste os filtros para ver mais resultados'
                    : 'Registre sua primeira chamada para começar'
                  }
                </p>
                <Button onClick={() => setShowRegistrarChamada(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primeira Chamada
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}