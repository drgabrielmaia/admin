'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Plus, Loader2, Target } from 'lucide-react'

export function MetaSemanalLeadsSetup() {
  const [metaExists, setMetaExists] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkMetaSemanalLeads()
  }, [])

  const checkMetaSemanalLeads = async () => {
    try {
      setChecking(true)
      
      const { data, error } = await supabase
        .from('metas_gerais')
        .select('id')
        .eq('tipo', 'semanal')
        .eq('categoria', 'leads')
        .eq('status', 'ativa')

      if (error) {
        console.error('Erro ao verificar meta semanal de leads:', error)
        return
      }

      setMetaExists(data && data.length > 0)
    } catch (error) {
      console.error('Erro ao verificar meta:', error)
    } finally {
      setChecking(false)
    }
  }

  const createMetaSemanalLeads = async () => {
    try {
      setLoading(true)

      // Calcular datas da semana atual
      const hoje = new Date()
      const primeiroDiaSemana = new Date(hoje)
      primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay()) // Domingo
      
      const ultimoDiaSemana = new Date(primeiroDiaSemana)
      ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6) // Sábado

      const metaData = {
        tipo: 'semanal',
        categoria: 'leads',
        valor_meta: 140,
        data_inicio: primeiroDiaSemana.toISOString().split('T')[0],
        data_fim: ultimoDiaSemana.toISOString().split('T')[0],
        descricao: 'Meta semanal de leads gerados',
        status: 'ativa'
      }

      const { error } = await supabase
        .from('metas_gerais')
        .insert([metaData])

      if (error) {
        console.error('Erro ao criar meta semanal de leads:', error)
        alert('Erro ao criar meta. Verifique o console.')
        return
      }

      alert('Meta semanal de leads criada com sucesso!')
      setMetaExists(true)
    } catch (error) {
      console.error('Erro ao criar meta:', error)
      alert('Erro interno. Verifique o console.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 text-center">
          <div className="animate-pulse text-muted-foreground">
            Verificando meta semanal de leads...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (metaExists) {
    return (
      <Card className="border-0 bg-emerald-500/10 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Meta semanal de leads configurada
              </p>
              <p className="text-xs text-muted-foreground">
                A meta semanal de leads já existe e está ativa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 bg-yellow-500/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-yellow-400 flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Meta Semanal de Leads Não Encontrada</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          A meta semanal de leads não foi encontrada no sistema. Clique no botão abaixo para criar automaticamente uma meta semanal de 140 leads.
        </p>
        <Button 
          onClick={createMetaSemanalLeads}
          disabled={loading}
          className="bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Criar Meta Semanal de Leads
        </Button>
      </CardContent>
    </Card>
  )
}