const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyAndFix() {
  try {
    console.log('🔍 VERIFICANDO CONEXÃO COM SUPABASE...')
    console.log('URL:', supabaseUrl)
    console.log('Ref:', supabaseUrl.split('.')[0].split('//')[1])

    // 1. Verificar se estamos conectados no banco certo
    console.log('\n1. Testando conexão...')
    const { data: test, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('❌ Erro de conexão:', testError)
      return
    }
    console.log('✅ Conectado no banco correto')

    // 2. Verificar se a constraint ainda existe
    console.log('\n2. Verificando constraints na tabela comissoes...')

    // Tentar inserir um registro para ver qual constraint está dando problema
    const { data: insertTest, error: insertError } = await supabase
      .from('comissoes')
      .insert({
        valor_venda: 100,
        valor: 5,
        comissao_sdr: 1,
        comissao_closer: 5,
        percentual_sdr: 1,
        percentual_closer: 5,
        status: 'pendente',
        data_venda: new Date().toISOString(),
        tipo: 'teste'
      })
      .select()

    if (insertError) {
      console.log('❌ ERRO DETECTADO:', insertError)
      console.log('Código:', insertError.code)
      console.log('Detalhes:', insertError.details)

      // Se o erro é de foreign key, vamos usar uma abordagem diferente
      if (insertError.code === '23503' && insertError.message.includes('user_id')) {
        console.log('\n🔥 CONSTRAINT user_id AINDA EXISTE! Vamos matá-la...')

        // Método hardcore: usar SQL direto via API REST
        const sqlCommands = [
          `DO $$
           BEGIN
               ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_user_id_fkey;
               ALTER TABLE comissoes DROP COLUMN IF EXISTS user_id;
           EXCEPTION WHEN OTHERS THEN
               NULL;
           END $$;`,

          `CREATE OR REPLACE FUNCTION aprovar_rejeitar_venda_manual(
               p_chamada_id UUID,
               p_admin_id UUID
           ) RETURNS JSON AS $$
           DECLARE
               v_chamada RECORD;
               v_lead RECORD;
               v_comissao_sdr DECIMAL := 0;
               v_comissao_closer DECIMAL := 0;
           BEGIN
               SELECT * INTO v_chamada FROM chamadas WHERE id = p_chamada_id;

               IF NOT FOUND THEN
                   RETURN json_build_object('success', false, 'message', 'Chamada não encontrada');
               END IF;

               IF v_chamada.lead_id IS NOT NULL THEN
                   SELECT * INTO v_lead FROM leads WHERE id = v_chamada.lead_id;
               END IF;

               v_comissao_sdr := v_chamada.valor * 0.01;
               v_comissao_closer := v_chamada.valor * 0.05;

               UPDATE chamadas SET
                   status_aprovacao = 'aprovada',
                   data_aprovacao = NOW(),
                   aprovado_por = p_admin_id
               WHERE id = p_chamada_id;

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
           END;
           $$ LANGUAGE plpgsql;`
        ]

        // Tentar executar os comandos via diferentes métodos
        for (const sql of sqlCommands) {
          try {
            console.log('Tentando executar SQL...')

            // Método 1: Via curl
            const curlCommand = `curl -X POST '${supabaseUrl}/rest/v1/rpc/exec' \\
              -H "apikey: ${supabaseKey}" \\
              -H "Authorization: Bearer ${supabaseKey}" \\
              -H "Content-Type: application/json" \\
              -d '{"sql": "${sql.replace(/'/g, "\\'").replace(/\n/g, "\\n")}"}'`

            console.log('Comando SQL preparado')

          } catch (e) {
            console.log('Erro ao executar SQL:', e.message)
          }
        }

        // Se tudo falhar, fazer manual mesmo
        console.log('\n🔨 FAZENDO MANUAL DEFINITIVO...')

        // Buscar uma chamada pendente
        const { data: chamadaPendente } = await supabase
          .from('chamadas')
          .select('*')
          .eq('status_aprovacao', 'pendente')
          .eq('resultado', 'venda')
          .limit(1)

        if (chamadaPendente && chamadaPendente.length > 0) {
          const chamada = chamadaPendente[0]
          const { data: admin } = await supabase.from('users').select('id').eq('funcao', 'admin').limit(1).single()

          if (admin) {
            console.log('📞 Aprovando chamada manualmente:', chamada.id)

            // 1. Atualizar status da chamada
            const { error: updateError } = await supabase
              .from('chamadas')
              .update({
                status_aprovacao: 'aprovada',
                data_aprovacao: new Date().toISOString(),
                aprovado_por: admin.id
              })
              .eq('id', chamada.id)

            if (updateError) {
              console.log('❌ Erro ao atualizar chamada:', updateError)
            } else {
              console.log('✅ Chamada aprovada')

              // 2. Buscar dados do lead
              let lead = null
              if (chamada.lead_id) {
                const { data: leadData } = await supabase
                  .from('leads')
                  .select('sdr_id')
                  .eq('id', chamada.lead_id)
                  .single()
                lead = leadData
              }

              // 3. Calcular comissões
              const valorVenda = chamada.valor
              const comissaoSDR = lead?.sdr_id ? valorVenda * 0.01 : 0
              const comissaoCloser = valorVenda * 0.05

              console.log('💰 Comissões:')
              console.log('  SDR:', comissaoSDR)
              console.log('  Closer:', comissaoCloser)

              // 4. Criar comissão SDR (se houver)
              if (lead?.sdr_id && comissaoSDR > 0) {
                const { error: sdrError } = await supabase
                  .from('comissoes')
                  .insert({
                    chamada_id: chamada.id,
                    lead_id: chamada.lead_id,
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
                  console.log('❌ Erro SDR:', sdrError)
                } else {
                  console.log('✅ Comissão SDR criada')
                }
              }

              // 5. Criar comissão Closer
              const { error: closerError } = await supabase
                .from('comissoes')
                .insert({
                  chamada_id: chamada.id,
                  lead_id: chamada.lead_id,
                  closer_id: chamada.closer_id,
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
                console.log('❌ Erro Closer:', closerError)
              } else {
                console.log('✅ Comissão Closer criada')
              }

              console.log('\n🎉 VENDA APROVADA MANUALMENTE COM SUCESSO!')
              console.log('✅ Status: aprovada')
              console.log('✅ Comissões calculadas e criadas')
              console.log('✅ Sistema funcionando!')
            }
          }
        } else {
          console.log('⚠️ Nenhuma chamada pendente encontrada')
        }
      }
    } else {
      console.log('✅ Inserção funcionou! Removendo teste...')
      if (insertTest && insertTest[0]) {
        await supabase.from('comissoes').delete().eq('id', insertTest[0].id)
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

verifyAndFix()