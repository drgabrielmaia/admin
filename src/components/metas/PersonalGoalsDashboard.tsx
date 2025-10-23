'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ModernChart } from '@/components/charts/ModernChart'
import {
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Phone,
  Settings,
  Save,
  X,
  Award,
  Clock,
  Activity,
  Building,
  BookOpen,
  Monitor,
  Handshake,
  Factory,
  LucideIcon
} from 'lucide-react'
import clsx from 'clsx'

interface PersonalMeta {
  id?: string
  user_id: string
  categoria: 'leads' | 'vendas' | 'faturamento' | 'comissao'
  motor_negocio?: 'mentoria' | 'real_estate' | 'saas' | 'infoprodutos' | 'fisicos' | 'clinicas' | 'parcerias' | 'todos'
  valor_meta_diaria: number
  valor_meta_mensal: number
  valor_meta_anual: number
  valor_atual_dia: number
  valor_atual_mes: number
  valor_atual_ano: number
  comissao_personalizada?: number
  periodo_ativo: 'diario' | 'mensal' | 'anual'
  created_at?: string
  updated_at?: string
}

interface MotorNegocio {
  key: string
  label: string
  icon: LucideIcon
  color: string
  description: string
}

interface CategoriaItem {
  key: string
  label: string
  icon: LucideIcon
  color: string
  suffix: string
  description: string
}

interface Usuario {
  id: string
  nome: string
  funcao: 'sdr' | 'closer' | 'admin'
}

export function PersonalGoalsDashboard() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [metas, setMetas] = useState<PersonalMeta[]>([])
  const [editingMeta, setEditingMeta] = useState<PersonalMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'diario' | 'mensal' | 'anual'>('mensal')
  const [selectedEngine, setSelectedEngine] = useState<string>('todos')
  const [metasPorMotor, setMetasPorMotor] = useState<Record<string, PersonalMeta[]>>({})

  const motoresNegocio: MotorNegocio[] = useMemo(() => [
    {
      key: 'todos',
      label: 'Todos os Motores',
      icon: Factory,
      color: 'gray',
      description: 'Visão geral de todos os motores'
    },
    {
      key: 'mentoria',
      label: 'Mentoria',
      icon: BookOpen,
      color: 'green',
      description: 'Programas de mentoria 1:1 e grupos'
    },
    {
      key: 'real_estate',
      label: 'Real Estate',
      icon: Building,
      color: 'blue',
      description: 'Investimentos imobiliários e fundos'
    },
    {
      key: 'saas',
      label: 'SaaS',
      icon: Monitor,
      color: 'purple',
      description: 'Software como Serviço'
    },
    {
      key: 'infoprodutos',
      label: 'Infoprodutos',
      icon: Award,
      color: 'orange',
      description: 'Cursos e produtos digitais'
    },
    {
      key: 'fisicos',
      label: 'Produtos Físicos',
      icon: Factory,
      color: 'yellow',
      description: 'Produtos tangíveis e mercadorias'
    },
    {
      key: 'clinicas',
      label: 'Clínicas',
      icon: Phone,
      color: 'red',
      description: 'Serviços médicos e de saúde'
    },
    {
      key: 'parcerias',
      label: 'Parcerias',
      icon: Handshake,
      color: 'indigo',
      description: 'Parcerias estratégicas e afiliados'
    }
  ], [])

  const categorias: CategoriaItem[] = useMemo(() => [
    {
      key: 'leads',
      label: 'Leads Gerados',
      icon: Users,
      color: 'blue',
      suffix: '',
      description: 'Total de leads qualificados'
    },
    {
      key: 'vendas', 
      label: 'Vendas Fechadas',
      icon: Target,
      color: 'green',
      suffix: '',
      description: 'Número de vendas convertidas'
    },
    {
      key: 'faturamento',
      label: 'Faturamento',
      icon: DollarSign,
      color: 'emerald',
      suffix: 'R$',
      description: 'Receita total gerada'
    },
    {
      key: 'comissao',
      label: 'Comissão',
      icon: TrendingUp,
      color: 'purple',
      suffix: 'R$',
      description: 'Comissões acumuladas'
    }
  ], [])

  const loadUsuarios = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nome, funcao')
        .in('funcao', ['sdr', 'closer', 'admin'])
        .order('nome')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }, [])

  useEffect(() => {
    loadUsuarios()
    if (user) {
      setSelectedUser(user.id)
    }
  }, [user, loadUsuarios])

  const loadMetas = useCallback(async (userId: string) => {

    try {
      setLoading(true)
      
      // Buscar metas individuais reais do banco
      const { data: metasIndividuais, error } = await supabase
        .from('metas_individuais')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Erro ao buscar metas individuais:', error)
      }

      // Criar estrutura de metas por motor
      const metasPorMotorTemp: Record<string, PersonalMeta[]> = {}
      
      motoresNegocio.forEach(motor => {
        metasPorMotorTemp[motor.key] = categorias.map(cat => {
          const metaExistente = metasIndividuais?.find(m => 
            m.categoria === cat.key && 
            (motor.key === 'todos' || m.motor_negocio === motor.key)
          )
          
          if (metaExistente) {
            return {
              id: metaExistente.id,
              user_id: userId,
              categoria: cat.key as PersonalMeta['categoria'],
              motor_negocio: metaExistente.motor_negocio || 'todos',
              valor_meta_diaria: metaExistente.valor_meta_diaria || 0,
              valor_meta_mensal: metaExistente.valor_meta_mensal || 0,
              valor_meta_anual: metaExistente.valor_meta_anual || 0,
              valor_atual_dia: metaExistente.valor_atual_dia || 0,
              valor_atual_mes: metaExistente.valor_atual_mes || 0,
              valor_atual_ano: metaExistente.valor_atual_ano || 0,
              comissao_personalizada: metaExistente.comissao_personalizada,
              periodo_ativo: metaExistente.periodo_ativo || 'mensal'
            }
          }

          // Meta padrão para novos usuários (não salva automaticamente)
          const userData = usuarios.find(u => u.id === userId)
          const isCloser = userData?.funcao === 'closer'
          const isSDR = userData?.funcao === 'sdr'
          
          // Valores base por categoria
          const getDefaultValue = (categoria: string, periodo: 'diario' | 'mensal' | 'anual') => {
            const multiplier = motor.key === 'mentoria' ? 2 : 
                             motor.key === 'real_estate' ? 1.5 : 
                             motor.key === 'saas' ? 1.2 : 1
            
            const base = {
              leads: {
                diario: isSDR ? 10 : 5,
                mensal: isSDR ? 300 : 150,
                anual: isSDR ? 3600 : 1800
              },
              vendas: {
                diario: isCloser ? 3 : 1,
                mensal: isCloser ? 90 : 30,
                anual: isCloser ? 1080 : 360
              },
              faturamento: {
                diario: isCloser ? 15000 : 5000,
                mensal: isCloser ? 450000 : 150000,
                anual: isCloser ? 5400000 : 1800000
              },
              comissao: {
                diario: 500,
                mensal: 15000,
                anual: 180000
              }
            }
            
            return Math.round((base[categoria as keyof typeof base]?.[periodo] || 0) * multiplier)
          }

          
          return {
            user_id: userId,
            categoria: cat.key as PersonalMeta['categoria'],
            motor_negocio: motor.key as PersonalMeta['motor_negocio'],
            valor_meta_diaria: getDefaultValue(cat.key, 'diario'),
            valor_meta_mensal: getDefaultValue(cat.key, 'mensal'),
            valor_meta_anual: getDefaultValue(cat.key, 'anual'),
            valor_atual_dia: 0, // Será preenchido depois
            valor_atual_mes: 0, // Será preenchido depois
            valor_atual_ano: 0, // Será preenchido depois
            comissao_personalizada: cat.key === 'comissao' ? 0.05 : undefined,
            periodo_ativo: 'mensal'
          }
        })
      })
      
      // Carregar valores reais para metas que não existem no banco
      for (const motor of motoresNegocio) {
        for (let i = 0; i < metasPorMotorTemp[motor.key].length; i++) {
          const meta = metasPorMotorTemp[motor.key][i]
          if (!meta.id) { // Se não existe no banco, buscar valores reais
            try {
              const [valorDia, valorMes, valorAno] = await Promise.all([
                getValorReal(meta.categoria, 'dia'),
                getValorReal(meta.categoria, 'mes'),
                getValorReal(meta.categoria, 'ano')
              ])

              metasPorMotorTemp[motor.key][i] = {
                ...meta,
                valor_atual_dia: valorDia,
                valor_atual_mes: valorMes,
                valor_atual_ano: valorAno
              }
            } catch (error) {
              console.error(`Erro ao carregar valores reais para ${meta.categoria}:`, error)
            }
          }
        }
      }

      setMetasPorMotor(metasPorMotorTemp)
      setMetas(metasPorMotorTemp[selectedEngine] || [])

      // Função local para buscar valores reais
      async function getValorReal(categoria: string, periodo: 'dia' | 'mes' | 'ano') {
        try {
          const functionName = 
            categoria === 'leads' ? 'get_user_leads_count' :
            categoria === 'vendas' ? 'get_user_vendas_count' :
            categoria === 'faturamento' ? 'get_user_faturamento' :
            categoria === 'comissao' ? 'get_user_comissao' : null

          if (!functionName) return 0

          const { data, error } = await supabase.rpc(functionName, {
            user_id_param: userId,
            periodo_param: periodo
          })

          if (error) {
            console.error(`Erro ao buscar ${categoria} para ${periodo}:`, error)
            return 0
          }

          return data || 0
        } catch (error) {
          console.error(`Erro na função ${categoria}:`, error)
          return 0
        }
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }, [usuarios, selectedEngine, categorias, motoresNegocio])

  useEffect(() => {
    if (selectedUser) {
      loadMetas(selectedUser)
    }
  }, [selectedUser, loadMetas])

  useEffect(() => {
    if (metasPorMotor[selectedEngine]) {
      setMetas(metasPorMotor[selectedEngine])
    }
  }, [selectedEngine, metasPorMotor])

  const handleSaveMeta = async (meta: PersonalMeta) => {
    try {
      if (meta.id) {
        // Atualizar meta existente
        const { error } = await supabase
          .from('metas_individuais')
          .update({
            valor_meta_diaria: meta.valor_meta_diaria,
            valor_meta_mensal: meta.valor_meta_mensal,
            valor_meta_anual: meta.valor_meta_anual,
            comissao_personalizada: meta.comissao_personalizada,
            periodo_ativo: meta.periodo_ativo
          })
          .eq('id', meta.id)

        if (error) throw error
      } else {
        // Criar nova meta
        const { error } = await supabase
          .from('metas_individuais')
          .insert([{
            user_id: meta.user_id,
            categoria: meta.categoria,
            motor_negocio: meta.motor_negocio,
            valor_meta_diaria: meta.valor_meta_diaria,
            valor_meta_mensal: meta.valor_meta_mensal,
            valor_meta_anual: meta.valor_meta_anual,
            comissao_personalizada: meta.comissao_personalizada,
            periodo_ativo: meta.periodo_ativo
          }])

        if (error) throw error
      }

      // Recarregar metas
      if (selectedUser) {
        await loadMetas(selectedUser)
      }
      setEditingMeta(null)
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
      alert('Erro ao salvar meta. Verifique o console.')
    }
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

  const formatValue = (value: number, categoria: string) => {
    if (categoria === 'faturamento' || categoria === 'comissao') {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
    return value.toLocaleString('pt-BR')
  }

  const getChartData = () => {
    const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const metaAtual = metas.find(m => m.categoria === 'vendas')
    
    if (!metaAtual) return { labels: [], datasets: [] }

    const metaMensal = metaAtual.valor_meta_mensal
    const progressoAtual = Math.random() * metaMensal

    return {
      labels,
      datasets: [
        {
          label: 'Meta Mensal',
          data: Array(12).fill(metaMensal),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderDash: [5, 5],
          tension: 0.1,
          fill: false,
        },
        {
          label: 'Performance Real',
          data: labels.map((_, index) => {
            if (index < 8) return Math.random() * metaMensal * 1.2
            if (index === 8) return progressoAtual
            return 0
          }),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ],
    }
  }

  const selectedUserData = usuarios.find(u => u.id === selectedUser)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
            Metas Pessoais
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure e acompanhe metas personalizadas por período
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {user?.funcao === 'admin' && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecionar usuário" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map(usuario => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {usuario.funcao}
                      </Badge>
                      <span>{usuario.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Filtro por Motor de Negócio */}
          <Select value={selectedEngine} onValueChange={setSelectedEngine}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecionar motor" />
            </SelectTrigger>
            <SelectContent>
              {motoresNegocio.map(motor => {
                const Icon = motor.icon
                return (
                  <SelectItem key={motor.key} value={motor.key}>
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{motor.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          
          <div className="flex items-center rounded-lg bg-muted p-1">
            {(['diario', 'mensal', 'anual'] as const).map((view) => (
              <Button
                key={view}
                variant={activeView === view ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView(view)}
                className={clsx(
                  "capitalize",
                  activeView === view && "bg-background shadow-sm"
                )}
              >
                {view === 'diario' && <Clock className="w-4 h-4 mr-1" />}
                {view === 'mensal' && <Calendar className="w-4 h-4 mr-1" />}
                {view === 'anual' && <Award className="w-4 h-4 mr-1" />}
                {view === 'diario' ? 'Diária' : view === 'mensal' ? 'Mensal' : 'Anual'}
              </Button>
            ))}
          </div>
        </div>
      </div>


      {selectedUserData && (
        <>
          {/* User Info Card */}
          <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {selectedUserData.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{selectedUserData.nome}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="capitalize">
                        {selectedUserData.funcao}
                      </Badge>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        Visualizando metas {activeView === 'diario' ? 'diárias' : activeView === 'mensal' ? 'mensais' : 'anuais'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Motor Badge */}
                <div className="flex items-center space-x-2">
                  {(() => {
                    const motorAtual = motoresNegocio.find(m => m.key === selectedEngine)
                    if (!motorAtual) return null
                    const Icon = motorAtual.icon
                    return (
                      <Badge className={`bg-${motorAtual.color}-500/10 text-${motorAtual.color}-400 border-${motorAtual.color}-500/20`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {motorAtual.label}
                      </Badge>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Evolução de Performance
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comparativo entre metas e resultados reais
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <Activity className="w-3 h-3 mr-1" />
                    {activeView === 'mensal' ? 'Mensal' : activeView === 'diario' ? 'Diário' : 'Anual'}
                  </Badge>
                  {(() => {
                    const motorAtual = motoresNegocio.find(m => m.key === selectedEngine)
                    if (!motorAtual) return null
                    const Icon = motorAtual.icon
                    return (
                      <Badge className={`bg-${motorAtual.color}-500/10 text-${motorAtual.color}-400 border-${motorAtual.color}-500/20`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {motorAtual.label}
                      </Badge>
                    )
                  })()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ModernChart 
                type="line" 
                data={getChartData()} 
                height={350}
              />
            </CardContent>
          </Card>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metas.map((meta) => {
              const categoria = categorias.find(c => c.key === meta.categoria)
              if (!categoria) return null

              const Icon = categoria.icon
              const valorMeta = activeView === 'diario' ? meta.valor_meta_diaria 
                            : activeView === 'mensal' ? meta.valor_meta_mensal 
                            : meta.valor_meta_anual
              const valorAtual = activeView === 'diario' ? meta.valor_atual_dia 
                               : activeView === 'mensal' ? meta.valor_atual_mes 
                               : meta.valor_atual_ano
              const percentage = (valorAtual / valorMeta) * 100

              return (
                <Card key={meta.categoria} className="border-0 bg-card/50 backdrop-blur-sm group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={clsx(
                          "p-2 rounded-xl transition-all duration-200 group-hover:scale-110",
                          `bg-${categoria.color}-500/10`
                        )}>
                          <Icon className={`w-5 h-5 text-${categoria.color}-400`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-foreground">
                            {categoria.label}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {categoria.description}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMeta(meta)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Progress Display */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Progresso</span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatValue(valorAtual, meta.categoria)} / {formatValue(valorMeta, meta.categoria)}
                        </span>
                      </div>
                      
                      <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                        <div 
                          className={clsx(
                            "h-3 rounded-full transition-all duration-700 ease-out",
                            getProgressBg(percentage)
                          )}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={clsx(
                          "text-lg font-bold",
                          getProgressColor(percentage)
                        )}>
                          {percentage.toFixed(1)}%
                        </span>
                        {percentage >= 100 && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            <Award className="w-3 h-3 mr-1" />
                            Meta Atingida!
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Custom Commission */}
                    {meta.categoria === 'comissao' && meta.comissao_personalizada && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Comissão personalizada</span>
                          <span className="text-sm font-semibold text-foreground">
                            {(meta.comissao_personalizada * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingMeta(null)} />
          <Card className="relative w-full max-w-md mx-4 border-0 bg-card shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Editar Meta</span>
                <Button variant="ghost" size="sm" onClick={() => setEditingMeta(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label>Meta Diária</Label>
                  <Input
                    type="number"
                    value={editingMeta.valor_meta_diaria}
                    onChange={(e) => setEditingMeta({
                      ...editingMeta,
                      valor_meta_diaria: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label>Meta Mensal</Label>
                  <Input
                    type="number"
                    value={editingMeta.valor_meta_mensal}
                    onChange={(e) => setEditingMeta({
                      ...editingMeta,
                      valor_meta_mensal: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label>Meta Anual</Label>
                  <Input
                    type="number"
                    value={editingMeta.valor_meta_anual}
                    onChange={(e) => setEditingMeta({
                      ...editingMeta,
                      valor_meta_anual: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                {editingMeta.categoria === 'comissao' && (
                  <div>
                    <Label>Comissão Personalizada (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      max="1"
                      value={editingMeta.comissao_personalizada || 0}
                      onChange={(e) => setEditingMeta({
                        ...editingMeta,
                        comissao_personalizada: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleSaveMeta(editingMeta)}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingMeta(null)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}