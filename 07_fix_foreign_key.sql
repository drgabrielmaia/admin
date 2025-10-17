-- =====================================================
-- 07. FIX FOREIGN KEY - MATAR A CONSTRAINT PROBLEMÁTICA
-- =====================================================

-- REMOVER A CONSTRAINT QUE TÁ FUDENDO TUDO
ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_user_id_fkey;
ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_sdr_id_fkey;
ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_closer_id_fkey;
ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_lead_id_fkey;
ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_produto_id_fkey;
ALTER TABLE comissoes DROP CONSTRAINT IF EXISTS comissoes_chamada_id_fkey;

-- Verificar se ainda existem constraints
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'comissoes'
        AND constraint_type = 'FOREIGN KEY'
    ) LOOP
        EXECUTE 'ALTER TABLE comissoes DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        RAISE NOTICE 'Removida constraint: %', r.constraint_name;
    END LOOP;
END $$;

-- REMOVER CAMPO user_id COMPLETAMENTE
ALTER TABLE comissoes DROP COLUMN IF EXISTS user_id;

-- RECRIAR FUNÇÃO SEM user_id
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
    v_motor_type TEXT;
    v_comissao_sdr DECIMAL := 0;
    v_comissao_closer DECIMAL := 0;
    v_percentual_sdr DECIMAL := 1.00;
    v_percentual_closer DECIMAL := 5.00;
BEGIN
    -- Buscar dados da chamada
    SELECT c.*
    INTO v_chamada
    FROM chamadas c
    WHERE c.id = p_chamada_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Chamada não encontrada');
    END IF;

    -- Buscar dados do lead (se existir)
    IF v_chamada.lead_id IS NOT NULL THEN
        SELECT * INTO v_lead FROM leads WHERE id = v_chamada.lead_id;
    END IF;

    IF p_acao = 'aprovar' THEN
        -- Calcular comissões
        v_comissao_sdr := v_chamada.valor * v_percentual_sdr / 100;
        v_comissao_closer := v_chamada.valor * v_percentual_closer / 100;

        -- Atualizar status da chamada
        UPDATE chamadas
        SET
            status_aprovacao = 'aprovada',
            data_aprovacao = NOW(),
            aprovado_por = p_admin_id
        WHERE id = p_chamada_id;

        -- Criar comissão para SDR (se existir) - SEM FOREIGN KEYS
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
                'pendente', v_chamada.data_chamada, 'venda', 'mentoria',
                NOW(), NOW()
            );
        END IF;

        -- Criar comissão para Closer - SEM FOREIGN KEYS
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
            'pendente', v_chamada.data_chamada, 'venda', 'mentoria',
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