import { supabase } from './supabase'

// Script para inserir dados de exemplo para teste do sistema
export const insertSampleData = async () => {
  try {
    console.log('Inserindo dados de exemplo...')

    // 1. Inserir produtos de exemplo
    const produtos = [
      {
        nome: 'Mentoria Individual VIP',
        tipo: 'mentoria',
        valor: 5000.00,
        status: 'ativo',
        descricao: 'Mentoria 1:1 personalizada com foco em resultados'
      },
      {
        nome: 'Curso Completo High-Ticket',
        tipo: 'infoproduto',
        valor: 1997.00,
        status: 'ativo',
        descricao: 'Curso digital completo sobre vendas high-ticket'
      },
      {
        nome: 'Workshop Intensivo',
        tipo: 'evento',
        valor: 997.00,
        status: 'ativo',
        descricao: 'Workshop presencial de 2 dias sobre estratégias de venda'
      },
      {
        nome: 'Consultoria Empresarial',
        tipo: 'clinica',
        valor: 15000.00,
        status: 'ativo',
        descricao: 'Consultoria completa para empresas'
      }
    ]

    const { error: produtosError } = await supabase
      .from('produtos')
      .insert(produtos)

    if (produtosError) {
      console.error('Erro ao inserir produtos:', produtosError)
      return
    }

    // 2. Buscar produtos inseridos para usar nas próximas inserções
    const { data: produtosInseridos } = await supabase
      .from('produtos')
      .select('*')

    // 3. Criar usuários de exemplo
    // Nota: Para criar usuários reais, eles precisariam ser criados através do Supabase Auth
    // Este é apenas um exemplo da estrutura de dados
    
    console.log('Dados de exemplo inseridos com sucesso!')
    console.log('Produtos inseridos:', produtosInseridos?.length)
    
    return { success: true, produtos: produtosInseridos }

  } catch (error) {
    console.error('Erro ao inserir dados de exemplo:', error)
    return { success: false, error }
  }
}

// Função para criar leads de exemplo (precisa de um SDR válido)
export const createSampleLeads = async (sdrId: string) => {
  const leads = [
    {
      nome: 'João Silva',
      email: 'joao@email.com',
      telefone: '(11) 99999-1111',
      origem: 'Facebook Ads',
      status: 'novo',
      sdr_id: sdrId,
      valor_estimado: 2500.00,
      observacoes: 'Interessado em mentoria individual'
    },
    {
      nome: 'Maria Santos',
      email: 'maria@email.com',
      telefone: '(11) 99999-2222',
      origem: 'Google Ads',
      status: 'qualificado',
      sdr_id: sdrId,
      valor_estimado: 5000.00,
      observacoes: 'Empresária, quer escalar negócio'
    },
    {
      nome: 'Pedro Oliveira',
      email: 'pedro@email.com',
      telefone: '(11) 99999-3333',
      origem: 'Indicação',
      status: 'agendado',
      sdr_id: sdrId,
      valor_estimado: 1997.00,
      observacoes: 'Agendado para amanhã às 14h',
      data_agendamento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    {
      nome: 'Ana Costa',
      email: 'ana@email.com',
      telefone: '(11) 99999-4444',
      origem: 'LinkedIn',
      status: 'convertido',
      sdr_id: sdrId,
      valor_estimado: 997.00,
      observacoes: 'Fechou workshop intensivo'
    },
    {
      nome: 'Carlos Mendes',
      email: 'carlos@email.com',
      telefone: '(11) 99999-5555',
      origem: 'Instagram',
      status: 'perdido',
      sdr_id: sdrId,
      valor_estimado: 0,
      observacoes: 'Não teve budget no momento'
    }
  ]

  const { data, error } = await supabase
    .from('leads')
    .insert(leads)
    .select()

  if (error) {
    console.error('Erro ao inserir leads:', error)
    return { success: false, error }
  }

  console.log('Leads de exemplo inseridos:', data?.length)
  return { success: true, leads: data }
}

// Função para criar chamadas de exemplo (precisa de um Closer válido e leads)
export const createSampleChamadas = async (closerId: string, leadIds: string[]) => {
  if (leadIds.length < 4) {
    console.error('Precisa de pelo menos 4 leads para criar chamadas de exemplo')
    return { success: false, error: 'Insuficientes leads' }
  }

  const chamadas = [
    {
      closer_id: closerId,
      lead_id: leadIds[0],
      valor: 2500.00,
      resultado: 'venda',
      duracao_minutos: 45,
      observacoes: 'Venda fechada - mentoria individual',
      data_chamada: new Date().toISOString()
    },
    {
      closer_id: closerId,
      lead_id: leadIds[1],
      valor: 5000.00,
      resultado: 'venda',
      duracao_minutos: 60,
      observacoes: 'Venda fechada - mentoria VIP',
      data_chamada: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      closer_id: closerId,
      lead_id: leadIds[2],
      valor: null,
      resultado: 'reagendamento',
      duracao_minutos: 20,
      observacoes: 'Reagendado para próxima semana',
      data_chamada: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    },
    {
      closer_id: closerId,
      lead_id: leadIds[3],
      valor: null,
      resultado: 'perda',
      motivo_perda: 'Sem budget',
      duracao_minutos: 30,
      observacoes: 'Não tem orçamento no momento',
      data_chamada: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    }
  ]

  const { data, error } = await supabase
    .from('chamadas')
    .insert(chamadas)
    .select()

  if (error) {
    console.error('Erro ao inserir chamadas:', error)
    return { success: false, error }
  }

  console.log('Chamadas de exemplo inseridas:', data?.length)
  return { success: true, chamadas: data }
}

// Função para criar metas de exemplo
export const createSampleMetas = async (userId: string) => {
  const hoje = new Date().toISOString().split('T')[0]
  const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  
  const metas = [
    {
      user_id: userId,
      tipo: 'individual',
      categoria: 'leads',
      valor_meta: 5,
      periodo: 'diario',
      data_inicio: hoje,
      data_fim: hoje,
      status: 'ativa'
    },
    {
      user_id: userId,
      tipo: 'individual',
      categoria: 'leads',
      valor_meta: 35,
      periodo: 'semanal',
      data_inicio: hoje,
      data_fim: hoje,
      status: 'ativa'
    },
    {
      user_id: userId,
      tipo: 'individual',
      categoria: 'leads',
      valor_meta: 150,
      periodo: 'mensal',
      data_inicio: hoje,
      data_fim: fimMes,
      status: 'ativa'
    }
  ]

  const { data, error } = await supabase
    .from('metas')
    .insert(metas)
    .select()

  if (error) {
    console.error('Erro ao inserir metas:', error)
    return { success: false, error }
  }

  console.log('Metas de exemplo inseridas:', data?.length)
  return { success: true, metas: data }
}

// Função para calcular e inserir conversões
export const calculateSampleConversoes = async (userId: string) => {
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  // Buscar dados do usuário para calcular conversões
  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .eq('sdr_id', userId)
    .gte('created_at', inicioMes.toISOString())

  const { data: vendas } = await supabase
    .from('chamadas')
    .select('valor')
    .eq('closer_id', userId)
    .eq('resultado', 'venda')
    .gte('data_chamada', inicioMes.toISOString())

  const totalLeads = leads?.length || 0
  const totalVendas = vendas?.length || 0
  const valorTotal = vendas?.reduce((acc, v) => acc + (v.valor || 0), 0) || 0
  const taxaConversao = totalLeads > 0 ? (totalVendas / totalLeads) * 100 : 0
  const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0

  const conversao = {
    user_id: userId,
    periodo_tipo: 'mensal',
    periodo_data: inicioMes.toISOString().split('T')[0],
    total_leads: totalLeads,
    total_vendas: totalVendas,
    valor_total: valorTotal,
    taxa_conversao: taxaConversao,
    ticket_medio: ticketMedio
  }

  const { data, error } = await supabase
    .from('conversoes')
    .upsert(conversao, { onConflict: 'user_id,periodo_tipo,periodo_data' })
    .select()

  if (error) {
    console.error('Erro ao inserir conversões:', error)
    return { success: false, error }
  }

  console.log('Conversões calculadas:', data)
  return { success: true, conversoes: data }
}

// Função principal para criar todo o conjunto de dados de exemplo
export const createFullSampleData = async () => {
  try {
    console.log('Iniciando criação completa de dados de exemplo...')
    
    // 1. Inserir produtos
    await insertSampleData()
    
    console.log('Dados de exemplo básicos criados!')
    console.log('Para dados completos, você precisa:')
    console.log('1. Criar usuários através do sistema de cadastro')
    console.log('2. Usar os IDs dos usuários para criar leads, chamadas e metas')
    console.log('3. Executar as funções específicas após o login')
    
    return { success: true }
  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error)
    return { success: false, error }
  }
}