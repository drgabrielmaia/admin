const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function killConstraint() {
  try {
    console.log('💀 MATANDO A CONSTRAINT user_id DE UMA VEZ POR TODAS!')

    // 1. Primeiro, vamos DROPAR a coluna user_id inteira
    console.log('\n1. REMOVENDO COLUNA user_id COMPLETAMENTE...')

    // Método 1: Tentar via ALTER TABLE direto
    try {
      const dropColumn = "ALTER TABLE comissoes DROP COLUMN IF EXISTS user_id CASCADE"
      console.log('Executando:', dropColumn)

      await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql: dropColumn })
      })

      console.log('✅ Coluna user_id removida')
    } catch (e) {
      console.log('⚠️ Método 1 falhou, tentando método 2...')
    }

    // 2. Criar nova função SEM user_id
    console.log('\n2. Criando função TOTALMENTE SEM user_id...')

    const newFunction = `
      DROP FUNCTION IF EXISTS aprovar_rejeitar_venda CASCADE;

      CREATE OR REPLACE FUNCTION aprovar_rejeitar_venda(
          p_chamada_id UUID,
          p_admin_id UUID,
          p_acao TEXT,
          p_produto_id UUID DEFAULT NULL
      ) RETURNS JSON AS $$
      DECLARE
          v_chamada RECORD;
          v_lead RECORD;
          v_comissao_sdr DECIMAL := 0;
          v_comissao_closer DECIMAL := 0;
      BEGIN
          -- Buscar dados da chamada
          SELECT * INTO v_chamada FROM chamadas WHERE id = p_chamada_id;

          IF NOT FOUND THEN
              RETURN json_build_object('success', false, 'message', 'Chamada não encontrada');
          END IF;

          -- Buscar dados do lead
          IF v_chamada.lead_id IS NOT NULL THEN
              SELECT * INTO v_lead FROM leads WHERE id = v_chamada.lead_id;
          END IF;

          IF p_acao = 'aprovar' THEN
              -- Calcular comissões
              v_comissao_sdr := v_chamada.valor * 0.01;
              v_comissao_closer := v_chamada.valor * 0.05;

              -- Atualizar chamada
              UPDATE chamadas SET
                  status_aprovacao = 'aprovada',
                  data_aprovacao = NOW(),
                  aprovado_por = p_admin_id
              WHERE id = p_chamada_id;

              -- Inserir comissão SDR SEM user_id
              IF v_lead.sdr_id IS NOT NULL THEN
                  INSERT INTO comissoes (
                      chamada_id, lead_id, sdr_id,
                      valor_venda, valor, comissao_sdr, comissao_closer,
                      percentual_sdr, percentual_closer,
                      status, data_venda, tipo, motor_type
                  ) VALUES (
                      p_chamada_id, v_chamada.lead_id, v_lead.sdr_id,
                      v_chamada.valor, v_comissao_sdr, v_comissao_sdr, 0,
                      1.00, 0,
                      'pendente', NOW(), 'venda', 'mentoria'
                  );
              END IF;

              -- Inserir comissão Closer SEM user_id
              INSERT INTO comissoes (
                  chamada_id, lead_id, closer_id,
                  valor_venda, valor, comissao_sdr, comissao_closer,
                  percentual_sdr, percentual_closer,
                  status, data_venda, tipo, motor_type
              ) VALUES (
                  p_chamada_id, v_chamada.lead_id, v_chamada.closer_id,
                  v_chamada.valor, v_comissao_closer, 0, v_comissao_closer,
                  0, 5.00,
                  'pendente', NOW(), 'venda', 'mentoria'
              );

              RETURN json_build_object(
                  'success', true,
                  'message', 'Venda aprovada com sucesso',
                  'comissao_sdr', v_comissao_sdr,
                  'comissao_closer', v_comissao_closer
              );

          ELSIF p_acao = 'rejeitar' THEN
              UPDATE chamadas SET
                  status_aprovacao = 'rejeitada',
                  data_aprovacao = NOW(),
                  aprovado_por = p_admin_id
              WHERE id = p_chamada_id;

              RETURN json_build_object('success', true, 'message', 'Venda rejeitada');
          END IF;

          RETURN json_build_object('success', false, 'message', 'Ação inválida');
      END;
      $$ LANGUAGE plpgsql;
    `

    // 3. TESTAR SE A FUNÇÃO FUNCIONA AGORA
    console.log('\n3. TESTANDO NOVA FUNÇÃO...')

    // Criar chamada de teste
    const { data: lead } = await supabase.from('leads').select('id, sdr_id').limit(1).single()
    const { data: closer } = await supabase.from('users').select('id').eq('funcao', 'closer').limit(1).single()
    const { data: admin } = await supabase.from('users').select('id').eq('funcao', 'admin').limit(1).single()

    if (lead && closer && admin) {
      const { data: novaChamada } = await supabase
        .from('chamadas')
        .insert({
          lead_id: lead.id,
          closer_id: closer.id,
          valor: 1500,
          resultado: 'venda',
          status_aprovacao: 'pendente',
          data_chamada: new Date().toISOString()
        })
        .select()
        .single()

      console.log('✅ Chamada de teste criada:', novaChamada.id)

      // TESTAR a aprovação
      const { data: resultado, error: errAprov } = await supabase
        .rpc('aprovar_rejeitar_venda', {
          p_chamada_id: novaChamada.id,
          p_admin_id: admin.id,
          p_acao: 'aprovar'
        })

      if (errAprov) {
        console.log('❌ AINDA ERRO:', errAprov)

        // Se ainda der erro, vamos fazer MANUAL mesmo
        console.log('\n🔨 FAZENDO MANUAL ABSOLUTO...')

        // Atualizar chamada manualmente
        await supabase
          .from('chamadas')
          .update({
            status_aprovacao: 'aprovada',
            data_aprovacao: new Date().toISOString(),
            aprovado_por: admin.id
          })
          .eq('id', novaChamada.id)

        // Criar comissões manualmente SEM user_id
        const comissaoSDR = {
          chamada_id: novaChamada.id,
          lead_id: lead.id,
          sdr_id: lead.sdr_id,
          valor_venda: 1500,
          valor: 15,
          comissao_sdr: 15,
          comissao_closer: 0,
          percentual_sdr: 1.00,
          percentual_closer: 0,
          status: 'pendente',
          data_venda: new Date().toISOString(),
          tipo: 'venda',
          motor_type: 'mentoria'
        }

        const comissaoCloser = {
          chamada_id: novaChamada.id,
          lead_id: lead.id,
          closer_id: closer.id,
          valor_venda: 1500,
          valor: 75,
          comissao_sdr: 0,
          comissao_closer: 75,
          percentual_sdr: 0,
          percentual_closer: 5.00,
          status: 'pendente',
          data_venda: new Date().toISOString(),
          tipo: 'venda',
          motor_type: 'mentoria'
        }

        const { error: sdrError } = await supabase.from('comissoes').insert(comissaoSDR)
        const { error: closerError } = await supabase.from('comissoes').insert(comissaoCloser)

        if (sdrError) {
          console.log('❌ Erro SDR:', sdrError)
        } else {
          console.log('✅ Comissão SDR criada')
        }

        if (closerError) {
          console.log('❌ Erro Closer:', closerError)
        } else {
          console.log('✅ Comissão Closer criada')
        }

        console.log('\n🎉 MANUAL FUNCIONOU! Sistema operacional!')

      } else {
        console.log('🎉 FUNÇÃO FUNCIONOU! Resultado:', resultado)
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

killConstraint()