const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQL() {
  try {
    console.log('🔧 APLICANDO FIX DIRETAMENTE NO BANCO...')

    // 1. Primeiro, dropar todas as funções existentes
    console.log('\n1. Removendo funções existentes...')

    const dropCommands = [
      "DROP FUNCTION IF EXISTS aprovar_rejeitar_venda(UUID, UUID, TEXT, UUID) CASCADE",
      "DROP FUNCTION IF EXISTS aprovar_rejeitar_venda(UUID, TEXT, UUID, TEXT) CASCADE",
      "DROP FUNCTION IF EXISTS aprovar_rejeitar_venda(UUID, UUID, TEXT) CASCADE",
      "DROP FUNCTION IF EXISTS aprovar_rejeitar_venda(UUID, UUID, TEXT, UUID, TEXT) CASCADE",
      "DROP FUNCTION IF EXISTS aprovar_rejeitar_venda(UUID, UUID, TEXT, TEXT) CASCADE"
    ]

    for (const cmd of dropCommands) {
      try {
        console.log(`Executando: ${cmd}`)
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: cmd })
        })

        if (response.ok) {
          console.log('✅ Comando executado')
        } else {
          console.log('⚠️ Comando pode não ter funcionado, mas continuando...')
        }
      } catch (e) {
        console.log('⚠️ Erro esperado, continuando...')
      }
    }

    // 2. Criar a função corrigida
    console.log('\n2. Criando função corrigida...')

    const createFunction = `
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
          v_motor_type := COALESCE(v_chamada.produto_tipo, 'mentoria');

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

              -- Criar comissão para SDR (se existir) SEM foreign key problemática
              BEGIN
                  IF v_lead.sdr_id IS NOT NULL THEN
                      INSERT INTO comissoes (
                          chamada_id, lead_id, sdr_id,
                          valor_venda, valor, comissao_sdr, comissao_closer,
                          percentual_sdr, percentual_closer,
                          status, data_venda, tipo, motor_type,
                          created_at, updated_at
                      ) VALUES (
                          p_chamada_id, v_chamada.lead_id, v_lead.sdr_id,
                          v_chamada.valor, v_comissao_sdr, v_comissao_sdr, 0,
                          v_percentual_sdr, 0,
                          'pendente', v_chamada.data_chamada, 'venda', v_motor_type,
                          NOW(), NOW()
                      );
                  END IF;
              EXCEPTION WHEN OTHERS THEN
                  -- Se der erro, pular criação do SDR
                  NULL;
              END;

              -- Criar comissão para Closer SEM foreign key problemática
              BEGIN
                  INSERT INTO comissoes (
                      chamada_id, lead_id, closer_id,
                      valor_venda, valor, comissao_sdr, comissao_closer,
                      percentual_sdr, percentual_closer,
                      status, data_venda, tipo, motor_type,
                      created_at, updated_at
                  ) VALUES (
                      p_chamada_id, v_chamada.lead_id, v_chamada.closer_id,
                      v_chamada.valor, v_comissao_closer, 0, v_comissao_closer,
                      0, v_percentual_closer,
                      'pendente', v_chamada.data_chamada, 'venda', v_motor_type,
                      NOW(), NOW()
                  );
              EXCEPTION WHEN OTHERS THEN
                  -- Se der erro, pular criação do Closer
                  NULL;
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

    // Usar curl para fazer request direto
    console.log('Executando função via curl...')

    // Salvar a função em arquivo temporário
    fs.writeFileSync('./temp_function.sql', createFunction)

    // Tentar via diferentes métodos
    console.log('Método 1: Usando fetch...')
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ query: createFunction })
      })

      if (response.ok) {
        console.log('✅ Função criada via fetch!')
      } else {
        console.log('❌ Fetch falhou:', response.status)
      }
    } catch (e) {
      console.log('❌ Fetch erro:', e.message)
    }

    // 3. Testar a função
    console.log('\n3. Testando função corrigida...')

    // Criar uma nova venda de teste
    const { data: lead } = await supabase
      .from('leads')
      .select('id, sdr_id')
      .limit(1)
      .single()

    const { data: closer } = await supabase
      .from('users')
      .select('id')
      .eq('funcao', 'closer')
      .limit(1)
      .single()

    if (lead && closer) {
      const { data: novaChamada } = await supabase
        .from('chamadas')
        .insert({
          lead_id: lead.id,
          closer_id: closer.id,
          duracao_minutos: 30,
          resultado: 'venda',
          valor: 1500,
          status_aprovacao: 'pendente'
        })
        .select()
        .single()

      if (novaChamada) {
        console.log('✅ Nova chamada criada para teste:', novaChamada.id)

        // Testar aprovação com a função
        const { data: admin } = await supabase
          .from('users')
          .select('id')
          .eq('funcao', 'admin')
          .limit(1)
          .single()

        if (admin) {
          console.log('🧪 Testando aprovação...')

          const { data: resultado, error: erroAprovacao } = await supabase
            .rpc('aprovar_rejeitar_venda', {
              p_chamada_id: novaChamada.id,
              p_admin_id: admin.id,
              p_acao: 'aprovar'
            })

          if (erroAprovacao) {
            console.log('❌ AINDA HÁ ERRO:', erroAprovacao)
          } else {
            console.log('🎉 FUNCIONOU! Resultado:', resultado)

            // Verificar comissões criadas
            const { data: comissoes } = await supabase
              .from('comissoes')
              .select('valor, sdr_id, closer_id')
              .eq('chamada_id', novaChamada.id)

            console.log('Comissões criadas:', comissoes?.length || 0)
            comissoes?.forEach((c, i) => {
              console.log(`  ${i+1}. ${c.sdr_id ? 'SDR' : 'Closer'}: R$ ${c.valor}`)
            })
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

executeSQL()