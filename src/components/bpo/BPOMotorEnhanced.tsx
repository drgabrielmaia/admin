'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { BPOCharts } from './BPOCharts'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Calendar,
  CreditCard,
  PieChart,
  Filter,
  Download
} from 'lucide-react'

interface BPOMotorProps {
  motorType: 'mentoria' | 'infoproduto' | 'saas' | 'fisico' | 'parceria' | 'clinica' | 'evento' | 'real-estate' | 'sdr' | 'closer'
  motorName: string
  motorColor: string
  showFormExternal?: boolean
  onFormToggle?: (show: boolean) => void
  hideInternalButton?: boolean
}

interface MovimentacaoBPO {
  id: string
  tipo: 'entrada' | 'saida'
  categoria: string
  subcategoria?: string
  valor: number
  data_movimento: string
  descricao?: string
  conta_nome?: string
  forma_pagamento?: 'pix' | 'debito' | 'credito' | 'transferencia' | 'dinheiro' | 'boleto' | 'outros'
  tipo_gestao?: 'bruto' | 'pessoal' | 'aluguel' | 'operacional' | 'marketing' | 'vendas' | 'administrativo'
  status?: 'pendente' | 'realizado' | 'cancelado'
  tags?: string[]
}

interface DadosAnalyticos {
  faturamento_total: number
  custos_total: number
  lucro_total: number
  margem_lucro_percent: number
  pix_total: number
  debito_total: number
  credito_total: number
  despesas_marketing: number
  despesas_operacionais: number
  despesas_pessoal: number
  historico_mensal: any[]
}

export function BPOMotorEnhanced({
  motorType,
  motorName,
  motorColor,
  showFormExternal = false,
  onFormToggle,
  hideInternalButton = false
}: BPOMotorProps) {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoBPO[]>([])
  const [contas, setContas] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Métricas calculadas (versão enhanced)
  const [dadosAnalyticos, setDadosAnalyticos] = useState<DadosAnalyticos>({
    faturamento_total: 0,
    custos_total: 0,
    lucro_total: 0,
    margem_lucro_percent: 0,
    pix_total: 0,
    debito_total: 0,
    credito_total: 0,
    despesas_marketing: 0,
    despesas_operacionais: 0,
    despesas_pessoal: 0,
    historico_mensal: []
  })

  // Filtros
  const [filtros, setFiltros] = useState({
    periodo: 'mes_atual',
    forma_pagamento: 'todos',
    categoria: 'todas',
    tipo_gestao: 'todos'
  })

  // Estado para período selecionado e dados agrupados
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'diario' | 'semanal' | 'mensal' | 'anual'>('mensal')
  const [dadosAgrupados, setDadosAgrupados] = useState<any[]>([])

  // Formulário Enhanced
  const [formData, setFormData] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    categoria: '',
    subcategoria: '',
    valor: '',
    data_movimento: new Date().toISOString().split('T')[0],
    descricao: '',
    conta_id: '',
    metodo_pagamento: 'pix' as 'pix' | 'debito' | 'credito' | 'transferencia' | 'dinheiro' | 'boleto' | 'outros',
    tipo_gestao: 'bruto' as 'bruto' | 'pessoal' | 'aluguel' | 'operacional' | 'marketing' | 'vendas' | 'administrativo',
    tags: [] as string[]
  })

  useEffect(() => {
    loadData()
  }, [motorType, filtros])

  useEffect(() => {
    if (movimentacoes.length > 0) {
      agruparDadosPorPeriodo()
    }
  }, [movimentacoes, periodoSelecionado])

  useEffect(() => {
    if (showFormExternal !== undefined) {
      setShowForm(showFormExternal)
    }
  }, [showFormExternal])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadMovimentacoes(),
        loadContas(),
        loadCategorias(),
        loadDadosAnalyticos()
      ])
    } finally {
      setLoading(false)
    }
  }

  const agruparDadosPorPeriodo = () => {
    const movimentacoesOrdenadas = [...movimentacoes].sort((a, b) =>
      new Date(b.data_movimento).getTime() - new Date(a.data_movimento).getTime()
    )

    const agrupamento: { [key: string]: any } = {}

    movimentacoesOrdenadas.forEach((mov) => {
      const data = new Date(mov.data_movimento)
      let chave = ''

      switch (periodoSelecionado) {
        case 'diario':
          chave = data.toISOString().split('T')[0] // YYYY-MM-DD
          break
        case 'semanal':
          const inicioSemana = new Date(data)
          inicioSemana.setDate(data.getDate() - data.getDay()) // Domingo da semana
          chave = inicioSemana.toISOString().split('T')[0]
          break
        case 'mensal':
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
          break
        case 'anual':
          chave = data.getFullYear().toString() // YYYY
          break
      }

      if (!agrupamento[chave]) {
        agrupamento[chave] = {
          periodo: chave,
          total_entradas: 0,
          total_saidas: 0,
          total_movimentacoes: 0,
          movimentacoes: [],
          faturamento: 0,
          custos: 0,
          lucro: 0,
          margem_lucro: 0
        }
      }

      agrupamento[chave].total_movimentacoes++
      agrupamento[chave].movimentacoes.push(mov)

      if (mov.tipo === 'entrada') {
        agrupamento[chave].total_entradas += mov.valor
        agrupamento[chave].faturamento += mov.valor
      } else {
        agrupamento[chave].total_saidas += mov.valor
        agrupamento[chave].custos += mov.valor
      }

      agrupamento[chave].lucro = agrupamento[chave].faturamento - agrupamento[chave].custos
      agrupamento[chave].margem_lucro = agrupamento[chave].faturamento > 0
        ? (agrupamento[chave].lucro / agrupamento[chave].faturamento) * 100
        : 0
    })

    const dadosOrdenados = Object.values(agrupamento).sort((a: any, b: any) =>
      b.periodo.localeCompare(a.periodo)
    )

    setDadosAgrupados(dadosOrdenados)
  }

  const loadContas = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setContas(data || [])
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    }
  }

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('bpo_categorias')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const getBusinessType = () => {
    switch (motorType) {
      case 'mentoria':
        return 'mentoria'
      case 'infoproduto':
        return 'infoproduto'
      case 'saas':
        return 'saas'
      case 'fisico':
        return 'fisico'
      case 'parceria':
        return 'parceria'
      case 'evento':
        return 'evento'
      case 'clinica':
        return 'clinica'
      case 'real-estate':
        return 'real-estate'
      case 'sdr':
      case 'closer':
        return 'mentoria' // SDR e Closer usam mentoria como padrão
      default:
        return 'mentoria'
    }
  }

  const loadDadosAnalyticos = async () => {
    try {
      const businessType = getBusinessType()

      // PUXAR DADOS REAIS DO BANCO DE DADOS - SEM MOCK
      console.log('🔄 Carregando dados REAIS do banco para:', businessType)

      // 1. FATURAMENTO REAL das movimentações
      const { data: movimentacoes, error: movError } = await supabase
        .from('movimentacoes_financeiras')
        .select('*')
        .eq('negocio', businessType)
        .eq('status', 'realizado')

      let faturamento_real = 0
      let custos_real = 0
      let pix_total = 0
      let debito_total = 0
      let credito_total = 0
      let despesas_marketing = 0
      let despesas_operacionais = 0
      let despesas_pessoal = 0

      if (movimentacoes && movimentacoes.length > 0) {
        console.log(`📊 Encontradas ${movimentacoes.length} movimentações reais`)

        movimentacoes.forEach(mov => {
          if (mov.tipo === 'entrada') {
            faturamento_real += mov.valor

            // Separar por forma de pagamento (usando metodo_pagamento da tabela)
            if (mov.metodo_pagamento === 'pix') pix_total += mov.valor
            else if (mov.metodo_pagamento === 'debito') debito_total += mov.valor
            else if (mov.metodo_pagamento === 'credito') credito_total += mov.valor
          } else {
            custos_real += mov.valor

            // Separar despesas por categoria (usando categoria da tabela)
            if (mov.categoria.toLowerCase().includes('marketing')) despesas_marketing += mov.valor
            else if (mov.categoria.toLowerCase().includes('operacional') || mov.categoria.toLowerCase().includes('hospedagem') || mov.categoria.toLowerCase().includes('plataforma')) despesas_operacionais += mov.valor
            else if (mov.categoria.toLowerCase().includes('pessoal') || mov.categoria.toLowerCase().includes('treinamento')) despesas_pessoal += mov.valor
          }
        })
      }

      // 2. VENDAS REAIS do sistema (chamadas aprovadas)
      const { data: vendas, error: vendasError } = await supabase
        .from('chamadas')
        .select('valor, data_chamada')
        .eq('resultado', 'venda')
        .eq('status_aprovacao', 'aprovada')

      let faturamento_vendas = 0
      if (vendas && vendas.length > 0) {
        console.log(`💰 Encontradas ${vendas.length} vendas aprovadas`)
        faturamento_vendas = vendas.reduce((acc, venda) => acc + (venda.valor || 0), 0)
      }

      // 3. CÁLCULOS FINAIS REAIS
      const faturamento_total = faturamento_real + faturamento_vendas
      const lucro_total = faturamento_total - custos_real
      const margem_lucro_percent = faturamento_total > 0 ? ((lucro_total / faturamento_total) * 100) : 0

      // 4. HISTÓRICO REAL
      const { data: historico, error: histError } = await supabase
        .from('movimentacoes_financeiras')
        .select('data_movimento, tipo, valor')
        .eq('negocio', businessType)
        .order('data_movimento', { ascending: false })

      let historico_processado = []
      if (historico && historico.length > 0) {
        // Agrupar por mês
        const groupedByMonth = historico.reduce((acc, mov) => {
          const month = mov.data_movimento.substring(0, 7) // YYYY-MM
          if (!acc[month]) {
            acc[month] = {
              mes_ano: month,
              total_entradas: 0,
              total_saidas: 0,
              total_movimentacoes: 0
            }
          }

          acc[month].total_movimentacoes++
          if (mov.tipo === 'entrada') {
            acc[month].total_entradas += mov.valor
          } else {
            acc[month].total_saidas += mov.valor
          }
          acc[month].saldo_liquido = acc[month].total_entradas - acc[month].total_saidas

          return acc
        }, {})

        historico_processado = Object.values(groupedByMonth).slice(0, 12)
      }

      const dadosReais = {
        faturamento_total,
        custos_total: custos_real,
        lucro_total,
        margem_lucro_percent,
        pix_total,
        debito_total,
        credito_total,
        despesas_marketing,
        despesas_operacionais,
        despesas_pessoal,
        historico_mensal: historico_processado
      }

      console.log('📈 Dados REAIS carregados:', dadosReais)
      setDadosAnalyticos(dadosReais)

    } catch (error) {
      console.error('Erro ao carregar dados REAIS:', error)

      // Em caso de erro, zerar tudo - SEM DADOS FALSOS
      setDadosAnalyticos({
        faturamento_total: 0,
        custos_total: 0,
        lucro_total: 0,
        margem_lucro_percent: 0,
        pix_total: 0,
        debito_total: 0,
        credito_total: 0,
        despesas_marketing: 0,
        despesas_operacionais: 0,
        despesas_pessoal: 0,
        historico_mensal: []
      })
    }
  }

  const loadMovimentacoes = async () => {
    try {
      const businessType = getBusinessType()

      // Aplicar filtros de período
      let query = supabase
        .from('movimentacoes_financeiras')
        .select(`
          *,
          contas_bancarias:conta_id(nome)
        `)
        .eq('negocio', businessType)
        .order('data_movimento', { ascending: false })

      // Filtro de período
      if (filtros.periodo === 'mes_atual') {
        const inicioMes = new Date()
        inicioMes.setDate(1)
        query = query.gte('data_movimento', inicioMes.toISOString().split('T')[0])
      } else if (filtros.periodo === 'ultimo_mes') {
        const inicioMes = new Date()
        inicioMes.setMonth(inicioMes.getMonth() - 1)
        inicioMes.setDate(1)
        const fimMes = new Date()
        fimMes.setDate(1)
        query = query
          .gte('data_movimento', inicioMes.toISOString().split('T')[0])
          .lt('data_movimento', fimMes.toISOString().split('T')[0])
      }

      // Outros filtros
      if (filtros.forma_pagamento !== 'todos') {
        query = query.eq('metodo_pagamento', filtros.forma_pagamento)
      }
      if (filtros.tipo_gestao !== 'todos') {
        query = query.eq('tipo_gestao', filtros.tipo_gestao)
      }

      const { data: movimentacoesData, error: movError } = await query.limit(100)

      if (movError) throw movError

      const movimentacoesFormatted = movimentacoesData?.map(mov => ({
        ...mov,
        conta_nome: mov.contas_bancarias?.nome || 'N/A'
      })) || []

      setMovimentacoes(movimentacoesFormatted)

      // Não precisamos mais calcular aqui - os dados analíticos vêm de loadDadosAnalyticos()

    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.conta_id || !formData.valor || !formData.categoria) return

    try {
      const businessType = getBusinessType()
      const payload = {
        ...formData,
        valor: parseFloat(formData.valor),
        negocio: businessType,
        categoria: `${motorName} - ${formData.categoria}`,
        status: 'realizado',
        tags: formData.tags.length > 0 ? formData.tags : null
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
      setFormData({
        tipo: 'entrada',
        categoria: '',
        subcategoria: '',
        valor: '',
        data_movimento: new Date().toISOString().split('T')[0],
        descricao: '',
        conta_id: '',
        metodo_pagamento: 'pix',
        tipo_gestao: 'bruto',
        tags: []
      })
      setShowForm(false)
      setEditingItem(null)

      await loadData()

    } catch (error) {
      console.error('Erro ao salvar movimentação:', error)
      alert('Erro ao salvar movimentação')
    }
  }

  const handleDelete = async (id: string) => {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatPeriodo = (periodo: string, tipo: 'diario' | 'semanal' | 'mensal' | 'anual') => {
    switch (tipo) {
      case 'diario':
        return new Date(periodo).toLocaleDateString('pt-BR')
      case 'semanal':
        const data = new Date(periodo)
        const fimSemana = new Date(data)
        fimSemana.setDate(data.getDate() + 6)
        return `${data.toLocaleDateString('pt-BR')} - ${fimSemana.toLocaleDateString('pt-BR')}`
      case 'mensal':
        const [ano, mes] = periodo.split('-')
        const nomeMes = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric'
        })
        return nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)
      case 'anual':
        return periodo
      default:
        return periodo
    }
  }

  if (loading) {
    return <div className="text-center text-slate-400">Carregando BPO...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">BPO {motorName}</h3>
          <p className="text-slate-400 text-sm">Sistema de Gestão Financeira Completa</p>
        </div>
        <div className="flex gap-2">
          {!hideInternalButton && (
            <Button
              onClick={() => {
                setEditingItem(null)
                const newShowForm = !showForm
                setShowForm(newShowForm)
                if (onFormToggle) {
                  onFormToggle(newShowForm)
                }
              }}
              className={`bg-${motorColor}-600 hover:bg-${motorColor}-700`}
              style={{ backgroundColor: motorColor }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="dashboard" className="text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="movimentacoes" className="text-white">
            <DollarSign className="h-4 w-4 mr-2" />
            Movimentações
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-white">
            <PieChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Seletor de Período no Dashboard */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise por Período - {motorName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant={periodoSelecionado === 'diario' ? 'default' : 'outline'}
                  onClick={() => setPeriodoSelecionado('diario')}
                  className="w-full"
                  size="sm"
                >
                  Diário
                </Button>
                <Button
                  variant={periodoSelecionado === 'semanal' ? 'default' : 'outline'}
                  onClick={() => setPeriodoSelecionado('semanal')}
                  className="w-full"
                  size="sm"
                >
                  Semanal
                </Button>
                <Button
                  variant={periodoSelecionado === 'mensal' ? 'default' : 'outline'}
                  onClick={() => setPeriodoSelecionado('mensal')}
                  className="w-full"
                  size="sm"
                >
                  Mensal
                </Button>
                <Button
                  variant={periodoSelecionado === 'anual' ? 'default' : 'outline'}
                  onClick={() => setPeriodoSelecionado('anual')}
                  className="w-full"
                  size="sm"
                >
                  Anual
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Faturamento Total</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(dadosAnalyticos.faturamento_total)}
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
                    <p className="text-slate-400 text-sm">Custos Totais</p>
                    <p className="text-2xl font-bold text-red-400">
                      {formatCurrency(dadosAnalyticos.custos_total)}
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
                    <p className="text-slate-400 text-sm">Lucro Líquido</p>
                    <p className={`text-2xl font-bold ${dadosAnalyticos.lucro_total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(dadosAnalyticos.lucro_total)}
                    </p>
                  </div>
                  {dadosAnalyticos.lucro_total >= 0 ?
                    <TrendingUp className="h-8 w-8 text-green-400" /> :
                    <TrendingDown className="h-8 w-8 text-red-400" />
                  }
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Margem de Lucro</p>
                    <p className={`text-2xl font-bold ${dadosAnalyticos.margem_lucro_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {dadosAnalyticos.margem_lucro_percent.toFixed(1)}%
                    </p>
                  </div>
                  <PieChart className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formas de Pagamento */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Formas de Pagamento - {motorName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-slate-800">
                  <p className="text-slate-400 text-sm">PIX</p>
                  <p className="text-xl font-bold text-green-400">
                    {formatCurrency(dadosAnalyticos.pix_total)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800">
                  <p className="text-slate-400 text-sm">Cartão Débito</p>
                  <p className="text-xl font-bold text-blue-400">
                    {formatCurrency(dadosAnalyticos.debito_total)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800">
                  <p className="text-slate-400 text-sm">Cartão Crédito</p>
                  <p className="text-xl font-bold text-purple-400">
                    {formatCurrency(dadosAnalyticos.credito_total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorias de Despesas */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-slate-800">
                  <p className="text-slate-400 text-sm">Marketing</p>
                  <p className="text-xl font-bold text-orange-400">
                    {formatCurrency(dadosAnalyticos.despesas_marketing)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800">
                  <p className="text-slate-400 text-sm">Operacional</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {formatCurrency(dadosAnalyticos.despesas_operacionais)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-800">
                  <p className="text-slate-400 text-sm">Pessoal</p>
                  <p className="text-xl font-bold text-pink-400">
                    {formatCurrency(dadosAnalyticos.despesas_pessoal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movimentações Tab */}
        <TabsContent value="movimentacoes" className="space-y-6">
          {/* Filtros */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Pesquisa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Período</Label>
                  <Select value={filtros.periodo} onValueChange={(value) => setFiltros({...filtros, periodo: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mes_atual">Mês Atual</SelectItem>
                      <SelectItem value="ultimo_mes">Último Mês</SelectItem>
                      <SelectItem value="todos">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={filtros.forma_pagamento} onValueChange={(value) => setFiltros({...filtros, forma_pagamento: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="debito">Débito</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo Gerencial</Label>
                  <Select value={filtros.tipo_gestao} onValueChange={(value) => setFiltros({...filtros, tipo_gestao: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="bruto">Bruto</SelectItem>
                      <SelectItem value="pessoal">Pessoal</SelectItem>
                      <SelectItem value="aluguel">Aluguel</SelectItem>
                      <SelectItem value="operacional">Operacional</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={loadData} variant="outline" className="w-full">
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário Enhanced */}
          {showForm && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>{editingItem ? 'Editar' : 'Nova'} Movimentação - {motorName}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="conta_id">Conta *</Label>
                    <Select value={formData.conta_id} onValueChange={(value) => setFormData({...formData, conta_id: value})}>
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
                    <Select value={formData.tipo} onValueChange={(value: 'entrada' | 'saida') => setFormData({...formData, tipo: value})}>
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
                      value={formData.valor}
                      onChange={(e) => setFormData({...formData, valor: e.target.value})}
                      className="bg-slate-800 border-slate-700"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Selecione categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias
                          .filter(cat => cat.tipo === formData.tipo)
                          .map((categoria) => (
                            <SelectItem key={categoria.id} value={categoria.nome}>
                              {categoria.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="metodo_pagamento">Forma de Pagamento *</Label>
                    <Select value={formData.metodo_pagamento} onValueChange={(value: any) => setFormData({...formData, metodo_pagamento: value})}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="debito">Cartão Débito</SelectItem>
                        <SelectItem value="credito">Cartão Crédito</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tipo_gestao">Tipo Gerencial *</Label>
                    <Select value={formData.tipo_gestao} onValueChange={(value: any) => setFormData({...formData, tipo_gestao: value})}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bruto">Bruto</SelectItem>
                        <SelectItem value="pessoal">Pessoal</SelectItem>
                        <SelectItem value="aluguel">Aluguel</SelectItem>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="vendas">Vendas</SelectItem>
                        <SelectItem value="administrativo">Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="data_movimento">Data *</Label>
                    <Input
                      id="data_movimento"
                      type="date"
                      value={formData.data_movimento}
                      onChange={(e) => setFormData({...formData, data_movimento: e.target.value})}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subcategoria">Subcategoria</Label>
                    <Input
                      id="subcategoria"
                      value={formData.subcategoria}
                      onChange={(e) => setFormData({...formData, subcategoria: e.target.value})}
                      className="bg-slate-800 border-slate-700"
                      placeholder="Subcategoria opcional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      className="bg-slate-800 border-slate-700"
                      placeholder="Descrição adicional..."
                    />
                  </div>

                  <div className="md:col-span-3 flex gap-2">
                    <Button type="submit" style={{ backgroundColor: motorColor }}>
                      {editingItem ? 'Atualizar' : 'Cadastrar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
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

          {/* Lista de Movimentações Enhanced */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Movimentações - {motorName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {movimentacoes.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    Nenhuma movimentação registrada para {motorName}
                  </p>
                ) : (
                  movimentacoes.map((mov) => (
                    <div key={mov.id} className="flex justify-between items-center p-4 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors">
                      <div className="flex items-center space-x-4">
                        {mov.tipo === 'entrada' ?
                          <ArrowUpCircle className="h-5 w-5 text-green-400" /> :
                          <ArrowDownCircle className="h-5 w-5 text-red-400" />
                        }
                        <div>
                          <p className="font-medium text-white">{mov.categoria}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span>{mov.conta_nome}</span>
                            <span>•</span>
                            <span>{formatDate(mov.data_movimento)}</span>
                            {mov.metodo_pagamento && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {mov.metodo_pagamento.toUpperCase()}
                                </Badge>
                              </>
                            )}
                            {mov.tipo_gestao && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {mov.tipo_gestao}
                                </Badge>
                              </>
                            )}
                          </div>
                          {mov.descricao && <p className="text-sm text-slate-500 mt-1">{mov.descricao}</p>}
                          {mov.subcategoria && <p className="text-xs text-slate-600">Subcategoria: {mov.subcategoria}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className={`font-semibold ${mov.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                            {mov.tipo === 'entrada' ? '+' : '-'}{formatCurrency(mov.valor)}
                          </p>
                          {mov.status && (
                            <Badge
                              variant={mov.status === 'realizado' ? 'default' : 'secondary'}
                              className="text-xs mt-1"
                            >
                              {mov.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(mov.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <BPOCharts
            motorType={motorType}
            motorName={motorName}
            motorColor={motorColor}
            dadosAnalyticos={dadosAnalyticos}
            dadosAgrupados={dadosAgrupados}
            periodoSelecionado={periodoSelecionado}
          />
        </TabsContent>

        {/* Histórico Tab */}
        <TabsContent value="historico" className="space-y-6">
          {/* Seletor de Período */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Visualização por Período - {motorName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant={periodoSelecionado === 'diario' ? 'default' : 'outline'}
                  onClick={() => setPeriodoSelecionado('diario')}
                  className="w-full"
                >
                  Diário
                </Button>
                <Button
                  variant={periodoSelecionado === 'semanal' ? 'default' : 'outline'}
                  onClick={() => setPeriodoSelecionado('semanal')}
                  className="w-full"
                >
                  Semanal
                </Button>
                <Button
                  variant={periodoSelecionado === 'mensal' ? 'default' : 'outline'}
                  onClick={() => setPeriodoSelecionado('mensal')}
                  className="w-full"
                >
                  Mensal
                </Button>
                <Button
                  variant={periodoSelecionado === 'anual' ? 'default' : 'outline'}
                  onClick={() => setPeriodoSelecionado('anual')}
                  className="w-full"
                >
                  Anual
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumo do Período Selecionado */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total de Períodos</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {dadosAgrupados.length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Faturamento Total</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(dadosAgrupados.reduce((acc, item) => acc + item.faturamento, 0))}
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
                    <p className="text-slate-400 text-sm">Custos Totais</p>
                    <p className="text-2xl font-bold text-red-400">
                      {formatCurrency(dadosAgrupados.reduce((acc, item) => acc + item.custos, 0))}
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
                    <p className="text-slate-400 text-sm">Lucro Total</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(dadosAgrupados.reduce((acc, item) => acc + item.lucro, 0))}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dados Agrupados por Período */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>
                Histórico {periodoSelecionado.charAt(0).toUpperCase() + periodoSelecionado.slice(1)} - {motorName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dadosAgrupados.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-400">
                      Nenhum histórico disponível para o período {periodoSelecionado}.
                    </p>
                  </div>
                ) : (
                  dadosAgrupados.map((item, index) => (
                    <div key={index} className="p-6 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div>
                            <p className="font-semibold text-white text-lg">
                              {formatPeriodo(item.periodo, periodoSelecionado)}
                            </p>
                            <p className="text-sm text-slate-400">
                              {item.total_movimentacoes} movimentações registradas
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <ArrowUpCircle className="h-4 w-4 text-green-400" />
                              <span className="text-slate-400">Entradas:</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ArrowDownCircle className="h-4 w-4 text-red-400" />
                              <span className="text-slate-400">Saídas:</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <div>
                            <p className="text-lg font-bold text-green-400">
                              +{formatCurrency(item.total_entradas)}
                            </p>
                            <p className="text-lg font-bold text-red-400">
                              -{formatCurrency(item.total_saidas)}
                            </p>
                          </div>

                          <div className="border-t border-slate-700 pt-2">
                            <p className={`text-xl font-bold ${item.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(item.lucro)}
                            </p>
                            <p className="text-sm text-slate-400">
                              Margem: {item.margem_lucro.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {item.movimentacoes.length <= 5 && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <p className="text-sm text-slate-400 mb-2">Movimentações do período:</p>
                          <div className="space-y-1">
                            {item.movimentacoes.map((mov: any, movIndex: number) => (
                              <div key={movIndex} className="flex justify-between items-center text-sm">
                                <span className="text-slate-300">
                                  {mov.categoria} - {formatDate(mov.data_movimento)}
                                </span>
                                <span className={mov.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}>
                                  {mov.tipo === 'entrada' ? '+' : '-'}{formatCurrency(mov.valor)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}