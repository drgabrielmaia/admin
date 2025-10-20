'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  User,
  Target
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ComissaoCardProps {
  comissao: {
    id: string
    valor_venda: number
    percentual_sdr?: number
    percentual_closer?: number
    comissao_sdr: number
    comissao_closer: number
    status: 'pendente' | 'paga' | 'cancelada'
    data_venda: string
    data_pagamento?: string | null
    observacoes?: string | null
    lead?: {
      nome: string
      origem: string
    }
    sdr?: {
      nome: string
    }
    closer?: {
      nome: string
    }
    produto?: {
      nome: string
      tipo: string
    }
  }
  userRole: 'sdr' | 'closer' | 'admin'
  isHighlight?: boolean
}

export function ComissaoCard({ comissao, userRole, isHighlight = false }: ComissaoCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-900 text-yellow-300 border-yellow-700'
      case 'paga': return 'bg-green-900 text-green-300 border-green-700'
      case 'cancelada': return 'bg-red-900 text-red-300 border-red-700'
      default: return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="h-4 w-4" />
      case 'paga': return <CheckCircle className="h-4 w-4" />
      case 'cancelada': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente'
      case 'paga': return 'Paga'
      case 'cancelada': return 'Cancelada'
      default: return status
    }
  }

  // Calcular comissão do usuário atual
  const minhaComissao = userRole === 'sdr' ? comissao.comissao_sdr : comissao.comissao_closer
  const meuPercentual = userRole === 'sdr' ? comissao.percentual_sdr : comissao.percentual_closer

  return (
    <Card className={`bg-slate-800 border-slate-700 transition-all hover:border-slate-600 ${
      isHighlight ? 'ring-2 ring-green-500/20 border-green-600' : ''
    }`}>
      <CardContent className="p-6">
        {/* Header com Lead e Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-white">
                {comissao.lead?.nome || 'Lead não informado'}
              </h3>
              <Badge variant="outline" className={getStatusColor(comissao.status)}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(comissao.status)}
                  <span>{getStatusLabel(comissao.status)}</span>
                </div>
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              Origem: {comissao.lead?.origem || 'Não informado'}
            </p>
          </div>
        </div>

        {/* Informações da Venda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            {/* Valor da Venda */}
            <div className="flex items-center space-x-3 p-3 bg-slate-900 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Valor da Venda</p>
                <p className="text-xl font-bold text-blue-400">
                  {formatCurrency(comissao.valor_venda)}
                </p>
              </div>
            </div>

            {/* Data da Venda */}
            <div className="flex items-center space-x-3 p-3 bg-slate-900 rounded-lg">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Data da Venda</p>
                <p className="text-sm font-medium text-white">
                  {formatDate(comissao.data_venda)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Minha Comissão - DESTAQUE */}
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-900 to-emerald-900 rounded-lg border border-green-700">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-green-300 uppercase tracking-wide font-medium">
                  Minha Comissão ({meuPercentual}%)
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(minhaComissao)}
                </p>
              </div>
            </div>

            {/* Status do Pagamento */}
            {comissao.status === 'paga' && comissao.data_pagamento && (
              <div className="flex items-center space-x-3 p-3 bg-green-900/30 rounded-lg border border-green-700/50">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-300 uppercase tracking-wide">Pago em</p>
                  <p className="text-sm font-medium text-green-400">
                    {formatDate(comissao.data_pagamento)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detalhes Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
          {/* SDR */}
          {comissao.sdr && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-xs text-slate-400">SDR</p>
                <p className="text-sm text-white">{comissao.sdr.nome}</p>
                <p className="text-xs text-blue-400">
                  {formatCurrency(comissao.comissao_sdr)} (1%)
                </p>
              </div>
            </div>
          )}

          {/* Closer */}
          {comissao.closer && (
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-xs text-slate-400">Closer</p>
                <p className="text-sm text-white">{comissao.closer.nome}</p>
                <p className="text-xs text-purple-400">
                  {formatCurrency(comissao.comissao_closer)} (5%)
                </p>
              </div>
            </div>
          )}

          {/* Produto */}
          {comissao.produto && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-xs text-slate-400">Produto</p>
                <p className="text-sm text-white">{comissao.produto.nome}</p>
                <p className="text-xs text-green-400 capitalize">
                  {comissao.produto.tipo}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Observações */}
        {comissao.observacoes && (
          <div className="mt-4 p-3 bg-slate-900 rounded-lg">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Observações</p>
            <p className="text-sm text-slate-300 italic">&ldquo;{comissao.observacoes}&rdquo;</p>
          </div>
        )}

        {/* Indicador de destaque para comissões recentes */}
        {isHighlight && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Nova Comissão</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}