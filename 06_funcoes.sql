-- =====================================================
-- 06. FUNÇÕES - Funções principais do sistema
-- =====================================================

-- Remover função existente e recriar
DROP FUNCTION IF EXISTS aprovar_rejeitar_venda CASCADE;

-- Função principal de aprovação/rejeição de vendas
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
    SELECT c.*, p.tipo as produto_tipo, p.nome as produto_nome
    INTO v_chamada
    FROM chamadas c
    LEFT JOIN produtos p ON c.produto_id = p.id OR c.clinica_id = p.id
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
            produto_id = COALESCE(p_produto_id, produto_id),
            clinica_id = COALESCE(p_produto_id, clinica_id)
        WHERE id = p_chamada_id;

        -- Criar comissão para SDR (se existir)
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
            -- Ignorar erro e continuar
            NULL;
        END;

        -- Criar comissão para Closer
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
            -- Ignorar erro e continuar
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

-- Função para registrar venda de closer
CREATE OR REPLACE FUNCTION closer_registrar_venda(
    p_lead_id UUID,
    p_closer_id UUID,
    p_produto_id UUID,
    p_valor DECIMAL,
    p_duracao_minutos INTEGER DEFAULT NULL,
    p_observacoes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_chamada_id UUID;
BEGIN
    -- Registrar chamada como venda pendente
    INSERT INTO chamadas (
        lead_id,
        closer_id,
        produto_id,
        clinica_id,
        duracao_minutos,
        resultado,
        valor,
        observacoes,
        data_chamada,
        status_aprovacao
    ) VALUES (
        p_lead_id,
        p_closer_id,
        p_produto_id,
        p_produto_id,
        p_duracao_minutos,
        'venda',
        p_valor,
        p_observacoes,
        NOW(),
        'pendente'
    ) RETURNING id INTO v_chamada_id;

    -- Atualizar status do lead se possível
    IF p_lead_id IS NOT NULL THEN
        UPDATE leads SET
            status = 'convertido',
            updated_at = NOW()
        WHERE id = p_lead_id;
    END IF;

    RETURN v_chamada_id;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar comissão como paga
CREATE OR REPLACE FUNCTION marcar_comissao_paga(
    p_comissao_id UUID,
    p_data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE comissoes
    SET
        status = 'paga',
        data_pagamento = p_data_pagamento,
        updated_at = NOW()
    WHERE id = p_comissao_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;