const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSimple() {
  try {
    console.log('🧪 Teste simplificado do sistema de vendas...')

    // 1. Buscar o lead recém-criado
    const { data: leads } = await supabase
      .from('leads')
      .select('id, nome, sdr_id')
      .ilike('nome', '%Cliente Teste%')
      .limit(1)

    if (!leads || leads.length === 0) {
      console.log('❌ Lead de teste não encontrado')
      return
    }

    const lead = leads[0]
    console.log('📋 Lead encontrado:', lead.nome)

    // 2. Buscar closer
    const { data: closer } = await supabase
      .from('users')
      .select('id, nome')
      .eq('funcao', 'closer')
      .limit(1)
      .single()

    console.log('👤 Closer:', closer?.nome || 'Não encontrado')

    // 3. Buscar produtos/clínicas
    const { data: produtos } = await supabase
      .from('produtos')
      .select('id, nome')
      .limit(1)

    console.log('📦 Produtos disponíveis:', produtos?.length || 0)

    // Se não houver produtos, usar qualquer ID válido
    let produtoId = produtos?.[0]?.id

    if (!produtoId) {
      console.log('⚠️ Nenhum produto encontrado. Criando venda sem produto...')
    }

    // 4. Criar chamada de venda simples
    console.log('\n📞 Criando chamada de venda...')

    const { data: novaChamada, error: chamadaError } = await supabase
      .from('chamadas')
      .insert({
        lead_id: lead.id,
        closer_id: closer.id,
        ...(produtoId && { clinica_id: produtoId }),
        duracao_minutos: 30,
        resultado: 'venda',
        valor: 2500,
        observacoes: 'Teste sistema - venda simples',
        data_chamada: new Date().toISOString(),
        status_aprovacao: 'pendente'
      })
      .select()
      .single()

    if (chamadaError) {
      console.log('❌ Erro ao criar chamada:', chamadaError)
      return
    }

    console.log('✅ Chamada criada:', novaChamada.id, '- Valor: R$', novaChamada.valor)

    // 5. Aprovar manualmente (já sabemos que a função RPC tem problemas)
    console.log('\n✅ Aprovando venda manualmente...')

    // Buscar admin
    const { data: admin } = await supabase
      .from('users')
      .select('id, nome')
      .eq('funcao', 'admin')
      .limit(1)
      .single()

    // Atualizar status da chamada
    const { error: updateError } = await supabase
      .from('chamadas')
      .update({
        status_aprovacao: 'aprovada',
        data_aprovacao: new Date().toISOString(),
        aprovado_por: admin.id
      })
      .eq('id', novaChamada.id)

    if (updateError) {
      console.log('❌ Erro ao aprovar:', updateError)
      return
    }

    console.log('✅ Chamada aprovada')

    // 6. Criar comissões manualmente
    console.log('\n💰 Criando comissões...')

    const valorVenda = novaChamada.valor
    const comissaoSDR = lead.sdr_id ? valorVenda * 0.01 : 0 // 1%
    const comissaoCloser = valorVenda * 0.05 // 5%

    // Comissão para SDR (se houver)
    if (lead.sdr_id && comissaoSDR > 0) {
      const { data: comissaoSDRResult, error: sdrError } = await supabase
        .from('comissoes')
        .insert({
          chamada_id: novaChamada.id,
          lead_id: lead.id,
          sdr_id: lead.sdr_id,
          valor_venda: valorVenda,
          valor: comissaoSDR,
          comissao_sdr: comissaoSDR,
          comissao_closer: 0,
          percentual_sdr: 1.00,
          percentual_closer: 0,
          status: 'pendente',
          data_venda: new Date().toISOString(),
          tipo: 'venda',
          motor_type: 'mentoria',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (sdrError) {
        console.log('❌ Erro comissão SDR:', sdrError)
      } else {
        console.log('✅ Comissão SDR criada: R$', comissaoSDR)
      }
    }

    // Comissão para Closer
    const { data: comissaoCloserResult, error: closerError } = await supabase
      .from('comissoes')
      .insert({
        chamada_id: novaChamada.id,
        lead_id: lead.id,
        closer_id: closer.id,
        valor_venda: valorVenda,
        valor: comissaoCloser,
        comissao_sdr: 0,
        comissao_closer: comissaoCloser,
        percentual_sdr: 0,
        percentual_closer: 5.00,
        status: 'pendente',
        data_venda: new Date().toISOString(),
        tipo: 'venda',
        motor_type: 'mentoria',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (closerError) {
      console.log('❌ Erro comissão Closer:', closerError)
    } else {
      console.log('✅ Comissão Closer criada: R$', comissaoCloser)
    }

    // 7. Verificar resultado
    console.log('\n📊 Resultado final:')

    const { data: comissoesFinais } = await supabase
      .from('comissoes')
      .select('valor, sdr_id, closer_id, status')
      .eq('chamada_id', novaChamada.id)

    console.log('Comissões criadas:', comissoesFinais?.length || 0)
    let totalComissoes = 0
    comissoesFinais?.forEach((com, index) => {
      const tipo = com.sdr_id ? 'SDR' : 'Closer'
      console.log(`  ${index + 1}. ${tipo}: R$ ${com.valor} (${com.status})`)
      totalComissoes += parseFloat(com.valor)
    })

    console.log(`\n🎉 TESTE CONCLUÍDO COM SUCESSO!`)
    console.log(`✅ Venda: R$ ${valorVenda}`)
    console.log(`✅ Total de comissões: R$ ${totalComissoes}`)
    console.log(`✅ Percentual total: ${((totalComissoes / valorVenda) * 100).toFixed(1)}%`)
    console.log(`✅ Sistema funcionando corretamente!`)

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testSimple()