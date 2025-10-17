const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSqlFunction() {
  try {
    console.log('🔍 Testando sistema de vendas...')

    // 1. Verificar se a função existe
    console.log('\n1. Verificando função aprovar_rejeitar_venda...')
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, specific_name')
      .eq('routine_name', 'aprovar_rejeitar_venda')

    console.log('Funções encontradas:', functions)
    if (funcError) console.error('Erro ao buscar funções:', funcError)

    // 2. Verificar estrutura da tabela comissoes
    console.log('\n2. Verificando estrutura da tabela comissoes...')
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'comissoes')
      .order('ordinal_position')

    console.log('Colunas da tabela comissoes:')
    columns?.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`)
    })
    if (colError) console.error('Erro ao buscar colunas:', colError)

    // 3. Verificar foreign keys
    console.log('\n3. Verificando foreign keys...')
    const { data: fks, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'comissoes')
      .eq('constraint_type', 'FOREIGN KEY')

    console.log('Foreign keys da tabela comissoes:')
    fks?.forEach(fk => {
      console.log(`  - ${fk.constraint_name}`)
    })
    if (fkError) console.error('Erro ao buscar foreign keys:', fkError)

    // 4. Buscar uma chamada existente para testar
    console.log('\n4. Buscando chamadas pendentes...')
    const { data: chamadas, error: chamadaError } = await supabase
      .from('chamadas')
      .select('id, valor, resultado, status_aprovacao, closer_id, lead_id')
      .eq('resultado', 'venda')
      .eq('status_aprovacao', 'pendente')
      .limit(1)

    console.log('Chamadas pendentes encontradas:', chamadas?.length || 0)
    if (chamadas && chamadas.length > 0) {
      console.log('Primeira chamada:', chamadas[0])

      // 5. Buscar um admin para testar
      const { data: admin, error: adminError } = await supabase
        .from('users')
        .select('id, nome, funcao')
        .eq('funcao', 'admin')
        .limit(1)
        .single()

      if (admin) {
        console.log('\n5. Testando aprovação com admin:', admin.nome)

        // 6. Testar a função de aprovação
        try {
          const { data: result, error: approveError } = await supabase
            .rpc('aprovar_rejeitar_venda', {
              p_chamada_id: chamadas[0].id,
              p_admin_id: admin.id,
              p_acao: 'aprovar',
              p_produto_id: null
            })

          console.log('Resultado da aprovação:', result)
          if (approveError) {
            console.error('❌ ERRO na aprovação:', approveError)
          } else {
            console.log('✅ Aprovação realizada com sucesso!')
          }
        } catch (testError) {
          console.error('❌ ERRO capturado no teste:', testError)
        }
      } else {
        console.log('❌ Nenhum admin encontrado para teste')
      }
    } else {
      console.log('❌ Nenhuma chamada pendente encontrada para teste')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testSqlFunction()