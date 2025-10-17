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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  DollarSign,
  Percent,
  TrendingUp,
  Users,
  Settings,
  Save,
  RefreshCw,
  Award,
  Target,
  Zap,
  Calculator,
  PiggyBank,
  Crown,
  Star
} from 'lucide-react'
import clsx from 'clsx'

interface ComissaoConfig {
  id?: string
  user_id: string
  tipo: 'percentual' | 'fixo' | 'escalonado'
  
  // Percentual simples
  percentual_base?: number
  
  // Valor fixo
  valor_fixo_por_venda?: number
  
  // Sistema escalonado
  escalas?: {
    min_vendas: number
    max_vendas: number
    percentual: number
    bonus_extra?: number
  }[]
  
  // Bônus
  bonus_meta_mensal?: number
  bonus_meta_trimestral?: number
  bonus_top_performer?: number
  
  // Configurações especiais
  comissao_lider_equipe?: number
  comissao_indicacao?: number
  
  ativa: boolean
  created_at?: string
  updated_at?: string
}

interface Usuario {
  id: string
  nome: string
  funcao: 'sdr' | 'closer' | 'admin'
}

export function CommissionManager() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [config, setConfig] = useState<ComissaoConfig>({
    user_id: '',
    tipo: 'percentual',
    percentual_base: 5,
    ativa: true,
    escalas: [
      { min_vendas: 0, max_vendas: 10, percentual: 3, bonus_extra: 0 },
      { min_vendas: 11, max_vendas: 25, percentual: 5, bonus_extra: 200 },
      { min_vendas: 26, max_vendas: 50, percentual: 7, bonus_extra: 500 },
      { min_vendas: 51, max_vendas: 999, percentual: 10, bonus_extra: 1000 }
    ]
  })
  const [loading, setLoading] = useState(false)
  const [simulacao, setSimulacao] = useState({
    vendas_mes: 15,
    valor_medio_venda: 2500,
    posicao_ranking: 3
  })

  useEffect(() => {
    loadUsuarios()
    if (user) {
      setSelectedUser(user.id)
    }
  }, [user])

  useEffect(() => {
    if (selectedUser) {
      loadConfigComissao(selectedUser)
    }
  }, [selectedUser])

  const loadUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nome, funcao')
        .in('funcao', user?.funcao === 'admin' ? ['sdr', 'closer'] : [user?.funcao || ''])
        .order('nome')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const loadConfigComissao = async (userId: string) => {
    try {
      setLoading(true)
      
      // Aqui carregaria a configuração do banco
      // Por now, usando configuração padrão
      setConfig(prev => ({
        ...prev,
        user_id: userId
      }))
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      setLoading(true)
      
      // Aqui salvaria a configuração no banco
      console.log('Salvando configuração:', config)
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularSimulacao = () => {
    const faturamentoTotal = simulacao.vendas_mes * simulacao.valor_medio_venda
    let comissaoBase = 0
    let bonusTotal = 0

    switch (config.tipo) {
      case 'percentual':
        comissaoBase = faturamentoTotal * ((config.percentual_base || 0) / 100)
        break
        
      case 'fixo':
        comissaoBase = simulacao.vendas_mes * (config.valor_fixo_por_venda || 0)
        break
        
      case 'escalonado':
        if (config.escalas) {
          const escala = config.escalas.find(e => 
            simulacao.vendas_mes >= e.min_vendas && simulacao.vendas_mes <= e.max_vendas
          )
          if (escala) {
            comissaoBase = faturamentoTotal * (escala.percentual / 100)
            bonusTotal += escala.bonus_extra || 0
          }
        }
        break
    }

    // Bônus adicionais
    if (simulacao.vendas_mes >= 20 && config.bonus_meta_mensal) {
      bonusTotal += config.bonus_meta_mensal
    }

    if (simulacao.posicao_ranking <= 3 && config.bonus_top_performer) {
      bonusTotal += config.bonus_top_performer
    }

    return {
      comissaoBase,
      bonusTotal,
      comissaoTotal: comissaoBase + bonusTotal,
      faturamentoTotal
    }
  }

  const resultado = calcularSimulacao()
  const selectedUserData = usuarios.find(u => u.id === selectedUser)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
            Sistema de Comissões
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure comissões personalizadas e simule resultados
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          <Button onClick={handleSaveConfig} disabled={loading}>
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configuração
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Configuração */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <span>Configuração de Comissões</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de Comissão */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Tipo de Comissão</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'percentual', label: 'Percentual', icon: Percent, desc: 'Porcentagem sobre vendas' },
                    { value: 'fixo', label: 'Valor Fixo', icon: DollarSign, desc: 'Valor fixo por venda' },
                    { value: 'escalonado', label: 'Escalonado', icon: TrendingUp, desc: 'Escala por performance' }
                  ].map((tipo) => (
                    <Card
                      key={tipo.value}
                      className={clsx(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        config.tipo === tipo.value 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setConfig({ ...config, tipo: tipo.value as any })}
                    >
                      <CardContent className="p-4 text-center">
                        <tipo.icon className={clsx(
                          "w-8 h-8 mx-auto mb-2",
                          config.tipo === tipo.value ? "text-primary" : "text-muted-foreground"
                        )} />
                        <h4 className="font-semibold text-sm">{tipo.label}</h4>
                        <p className="text-xs text-muted-foreground">{tipo.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Configuração Específica */}
              {config.tipo === 'percentual' && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Percentual Base</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={config.percentual_base || 0}
                      onChange={(e) => setConfig({
                        ...config,
                        percentual_base: parseFloat(e.target.value) || 0
                      })}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">% sobre o faturamento</span>
                  </div>
                </div>
              )}

              {config.tipo === 'fixo' && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Valor por Venda</Label>
                  <div className="flex items-center space-x-3">
                    <span className="text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      min="0"
                      value={config.valor_fixo_por_venda || 0}
                      onChange={(e) => setConfig({
                        ...config,
                        valor_fixo_por_venda: parseFloat(e.target.value) || 0
                      })}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">por venda fechada</span>
                  </div>
                </div>
              )}

              {config.tipo === 'escalonado' && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Escala de Comissões</Label>
                  <div className="space-y-3">
                    {config.escalas?.map((escala, index) => (
                      <Card key={index} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                            <div>
                              <Label className="text-xs">Vendas (min)</Label>
                              <Input
                                type="number"
                                value={escala.min_vendas}
                                onChange={(e) => {
                                  const novasEscalas = [...(config.escalas || [])]
                                  novasEscalas[index] = {
                                    ...escala,
                                    min_vendas: parseInt(e.target.value) || 0
                                  }
                                  setConfig({ ...config, escalas: novasEscalas })
                                }}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Vendas (máx)</Label>
                              <Input
                                type="number"
                                value={escala.max_vendas}
                                onChange={(e) => {
                                  const novasEscalas = [...(config.escalas || [])]
                                  novasEscalas[index] = {
                                    ...escala,
                                    max_vendas: parseInt(e.target.value) || 0
                                  }
                                  setConfig({ ...config, escalas: novasEscalas })
                                }}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Percentual (%)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={escala.percentual}
                                onChange={(e) => {
                                  const novasEscalas = [...(config.escalas || [])]
                                  novasEscalas[index] = {
                                    ...escala,
                                    percentual: parseFloat(e.target.value) || 0
                                  }
                                  setConfig({ ...config, escalas: novasEscalas })
                                }}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Bônus (R$)</Label>
                              <Input
                                type="number"
                                value={escala.bonus_extra || 0}
                                onChange={(e) => {
                                  const novasEscalas = [...(config.escalas || [])]
                                  novasEscalas[index] = {
                                    ...escala,
                                    bonus_extra: parseFloat(e.target.value) || 0
                                  }
                                  setConfig({ ...config, escalas: novasEscalas })
                                }}
                                className="h-8"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Bônus Extras */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Bônus Adicionais</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Bônus Meta Mensal</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        value={config.bonus_meta_mensal || 0}
                        onChange={(e) => setConfig({
                          ...config,
                          bonus_meta_mensal: parseFloat(e.target.value) || 0
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Bônus Top 3</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        value={config.bonus_top_performer || 0}
                        onChange={(e) => setConfig({
                          ...config,
                          bonus_top_performer: parseFloat(e.target.value) || 0
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simulador */}
        <div className="space-y-6">
          <Card className="border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-primary" />
                <span>Simulador</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Vendas no Mês</Label>
                <Input
                  type="number"
                  value={simulacao.vendas_mes}
                  onChange={(e) => setSimulacao({
                    ...simulacao,
                    vendas_mes: parseInt(e.target.value) || 0
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Valor Médio por Venda</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    value={simulacao.valor_medio_venda}
                    onChange={(e) => setSimulacao({
                      ...simulacao,
                      valor_medio_venda: parseFloat(e.target.value) || 0
                    })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm">Posição no Ranking</Label>
                <Select 
                  value={simulacao.posicao_ranking.toString()}
                  onValueChange={(value) => setSimulacao({
                    ...simulacao,
                    posicao_ranking: parseInt(value)
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}º lugar
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PiggyBank className="w-5 h-5 text-emerald-500" />
                <span>Resultado</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Faturamento Total</span>
                  <span className="font-semibold">
                    {resultado.faturamentoTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Comissão Base</span>
                  <span className="font-semibold text-blue-400">
                    {resultado.comissaoBase.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bônus Total</span>
                  <span className="font-semibold text-yellow-400">
                    {resultado.bonusTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total a Receber</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {resultado.comissaoTotal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((resultado.comissaoTotal / resultado.faturamentoTotal) * 100).toFixed(1)}% do faturamento
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}