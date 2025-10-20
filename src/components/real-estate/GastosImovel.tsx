'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Plus,
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  Receipt,
  Trash2,
  Edit3,
  Package
} from 'lucide-react'
import Link from 'next/link'

interface Imovel {
  id: string
  nome: string
  tipo: string
  endereco: string
}

interface Gasto {
  id: string
  categoria: string
  descricao: string
  valor: number
  data_gasto: string
  fornecedor: string | null
  observacoes: string | null
  responsavel_nome: string | null
}

interface NovoGastoData {
  categoria: string
  descricao: string
  valor: string
  data_gasto: string
  fornecedor: string
  observacoes: string
}

interface GastosImovelProps {
  imovelId: string
}

export function GastosImovel({ imovelId }: GastosImovelProps) {
  const { user } = useAuth()
  const [imovel, setImovel] = useState<Imovel | null>(null)
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null)
  
  const [formData, setFormData] = useState<NovoGastoData>({
    categoria: 'reforma',
    descricao: '',
    valor: '',
    data_gasto: new Date().toISOString().split('T')[0],
    fornecedor: '',
    observacoes: ''
  })

  useEffect(() => {
    loadData()
  }, [imovelId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados do imóvel
      const { data: imovelData, error: imovelError } = await supabase
        .from('imoveis')
        .select('id, nome, tipo, endereco')
        .eq('id', imovelId)
        .single()

      if (imovelError) {
        console.error('Erro ao carregar imóvel:', imovelError)
        return
      }

      setImovel(imovelData)

      // Carregar gastos
      await loadGastos()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGastos = async () => {
    try {
      const { data, error } = await supabase
        .from('imoveis_gastos')
        .select(`
          *,
          responsavel:responsavel_id(nome)
        `)
        .eq('imovel_id', imovelId)
        .order('data_gasto', { ascending: false })

      if (error) {
        console.error('Erro ao carregar gastos:', error)
        return
      }

      const gastosFormatted = data.map(gasto => ({
        ...gasto,
        responsavel_nome: gasto.responsavel?.nome || null
      }))

      setGastos(gastosFormatted)
    } catch (error) {
      console.error('Erro ao buscar gastos:', error)
    }
  }

  const handleInputChange = (field: keyof NovoGastoData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      categoria: 'reforma',
      descricao: '',
      valor: '',
      data_gasto: new Date().toISOString().split('T')[0],
      fornecedor: '',
      observacoes: ''
    })
    setEditingGasto(null)
    setShowForm(false)
  }

  const handleEdit = (gasto: Gasto) => {
    setFormData({
      categoria: gasto.categoria,
      descricao: gasto.descricao,
      valor: gasto.valor.toString(),
      data_gasto: gasto.data_gasto,
      fornecedor: gasto.fornecedor || '',
      observacoes: gasto.observacoes || ''
    })
    setEditingGasto(gasto)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.descricao || !formData.valor || !user) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    try {
      setSaving(true)

      const gastoData = {
        imovel_id: imovelId,
        categoria: formData.categoria,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        data_gasto: formData.data_gasto,
        fornecedor: formData.fornecedor || null,
        observacoes: formData.observacoes || null,
        responsavel_id: user.id
      }

      let error

      if (editingGasto) {
        // Atualizar gasto existente
        const { error: updateError } = await supabase
          .from('imoveis_gastos')
          .update(gastoData)
          .eq('id', editingGasto.id)
        error = updateError
      } else {
        // Criar novo gasto
        const { error: insertError } = await supabase
          .from('imoveis_gastos')
          .insert([gastoData])
        error = insertError
      }

      if (error) {
        console.error('Erro ao salvar gasto:', error)
        alert('Erro ao salvar gasto. Verifique o console.')
        return
      }

      alert(editingGasto ? 'Gasto atualizado com sucesso!' : 'Gasto adicionado com sucesso!')
      resetForm()
      await loadGastos()
    } catch (error) {
      console.error('Erro ao salvar gasto:', error)
      alert('Erro interno. Verifique o console.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (gastoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('imoveis_gastos')
        .delete()
        .eq('id', gastoId)

      if (error) {
        console.error('Erro ao excluir gasto:', error)
        alert('Erro ao excluir gasto. Verifique o console.')
        return
      }

      alert('Gasto excluído com sucesso!')
      await loadGastos()
    } catch (error) {
      console.error('Erro ao excluir gasto:', error)
      alert('Erro interno. Verifique o console.')
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'reforma':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'documentacao':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'imposto':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'manutencao':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'marketing':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'comissao':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'juridico':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'reforma':
        return 'Reforma'
      case 'documentacao':
        return 'Documentação'
      case 'imposto':
        return 'Imposto'
      case 'manutencao':
        return 'Manutenção'
      case 'marketing':
        return 'Marketing'
      case 'comissao':
        return 'Comissão'
      case 'juridico':
        return 'Jurídico'
      case 'outro':
        return 'Outro'
      default:
        return categoria
    }
  }

  const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.valor, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!imovel) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Imóvel não encontrado
        </h3>
        <Link href="/dashboard/admin/real-estate">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Lista
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/admin/real-estate">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
            Gastos - {imovel.nome}
          </h2>
          <p className="text-muted-foreground mt-1">
            {imovel.endereco} • Total: {formatCurrency(totalGastos)}
          </p>
        </div>
      </div>

      {/* Botão Adicionar e Resumo */}
      <div className="flex items-center justify-between">
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Gastos</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(totalGastos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancelar' : 'Adicionar Gasto'}
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>
              {editingGasto ? 'Editar Gasto' : 'Novo Gasto'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <select
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => handleInputChange('categoria', e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                    required
                  >
                    <option value="reforma">Reforma</option>
                    <option value="documentacao">Documentação</option>
                    <option value="imposto">Imposto</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="marketing">Marketing</option>
                    <option value="comissao">Comissão</option>
                    <option value="juridico">Jurídico</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => handleInputChange('valor', e.target.value)}
                    placeholder="1500.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descrição do gasto..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_gasto">Data do Gasto *</Label>
                  <Input
                    id="data_gasto"
                    type="date"
                    value={formData.data_gasto}
                    onChange={(e) => handleInputChange('data_gasto', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    value={formData.fornecedor}
                    onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                    placeholder="Nome do fornecedor"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : editingGasto ? (
                    <Edit3 className="w-4 h-4 mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {editingGasto ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Gastos */}
      {gastos.length > 0 ? (
        <div className="space-y-4">
          {gastos.map((gasto) => (
            <Card key={gasto.id} className="border-0 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className={getCategoriaColor(gasto.categoria)}>
                        {getCategoriaLabel(gasto.categoria)}
                      </Badge>
                      <span className="font-semibold text-foreground">{gasto.descricao}</span>
                      <span className="text-lg font-bold text-red-400">
                        {formatCurrency(gasto.valor)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(gasto.data_gasto)}</span>
                      </div>
                      
                      {gasto.fornecedor && (
                        <div className="flex items-center space-x-1">
                          <Receipt className="w-3 h-3" />
                          <span>{gasto.fornecedor}</span>
                        </div>
                      )}
                      
                      {gasto.responsavel_nome && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{gasto.responsavel_nome}</span>
                        </div>
                      )}
                    </div>
                    
                    {gasto.observacoes && (
                      <p className="text-sm text-muted-foreground italic">
                        {gasto.observacoes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(gasto)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(gasto.id)}
                      className="text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum gasto cadastrado
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Comece adicionando os gastos relacionados a este imóvel para ter um controle completo dos custos.
          </p>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Gasto
          </Button>
        </div>
      )}
    </div>
  )
}