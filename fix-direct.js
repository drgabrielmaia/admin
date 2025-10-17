const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function manualFix() {
  try {
    console.log('🔧 Aplicando fix manual...')

    // 1. Criar a função com SQL direto substituindo a atual
    console.log('\n1. Criando função sem foreign keys...')

    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION aprovar_rejeitar_venda(
          p_chamada_id UUID,
          p_admin_id UUID,
          p_acao TEXT,
          p_produto_id UUID DEFAULT NULL
      ) RETURNS JSON AS $$
      DECLARE
          v_chamada RECORD;
          v_lead RECORD;
          v_motor_type TEXT;
          v_comissao_sdr DECIMAL := 0;
          v_comissao_closer DECIMAL := 0;
          v_percentual_sdr DECIMAL := 1.00;
          v_percentual_closer DECIMAL := 5.00;
      BEGIN
          -- Buscar dados da chamada
          SELECT c.*, cl.tipo as produto_tipo, cl.nome as produto_nome
          INTO v_chamada
          FROM chamadas c
          LEFT JOIN clinicas cl ON c.clinica_id = cl.id
          WHERE c.id = p_chamada_id;

          IF NOT FOUND THEN
              RETURN json_build_object('success', false, 'message', 'Chamada não encontrada');
          END IF;

          -- Buscar dados do lead (se existir)
          IF v_chamada.lead_id IS NOT NULL THEN
              SELECT * INTO v_lead FROM leads WHERE id = v_chamada.lead_id;
          END IF;

          -- Determinar motor type
          v_motor_type := CASE
              WHEN v_chamada.produto_tipo = 'real_estate' THEN 'real-estate'
              WHEN v_chamada.produto_tipo = 'infoprodutos' THEN 'infoproduto'
              WHEN v_chamada.produto_tipo = 'produto_fisico' THEN 'fisico'
              ELSE COALESCE(v_chamada.produto_tipo, 'mentoria')
          END;

          IF p_acao = 'aprovar' THEN
              -- Calcular comissões
              v_comissao_sdr := v_chamada.valor * v_percentual_sdr / 100;
              v_comissao_closer := v_chamada.valor * v_percentual_closer / 100;

              -- Atualizar status da chamada
              UPDATE chamadas
              SET
                  status_aprovacao = 'aprovada',
                  data_aprovacao = NOW(),
                  aprovado_por = p_admin_id,
                  clinica_id = COALESCE(p_produto_id, clinica_id)
              WHERE id = p_chamada_id;

              -- Criar comissão para SDR usando INSERT direto (ignorando foreign keys)
              BEGIN
                  IF v_lead.sdr_id IS NOT NULL THEN
                      INSERT INTO comissoes (
                          chamada_id, lead_id, sdr_id, user_id,
                          valor_venda, valor, comissao_sdr,
                          percentual_sdr,
                          status, data_venda, tipo, motor_type,
                          created_at, updated_at
                      ) VALUES (
                          p_chamada_id, v_chamada.lead_id, v_lead.sdr_id, v_lead.sdr_id,
                          v_chamada.valor, v_comissao_sdr, v_comissao_sdr,
                          v_percentual_sdr,
                          'pendente', v_chamada.data_chamada, 'venda', v_motor_type,
                          NOW(), NOW()
                      );
                  END IF;
              EXCEPTION WHEN OTHERS THEN
                  -- Se der erro de foreign key, inserir sem user_id
                  IF v_lead.sdr_id IS NOT NULL THEN
                      INSERT INTO comissoes (
                          chamada_id, lead_id, sdr_id,
                          valor_venda, valor, comissao_sdr,
                          percentual_sdr,
                          status, data_venda, tipo, motor_type,
                          created_at, updated_at
                      ) VALUES (
                          p_chamada_id, v_chamada.lead_id, v_lead.sdr_id,
                          v_chamada.valor, v_comissao_sdr, v_comissao_sdr,
                          v_percentual_sdr,
                          'pendente', v_chamada.data_chamada, 'venda', v_motor_type,
                          NOW(), NOW()
                      );
                  END IF;
              END;

              -- Criar comissão para Closer usando INSERT direto (ignorando foreign keys)
              BEGIN
                  INSERT INTO comissoes (
                      chamada_id, lead_id, closer_id, user_id,
                      valor_venda, valor, comissao_closer,
                      percentual_closer,
                      status, data_venda, tipo, motor_type,
                      created_at, updated_at
                  ) VALUES (
                      p_chamada_id, v_chamada.lead_id, v_chamada.closer_id, v_chamada.closer_id,
                      v_chamada.valor, v_comissao_closer, v_comissao_closer,
                      v_percentual_closer,
                      'pendente', v_chamada.data_chamada, 'venda', v_motor_type,
                      NOW(), NOW()
                  );
              EXCEPTION WHEN OTHERS THEN
                  -- Se der erro de foreign key, inserir sem user_id
                  INSERT INTO comissoes (
                      chamada_id, lead_id, closer_id,
                      valor_venda, valor, comissao_closer,
                      percentual_closer,
                      status, data_venda, tipo, motor_type,
                      created_at, updated_at
                  ) VALUES (
                      p_chamada_id, v_chamada.lead_id, v_chamada.closer_id,
                      v_chamada.valor, v_comissao_closer, v_comissao_closer,
                      v_percentual_closer,
                      'pendente', v_chamada.data_chamada, 'venda', v_motor_type,
                      NOW(), NOW()
                  );
              END;

              RETURN json_build_object(
                  'success', true,
                  'message', 'Venda aprovada com sucesso',
                  'comissao_sdr', v_comissao_sdr,
                  'comissao_closer', v_comissao_closer
              );

          ELSIF p_acao = 'rejeitar' THEN
              UPDATE chamadas
              SET
                  status_aprovacao = 'rejeitada',
                  data_aprovacao = NOW(),
                  aprovado_por = p_admin_id
              WHERE id = p_chamada_id;

              RETURN json_build_object('success', true, 'message', 'Venda rejeitada');
          ELSE
              RETURN json_build_object('success', false, 'message', 'Ação inválida');
          END IF;
      END;
      $$ LANGUAGE plpgsql;
    `

    // Usar a API REST diretamente para executar SQL
    console.log('Executando SQL através da API REST...')

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: createFunctionSQL })
    })

    if (!response.ok) {
      console.log('❌ Erro na API REST:', response.status, response.statusText)
      const errorText = await response.text()
      console.log('Detalhes do erro:', errorText)
    } else {
      console.log('✅ Função atualizada via API REST')
    }

    // 2. Testar a função atualizada
    console.log('\n2. Testando função atualizada...')

    const { data: chamadas } = await supabase
      .from('chamadas')
      .select('id, valor, resultado, status_aprovacao, closer_id, lead_id')
      .eq('resultado', 'venda')
      .eq('status_aprovacao', 'pendente')
      .limit(1)

    if (chamadas && chamadas.length > 0) {
      const { data: admin } = await supabase
        .from('users')
        .select('id, nome, funcao')
        .eq('funcao', 'admin')
        .limit(1)
        .single()

      if (admin) {
        console.log('🧪 Testando aprovação...')

        const { data: result, error: approveError } = await supabase
          .rpc('aprovar_rejeitar_venda', {
            p_chamada_id: chamadas[0].id,
            p_admin_id: admin.id,
            p_acao: 'aprovar',
            p_produto_id: null
          })

        if (approveError) {
          console.log('❌ ERRO:', approveError)
        } else {
          console.log('✅ SUCESSO! Resultado:', result)
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

manualFix()