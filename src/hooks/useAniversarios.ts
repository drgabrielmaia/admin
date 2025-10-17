'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Aniversariante {
  id: string
  nome: string
  funcao: string
  data_nascimento: string
  idade: number
  status_aniversario: 'hoje' | 'este_mes' | 'outros'
}

export function useAniversarios() {
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([])
  const [aniversariantesHoje, setAniversariantesHoje] = useState<Aniversariante[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAniversarios()
  }, [])

  const loadAniversarios = async () => {
    try {
      setLoading(true)

      // Carregar todos os aniversários organizados
      const { data: todosAniversarios, error: errorTodos } = await supabase
        .from('vw_aniversarios_dashboard')
        .select('*')

      if (errorTodos) throw errorTodos

      // Filtrar aniversariantes de hoje
      const hoje = todosAniversarios?.filter(a => a.status_aniversario === 'hoje') || []
      
      setAniversariantes(todosAniversarios || [])
      setAniversariantesHoje(hoje)

    } catch (error) {
      console.error('Erro ao carregar aniversários:', error)
    } finally {
      setLoading(false)
    }
  }

  const verificarAniversarioUsuario = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('usuario_faz_aniversario_hoje', { user_id: userId })

      if (error) throw error
      return data || false
    } catch (error) {
      console.error('Erro ao verificar aniversário do usuário:', error)
      return false
    }
  }

  const temAniversarianteHoje = aniversariantesHoje.length > 0

  return {
    aniversariantes,
    aniversariantesHoje,
    temAniversarianteHoje,
    loading,
    verificarAniversarioUsuario,
    recarregar: loadAniversarios
  }
}