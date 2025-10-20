'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Eye,
  Check,
  X
} from 'lucide-react'

interface IndicacaoDetalhada {
  id: string
  mentorado_nome: string
  mentorado_email: string
  nome: string
  email: string
  telefone: string
  observacao?: string
  status: string
  data_envio: string
  data_atualizacao: string
  convertida: boolean
  valor_venda?: number
  valor_comissao?: number
  comissao_paga: boolean
}

interface EstatisticasGerais {
  total_indicacoes: number
  indicacoes_pendentes: number
  indicacoes_convertidas: number
  taxa_conversao: number
  total_vendas_geradas: number
  total_comissoes_geradas: number
  comissoes_pagas: number
  comissoes_pendentes: number
}

interface ModalConversaoProps {
  indicacao: IndicacaoDetalhada
  onClose: () => void
  onSuccess: () => void
}

function ModalConversao({ indicacao, onClose, onSuccess }: ModalConversaoProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [valorVenda, setValorVenda] = useState('')
  const [closerResponsavel, setCloserResponsavel] = useState('')
  const [closers, setClosers] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    const loadClosers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, nome')
          .in('funcao', ['closer', 'mentorado'])
          .order('nome')

        if (error) throw error
        setClosers(data || [])
      } catch (error) {
        console.error('Erro ao carregar closers:', error)
      }
    }

    loadClosers()
  }, [])

  const handleConverter = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!valorVenda || parseFloat(valorVenda) <= 0) {
      setError('Valor da venda deve ser maior que zero')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.rpc('converter_indicacao', {
        p_indicacao_id: indicacao.id,
        p_valor_venda: parseFloat(valorVenda),
        p_closer_responsavel_id: closerResponsavel || null
      })

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao converter indicação:', error)
      setError(error.message || 'Erro ao converter indicação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Converter Indicação</CardTitle>
          <CardDescription>
            Marcar como venda e calcular comissão para {indicacao.nome}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleConverter} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valorVenda">Valor da Venda *</Label>
              <Input
                id="valorVenda"
                type="number"
                step="0.01"
                min="0"
                value={valorVenda}
                onChange={(e) => setValorVenda(e.target.value)}
                placeholder="5000.00"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closerResponsavel">Closer Responsável</Label>
              <Select value={closerResponsavel} onValueChange={setCloserResponsavel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o closer (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {closers.map((closer) => (
                    <SelectItem key={closer.id} value={closer.id}>
                      {closer.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Se for o próprio mentorado, deixe em branco
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Convertendo...' : 'Converter'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function IndicacoesManager() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [indicacoes, setIndicacoes] = useState<IndicacaoDetalhada[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [indicacaoSelecionada, setIndicacaoSelecionada] = useState<IndicacaoDetalhada | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar estatísticas
      const { data: statsData, error: statsError } = await supabase.rpc('get_estatisticas_indicacoes')
      if (statsError) throw statsError
      setEstatisticas(statsData?.[0] || null)

      // Carregar indicações
      const { data: indicacoesData, error: indicacoesError } = await supabase.rpc('get_indicacoes_por_status', {
        p_status: filtroStatus === 'todos' ? null : filtroStatus
      })
      if (indicacoesError) throw indicacoesError
      setIndicacoes(indicacoesData || [])

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      setError(error.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filtroStatus])

  const handleAtualizarStatus = async (indicacaoId: string, novoStatus: string, motivo?: string) => {
    try {
      const { error } = await supabase
        .from('indicacoes')
        .update({
          status: novoStatus,
          motivo_rejeicao: motivo || null,
          responsavel_analise_id: user?.id,
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', indicacaoId)

      if (error) throw error
      
      await loadData()
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      setError(error.message || 'Erro ao atualizar status')
    }
  }

  const handleMarcarComissaoPaga = async (indicacaoId: string) => {
    try {
      const { error } = await supabase.rpc('marcar_comissao_paga', {
        p_indicacao_id: indicacaoId
      })

      if (error) throw error
      
      await loadData()
    } catch (error: any) {
      console.error('Erro ao marcar comissão como paga:', error)
      setError(error.message || 'Erro ao marcar comissão como paga')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800',
      em_analise: 'bg-blue-100 text-blue-800',
      aceita: 'bg-green-100 text-green-800',
      rejeitada: 'bg-red-100 text-red-800',
      convertida: 'bg-purple-100 text-purple-800'
    }

    return (
      <Badge className={styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (user?.funcao !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Acesso restrito a administradores
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Indicações</h1>
        <p className="text-gray-600">Gerencie indicações enviadas pelos mentorados</p>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.total_indicacoes}</div>
              <p className="text-xs text-muted-foreground">
                {estatisticas.indicacoes_pendentes} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.taxa_conversao}%</div>
              <p className="text-xs text-muted-foreground">
                {estatisticas.indicacoes_convertidas} convertidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Geradas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(estatisticas.total_vendas_geradas)}</div>
              <p className="text-xs text-muted-foreground">
                Comissões: {formatCurrency(estatisticas.total_comissoes_geradas)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(estatisticas.comissoes_pendentes)}</div>
              <p className="text-xs text-muted-foreground">
                Pagas: {formatCurrency(estatisticas.comissoes_pagas)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aceita">Aceitas</SelectItem>
                  <SelectItem value="rejeitada">Rejeitadas</SelectItem>
                  <SelectItem value="convertida">Convertidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Indicações */}
      <Card>
        <CardHeader>
          <CardTitle>Indicações</CardTitle>
          <CardDescription>
            Gerencie todas as indicações recebidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {indicacoes.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma indicação encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {indicacoes.map((indicacao) => (
                <div key={indicacao.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Dados da Indicação */}
                    <div>
                      <h4 className="font-medium">{indicacao.nome}</h4>
                      <p className="text-sm text-gray-600">{indicacao.email}</p>
                      <p className="text-sm text-gray-600">{indicacao.telefone}</p>
                      {indicacao.observacao && (
                        <p className="text-sm text-gray-500 mt-1">{indicacao.observacao}</p>
                      )}
                    </div>

                    {/* Dados do Mentorado */}
                    <div>
                      <p className="text-sm text-gray-500">Mentorado:</p>
                      <p className="font-medium">{indicacao.mentorado_nome}</p>
                      <p className="text-sm text-gray-600">{indicacao.mentorado_email}</p>
                      <p className="text-sm text-gray-500">
                        Enviado em {formatDate(indicacao.data_envio)}
                      </p>
                    </div>

                    {/* Status e Ações */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        {getStatusBadge(indicacao.status)}
                      </div>

                      {/* Informações de Conversão */}
                      {indicacao.convertida && (
                        <div className="bg-green-50 p-2 rounded text-sm">
                          <p><strong>Valor:</strong> {formatCurrency(indicacao.valor_venda || 0)}</p>
                          <p><strong>Comissão:</strong> {formatCurrency(indicacao.valor_comissao || 0)}</p>
                          <p><strong>Status:</strong> {indicacao.comissao_paga ? '✅ Paga' : '⏳ Pendente'}</p>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex flex-wrap gap-2">
                        {indicacao.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAtualizarStatus(indicacao.id, 'em_analise')}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Analisar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAtualizarStatus(indicacao.id, 'aceita')}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAtualizarStatus(indicacao.id, 'rejeitada', 'Não qualificado')}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Rejeitar
                            </Button>
                          </>
                        )}

                        {(indicacao.status === 'aceita' && !indicacao.convertida) && (
                          <Button
                            size="sm"
                            onClick={() => setIndicacaoSelecionada(indicacao)}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Converter
                          </Button>
                        )}

                        {(indicacao.convertida && !indicacao.comissao_paga) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarcarComissaoPaga(indicacao.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Marcar Paga
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Conversão */}
      {indicacaoSelecionada && (
        <ModalConversao
          indicacao={indicacaoSelecionada}
          onClose={() => setIndicacaoSelecionada(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}