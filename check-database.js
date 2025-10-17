const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  try {
    console.log('🔍 VERIFICANDO ESTRUTURA DO BANCO...')

    // Lista das tabelas que o sistema usa
    const tables = [
      'users', 'leads', 'chamadas', 'comissoes', 'metas',
      'produtos', 'clinicas', 'movimentacoes_financeiras',
      'contas_bancarias', 'indicacoes', 'configuracoes_comissao'
    ]

    const existingTables = []
    const tableStructures = {}

    for (const table of tables) {
      try {
        // Tentar fazer uma query simples para ver se a tabela existe
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (!error) {
          existingTables.push(table)
          console.log(`✅ ${table} - ${data?.length || 0} registros`)

          // Se tem dados, pegar a estrutura
          if (data && data.length > 0) {
            tableStructures[table] = Object.keys(data[0])
          } else {
            // Se não tem dados, tentar inserir/deletar para ver campos obrigatórios
            const { error: insertError } = await supabase
              .from(table)
              .insert({})
              .select()

            if (insertError) {
              // Parse do erro para entender campos obrigatórios
              console.log(`  📋 ${table} - Campos obrigatórios detectados no erro`)
            }
          }
        } else {
          console.log(`❌ ${table} - Não existe`)
        }
      } catch (e) {
        console.log(`❌ ${table} - Erro: ${e.message}`)
      }
    }

    console.log('\n📊 RESUMO DO BANCO:')
    console.log('Tabelas existentes:', existingTables.length)
    existingTables.forEach(table => {
      console.log(`- ${table}`)
      if (tableStructures[table]) {
        console.log(`  Campos: ${tableStructures[table].join(', ')}`)
      }
    })

    // Verificar funções existentes
    console.log('\n🔧 VERIFICANDO FUNÇÕES...')
    try {
      const { data: functions, error } = await supabase.rpc('aprovar_rejeitar_venda', {
        p_chamada_id: '00000000-0000-0000-0000-000000000000',
        p_admin_id: '00000000-0000-0000-0000-000000000000',
        p_acao: 'test'
      })

      if (error && error.code === 'PGRST202') {
        console.log('❌ Função aprovar_rejeitar_venda NÃO existe')
      } else {
        console.log('✅ Função aprovar_rejeitar_venda existe')
      }
    } catch (e) {
      console.log('❌ Função aprovar_rejeitar_venda com problemas')
    }

    return { existingTables, tableStructures }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkDatabase()