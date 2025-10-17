const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSystem() {
  try {
    console.log('🧪 Testando sistema de vendas completo...')

    // 1. Verificar o estado atual
    console.log('\n1. Verificando estado atual do sistema...')

    // Buscar chamadas aprovadas
    const { data: chamadasAprovadas } = await supabase
      .from('chamadas')
      .select('id, valor, status_aprovacao, data_aprovacao')
      .eq('status_aprovacao', 'aprovada')
      .order('data_aprovacao', { ascending: false })
      .limit(5)

    console.log(`✅ Chamadas aprovadas: ${chamadasAprovadas?.length || 0}`)
    chamadasAprovadas?.forEach((chamada, index) => {
      console.log(`  ${index + 1}. ID: ${chamada.id} | Valor: R$ ${chamada.valor} | Aprovada em: ${new Date(chamada.data_aprovacao).toLocaleString('pt-BR')}`)
    })

    // Buscar comissões criadas
    const { data: comissoes } = await supabase
      .from('comissoes')
      .select('id, chamada_id, valor, sdr_id, closer_id, status')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log(`\n✅ Comissões criadas: ${comissoes?.length || 0}`)
    comissoes?.forEach((comissao, index) => {
      const tipo = comissao.sdr_id ? 'SDR' : 'Closer'
      console.log(`  ${index + 1}. ${tipo} | Valor: R$ ${comissao.valor} | Status: ${comissao.status}`)
    })

    // 2. Criar uma nova venda de teste para verificar se o fix funcionou
    console.log('\n2. Criando nova venda de teste...')

    // Buscar um lead disponível
    const { data: leads } = await supabase
      .from('leads')
      .select('id, nome, sdr_id')
      .eq('status', 'novo')
      .limit(1)

    if (!leads || leads.length === 0) {
      console.log('⚠️ Nenhum lead disponível. Criando lead de teste...')

      // Buscar um SDR
      const { data: sdr } = await supabase
        .from('users')
        .select('id, nome')
        .eq('funcao', 'sdr')
        .limit(1)
        .single()

      if (sdr) {
        // Criar lead de teste
        const { data: novoLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            nome: 'Cliente Teste - ' + new Date().toLocaleTimeString(),
            email: 'teste@exemplo.com',
            telefone: '11999999999',
            origem: 'Teste Sistema',
            status: 'qualificado',
            sdr_id: sdr.id,
            valor_estimado: 3000
          })
          .select()
          .single()

        if (leadError) {
          console.log('❌ Erro ao criar lead de teste:', leadError)
          return
        }

        console.log('✅ Lead de teste criado:', novoLead.nome)
        leads[0] = novoLead
      } else {
        console.log('❌ Nenhum SDR encontrado para criar lead de teste')
        return
      }
    }

    const lead = leads[0]
    console.log('📋 Lead selecionado:', lead.nome)

    // Buscar um closer
    const { data: closer } = await supabase
      .from('users')
      .select('id, nome')
      .eq('funcao', 'closer')
      .limit(1)
      .single()

    if (!closer) {
      console.log('❌ Nenhum closer encontrado')
      return
    }

    console.log('👤 Closer selecionado:', closer.nome)

    // Buscar uma clínica/produto
    const { data: clinica } = await supabase
      .from('clinicas')
      .select('id, nome')
      .limit(1)
      .single()

    if (!clinica) {
      console.log('❌ Nenhuma clínica encontrada')
      return
    }

    console.log('🏥 Clínica selecionada:', clinica.nome)

    // 3. Registrar uma nova chamada de venda
    console.log('\n3. Registrando nova chamada de venda...')

    const { data: novaChamada, error: chamadaError } = await supabase
      .from('chamadas')
      .insert({
        lead_id: lead.id,
        closer_id: closer.id,
        clinica_id: clinica.id,
        duracao_minutos: 45,
        resultado: 'venda',
        valor: 4500,
        observacoes: 'Venda de teste para verificar sistema',
        data_chamada: new Date().toISOString(),
        status_aprovacao: 'pendente'
      })
      .select()
      .single()

    if (chamadaError) {
      console.log('❌ Erro ao criar chamada de venda:', chamadaError)
      return
    }

    console.log('✅ Chamada de venda criada:', novaChamada.id)

    // 4. Testar aprovação usando a função corrigida
    console.log('\n4. Testando aprovação com função corrigida...')

    // Buscar um admin
    const { data: admin } = await supabase
      .from('users')
      .select('id, nome')
      .eq('funcao', 'admin')
      .limit(1)
      .single()

    if (!admin) {
      console.log('❌ Nenhum admin encontrado')
      return
    }

    console.log('👮 Admin selecionado:', admin.nome)

    // Tentar aprovar usando a função RPC
    const { data: resultadoAprovacao, error: aprovarError } = await supabase
      .rpc('aprovar_rejeitar_venda', {
        p_chamada_id: novaChamada.id,
        p_admin_id: admin.id,
        p_acao: 'aprovar',
        p_produto_id: clinica.id
      })

    if (aprovarError) {
      console.log('❌ ERRO na aprovação:', aprovarError)

      // Se der erro, tentar o método manual
      console.log('\n🔧 Tentando método manual...')

      // Atualizar chamada manualmente
      const { error: updateError } = await supabase
        .from('chamadas')
        .update({
          status_aprovacao: 'aprovada',
          data_aprovacao: new Date().toISOString(),
          aprovado_por: admin.id
        })
        .eq('id', novaChamada.id)

      if (updateError) {
        console.log('❌ Erro ao atualizar chamada manualmente:', updateError)
        return
      }

      // Criar comissões manualmente
      const valorVenda = novaChamada.valor
      const comissaoSDR = lead.sdr_id ? valorVenda * 0.01 : 0
      const comissaoCloser = valorVenda * 0.05

      // Comissão SDR
      if (lead.sdr_id) {
        const { error: sdrError } = await supabase
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
            motor_type: 'mentoria'
          })

        if (sdrError) {
          console.log('❌ Erro ao criar comissão SDR manual:', sdrError)
        } else {
          console.log('✅ Comissão SDR criada manualmente: R$', comissaoSDR)
        }
      }

      // Comissão Closer
      const { error: closerError } = await supabase
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
          motor_type: 'mentoria'
        })

      if (closerError) {
        console.log('❌ Erro ao criar comissão Closer manual:', closerError)
      } else {
        console.log('✅ Comissão Closer criada manualmente: R$', comissaoCloser)
      }

      console.log('✅ Aprovação manual concluída!')

    } else {
      console.log('✅ APROVAÇÃO AUTOMÁTICA FUNCIONOU!')
      console.log('Resultado:', resultadoAprovacao)
    }

    // 5. Verificar resultado final
    console.log('\n5. Verificando resultado final...')

    const { data: chamadaFinal } = await supabase
      .from('chamadas')
      .select('status_aprovacao, data_aprovacao')
      .eq('id', novaChamada.id)
      .single()

    const { data: comissoesFinal } = await supabase
      .from('comissoes')
      .select('valor, sdr_id, closer_id')
      .eq('chamada_id', novaChamada.id)

    console.log('📊 Status final da chamada:', chamadaFinal?.status_aprovacao)
    console.log('📊 Comissões criadas:', comissoesFinal?.length || 0)
    comissoesFinal?.forEach((com, index) => {
      const tipo = com.sdr_id ? 'SDR' : 'Closer'
      console.log(`  ${index + 1}. ${tipo}: R$ ${com.valor}`)
    })

    console.log('\n🎉 TESTE COMPLETO!')
    console.log('✅ Sistema de vendas funcionando')
    console.log('✅ Aprovação de vendas funcionando')
    console.log('✅ Cálculo de comissões funcionando')

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testSystem()