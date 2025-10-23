'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Download,
  Filter,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  Clock
} from 'lucide-react'

interface RelatorioItem {
  indicacao_id: string
  mentorado_nome: string
  mentorado_email: string
  cliente_nome: string
  cliente_email: string
  data_envio: string
  data_conversao: string
  valor_venda: number
  percentual_comissao: number
  valor_comissao: number
  comissao_paga: boolean
  data_pagamento_comissao?: string
  responsavel_fechamento: string
  status_comissao: string
}

interface Filtros {
  mentorado_id: string
  data_inicio: string
  data_fim: string
  status_comissao: string
}

export function RelatorioComissoes() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [relatorio, setRelatorio] = useState<RelatorioItem[]>([])
  const [mentorados, setMentorados] = useState<{ id: string; nome: string }[]>([])
  
  const [filtros, setFiltros] = useState<Filtros>({
    mentorado_id: '',
    data_inicio: '',
    data_fim: '',
    status_comissao: ''
  })

  const [resumo, setResumo] = useState({
    total_vendas: 0,
    total_comissoes: 0,
    comissoes_pagas: 0,
    comissoes_pendentes: 0,
    total_indicacoes: 0
  })

  const loadMentorados = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nome')
        .eq('funcao', 'mentorado')
        .order('nome')

      if (error) throw error
      setMentorados(data || [])
    } catch (error) {
      console.error('Erro ao carregar mentorados:', error)
    }
  }, [])

  const loadRelatorio = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('vw_relatorio_comissoes')
        .select('*')

      // Aplicar filtros
      if (filtros.mentorado_id) {
        const { data: mentoradoData } = await supabase
          .from('users')
          .select('email')
          .eq('id', filtros.mentorado_id)
          .single()
        
        if (mentoradoData) {
          query = query.eq('mentorado_email', mentoradoData.email)
        }
      }

      if (filtros.data_inicio) {
        query = query.gte('data_conversao', filtros.data_inicio)
      }

      if (filtros.data_fim) {
        query = query.lte('data_conversao', filtros.data_fim + 'T23:59:59')
      }

      if (filtros.status_comissao) {
        const statusMap = {
          'paga': true,
          'pendente': false
        }
        
        if (filtros.status_comissao in statusMap) {
          query = query.eq('comissao_paga', statusMap[filtros.status_comissao as keyof typeof statusMap])
        }
      }

      const { data, error } = await query.order('data_conversao', { ascending: false })

      if (error) throw error

      const relatorioData = data || []
      setRelatorio(relatorioData)

      // Calcular resumo
      const novoResumo = {
        total_vendas: relatorioData.reduce((sum, item) => sum + (item.valor_venda || 0), 0),
        total_comissoes: relatorioData.reduce((sum, item) => sum + (item.valor_comissao || 0), 0),
        comissoes_pagas: relatorioData.filter(item => item.comissao_paga).reduce((sum, item) => sum + (item.valor_comissao || 0), 0),
        comissoes_pendentes: relatorioData.filter(item => !item.comissao_paga).reduce((sum, item) => sum + (item.valor_comissao || 0), 0),
        total_indicacoes: relatorioData.length
      }

      setResumo(novoResumo)

    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
      setError((error as Error).message || 'Erro ao carregar relatório')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    loadMentorados()
  }, [loadMentorados])

  useEffect(() => {
    loadRelatorio()
  }, [loadRelatorio])

  const handleExportCSV = () => {
    if (relatorio.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }

    const headers = [
      'Mentorado',
      'Cliente',
      'Data Conversão',
      'Valor Venda',
      'Percentual Comissão',
      'Valor Comissão',
      'Status Comissão',
      'Responsável Fechamento',
      'Data Pagamento'
    ]

    const csvContent = [
      headers.join(','),
      ...relatorio.map(item => [
        item.mentorado_nome,
        item.cliente_nome,
        new Date(item.data_conversao).toLocaleDateString('pt-BR'),
        item.valor_venda.toFixed(2),
        item.percentual_comissao.toFixed(2) + '%',
        item.valor_comissao.toFixed(2),
        item.status_comissao,
        item.responsavel_fechamento,
        item.data_pagamento_comissao ? new Date(item.data_pagamento_comissao).toLocaleDateString('pt-BR') : '-'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `relatorio_comissoes_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
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

  const getStatusBadge = (status: string) => {
    const styles = {
      'Paga': 'bg-green-100 text-green-800',
      'Pendente': 'bg-yellow-100 text-yellow-800',
      'Não convertida': 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge className={styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    )
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Relatório de Comissões</h1>
        <p className="text-gray-600">Acompanhe todas as comissões geradas por indicações</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indicações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo.total_indicacoes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.total_vendas)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.total_comissoes)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.comissoes_pagas)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.comissoes_pendentes)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Mentorado</Label>
              <Select value={filtros.mentorado_id} onValueChange={(value) => {
                setFiltros(prev => ({ ...prev, mentorado_id: value }))
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os mentorados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os mentorados</SelectItem>
                  {mentorados.map(mentorado => (
                    <SelectItem key={mentorado.id} value={mentorado.id}>
                      {mentorado.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Status Comissão</Label>
              <Select value={filtros.status_comissao} onValueChange={(value) => {
                setFiltros(prev => ({ ...prev, status_comissao: value }))
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Relatório */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório Detalhado
              </CardTitle>
              <CardDescription>
                Comissões de indicações convertidas
              </CardDescription>
            </div>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : relatorio.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma comissão encontrada</p>
              <p className="text-sm text-gray-400">Ajuste os filtros para ver os dados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Mentorado</th>
                    <th className="text-left p-2">Cliente</th>
                    <th className="text-left p-2">Data Conversão</th>
                    <th className="text-right p-2">Valor Venda</th>
                    <th className="text-right p-2">% Comissão</th>
                    <th className="text-right p-2">Valor Comissão</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-left p-2">Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.map((item, index) => (
                    <tr key={item.indicacao_id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{item.mentorado_nome}</p>
                          <p className="text-sm text-gray-600">{item.mentorado_email}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{item.cliente_nome}</p>
                          <p className="text-sm text-gray-600">{item.cliente_email}</p>
                        </div>
                      </td>
                      <td className="p-2">{formatDate(item.data_conversao)}</td>
                      <td className="p-2 text-right font-medium">{formatCurrency(item.valor_venda)}</td>
                      <td className="p-2 text-right">{item.percentual_comissao}%</td>
                      <td className="p-2 text-right font-medium">{formatCurrency(item.valor_comissao)}</td>
                      <td className="p-2 text-center">{getStatusBadge(item.status_comissao)}</td>
                      <td className="p-2">{item.responsavel_fechamento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}