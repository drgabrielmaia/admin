'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  Activity
} from 'lucide-react'

interface BPOChartsProps {
  motorType: string
  motorName: string
  motorColor: string
  dadosAnalyticos: {
    faturamento_total: number
    custos_total: number
    lucro_total: number
    margem_lucro_percent: number
    historico_mensal: {
      mes_ano: string;
      total_movimentacoes: number;
      total_entradas: number;
      total_saidas: number;
      saldo_liquido: number;
    }[]
    pix_total: number
    debito_total: number
    credito_total: number
    despesas_marketing: number
    despesas_operacionais: number
    despesas_pessoal: number
  }
  dadosAgrupados?: {
    periodo: string;
    faturamento: number;
    custos: number;
    lucro: number;
    margem_lucro: number;
  }[]
  periodoSelecionado?: 'diario' | 'semanal' | 'mensal' | 'anual'
}

export function BPOCharts({
  motorName,
  dadosAnalyticos
}: BPOChartsProps) {
  const [periodoAnalise, setPeriodoAnalise] = useState('mes_atual')
  const [tipoGrafico, setTipoGrafico] = useState('visao_geral')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Dados para gráfico de pizza - Formas de Pagamento
  const dadosFormasPagamento = [
    { nome: 'PIX', valor: dadosAnalyticos.pix_total, cor: '#10b981' },
    { nome: 'Débito', valor: dadosAnalyticos.debito_total, cor: '#3b82f6' },
    { nome: 'Crédito', valor: dadosAnalyticos.credito_total, cor: '#8b5cf6' }
  ].filter(item => item.valor > 0)

  // Dados para gráfico de pizza - Despesas por Categoria
  const dadosDespesas = [
    { nome: 'Marketing', valor: dadosAnalyticos.despesas_marketing, cor: '#ef4444' },
    { nome: 'Operacional', valor: dadosAnalyticos.despesas_operacionais, cor: '#f97316' },
    { nome: 'Pessoal', valor: dadosAnalyticos.despesas_pessoal, cor: '#ec4899' }
  ].filter(item => item.valor > 0)

  // Calcular percentuais para formas de pagamento
  const totalFormasPagamento = dadosFormasPagamento.reduce((acc, item) => acc + item.valor, 0)
  const formasPagamentoComPercent = dadosFormasPagamento.map(item => ({
    ...item,
    percentual: totalFormasPagamento > 0 ? (item.valor / totalFormasPagamento * 100) : 0
  }))

  // Calcular percentuais para despesas
  const totalDespesas = dadosDespesas.reduce((acc, item) => acc + item.valor, 0)
  const despesasComPercent = dadosDespesas.map(item => ({
    ...item,
    percentual: totalDespesas > 0 ? (item.valor / totalDespesas * 100) : 0
  }))

  // Dados para evolução temporal
  const dadosEvoluacao = dadosAnalyticos.historico_mensal.slice(0, 6).reverse()

  return (
    <div className="space-y-6">
      {/* Controles de Filtro */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <Select value={periodoAnalise} onValueChange={setPeriodoAnalise}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">Mês Atual</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="semestre">Semestre</SelectItem>
              <SelectItem value="ano">Ano Completo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={tipoGrafico} onValueChange={setTipoGrafico}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visao_geral">Visão Geral</SelectItem>
              <SelectItem value="formas_pagamento">Formas de Pagamento</SelectItem>
              <SelectItem value="despesas">Análise de Despesas</SelectItem>
              <SelectItem value="evolucao">Evolução Temporal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Visão Geral */}
      {tipoGrafico === 'visao_geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumo Financeiro */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Resumo Financeiro - {motorName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800">
                  <div>
                    <p className="text-sm text-slate-400">Faturamento Total</p>
                    <p className="text-lg font-bold text-green-400">
                      {formatCurrency(dadosAnalyticos.faturamento_total)}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800">
                  <div>
                    <p className="text-sm text-slate-400">Custos Totais</p>
                    <p className="text-lg font-bold text-red-400">
                      {formatCurrency(dadosAnalyticos.custos_total)}
                    </p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-red-400" />
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800 border-l-4 border-blue-500">
                  <div>
                    <p className="text-sm text-slate-400">Lucro Líquido</p>
                    <p className={`text-xl font-bold ${dadosAnalyticos.lucro_total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(dadosAnalyticos.lucro_total)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Margem: {formatPercent(dadosAnalyticos.margem_lucro_percent)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indicadores de Performance */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Indicadores de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Eficiência Financeira</span>
                    <Badge variant={dadosAnalyticos.margem_lucro_percent > 20 ? 'default' : 'secondary'}>
                      {dadosAnalyticos.margem_lucro_percent > 20 ? 'Excelente' :
                       dadosAnalyticos.margem_lucro_percent > 10 ? 'Bom' : 'Atenção'}
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(Math.max(dadosAnalyticos.margem_lucro_percent, 0), 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatPercent(dadosAnalyticos.margem_lucro_percent)} de margem de lucro
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Volume de Negócios</span>
                    <Badge variant="outline">
                      {dadosAnalyticos.faturamento_total > 50000 ? 'Alto' :
                       dadosAnalyticos.faturamento_total > 20000 ? 'Médio' : 'Inicial'}
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {formatCurrency(dadosAnalyticos.faturamento_total)}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Controle de Custos</span>
                    <Badge variant={dadosAnalyticos.custos_total < dadosAnalyticos.faturamento_total * 0.7 ? 'default' : 'destructive'}>
                      {dadosAnalyticos.custos_total < dadosAnalyticos.faturamento_total * 0.7 ? 'Controlado' : 'Alto'}
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {formatCurrency(dadosAnalyticos.custos_total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formas de Pagamento */}
      {tipoGrafico === 'formas_pagamento' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Análise de Formas de Pagamento - {motorName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formasPagamentoComPercent.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-400">Nenhum dado de pagamento disponível</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Simulação de Gráfico de Pizza */}
                <div className="relative h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {formatCurrency(totalFormasPagamento)}
                    </div>
                    <p className="text-slate-400 text-sm">Total Recebido</p>
                  </div>
                </div>

                {/* Legenda e Dados */}
                <div className="space-y-4">
                  {formasPagamentoComPercent.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.cor }}
                        />
                        <span className="font-medium text-white">{item.nome}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {formatCurrency(item.valor)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatPercent(item.percentual)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Análise de Despesas */}
      {tipoGrafico === 'despesas' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análise de Despesas por Categoria - {motorName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {despesasComPercent.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-400">Nenhuma despesa registrada</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Total de Despesas */}
                <div className="text-center p-4 rounded-lg bg-slate-800 border">
                  <p className="text-slate-400 text-sm">Total de Despesas</p>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(totalDespesas)}
                  </p>
                </div>

                {/* Barras de Despesas */}
                <div className="space-y-4">
                  {despesasComPercent.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">{item.nome}</span>
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            {formatCurrency(item.valor)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatPercent(item.percentual)}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: item.cor,
                            width: `${item.percentual}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evolução Temporal */}
      {tipoGrafico === 'evolucao' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Evolução Temporal - {motorName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosEvoluacao.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-400">Sem dados históricos suficientes</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Resumo da Tendência */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-slate-800">
                    <p className="text-slate-400 text-sm">Melhor Mês</p>
                    <p className="text-lg font-bold text-green-400">
                      {dadosEvoluacao.reduce((max, item) =>
                        item.saldo_liquido > max.saldo_liquido ? item : max, dadosEvoluacao[0]
                      )?.mes_ano || 'N/A'}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800">
                    <p className="text-slate-400 text-sm">Tendência</p>
                    <p className="text-lg font-bold text-blue-400">
                      {dadosEvoluacao[dadosEvoluacao.length - 1]?.saldo_liquido > dadosEvoluacao[0]?.saldo_liquido
                        ? 'Crescimento' : 'Declínio'}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-800">
                    <p className="text-slate-400 text-sm">Média Mensal</p>
                    <p className="text-lg font-bold text-purple-400">
                      {formatCurrency(
                        dadosEvoluacao.reduce((acc, item) => acc + item.saldo_liquido, 0) / dadosEvoluacao.length
                      )}
                    </p>
                  </div>
                </div>

                {/* Dados Mensais */}
                <div className="space-y-3">
                  {dadosEvoluacao.map((item, index) => (
                    <div key={index} className="p-4 rounded-lg bg-slate-800">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">{item.mes_ano}</p>
                          <p className="text-sm text-slate-400">
                            {item.total_movimentacoes} movimentações
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-green-400 text-sm">
                            +{formatCurrency(item.total_entradas)}
                          </p>
                          <p className="text-red-400 text-sm">
                            -{formatCurrency(item.total_saidas)}
                          </p>
                          <p className={`font-bold ${item.saldo_liquido >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(item.saldo_liquido)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}