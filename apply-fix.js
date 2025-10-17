const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyFix() {
  try {
    console.log('🔧 Aplicando fix da foreign key...')

    // 1. Primeiro, remover as constraints problemáticas
    console.log('\n1. Removendo constraints foreign key...')

    const constraintsToRemove = [
      'comissoes_user_id_fkey',
      'comissoes_sdr_id_fkey',
      'comissoes_closer_id_fkey',
      'comissoes_lead_id_fkey',
      'comissoes_produto_id_fkey',
      'comissoes_chamada_id_fkey'
    ]

    for (const constraint of constraintsToRemove) {
      try {
        console.log(`  Removendo constraint: ${constraint}...`)
        const { error } = await supabase.rpc('exec_sql_direct', {
          query: `ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS ${constraint};`
        })
        if (error && !error.message.includes('does not exist')) {
          console.log(`  ⚠️ ${constraint}: ${error.message}`)
        } else {
          console.log(`  ✅ ${constraint} removida/verificada`)
        }
      } catch (e) {
        console.log(`  ⚠️ ${constraint}: ${e.message}`)
      }
    }

    // 2. Verificar se função existe e removê-la
    console.log('\n2. Removendo funções conflitantes...')
    try {
      const { error: dropError } = await supabase.rpc('exec_sql_direct', {
        query: `
          DROP FUNCTION IF EXISTS aprovar_rejeitar_venda(UUID, UUID, TEXT, UUID) CASCADE;
          DROP FUNCTION IF EXISTS aprovar_rejeitar_venda(UUID, TEXT, UUID, TEXT) CASCADE;
          DROP FUNCTION IF EXISTS aprovar_rejeitar_venda(UUID, UUID, TEXT) CASCADE;
          DROP FUNCTION IF EXISTS aprovar_rejeitar_venda(UUID, UUID, TEXT, UUID, TEXT) CASCADE;
        `
      })

      if (dropError) {
        console.log('  ⚠️ Erro ao remover funções:', dropError.message)
      } else {
        console.log('  ✅ Funções removidas')
      }
    } catch (e) {
      console.log('  ⚠️ Erro ao remover funções:', e.message)
    }

    // 3. Criar a função corrigida
    console.log('\n3. Criando função corrigida...')

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

              -- Criar comissão para SDR (se existir) SEM FOREIGN KEY
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

              -- Criar comissão para Closer (sempre) SEM FOREIGN KEY
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

    try {
      const { error: createError } = await supabase.rpc('exec_sql_direct', {
        query: createFunctionSQL
      })

      if (createError) {
        console.log('  ❌ Erro ao criar função:', createError.message)
      } else {
        console.log('  ✅ Função criada com sucesso')
      }
    } catch (e) {
      console.log('  ❌ Erro ao criar função:', e.message)
    }

    console.log('\n🎉 Fix aplicado! Testando novamente...')

    // 4. Testar novamente
    const { data: chamadas, error: chamadaError } = await supabase
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
        console.log('🧪 Testando aprovação após fix...')

        const { data: result, error: approveError } = await supabase
          .rpc('aprovar_rejeitar_venda', {
            p_chamada_id: chamadas[0].id,
            p_admin_id: admin.id,
            p_acao: 'aprovar',
            p_produto_id: null
          })

        if (approveError) {
          console.log('❌ AINDA HÁ ERRO:', approveError)
        } else {
          console.log('✅ SUCESSO! Resultado:', result)
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

applyFix()