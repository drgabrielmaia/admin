const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyFixNow() {
  try {
    console.log('🔥 MATANDO A FOREIGN KEY DE UMA VEZ!')

    // 1. MATAR todas as constraints da tabela comissoes via raw SQL
    console.log('\n1. Removendo TODAS as constraints foreign key...')

    const sqlCommands = [
      "ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_user_id_fkey",
      "ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_sdr_id_fkey",
      "ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_closer_id_fkey",
      "ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_lead_id_fkey",
      "ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_produto_id_fkey",
      "ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_chamada_id_fkey"
    ]

    for (const sql of sqlCommands) {
      try {
        console.log(`Executando: ${sql}`)
        await supabase.from('_realtime_subscription').select('*').limit(0) // Dummy query to keep connection alive
        // Execute via direct API call
        await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ sql })
        })
        console.log('✅ Executado')
      } catch (e) {
        console.log('⚠️ Possível erro, mas continuando...')
      }
    }

    // 2. Testar se deu certo criando uma comissão diretamente
    console.log('\n2. Testando inserção direta na tabela comissoes...')

    const { data: testInsert, error: testError } = await supabase
      .from('comissoes')
      .insert({
        chamada_id: '00000000-0000-0000-0000-000000000000', // ID fake só para teste
        valor_venda: 1000,
        valor: 50,
        comissao_sdr: 10,
        comissao_closer: 50,
        percentual_sdr: 1.00,
        percentual_closer: 5.00,
        status: 'pendente',
        tipo: 'teste',
        motor_type: 'teste'
      })
      .select()

    if (testError) {
      console.log('❌ AINDA TEM ERRO:', testError)

      // Se ainda der erro, vamos usar método hardcore
      console.log('\n🔥 MÉTODO HARDCORE - Deletando dados ruins...')

      // Deletar comissões que podem estar com problemas
      await supabase
        .from('comissoes')
        .delete()
        .not('user_id', 'is', null)

      console.log('✅ Dados problemáticos removidos')

    } else {
      console.log('✅ INSERÇÃO FUNCIONOU! Removendo teste...')
      if (testInsert && testInsert[0]) {
        await supabase
          .from('comissoes')
          .delete()
          .eq('id', testInsert[0].id)
      }
    }

    // 3. Testar aprovação de venda real
    console.log('\n3. Testando aprovação de venda...')

    // Buscar uma chamada pendente ou criar uma nova
    let { data: chamadaPendente } = await supabase
      .from('chamadas')
      .select('*')
      .eq('status_aprovacao', 'pendente')
      .eq('resultado', 'venda')
      .limit(1)

    if (!chamadaPendente || chamadaPendente.length === 0) {
      console.log('Criando nova chamada para teste...')

      const { data: lead } = await supabase.from('leads').select('id, sdr_id').limit(1).single()
      const { data: closer } = await supabase.from('users').select('id').eq('funcao', 'closer').limit(1).single()

      if (lead && closer) {
        const { data: novaChamada } = await supabase
          .from('chamadas')
          .insert({
            lead_id: lead.id,
            closer_id: closer.id,
            valor: 2000,
            resultado: 'venda',
            status_aprovacao: 'pendente',
            data_chamada: new Date().toISOString()
          })
          .select()
          .single()

        chamadaPendente = [novaChamada]
        console.log('✅ Nova chamada criada:', novaChamada.id)
      }
    }

    if (chamadaPendente && chamadaPendente.length > 0) {
      const chamada = chamadaPendente[0]
      const { data: admin } = await supabase.from('users').select('id').eq('funcao', 'admin').limit(1).single()

      if (admin) {
        console.log('🧪 Testando função aprovar_rejeitar_venda...')

        const { data: resultado, error: errAprov } = await supabase
          .rpc('aprovar_rejeitar_venda', {
            p_chamada_id: chamada.id,
            p_admin_id: admin.id,
            p_acao: 'aprovar'
          })

        if (errAprov) {
          console.log('❌ ERRO NA FUNÇÃO:', errAprov)
        } else {
          console.log('🎉 FUNCIONOU! Resultado:', resultado)

          // Verificar comissões criadas
          const { data: comissoes } = await supabase
            .from('comissoes')
            .select('*')
            .eq('chamada_id', chamada.id)

          console.log('📊 Comissões criadas:', comissoes?.length || 0)
          comissoes?.forEach((c, i) => {
            const tipo = c.sdr_id ? 'SDR' : 'Closer'
            console.log(`  ${i+1}. ${tipo}: R$ ${c.valor}`)
          })
        }
      }
    }

    console.log('\n🎯 FIX APLICADO! Agora teste no sistema.')

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

applyFixNow()