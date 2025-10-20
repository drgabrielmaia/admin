'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Edit,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react'

interface MovimentacaoFinanceira {
  id: string
  conta_id: string
  tipo: 'entrada' | 'saida'
  categoria: string
  subcategoria?: string
  descricao?: string
  valor: number
  data_movimento: string
  metodo_pagamento?: string
  negocio?: 'clinica' | 'mentoria' | 'infoproduto' | 'saas' | 'fisico' | 'evento' | 'parceria' | 'real-estate'
  status: 'pendente' | 'realizado' | 'cancelado'
  conta_nome?: string
}

interface ContaBancaria {
  id: string
  nome: string
  tipo: 'conta_corrente' | 'conta_poupanca' | 'carteira_digital' | 'caixa_fisico'
  banco?: string
  saldo_atual: number
  ativo: boolean
}

export default function BPOFinanceiroPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Estados para dados
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoFinanceira[]>([])
  const [saldoTotal, setSaldoTotal] = useState(0)
  const [entradasMes, setEntradasMes] = useState(0)
  const [saidasMes, setSaidasMes] = useState(0)
  const [comissoesIndicacoesMes, setComissoesIndicacoesMes] = useState(0)
  const [custosVendasMes, setCustosVendasMes] = useState(0)
  const [faturamentoVendasMes, setFaturamentoVendasMes] = useState(0)
  
  // Estados para formulários
  const [showFormMovimentacao, setShowFormMovimentacao] = useState(false)
  const [showFormConta, setShowFormConta] = useState(false)
  const [editingItem, setEditingItem] = useState<MovimentacaoFinanceira | ContaBancaria | null>(null)
  
  // Formulários
  const [formMovimentacao, setFormMovimentacao] = useState({
    conta_id: '',
    tipo: 'entrada' as 'entrada' | 'saida',
    categoria: '',
    subcategoria: '',
    descricao: '',
    valor: '',
    data_movimento: new Date().toISOString().split('T')[0],
    metodo_pagamento: 'pix',
    negocio: 'mentoria' as 'clinica' | 'mentoria' | 'infoproduto' | 'saas' | 'fisico' | 'evento' | 'parceria' | 'real-estate'
  })
  
  const [formConta, setFormConta] = useState({
    nome: '',
    tipo: 'conta_corrente' as ContaBancaria['tipo'],
    banco: '',
    saldo_atual: ''
  })

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadContas(),
        loadMovimentacoes()
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.funcao === 'admin') {
      loadAllData()
    }
  }, [user, loadAllData])

  const loadContas = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setContas(data || [])
      
      // Calcular saldo total
      const total = data?.reduce((sum, conta) => sum + conta.saldo_atual, 0) || 0
      setSaldoTotal(total)
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    }
  }

  const loadMovimentacoes = async () => {
    try {
      // Carregar movimentações manuais
      const { data: movData, error: movError } = await supabase
        .from('movimentacoes_financeiras')
        .select(`
          *,
          contas_bancarias:conta_id(nome)
        `)
        .order('data_movimento', { ascending: false })
        .limit(100)

      if (movError) throw movError
      
      const movimentacoesFormatted = movData?.map(mov => ({
        ...mov,
        conta_nome: mov.contas_bancarias?.nome || 'N/A'
      })) || []
      
      setMovimentacoes(movimentacoesFormatted)
      
      // Carregar TODAS as vendas aprovadas de TODOS os motores
      const { data: vendasData, error: vendasError } = await supabase
        .from('chamadas')
        .select(`
          valor,
          status_aprovacao,
          created_at,
          produtos!inner(id, nome, tipo, preco, custo)
        `)
        .eq('resultado', 'venda')
        .eq('status_aprovacao', 'aprovada')

      if (vendasError) throw vendasError
      
      // Calcular faturamento e custos do mês atual
      const mesAtual = new Date().toISOString().slice(0, 7) // YYYY-MM
      
      // Vendas do mês (FATURAMENTO REAL de todos os motores)
      const vendasMesAtual = vendasData?.filter(venda => 
        venda.created_at.startsWith(mesAtual)
      ) || []
      
      const faturamentoVendas = vendasMesAtual.reduce((sum, venda) => sum + (venda.valor || 0), 0)
      const custosVendas = vendasMesAtual.reduce((sum, venda) => {
        const produto = venda.produtos as {custo?: number} | null
        return sum + (produto?.custo || 0)
      }, 0)
      
      // ============================================================================
      // CARREGAR COMISSÕES DE INDICAÇÕES DO MÊS
      // ============================================================================
      const { data: comissoesData, error: comissoesError } = await supabase
        .from('comissoes')
        .select('comissao_sdr, comissao_closer, data_venda')
        .eq('status', 'pendente')
      
      if (comissoesError) throw comissoesError
      
      // Filtrar comissões do mês atual
      const comissoesMesAtual = comissoesData?.filter(comissao => 
        comissao.data_venda.startsWith(mesAtual)
      ) || []
      
      const totalComissoesIndicacoes = comissoesMesAtual.reduce((sum, comissao) => 
        sum + (comissao.comissao_sdr || 0) + (comissao.comissao_closer || 0), 0
      )
      
      // Movimentações manuais do mês
      const movMesAtual = movimentacoesFormatted.filter(mov => 
        mov.data_movimento.startsWith(mesAtual) && mov.status === 'realizado'
      )
      
      const entradasExtras = movMesAtual
        .filter(mov => mov.tipo === 'entrada')
        .reduce((sum, mov) => sum + mov.valor, 0)
      
      const saidasExtras = movMesAtual
        .filter(mov => mov.tipo === 'saida')
        .reduce((sum, mov) => sum + mov.valor, 0)
      
      // TOTAIS CONSOLIDADOS (Faturamento real + movimentações)
      const totalEntradas = faturamentoVendas + entradasExtras
      // INCLUIR COMISSÕES DE INDICAÇÕES NAS SAÍDAS
      const totalSaidas = custosVendas + saidasExtras + totalComissoesIndicacoes
      
      // Armazenar valores detalhados
      setFaturamentoVendasMes(faturamentoVendas)
      setCustosVendasMes(custosVendas)
      setComissoesIndicacoesMes(totalComissoesIndicacoes)
      setEntradasMes(totalEntradas)
      setSaidasMes(totalSaidas)
      
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
    }
  }

  const handleSubmitMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formMovimentacao.conta_id || !formMovimentacao.valor) return

    try {
      const payload = {
        ...formMovimentacao,
        valor: parseFloat(formMovimentacao.valor),
        status: 'realizado'
      }

      if (editingItem) {
        const { error } = await supabase
          .from('movimentacoes_financeiras')
          .update(payload)
          .eq('id', editingItem.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('movimentacoes_financeiras')
          .insert(payload)
        
        if (error) throw error
      }

      // Resetar formulário
      setFormMovimentacao({
        conta_id: '',
        tipo: 'entrada',
        categoria: '',
        subcategoria: '',
        descricao: '',
        valor: '',
        data_movimento: new Date().toISOString().split('T')[0],
        metodo_pagamento: 'pix',
        negocio: 'mentoria'
      })
      setShowFormMovimentacao(false)
      setEditingItem(null)
      
      // Recarregar dados
      await loadAllData()
      
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error)
      alert('Erro ao salvar movimentação')
    }
  }

  const handleSubmitConta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formConta.nome || !formConta.saldo_atual) return

    try {
      const payload = {
        ...formConta,
        saldo_atual: parseFloat(formConta.saldo_atual),
        ativo: true
      }

      if (editingItem) {
        const { error } = await supabase
          .from('contas_bancarias')
          .update(payload)
          .eq('id', editingItem.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('contas_bancarias')
          .insert(payload)
        
        if (error) throw error
      }

      // Resetar formulário
      setFormConta({
        nome: '',
        tipo: 'conta_corrente',
        banco: '',
        saldo_atual: ''
      })
      setShowFormConta(false)
      setEditingItem(null)
      
      // Recarregar dados
      await loadContas()
      
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
      alert('Erro ao salvar conta bancária')
    }
  }

  const handleDeleteMovimentacao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return

    try {
      const { error } = await supabase
        .from('movimentacoes_financeiras')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadMovimentacoes()
    } catch (error) {
      console.error('Erro ao deletar movimentação:', error)
    }
  }

  const handleEditMovimentacao = (mov: MovimentacaoFinanceira) => {
    setEditingItem(mov)
    setFormMovimentacao({
      conta_id: mov.conta_id,
      tipo: mov.tipo,
      categoria: mov.categoria,
      subcategoria: mov.subcategoria || '',
      descricao: mov.descricao || '',
      valor: mov.valor.toString(),
      data_movimento: mov.data_movimento,
      metodo_pagamento: mov.metodo_pagamento || 'pix',
      negocio: mov.negocio || 'mentoria'
    })
    setShowFormMovimentacao(true)
  }

  const handleEditConta = (conta: ContaBancaria) => {
    setEditingItem(conta)
    setFormConta({
      nome: conta.nome,
      tipo: conta.tipo,
      banco: conta.banco || '',
      saldo_atual: conta.saldo_atual.toString()
    })
    setShowFormConta(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (user?.funcao !== 'admin') {
    return (
      <DashboardLayout title="BPO Financeiro">
        <div className="text-center text-slate-400">
          Acesso restrito para administradores
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout title="BPO Financeiro">
        <div className="text-center text-slate-400">Carregando...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="BPO Financeiro">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">BPO Financeiro</h2>
            <p className="text-slate-400">Gestão financeira completa</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="contas">Contas Bancárias</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Saldo Total</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(saldoTotal)}
                      </p>
                    </div>
                    <PiggyBank className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Entradas Mês</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatCurrency(entradasMes)}
                      </p>
                    </div>
                    <ArrowUpCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Saídas Mês</p>
                      <p className="text-2xl font-bold text-red-400">
                        {formatCurrency(saidasMes)}
                      </p>
                    </div>
                    <ArrowDownCircle className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Saldo Mês</p>
                      <p className={`text-2xl font-bold ${entradasMes - saidasMes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(entradasMes - saidasMes)}
                      </p>
                    </div>
                    {entradasMes - saidasMes >= 0 ? 
                      <TrendingUp className="h-8 w-8 text-green-400" /> :
                      <TrendingDown className="h-8 w-8 text-red-400" />
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção de Detalhamento Financeiro */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>💰 Detalhamento Financeiro do Mês</CardTitle>
                <p className="text-slate-400 text-sm">Veja exatamente onde foi seu lucro</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ENTRADAS */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-400 flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4" />
                      ENTRADAS
                    </h4>
                    <div className="space-y-2 pl-6">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Faturamento Vendas:</span>
                        <span className="text-green-400 font-medium">{formatCurrency(faturamentoVendasMes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Outras Entradas:</span>
                        <span className="text-green-400 font-medium">{formatCurrency(entradasMes - faturamentoVendasMes)}</span>
                      </div>
                      <div className="border-t border-slate-700 pt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-white">TOTAL ENTRADAS:</span>
                          <span className="text-green-400">{formatCurrency(entradasMes)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SAÍDAS */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-400 flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4" />
                      SAÍDAS
                    </h4>
                    <div className="space-y-2 pl-6">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Custos dos Produtos:</span>
                        <span className="text-red-400 font-medium">{formatCurrency(custosVendasMes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">🎯 Comissões Indicações:</span>
                        <span className="text-orange-400 font-medium">{formatCurrency(comissoesIndicacoesMes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Outras Saídas:</span>
                        <span className="text-red-400 font-medium">{formatCurrency(saidasMes - custosVendasMes - comissoesIndicacoesMes)}</span>
                      </div>
                      <div className="border-t border-slate-700 pt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-white">TOTAL SAÍDAS:</span>
                          <span className="text-red-400">{formatCurrency(saidasMes)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RESULTADO FINAL */}
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-slate-800">
                    <span className="text-xl font-bold text-white">LUCRO LÍQUIDO DO MÊS:</span>
                    <span className={`text-2xl font-bold ${entradasMes - saidasMes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(entradasMes - saidasMes)}
                    </span>
                  </div>
                  {comissoesIndicacoesMes > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-orange-900/20 border border-orange-700/30">
                      <p className="text-orange-300 text-sm">
                        ⚠️ <strong>{formatCurrency(comissoesIndicacoesMes)}</strong> foram para comissões de indicações este mês
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Contas Bancárias</CardTitle>
                </CardHeader>
                <CardContent>
                  {contas.length === 0 ? (
                    <p className="text-slate-400">Nenhuma conta cadastrada</p>
                  ) : (
                    <div className="space-y-3">
                      {contas.map((conta) => (
                        <div key={conta.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-800">
                          <div>
                            <p className="font-medium text-white">{conta.nome}</p>
                            <p className="text-sm text-slate-400">{conta.banco}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">{formatCurrency(conta.saldo_atual)}</p>
                            <Badge variant="secondary">{conta.tipo.replace('_', ' ')}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Últimas Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                  {movimentacoes.slice(0, 5).map((mov) => (
                    <div key={mov.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-800 mb-2">
                      <div className="flex items-center space-x-3">
                        {mov.tipo === 'entrada' ? 
                          <ArrowUpCircle className="h-4 w-4 text-green-400" /> :
                          <ArrowDownCircle className="h-4 w-4 text-red-400" />
                        }
                        <div>
                          <p className="font-medium text-white">{mov.categoria}</p>
                          <p className="text-sm text-slate-400">{formatDate(mov.data_movimento)}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${mov.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{formatCurrency(mov.valor)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Movimentações */}
          <TabsContent value="movimentacoes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Movimentações Financeiras</h3>
              <Button 
                onClick={() => {
                  setEditingItem(null)
                  setShowFormMovimentacao(!showFormMovimentacao)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </div>

            {showFormMovimentacao && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>{editingItem ? 'Editar' : 'Nova'} Movimentação</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitMovimentacao} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="conta_id">Conta *</Label>
                      <Select value={formMovimentacao.conta_id} onValueChange={(value) => setFormMovimentacao({...formMovimentacao, conta_id: value})}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                        <SelectContent>
                          {contas.map((conta) => (
                            <SelectItem key={conta.id} value={conta.id}>{conta.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select value={formMovimentacao.tipo} onValueChange={(value: 'entrada' | 'saida') => setFormMovimentacao({...formMovimentacao, tipo: value})}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="valor">Valor *</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={formMovimentacao.valor}
                        onChange={(e) => setFormMovimentacao({...formMovimentacao, valor: e.target.value})}
                        className="bg-slate-800 border-slate-700"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Input
                        id="categoria"
                        value={formMovimentacao.categoria}
                        onChange={(e) => setFormMovimentacao({...formMovimentacao, categoria: e.target.value})}
                        className="bg-slate-800 border-slate-700"
                        placeholder="Ex: Receita de Vendas"
                      />
                    </div>

                    <div>
                      <Label htmlFor="data_movimento">Data *</Label>
                      <Input
                        id="data_movimento"
                        type="date"
                        value={formMovimentacao.data_movimento}
                        onChange={(e) => setFormMovimentacao({...formMovimentacao, data_movimento: e.target.value})}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>

                    <div>
                      <Label htmlFor="negocio">Negócio</Label>
                      <Select value={formMovimentacao.negocio} onValueChange={(value: 'clinica' | 'mentoria' | 'infoproduto' | 'saas' | 'fisico' | 'evento' | 'parceria' | 'real-estate') => setFormMovimentacao({...formMovimentacao, negocio: value})}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mentoria">🎯 Mentoria</SelectItem>
                          <SelectItem value="infoproduto">💻 Infoproduto</SelectItem>
                          <SelectItem value="saas">☁️ SaaS</SelectItem>
                          <SelectItem value="fisico">📦 Produto Físico</SelectItem>
                          <SelectItem value="evento">🎪 Evento</SelectItem>
                          <SelectItem value="clinica">🏥 Clínica</SelectItem>
                          <SelectItem value="parceria">🤝 Parceria</SelectItem>
                          <SelectItem value="real-estate">🏠 Real Estate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-3">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={formMovimentacao.descricao}
                        onChange={(e) => setFormMovimentacao({...formMovimentacao, descricao: e.target.value})}
                        className="bg-slate-800 border-slate-700"
                        placeholder="Descrição adicional..."
                      />
                    </div>

                    <div className="md:col-span-3 flex gap-2">
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {editingItem ? 'Atualizar' : 'Cadastrar'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowFormMovimentacao(false)
                          setEditingItem(null)
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {movimentacoes.map((mov) => (
                    <div key={mov.id} className="flex justify-between items-center p-4 rounded-lg bg-slate-800">
                      <div className="flex items-center space-x-4">
                        {mov.tipo === 'entrada' ? 
                          <ArrowUpCircle className="h-5 w-5 text-green-400" /> :
                          <ArrowDownCircle className="h-5 w-5 text-red-400" />
                        }
                        <div>
                          <p className="font-medium text-white">{mov.categoria}</p>
                          <p className="text-sm text-slate-400">
                            {mov.conta_nome} • {formatDate(mov.data_movimento)}
                            {mov.negocio && <span> • {mov.negocio}</span>}
                          </p>
                          {mov.descricao && <p className="text-sm text-slate-500">{mov.descricao}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className={`font-semibold ${mov.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                            {mov.tipo === 'entrada' ? '+' : '-'}{formatCurrency(mov.valor)}
                          </p>
                          <Badge variant={mov.status === 'realizado' ? 'default' : 'secondary'}>
                            {mov.status}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditMovimentacao(mov)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMovimentacao(mov.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contas Bancárias */}
          <TabsContent value="contas" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Contas Bancárias</h3>
              <Button 
                onClick={() => {
                  setEditingItem(null)
                  setShowFormConta(!showFormConta)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </div>

            {showFormConta && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>{editingItem ? 'Editar' : 'Nova'} Conta Bancária</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitConta} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome da Conta *</Label>
                      <Input
                        id="nome"
                        value={formConta.nome}
                        onChange={(e) => setFormConta({...formConta, nome: e.target.value})}
                        className="bg-slate-800 border-slate-700"
                        placeholder="Ex: Conta Itaú"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select value={formConta.tipo} onValueChange={(value: ContaBancaria['tipo']) => setFormConta({...formConta, tipo: value})}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                          <SelectItem value="conta_poupanca">Conta Poupança</SelectItem>
                          <SelectItem value="carteira_digital">Carteira Digital</SelectItem>
                          <SelectItem value="caixa_fisico">Caixa Físico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="banco">Banco</Label>
                      <Input
                        id="banco"
                        value={formConta.banco}
                        onChange={(e) => setFormConta({...formConta, banco: e.target.value})}
                        className="bg-slate-800 border-slate-700"
                        placeholder="Ex: Banco Itaú"
                      />
                    </div>

                    <div>
                      <Label htmlFor="saldo_atual">Saldo Atual *</Label>
                      <Input
                        id="saldo_atual"
                        type="number"
                        step="0.01"
                        value={formConta.saldo_atual}
                        onChange={(e) => setFormConta({...formConta, saldo_atual: e.target.value})}
                        className="bg-slate-800 border-slate-700"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        {editingItem ? 'Atualizar' : 'Cadastrar'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowFormConta(false)
                          setEditingItem(null)
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contas.map((conta) => (
                <Card key={conta.id} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-white">{conta.nome}</h4>
                        <p className="text-sm text-slate-400">{conta.banco}</p>
                        <Badge variant="secondary" className="mt-2">
                          {conta.tipo.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditConta(conta)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400">Saldo</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(conta.saldo_atual)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="relatorios" className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Relatórios Financeiros</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Resumo por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">Em desenvolvimento...</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Fluxo de Caixa</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">Em desenvolvimento...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}