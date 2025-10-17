'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Package, 
  Plus, 
  Search,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Building,
  Home,
  Briefcase,
  Warehouse,
  Store,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3
} from 'lucide-react'
import Link from 'next/link'

interface Imovel {
  id: string
  nome: string
  tipo: string
  endereco: string
  cidade: string
  estado: string
  valor_compra: number
  valor_venda_pretendido: number
  valor_venda_final: number | null
  status: 'disponivel' | 'em_negociacao' | 'vendido' | 'indisponivel'
  data_compra: string
  data_venda: string | null
  responsavel_nome: string | null
  total_gastos: number
  custo_total: number
  lucro_estimado: number
  percentual_lucro: number
}

export function ImoveisLista() {
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')

  useEffect(() => {
    loadImoveis()
  }, [])

  const loadImoveis = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('vw_imoveis_completo')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar imóveis:', error)
        return
      }

      setImoveis(data || [])
    } catch (error) {
      console.error('Erro ao buscar imóveis:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'em_negociacao':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'vendido':
        return <Target className="w-4 h-4 text-blue-500" />
      case 'indisponivel':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'em_negociacao':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'vendido':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'indisponivel':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível'
      case 'em_negociacao':
        return 'Em Negociação'
      case 'vendido':
        return 'Vendido'
      case 'indisponivel':
        return 'Indisponível'
      default:
        return status
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'casa':
        return <Home className="w-4 h-4" />
      case 'apartamento':
        return <Building className="w-4 h-4" />
      case 'consultorio':
      case 'sala_comercial':
        return <Briefcase className="w-4 h-4" />
      case 'terreno':
        return <MapPin className="w-4 h-4" />
      case 'galpao':
        return <Warehouse className="w-4 h-4" />
      case 'loja':
        return <Store className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const filteredImoveis = imoveis.filter(imovel => {
    const matchesSearch = imovel.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         imovel.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         imovel.cidade.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || imovel.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
            Real Estate
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestão completa de imóveis - compra, venda e controle de gastos
          </p>
        </div>
        <Link href="/dashboard/admin/real-estate/novo">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Imóvel
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, endereço ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
        >
          <option value="todos">Todos os Status</option>
          <option value="disponivel">Disponível</option>
          <option value="em_negociacao">Em Negociação</option>
          <option value="vendido">Vendido</option>
          <option value="indisponivel">Indisponível</option>
        </select>
      </div>

      {/* Lista de Imóveis */}
      {filteredImoveis.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredImoveis.map((imovel) => (
            <Card key={imovel.id} className="border-0 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      {getTipoIcon(imovel.tipo)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {imovel.nome}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={getStatusColor(imovel.status)}>
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(imovel.status)}
                            <span>{getStatusLabel(imovel.status)}</span>
                          </span>
                        </Badge>
                        <span className="text-sm text-muted-foreground capitalize">
                          {imovel.tipo.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Endereço */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{imovel.endereco}, {imovel.cidade} - {imovel.estado}</span>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor de Compra</p>
                    <p className="text-sm font-semibold">{formatCurrency(imovel.valor_compra)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {imovel.status === 'vendido' ? 'Valor de Venda' : 'Valor Pretendido'}
                    </p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {formatCurrency(imovel.valor_venda_final || imovel.valor_venda_pretendido)}
                    </p>
                  </div>
                </div>

                {/* Gastos e Lucro */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Gastos</p>
                    <p className="text-sm font-semibold text-red-400">
                      {formatCurrency(imovel.total_gastos)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Custo Total</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(imovel.custo_total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {imovel.status === 'vendido' ? 'Lucro' : 'Lucro Estimado'}
                    </p>
                    <p className={`text-sm font-semibold ${imovel.lucro_estimado >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(imovel.lucro_estimado)}
                    </p>
                  </div>
                </div>

                {/* Margem e Info Adicional */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className={`text-sm font-medium ${imovel.percentual_lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {imovel.percentual_lucro.toFixed(1)}% de margem
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Compra: {formatDate(imovel.data_compra)}</span>
                    </div>
                    {imovel.data_venda && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Venda: {formatDate(imovel.data_venda)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Responsável */}
                {imovel.responsavel_nome && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>Responsável: {imovel.responsavel_nome}</span>
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <Link href={`/dashboard/admin/real-estate/${imovel.id}/gastos`}>
                    <Button variant="outline" size="sm">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Gastos
                    </Button>
                  </Link>
                  <Link href={`/dashboard/admin/real-estate/${imovel.id}`}>
                    <Button variant="outline" size="sm" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                      <Edit3 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchTerm || statusFilter !== 'todos' ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            {searchTerm || statusFilter !== 'todos' 
              ? 'Tente ajustar os filtros de busca para encontrar o que procura.'
              : 'Comece cadastrando seu primeiro imóvel para começar a gestão completa do seu portfólio.'
            }
          </p>
          {!searchTerm && statusFilter === 'todos' && (
            <Link href="/dashboard/admin/real-estate/novo">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Imóvel
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}