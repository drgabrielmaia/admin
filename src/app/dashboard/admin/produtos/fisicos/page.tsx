'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { MovimentacaoModal } from '@/components/modals/MovimentacaoModal'
import { 
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Edit,
  Trash2,
  Package,
  Box
} from 'lucide-react'

interface FisicoProduto {
  id: string
  nome: string
  descricao?: string
  preco: number
  custo: number
  margem_lucro: number
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at: string
}

interface VendasFisicos {
  total_vendas: number
  faturamento_total: number
  lucro_total: number
  custo_total: number
}

export default function FisicosPage() {
  const { user } = useAuth()
  const [produtos, setProdutos] = useState<FisicoProduto[]>([])
  const [vendas, setVendas] = useState<VendasFisicos>({
    total_vendas: 0,
    faturamento_total: 0,
    lucro_total: 0,
    custo_total: 0
  })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<FisicoProduto | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    custo: ''
  })

  useEffect(() => {
    if (user?.funcao === 'admin') {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar produtos físicos
      const { data: produtosData } = await supabase
        .from('produtos')
        .select('*')
        .eq('tipo', 'fisico')
        .order('created_at', { ascending: false })

      setProdutos(produtosData || [])

      // Calcular vendas e lucros
      await calcularVendas()

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularVendas = async () => {
    try {
      // USAR A MESMA LÓGICA UNIFICADA DO BPO
      // Buscar todas as vendas APROVADAS de produtos físicos
      const { data: vendasData } = await supabase
        .from('chamadas')
        .select(`
          valor,
          status_aprovacao,
          produtos!inner(id, nome, tipo, preco, custo)
        `)
        .eq('resultado', 'venda')
        .eq('status_aprovacao', 'aprovada')
        .eq('produtos.tipo', 'fisico')

      // Buscar movimentações manuais de produtos físicos
      const { data: movimentacoesData } = await supabase
        .from('movimentacoes_financeiras')
        .select('*')
        .eq('negocio', 'fisico')
        .eq('status', 'realizado')

      if (vendasData) {
        const totalVendas = vendasData.length
        const faturamentoVendas = vendasData.reduce((acc, v) => acc + (v.valor || 0), 0)
        const custoVendas = vendasData.reduce((acc, v) => {
          const produto = v.produtos as any
          return acc + (produto?.custo || 0)
        }, 0)

        // Adicionar movimentações manuais
        const entradasExtras = movimentacoesData?.filter(mov => mov.tipo === 'entrada')
          .reduce((sum, mov) => sum + mov.valor, 0) || 0
        
        const saidasExtras = movimentacoesData?.filter(mov => mov.tipo === 'saida')
          .reduce((sum, mov) => sum + mov.valor, 0) || 0

        // TOTAIS UNIFICADOS (igual ao BPO)
        const faturamentoTotal = faturamentoVendas + entradasExtras
        const custoTotal = custoVendas + saidasExtras
        const lucroTotal = faturamentoTotal - custoTotal

        setVendas({
          total_vendas: totalVendas,
          faturamento_total: faturamentoTotal,
          lucro_total: lucroTotal,
          custo_total: custoTotal
        })
      }
    } catch (error) {
      console.error('Erro ao calcular vendas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome || !formData.preco || !formData.custo) return

    try {
      const preco = parseFloat(formData.preco)
      const custo = parseFloat(formData.custo)
      const margem_lucro = ((preco - custo) / preco) * 100

      const payload = {
        nome: formData.nome,
        tipo: 'fisico',
        descricao: formData.descricao,
        preco,
        custo,
        margem_lucro,
        status: 'ativo'
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('produtos')
          .update(payload)
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert(payload)

        if (error) throw error
      }

      setFormData({ nome: '', descricao: '', preco: '', custo: '' })
      setEditingProduct(null)
      setShowForm(false)
      await loadData()

    } catch (error) {
      console.error('Erro ao salvar produto:', error)
    }
  }

  const handleEdit = (produto: FisicoProduto) => {
    setEditingProduct(produto)
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: produto.preco.toString(),
      custo: produto.custo.toString()
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Erro ao deletar produto:', error)
    }
  }

  if (user?.funcao !== 'admin') {
    return (
      <DashboardLayout title="Produtos Físicos">
        <div className="text-center text-slate-400">
          Acesso restrito para administradores
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout title="Produtos Físicos">
        <div className="text-center text-slate-400">Carregando...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Produtos Físicos">
      <div className="space-y-6">
        {/* Header com botão de adicionar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-orange-400" />
            <h2 className="text-2xl font-bold text-white">Produtos Físicos</h2>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={() => window.location.href = '/dashboard/admin/produtos/fisicos/bpo'}
              variant="outline"
              className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              BPO Produtos Físicos
            </Button>
            <Button 
              onClick={() => setShowMovimentacaoModal(true)}
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Vendas</p>
                  <p className="text-2xl font-bold text-white">{vendas.total_vendas}</p>
                </div>
                <Box className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Faturamento</p>
                  <p className="text-2xl font-bold text-white">
                    {vendas.faturamento_total.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Custos Totais</p>
                  <p className="text-2xl font-bold text-red-400">
                    {vendas.custo_total.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </p>
                </div>
                <Target className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Lucro Total</p>
                  <p className="text-2xl font-bold text-green-400">
                    {vendas.lucro_total.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário */}
        {showForm && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>{editingProduct ? 'Editar Produto' : 'Novo Produto Físico'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Produto *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Ex: Kit Premium High-Ticket"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco">Preço de Venda *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({...formData, preco: e.target.value})}
                    placeholder="1500.00"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo">Custo de Produção *</Label>
                  <Input
                    id="custo"
                    type="number"
                    step="0.01"
                    value={formData.custo}
                    onChange={(e) => setFormData({...formData, custo: e.target.value})}
                    placeholder="600.00"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Margem de Lucro</Label>
                  <div className="p-3 bg-slate-800 rounded-md border border-slate-700">
                    {formData.preco && formData.custo ? (
                      <span className="text-green-400 font-bold">
                        {(((parseFloat(formData.preco) - parseFloat(formData.custo)) / parseFloat(formData.preco)) * 100).toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">Preencha preço e custo</span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    placeholder="Descrição detalhada do produto físico..."
                    className="bg-slate-800 border-slate-700"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                    {editingProduct ? 'Atualizar' : 'Criar Produto'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false)
                      setEditingProduct(null)
                      setFormData({ nome: '', descricao: '', preco: '', custo: '' })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Produtos */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Produtos Físicos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {produtos.length > 0 ? (
              <div className="space-y-4">
                {produtos.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-white">{produto.nome}</h3>
                        <Badge variant={produto.status === 'ativo' ? 'default' : 'secondary'}>
                          {produto.status}
                        </Badge>
                        <Badge className="bg-orange-900 text-orange-300">
                          {produto.margem_lucro.toFixed(1)}% lucro
                        </Badge>
                      </div>
                      {produto.descricao && (
                        <p className="text-slate-400 text-sm mt-1">{produto.descricao}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(produto)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(produto.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto físico cadastrado</p>
                <p className="text-sm">Clique em "Novo Produto" para começar</p>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Modal de Movimentação */}
        <MovimentacaoModal 
          isOpen={showMovimentacaoModal}
          onClose={() => setShowMovimentacaoModal(false)}
          motorType="fisico"
          motorName="Produtos Físicos"
          onSuccess={() => {
            // Pode adicionar lógica de refresh aqui se necessário
          }}
        />
      </div>
    </DashboardLayout>
  )
}