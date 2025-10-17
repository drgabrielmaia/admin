import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente com service role para operações admin (usando anon key por enquanto)
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export type UserRole = 'admin' | 'sdr' | 'closer' | 'mentorado'

export interface User {
  id: string
  email: string
  nome: string
  funcao: UserRole
  data_nascimento?: string // Campo de aniversário
  data_cadastro: string
  primeiro_login?: string
}

export interface Lead {
  id: string
  nome: string
  email?: string
  telefone?: string
  origem: string
  status: 'novo' | 'qualificado' | 'agendado' | 'perdido' | 'convertido'
  sdr_id: string
  valor_estimado?: number
  observacoes?: string
  data_agendamento?: string
  created_at: string
  updated_at: string
}

export interface Chamada {
  id: string
  closer_id: string
  lead_id: string
  produto_id?: string
  valor?: number
  resultado: 'venda' | 'perda' | 'reagendamento'
  motivo_perda?: string
  observacoes?: string
  duracao_minutos?: number
  data_chamada?: string
  created_at: string
}

export interface Produto {
  id: string
  nome: string
  tipo: 'infoproduto' | 'fisico' | 'mentoria' | 'evento' | 'saas' | 'parceria'
  descricao?: string
  preco: number
  custo: number
  margem_lucro: number
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at: string
}

export interface Meta {
  id: string
  user_id?: string
  tipo: 'individual' | 'equipe'
  categoria: 'leads' | 'vendas' | 'faturamento' | 'comissao' | 'conversao'
  valor_meta: number
  periodo: 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'anual'
  data_inicio: string
  data_fim: string
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada'
  funcao?: 'sdr' | 'closer'
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface Conversao {
  user_id: string
  periodo: string
  total_leads: number
  total_vendas: number
  valor_total: number
  taxa_conversao: number
  ticket_medio: number
  updated_at: string
}

export interface Indicacao {
  id: string
  mentorado_id: string
  nome: string
  email: string
  telefone: string
  observacao?: string
  status: 'pendente' | 'em_analise' | 'aceita' | 'rejeitada' | 'convertida'
  data_envio: string
  data_atualizacao: string
  responsavel_analise_id?: string
  motivo_rejeicao?: string
  convertida: boolean
  data_conversao?: string
  valor_venda?: number
  closer_responsavel_id?: string
  percentual_comissao?: number
  valor_comissao?: number
  comissao_paga: boolean
  data_pagamento_comissao?: string
  created_at: string
  updated_at: string
}

export interface ConfiguracaoComissao {
  id: string
  tipo: 'cargo' | 'pessoa'
  referencia_id?: string
  cargo?: string
  percentual_closer: number
  percentual_proprio: number
  ativo: boolean
  created_at: string
  updated_at: string
}