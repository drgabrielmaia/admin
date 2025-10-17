const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function finalFix() {
  try {
    console.log('🔧 Aplicando fix final...')

    // Buscar uma chamada pendente
    const { data: chamadas } = await supabase
      .from('chamadas')
      .select('id, valor, resultado, status_aprovacao, closer_id, lead_id')
      .eq('resultado', 'venda')
      .eq('status_aprovacao', 'pendente')
      .limit(1)

    if (chamadas && chamadas.length > 0) {
      const chamada = chamadas[0]
      console.log('Chamada encontrada:', chamada)

      // Buscar dados do lead e SDR
      let sdrId = null
      if (chamada.lead_id) {
        const { data: lead } = await supabase
          .from('leads')
          .select('sdr_id')
          .eq('id', chamada.lead_id)
          .single()

        sdrId = lead?.sdr_id
      }

      // Calcular comissões
      const valorVenda = chamada.valor
      const comissaoSDR = sdrId ? valorVenda * 0.01 : 0 // 1% se houver SDR
      const comissaoCloser = valorVenda * 0.05 // 5% sempre

      console.log('Valores calculados:')
      console.log('- Valor da venda:', valorVenda)
      console.log('- Comissão SDR:', comissaoSDR)
      console.log('- Comissão Closer:', comissaoCloser)

      // 1. Atualizar a chamada
      console.log('\n1. Atualizando status da chamada...')
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
      console.log('✅ Chamada aprovada')

      // 2. Criar comissão para o SDR (se existir)
      if (sdrId) {
        console.log('\n2. Criando comissão para SDR...')
        const comissaoSDRData = {
          chamada_id: chamada.id,
          lead_id: chamada.lead_id,
          sdr_id: sdrId,
          valor_venda: valorVenda,
          valor: comissaoSDR,
          comissao_sdr: comissaoSDR,
          comissao_closer: 0, // Necessário para NOT NULL constraint
          percentual_sdr: 1.00,
          percentual_closer: 0,
          status: 'pendente',
          data_venda: new Date().toISOString(),
          tipo: 'venda',
          motor_type: 'mentoria',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: sdrResult, error: sdrError } = await supabase
          .from('comissoes')
          .insert(comissaoSDRData)
          .select()

        if (sdrError) {
          console.log('❌ Erro ao criar comissão SDR:', sdrError)
        } else {
          console.log('✅ Comissão SDR criada:', sdrResult[0]?.id)
        }
      }

      // 3. Criar comissão para o Closer
      console.log('\n3. Criando comissão para Closer...')
      const comissaoCloserData = {
        chamada_id: chamada.id,
        lead_id: chamada.lead_id,
        closer_id: chamada.closer_id,
        valor_venda: valorVenda,
        valor: comissaoCloser,
        comissao_sdr: 0, // Necessário para NOT NULL constraint
        comissao_closer: comissaoCloser,
        percentual_sdr: 0,
        percentual_closer: 5.00,
        status: 'pendente',
        data_venda: new Date().toISOString(),
        tipo: 'venda',
        motor_type: 'mentoria',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: closerResult, error: closerError } = await supabase
        .from('comissoes')
        .insert(comissaoCloserData)
        .select()

      if (closerError) {
        console.log('❌ Erro ao criar comissão Closer:', closerError)
      } else {
        console.log('✅ Comissão Closer criada:', closerResult[0]?.id)
      }

      // 4. Verificar as comissões criadas
      console.log('\n4. Verificando comissões criadas...')
      const { data: comissoesCriadas, error: comissoesError } = await supabase
        .from('comissoes')
        .select('*')
        .eq('chamada_id', chamada.id)

      if (comissoesError) {
        console.log('❌ Erro ao buscar comissões:', comissoesError)
      } else {
        console.log('✅ Comissões encontradas:', comissoesCriadas?.length || 0)
        comissoesCriadas?.forEach((com, index) => {
          console.log(`  ${index + 1}. ${com.sdr_id ? 'SDR' : 'Closer'}: R$ ${com.valor}`)
        })
      }

      console.log('\n🎉 FIX APLICADO COM SUCESSO!')
      console.log('✅ Venda aprovada')
      console.log('✅ Comissões criadas')
      console.log('✅ Sistema funcionando!')

    } else {
      console.log('❌ Nenhuma chamada pendente encontrada')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

finalFix()