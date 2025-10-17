'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { X, Plus } from 'lucide-react'

interface MovimentacaoModalProps {
  isOpen: boolean
  onClose: () => void
  motorType: 'mentoria' | 'infoproduto' | 'saas' | 'fisico' | 'parceria' | 'clinica' | 'evento' | 'real-estate'
  motorName: string
  onSuccess?: () => void
}

interface CategoriaSalva {
  id: string
  nome: string
  tipo: 'entrada' | 'saida'
  uso_count: number
}

export function MovimentacaoModal({
  isOpen,
  onClose,
  motorType,
  motorName,
  onSuccess
}: MovimentacaoModalProps) {
  const [contas, setContas] = useState<any[]>([])
  const [categoriasSalvas, setCategoriasSalvas] = useState<CategoriaSalva[]>([])
  const [loading, setLoading] = useState(false)
  const [showNovaCategoria, setShowNovaCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')

  const [formData, setFormData] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    categoria: '',
    valor: '',
    data_movimento: new Date().toISOString().split('T')[0],
    descricao: '',
    conta_id: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadContas()
      loadCategorias()
    }
  }, [isOpen, formData.tipo, motorType])

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
        .from('categorias_movimentacao')
        .select('*')
        .eq('tipo', formData.tipo)
        .eq('motor_type', motorType)
        .order('uso_count', { ascending: false })

      if (error) throw error
      setCategoriasSalvas(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const salvarNovaCategoria = async () => {
    if (!novaCategoria.trim()) return

    try {
      // Verificar se já existe
      const { data: existente, error: erroExistente } = await supabase
        .from('categorias_movimentacao')
        .select('*')
        .eq('nome', novaCategoria.trim())
        .eq('tipo', formData.tipo)
        .eq('motor_type', motorType)
        .maybeSingle()

      if (erroExistente && erroExistente.code !== 'PGRST116') throw erroExistente

      if (existente) {
        // Se existe, incrementar uso_count
        const { error } = await supabase
          .from('categorias_movimentacao')
          .update({ 
            uso_count: existente.uso_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existente.id)

        if (error) throw error
      } else {
        // Se não existe, criar nova
        const { error } = await supabase
          .from('categorias_movimentacao')
          .insert({
            nome: novaCategoria.trim(),
            tipo: formData.tipo,
            motor_type: motorType,
            uso_count: 1
          })

        if (error) throw error
      }

      // Usar a nova categoria
      setFormData({...formData, categoria: novaCategoria.trim()})
      setNovaCategoria('')
      setShowNovaCategoria(false)
      loadCategorias()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert('Erro ao salvar categoria')
    }
  }

  const deletarCategoria = async (categoriaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      const { error } = await supabase
        .from('categorias_movimentacao')
        .delete()
        .eq('id', categoriaId)

      if (error) throw error
      loadCategorias()
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
      alert('Erro ao deletar categoria')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.conta_id || !formData.valor || !formData.categoria) return

    setLoading(true)
    try {
      // Salvar/incrementar categoria se não está na lista
      const categoriaExistente = categoriasSalvas.find(c => c.nome === formData.categoria)
      if (!categoriaExistente) {
        await salvarNovaCategoria()
      } else {
        // Incrementar uso da categoria existente
        await supabase
          .from('categorias_movimentacao')
          .update({ uso_count: categoriaExistente.uso_count + 1 })
          .eq('id', categoriaExistente.id)
      }

      const payload = {
        ...formData,
        valor: parseFloat(formData.valor),
        negocio: motorType,
        categoria: `${motorName} - ${formData.categoria}`,
        status: 'realizado'
      }

      const { error } = await supabase
        .from('movimentacoes_financeiras')
        .insert(payload)
      
      if (error) throw error

      // Resetar formulário
      setFormData({
        tipo: 'entrada',
        categoria: '',
        valor: '',
        data_movimento: new Date().toISOString().split('T')[0],
        descricao: '',
        conta_id: ''
      })
      
      onClose()
      if (onSuccess) onSuccess()
      
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error)
      alert('Erro ao salvar movimentação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Movimentação - {motorName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Select value={formData.tipo} onValueChange={(value: 'entrada' | 'saida') => {
                setFormData({...formData, tipo: value, categoria: ''})
                setShowNovaCategoria(false)
              }}>
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
              <Label htmlFor="data_movimento">Data *</Label>
              <Input
                id="data_movimento"
                type="date"
                value={formData.data_movimento}
                onChange={(e) => setFormData({...formData, data_movimento: e.target.value})}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          {/* Categoria com opções salvas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNovaCategoria(!showNovaCategoria)}
                className="text-green-400 hover:text-green-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova
              </Button>
            </div>

            {/* Categorias salvas */}
            {categoriasSalvas.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-2">Categorias salvas (clique para usar):</p>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {categoriasSalvas.map((categoria) => (
                    <div key={categoria.id} className="flex items-center">
                      <Badge
                        variant="outline"
                        className={`cursor-pointer hover:bg-slate-700 ${
                          formData.categoria === categoria.nome ? 'bg-green-600 border-green-500' : ''
                        }`}
                        onClick={() => setFormData({...formData, categoria: categoria.nome})}
                      >
                        {categoria.nome} ({categoria.uso_count})
                      </Badge>
                      <button
                        type="button"
                        onClick={() => deletarCategoria(categoria.id)}
                        className="ml-1 text-red-400 hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campo para nova categoria */}
            {showNovaCategoria && (
              <div className="mb-3 p-3 border border-slate-700 rounded-lg bg-slate-800">
                <div className="flex space-x-2">
                  <Input
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    placeholder="Nome da nova categoria"
                    className="bg-slate-700 border-slate-600"
                  />
                  <Button
                    type="button"
                    onClick={salvarNovaCategoria}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowNovaCategoria(false)
                      setNovaCategoria('')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Input manual de categoria */}
            <Input
              id="categoria"
              value={formData.categoria}
              onChange={(e) => setFormData({...formData, categoria: e.target.value})}
              className="bg-slate-800 border-slate-700"
              placeholder="Ex: Receita de Vendas"
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}