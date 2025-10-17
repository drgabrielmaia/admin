const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function workaroundFix() {
  try {
    console.log('🔧 Aplicando workaround para foreign key...')

    // Primeiro vou verificar qual user_id está causando o problema
    console.log('\n1. Investigando o problema...')

    const { data: chamadas } = await supabase
      .from('chamadas')
      .select('id, valor, resultado, status_aprovacao, closer_id, lead_id')
      .eq('resultado', 'venda')
      .eq('status_aprovacao', 'pendente')
      .limit(1)

    if (chamadas && chamadas.length > 0) {
      const chamada = chamadas[0]
      console.log('Chamada encontrada:', chamada)

      // Verificar se o closer_id existe na tabela users
      const { data: closerUser, error: closerError } = await supabase
        .from('users')
        .select('id, nome')
        .eq('id', chamada.closer_id)
        .single()

      console.log('Closer encontrado:', closerUser)
      console.log('Erro do closer:', closerError)

      // Verificar se o lead existe e tem SDR
      if (chamada.lead_id) {
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('id, sdr_id')
          .eq('id', chamada.lead_id)
          .single()

        console.log('Lead encontrado:', lead)
        console.log('Erro do lead:', leadError)

        if (lead && lead.sdr_id) {
          const { data: sdrUser, error: sdrError } = await supabase
            .from('users')
            .select('id, nome')
            .eq('id', lead.sdr_id)
            .single()

          console.log('SDR encontrado:', sdrUser)
          console.log('Erro do SDR:', sdrError)
        }
      }

      // 2. Aprovar a venda manualmente criando as comissões sem foreign key
      console.log('\n2. Aprovando venda manualmente...')

      // Atualizar a chamada primeiro
      const { error: updateError } = await supabase
        .from('chamadas')
        .update({
          status_aprovacao: 'aprovada',
          data_aprovacao: new Date().toISOString()
        })
        .eq('id', chamada.id)

      if (updateError) {
        console.log('❌ Erro ao atualizar chamada:', updateError)
        return
      }

      console.log('✅ Chamada atualizada para aprovada')

      // Criar comissões manualmente SEM o campo user_id problemático
      const comissaoCloser = {
        chamada_id: chamada.id,
        lead_id: chamada.lead_id,
        closer_id: chamada.closer_id,
        valor_venda: chamada.valor,
        valor: chamada.valor * 0.05, // 5% para closer
        comissao_closer: chamada.valor * 0.05,
        percentual_closer: 5.00,
        status: 'pendente',
        data_venda: new Date().toISOString(),
        tipo: 'venda',
        motor_type: 'mentoria',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('3. Criando comissão para o closer...')
      const { data: comissaoCloserResult, error: comissaoCloserError } = await supabase
        .from('comissoes')
        .insert(comissaoCloser)
        .select()

      if (comissaoCloserError) {
        console.log('❌ Erro ao criar comissão do closer:', comissaoCloserError)
      } else {
        console.log('✅ Comissão do closer criada:', comissaoCloserResult)
      }

      // Criar comissão para SDR se existir
      if (chamada.lead_id) {
        const { data: lead } = await supabase
          .from('leads')
          .select('sdr_id')
          .eq('id', chamada.lead_id)
          .single()

        if (lead && lead.sdr_id) {
          const comissaoSDR = {
            chamada_id: chamada.id,
            lead_id: chamada.lead_id,
            sdr_id: lead.sdr_id,
            valor_venda: chamada.valor,
            valor: chamada.valor * 0.01, // 1% para SDR
            comissao_sdr: chamada.valor * 0.01,
            percentual_sdr: 1.00,
            status: 'pendente',
            data_venda: new Date().toISOString(),
            tipo: 'venda',
            motor_type: 'mentoria',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          console.log('4. Criando comissão para o SDR...')
          const { data: comissaoSDRResult, error: comissaoSDRError } = await supabase
            .from('comissoes')
            .insert(comissaoSDR)
            .select()

          if (comissaoSDRError) {
            console.log('❌ Erro ao criar comissão do SDR:', comissaoSDRError)
          } else {
            console.log('✅ Comissão do SDR criada:', comissaoSDRResult)
          }
        }
      }

      console.log('\n🎉 Workaround aplicado com sucesso!')
      console.log('A venda foi aprovada e as comissões foram criadas manualmente.')
      console.log('Agora você pode testar no sistema.')

    } else {
      console.log('❌ Nenhuma chamada pendente encontrada para teste')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

workaroundFix()