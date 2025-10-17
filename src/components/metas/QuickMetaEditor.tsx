'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Target,
  Edit3,
  Save,
  X,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Phone,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import clsx from 'clsx'

interface MetaMes {
  id: string
  categoria: string
  valor_meta: number
  valor_atual: number
  percentual: number
  usuario?: {
    id: string
    nome: string
    funcao: string
  }
  editando?: boolean
  novoValor?: number
}

export function QuickMetaEditor() {
  const { user } = useAuth()
  const [metas, setMetas] = useState<MetaMes[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)

  const categorias = {
    leads: { label: 'Leads Gerados', icon: Users, color: 'blue' },
    vendas: { label: 'Vendas Fechadas', icon: Target, color: 'green' },
    faturamento: { label: 'Faturamento', icon: DollarSign, color: 'emerald' },
    chamadas: { label: 'Chamadas Realizadas', icon: Phone, color: 'purple' }
  }

  useEffect(() => {
    loadMetas()
  }, [])

  const loadMetas = async () => {
    try {
      setLoading(true)
      
      // Buscar metas reais do banco de dados
      const { data: metasData, error } = await supabase
        .from('vw_metas_com_progresso_real')
        .select('*')
        .eq('tipo', 'mensal') // Apenas metas mensais para edição rápida
        .order('percentual_real', { ascending: false })

      if (error) {
        console.error('Erro ao buscar metas:', error)
        setMetas([])
        return
      }

      // Mapear os dados para o formato esperado
      const metasFormatadas: MetaMes[] = metasData?.map(meta => ({
        id: meta.id,
        categoria: meta.categoria,
        valor_meta: meta.valor_meta,
        valor_atual: meta.progresso_real || 0,
        percentual: meta.percentual_real || 0,
        usuario: {
          id: meta.user_id,
          nome: meta.usuario_nome,
          funcao: meta.funcao
        }
      })) || []

      setMetas(metasFormatadas)
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (metaId: string) => {
    setMetas(prev => prev.map(meta => 
      meta.id === metaId 
        ? { ...meta, editando: true, novoValor: meta.valor_meta }
        : meta
    ))
  }

  const handleCancel = (metaId: string) => {
    setMetas(prev => prev.map(meta => 
      meta.id === metaId 
        ? { ...meta, editando: false, novoValor: undefined }
        : meta
    ))
  }

  const handleSave = async (metaId: string) => {
    const meta = metas.find(m => m.id === metaId)
    if (!meta || !meta.novoValor) return

    try {
      setSalvando(metaId)
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('metas_individuais')
        .update({ valor_meta: meta.novoValor })
        .eq('id', metaId)

      if (error) {
        console.error('Erro ao salvar meta:', error)
        return
      }
      
      // Atualizar estado local
      setMetas(prev => prev.map(m => 
        m.id === metaId 
          ? { 
              ...m, 
              valor_meta: meta.novoValor!,
              percentual: m.valor_atual > 0 ? (m.valor_atual / meta.novoValor!) * 100 : 0,
              editando: false,
              novoValor: undefined
            }
          : m
      ))

      // Atualizar progresso real após salvar
      await supabase.rpc('update_metas_progress_real')
      
      console.log(`Meta ${metaId} atualizada para ${meta.novoValor} no banco de dados`)
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    } finally {
      setSalvando(null)
    }
  }

  const formatValue = (value: number, categoria: string) => {
    if (categoria === 'faturamento') {
      return value.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        maximumFractionDigits: 0 
      })
    }
    return value.toLocaleString('pt-BR')
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-emerald-400'
    if (percentage >= 80) return 'text-yellow-400'
    if (percentage >= 60) return 'text-blue-400'
    return 'text-slate-400'
  }

  const getProgressBg = (percentage: number) => {
    if (percentage >= 100) return 'bg-emerald-500'
    if (percentage >= 80) return 'bg-yellow-500'  
    if (percentage >= 60) return 'bg-blue-500'
    return 'bg-slate-500'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <CheckCircle className="w-4 h-4 text-emerald-400" />
    if (percentage >= 80) return <TrendingUp className="w-4 h-4 text-yellow-400" />
    return <AlertCircle className="w-4 h-4 text-slate-400" />
  }

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
            Metas do Mês
          </h2>
          <div className="flex items-center space-x-2 mt-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
        
        <Button onClick={loadMetas} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-sm text-muted-foreground">Metas Atingidas</p>
                <p className="text-2xl font-bold text-foreground">
                  {metas.filter(m => m.percentual >= 100).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-sm text-muted-foreground">Próximo ao Alvo</p>
                <p className="text-2xl font-bold text-foreground">
                  {metas.filter(m => m.percentual >= 80 && m.percentual < 100).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-r from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Metas</p>
                <p className="text-2xl font-bold text-foreground">
                  {metas.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metas.map((meta) => {
          const categoria = categorias[meta.categoria as keyof typeof categorias]
          if (!categoria) return null

          const Icon = categoria.icon

          return (
            <Card 
              key={meta.id} 
              className={clsx(
                "border-0 bg-card/50 backdrop-blur-sm group transition-all duration-300",
                meta.editando && "ring-2 ring-primary shadow-lg"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={clsx(
                      "p-2 rounded-xl",
                      `bg-${categoria.color}-500/10`
                    )}>
                      <Icon className={`w-5 h-5 text-${categoria.color}-400`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {categoria.label}
                      </CardTitle>
                      {meta.usuario ? (
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {meta.usuario.funcao}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {meta.usuario.nome}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs mt-1">
                          Meta da Equipe
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(meta.percentual)}
                    {!meta.editando && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(meta.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Meta Value */}
                {meta.editando ? (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Nova Meta</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={meta.novoValor || ''}
                        onChange={(e) => setMetas(prev => prev.map(m => 
                          m.id === meta.id 
                            ? { ...m, novoValor: parseFloat(e.target.value) || 0 }
                            : m
                        ))}
                        className="flex-1"
                        placeholder="Digite o novo valor"
                      />
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          onClick={() => handleSave(meta.id)}
                          disabled={salvando === meta.id}
                        >
                          {salvando === meta.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(meta.id)}
                          disabled={salvando === meta.id}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Progress Display */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Progresso</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatValue(meta.valor_atual, meta.categoria)} / {formatValue(meta.valor_meta, meta.categoria)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                      <div 
                        className={clsx(
                          "h-3 rounded-full transition-all duration-700 ease-out",
                          getProgressBg(meta.percentual)
                        )}
                        style={{ width: `${Math.min(meta.percentual, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={clsx(
                        "text-xl font-bold",
                        getProgressColor(meta.percentual)
                      )}>
                        {meta.percentual.toFixed(1)}%
                      </span>
                      
                      {meta.percentual >= 100 ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <Zap className="w-3 h-3 mr-1" />
                          Concluída!
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={clsx(
                          meta.percentual >= 80 ? "text-yellow-400 border-yellow-400/20" :
                          meta.percentual >= 60 ? "text-blue-400 border-blue-400/20" :
                          "text-slate-400 border-slate-400/20"
                        )}>
                          Restam {formatValue(meta.valor_meta - meta.valor_atual, meta.categoria)}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}