'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Target,
  DollarSign,
  Save,
  Plus,
  Trash2,
  TrendingUp,
  Calendar,
  Building
} from 'lucide-react'
import clsx from 'clsx'

interface MetaGeral {
  id?: string
  tipo: 'individual' | 'equipe' | 'empresa'
  categoria: 'leads' | 'vendas' | 'faturamento' | 'equipe' | 'evento'
  valor_meta: number
  periodo: 'diaria' | 'semanal' | 'mensal' | 'anual'
  data_inicio: string
  data_fim: string
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada'
}

export function MetasGeraisConfig() {
  const [metas, setMetas] = useState<MetaGeral[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [novaMeta, setNovaMeta] = useState<MetaGeral>({
    tipo: 'empresa',
    categoria: 'faturamento',
    valor_meta: 0,
    periodo: 'mensal',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    status: 'ativa'
  })

  const categorias = {
    leads: { label: 'Leads Gerados', icon: Target, color: 'blue' },
    vendas: { label: 'Vendas Fechadas', icon: TrendingUp, color: 'green' },
    faturamento: { label: 'Faturamento', icon: DollarSign, color: 'emerald' },
    equipe: { label: 'Crescimento Equipe', icon: Building, color: 'purple' },
    evento: { label: 'Eventos Realizados', icon: Calendar, color: 'orange' }
  }

  const periodos = {
    diaria: 'Diária',
    semanal: 'Semanal', 
    mensal: 'Mensal',
    anual: 'Anual'
  }

  const loadMetas = useCallback(async () => {
    try {
      setLoading(true)

      // Carregar metas da tabela metas_gerais (novas metas da empresa)
      const { data: metasEmpresa, error: errorEmpresa } = await supabase
        .from('metas_gerais')
        .select('*')
        .order('tipo', { ascending: true })

      // Carregar metas da tabela metas (metas antigas individuais/equipe)
      const { data: metasIndividuais, error: errorIndividuais } = await supabase
        .from('metas')
        .select('*')
        .in('tipo', ['individual', 'equipe'])
        .order('periodo', { ascending: true })

      if (errorEmpresa) {
        console.error('Erro ao buscar metas da empresa:', errorEmpresa)
      }

      if (errorIndividuais) {
        console.error('Erro ao buscar metas individuais:', errorIndividuais)
      }

      // Combinar e transformar dados
      const metasTransformadas = [
        ...(metasEmpresa || []).map(meta => ({
          id: meta.id,
          tipo: 'empresa' as const,
          categoria: meta.categoria,
          valor_meta: meta.valor_meta,
          periodo: meta.tipo, // tipo vira periodo (diario, semanal, etc)
          data_inicio: meta.data_inicio,
          data_fim: meta.data_fim,
          status: meta.status
        })),
        ...(metasIndividuais || [])
      ]

      setMetas(metasTransformadas)
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMetas()
  }, [loadMetas])

  const salvarMeta = async () => {
    if (!novaMeta.valor_meta || novaMeta.valor_meta <= 0) {
      alert('Digite um valor válido para a meta')
      return
    }

    try {
      setSalvando(true)

      if (novaMeta.tipo === 'empresa') {
        // Salvar na tabela metas_gerais
        const { error } = await supabase
          .from('metas_gerais')
          .insert([{
            tipo: novaMeta.periodo, // periodo vira tipo (diario, semanal, etc)
            categoria: novaMeta.categoria,
            valor_meta: novaMeta.valor_meta,
            data_inicio: novaMeta.data_inicio,
            data_fim: novaMeta.data_fim,
            status: novaMeta.status,
            descricao: `Meta ${novaMeta.periodo} de ${novaMeta.categoria} da empresa`
          }])

        if (error) {
          console.error('Erro ao salvar meta da empresa:', error)
          alert('Erro ao salvar meta da empresa. Verifique o console.')
          return
        }
      } else {
        // Salvar na tabela metas (individuais/equipe)
        const { error } = await supabase
          .from('metas')
          .insert([{
            ...novaMeta,
            user_id: null // Meta geral da equipe
          }])

        if (error) {
          console.error('Erro ao salvar meta:', error)
          alert('Erro ao salvar meta. Verifique o console.')
          return
        }
      }

      // Reset form
      setNovaMeta({
        tipo: 'empresa',
        categoria: 'faturamento',
        valor_meta: 0,
        periodo: 'mensal',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        status: 'ativa'
      })

      // Reload metas
      await loadMetas()
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    } finally {
      setSalvando(false)
    }
  }

  const deletarMeta = async (id: string, tipo: string) => {
    if (!confirm('Tem certeza que deseja deletar esta meta?')) return

    try {
      if (tipo === 'empresa') {
        // Deletar da tabela metas_gerais
        const { error } = await supabase
          .from('metas_gerais')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Erro ao deletar meta da empresa:', error)
          return
        }
      } else {
        // Deletar da tabela metas
        const { error } = await supabase
          .from('metas')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Erro ao deletar meta:', error)
          return
        }
      }

      await loadMetas()
    } catch (error) {
      console.error('Erro ao deletar meta:', error)
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
    if (categoria === 'evento') {
      return `${value.toLocaleString('pt-BR')} evento${value !== 1 ? 's' : ''}`
    }
    return value.toLocaleString('pt-BR')
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
      <div>
        <h2 className="text-3xl font-semibold text-foreground tracking-tight">
          Metas Gerais da Empresa
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure metas globais que aparecerão no dashboard principal para todos
        </p>
      </div>

      {/* Formulário para Nova Meta */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Adicionar Nova Meta Geral</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Tipo de Meta</Label>
              <select
                value={novaMeta.tipo}
                onChange={(e) => setNovaMeta(prev => ({ ...prev, tipo: e.target.value as 'individual' | 'equipe' | 'empresa' }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                <option value="empresa">Meta da Empresa</option>
                <option value="equipe">Meta de Equipe</option>
                <option value="individual">Meta Individual</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Categoria</Label>
              <select
                value={novaMeta.categoria}
                onChange={(e) => setNovaMeta(prev => ({ ...prev, categoria: e.target.value as 'leads' | 'vendas' | 'faturamento' | 'equipe' | 'evento' }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                {Object.entries(categorias).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Período</Label>
              <select
                value={novaMeta.periodo}
                onChange={(e) => setNovaMeta(prev => ({ ...prev, periodo: e.target.value as 'diaria' | 'semanal' | 'mensal' | 'anual' }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
              >
                {Object.entries(periodos).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Valor da Meta</Label>
              <Input
                type="number"
                value={novaMeta.valor_meta || ''}
                onChange={(e) => setNovaMeta(prev => ({ ...prev, valor_meta: parseFloat(e.target.value) || 0 }))}
                placeholder="Ex: 50000, 1000000"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Data Início</Label>
              <Input
                type="date"
                value={novaMeta.data_inicio}
                onChange={(e) => setNovaMeta(prev => ({ ...prev, data_inicio: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Data Fim</Label>
              <Input
                type="date"
                value={novaMeta.data_fim}
                onChange={(e) => setNovaMeta(prev => ({ ...prev, data_fim: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={salvarMeta}
                disabled={salvando || !novaMeta.valor_meta}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {salvando ? 'Salvando...' : 'Salvar Meta'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Metas Existentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metas.map((meta) => {
          const categoria = categorias[meta.categoria]
          const Icon = categoria.icon

          return (
            <Card 
              key={meta.id}
              className="border-0 bg-card/50 backdrop-blur-sm group transition-all duration-300 hover:shadow-lg"
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
                      <Badge variant="outline" className="text-xs mt-1 capitalize">
                        {periodos[meta.periodo]}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => meta.id && deletarMeta(meta.id, meta.tipo)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Meta</span>
                    <span className="font-bold text-foreground text-lg">
                      {formatValue(meta.valor_meta, meta.categoria)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(meta.data_inicio).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-muted-foreground">
                      até {new Date(meta.data_fim).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {metas.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Nenhuma meta geral configurada
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Configure metas como &ldquo;R$ 50K por semana&rdquo; ou &ldquo;R$ 1M por mês&rdquo; para motivar a equipe
          </p>
        </div>
      )}
    </div>
  )
}