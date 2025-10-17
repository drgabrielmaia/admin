-- =====================================================
-- 08. SISTEMA BPO COMPLETO - Estrutura Financeira Avançada
-- =====================================================

-- 1. TABELA DE CONTAS BANCÁRIAS (se não existir)
CREATE TABLE IF NOT EXISTS contas_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    banco TEXT,
    tipo_conta TEXT CHECK (tipo_conta IN ('corrente', 'poupanca', 'investimento', 'carteira')),
    saldo_inicial DECIMAL(12,2) DEFAULT 0,
    saldo_atual DECIMAL(12,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA PRINCIPAL DE MOVIMENTAÇÕES FINANCEIRAS (Versão Enhanced)
CREATE TABLE IF NOT EXISTS movimentacoes_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- DADOS BÁSICOS
    conta_id UUID REFERENCES contas_bancarias(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(12,2) NOT NULL,
    data_movimento DATE NOT NULL,

    -- CATEGORIZAÇÃO DETALHADA
    categoria TEXT NOT NULL,
    subcategoria TEXT,
    descricao TEXT,

    -- FORMA DE PAGAMENTO (PIX, Débito, Crédito)
    forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'debito', 'credito', 'transferencia', 'dinheiro', 'boleto', 'outros')),

    -- MAPEAMENTO PARA NEGÓCIOS
    negocio TEXT NOT NULL CHECK (negocio IN ('mentoria', 'infoproduto', 'saas', 'fisico', 'parceria', 'evento', 'clinica', 'real-estate')),
    motor_type TEXT, -- Para compatibilidade

    -- STATUS E CONTROLE
    status TEXT DEFAULT 'realizado' CHECK (status IN ('pendente', 'realizado', 'cancelado')),

    -- DADOS GERENCIAIS
    tipo_gestao TEXT CHECK (tipo_gestao IN ('bruto', 'pessoal', 'aluguel', 'operacional', 'marketing', 'vendas', 'administrativo')),
    responsavel_id UUID, -- Referência ao usuário responsável

    -- METADADOS
    observacoes TEXT,
    tags TEXT[], -- Para categorização livre
    anexos JSONB, -- Para armazenar URLs de comprovantes

    -- AUDITORIA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- 3. TABELA DE DESPESAS DETALHADAS
CREATE TABLE IF NOT EXISTS bpo_despesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimentacao_id UUID REFERENCES movimentacoes_financeiras(id) ON DELETE CASCADE,

    -- CLASSIFICAÇÃO DA DESPESA
    tipo_despesa TEXT NOT NULL CHECK (tipo_despesa IN (
        'marketing', 'vendas', 'operacional', 'pessoal', 'administrativo',
        'tecnologia', 'aluguel', 'impostos', 'servicos', 'produtos'
    )),

    -- DADOS ESPECÍFICOS
    fornecedor TEXT,
    centro_custo TEXT,
    projeto TEXT,

    -- RECORRÊNCIA
    eh_recorrente BOOLEAN DEFAULT false,
    frequencia TEXT CHECK (frequencia IN ('mensal', 'trimestral', 'semestral', 'anual')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE FATURAMENTO E LUCROS
CREATE TABLE IF NOT EXISTS bpo_faturamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- PERÍODO
    data_referencia DATE NOT NULL,
    mes_ano TEXT GENERATED ALWAYS AS (TO_CHAR(data_referencia, 'YYYY-MM')) STORED,

    -- NEGÓCIO/MOTOR
    negocio TEXT NOT NULL,
    motor_type TEXT,

    -- FATURAMENTO
    faturamento_bruto DECIMAL(12,2) DEFAULT 0,
    faturamento_liquido DECIMAL(12,2) DEFAULT 0,

    -- CUSTOS E DESPESAS
    total_despesas DECIMAL(12,2) DEFAULT 0,
    despesas_marketing DECIMAL(12,2) DEFAULT 0,
    despesas_operacionais DECIMAL(12,2) DEFAULT 0,
    despesas_pessoal DECIMAL(12,2) DEFAULT 0,
    despesas_administrativas DECIMAL(12,2) DEFAULT 0,

    -- LUCROS
    lucro_bruto DECIMAL(12,2) GENERATED ALWAYS AS (faturamento_bruto - total_despesas) STORED,
    margem_lucro_percent DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN faturamento_bruto > 0 THEN
            ((faturamento_bruto - total_despesas) / faturamento_bruto * 100)
        ELSE 0 END
    ) STORED,

    -- FORMAS DE PAGAMENTO
    pix_total DECIMAL(12,2) DEFAULT 0,
    debito_total DECIMAL(12,2) DEFAULT 0,
    credito_total DECIMAL(12,2) DEFAULT 0,
    outros_total DECIMAL(12,2) DEFAULT 0,

    -- METADADOS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- CONSTRAINT PARA EVITAR DUPLICATAS
    UNIQUE(data_referencia, negocio)
);

-- 5. TABELA DE HISTÓRICO DIÁRIO DE FATURAMENTO
CREATE TABLE IF NOT EXISTS bpo_historico_diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    data_dia DATE NOT NULL,
    negocio TEXT NOT NULL,

    -- ENTRADAS DO DIA
    entradas_total DECIMAL(12,2) DEFAULT 0,
    entradas_pix DECIMAL(12,2) DEFAULT 0,
    entradas_debito DECIMAL(12,2) DEFAULT 0,
    entradas_credito DECIMAL(12,2) DEFAULT 0,

    -- SAÍDAS DO DIA
    saidas_total DECIMAL(12,2) DEFAULT 0,
    saidas_marketing DECIMAL(12,2) DEFAULT 0,
    saidas_operacional DECIMAL(12,2) DEFAULT 0,
    saidas_pessoal DECIMAL(12,2) DEFAULT 0,

    -- RESULTADO LÍQUIDO
    saldo_dia DECIMAL(12,2) GENERATED ALWAYS AS (entradas_total - saidas_total) STORED,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(data_dia, negocio)
);

-- 6. TABELA DE CATEGORIAS PERSONALIZADAS
CREATE TABLE IF NOT EXISTS bpo_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    negocio TEXT,
    cor TEXT DEFAULT '#6b7280',
    icone TEXT DEFAULT 'circle',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Movimentações Financeiras
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON movimentacoes_financeiras(data_movimento);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_negocio ON movimentacoes_financeiras(negocio);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON movimentacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_forma_pagamento ON movimentacoes_financeiras(forma_pagamento);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_categoria ON movimentacoes_financeiras(categoria);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_status ON movimentacoes_financeiras(status);

-- Faturamento
CREATE INDEX IF NOT EXISTS idx_faturamento_mes_ano ON bpo_faturamento(mes_ano);
CREATE INDEX IF NOT EXISTS idx_faturamento_negocio ON bpo_faturamento(negocio);
CREATE INDEX IF NOT EXISTS idx_faturamento_data ON bpo_faturamento(data_referencia);

-- Histórico Diário
CREATE INDEX IF NOT EXISTS idx_historico_data ON bpo_historico_diario(data_dia);
CREATE INDEX IF NOT EXISTS idx_historico_negocio ON bpo_historico_diario(negocio);

-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger para updated_at nas movimentações
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_movimentacoes_updated_at
    BEFORE UPDATE ON movimentacoes_financeiras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faturamento_updated_at
    BEFORE UPDATE ON bpo_faturamento
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para Resumo Mensal por Negócio
CREATE OR REPLACE VIEW vw_bpo_resumo_mensal AS
SELECT
    TO_CHAR(data_movimento, 'YYYY-MM') as mes_ano,
    negocio,
    COUNT(*) as total_movimentacoes,
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as total_entradas,
    SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as total_saidas,
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) as saldo_liquido,

    -- Por forma de pagamento
    SUM(CASE WHEN tipo = 'entrada' AND forma_pagamento = 'pix' THEN valor ELSE 0 END) as entradas_pix,
    SUM(CASE WHEN tipo = 'entrada' AND forma_pagamento = 'debito' THEN valor ELSE 0 END) as entradas_debito,
    SUM(CASE WHEN tipo = 'entrada' AND forma_pagamento = 'credito' THEN valor ELSE 0 END) as entradas_credito
FROM movimentacoes_financeiras
WHERE status = 'realizado'
GROUP BY TO_CHAR(data_movimento, 'YYYY-MM'), negocio
ORDER BY mes_ano DESC, negocio;

-- View para Dashboard de Performance
CREATE OR REPLACE VIEW vw_bpo_performance AS
SELECT
    negocio,
    COUNT(*) as total_movimentacoes,
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as faturamento_total,
    SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as custos_total,
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) as lucro_total,

    -- Cálculo de margem
    CASE
        WHEN SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) > 0 THEN
            ROUND(
                (SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) /
                 SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) * 100)::numeric, 2
            )
        ELSE 0
    END as margem_lucro_percent,

    -- Performance do mês atual
    SUM(CASE
        WHEN tipo = 'entrada'
        AND data_movimento >= DATE_TRUNC('month', CURRENT_DATE)
        THEN valor ELSE 0
    END) as faturamento_mes_atual,

    SUM(CASE
        WHEN tipo = 'saida'
        AND data_movimento >= DATE_TRUNC('month', CURRENT_DATE)
        THEN valor ELSE 0
    END) as custos_mes_atual

FROM movimentacoes_financeiras
WHERE status = 'realizado'
GROUP BY negocio
ORDER BY faturamento_total DESC;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir contas bancárias padrão
INSERT INTO contas_bancarias (nome, banco, tipo_conta) VALUES
('Conta Principal', 'Nubank', 'corrente'),
('Conta Poupança', 'Banco do Brasil', 'poupanca'),
('Carteira PIX', 'Digital', 'carteira')
ON CONFLICT DO NOTHING;

-- Inserir categorias padrão
INSERT INTO bpo_categorias (nome, tipo, negocio, cor) VALUES
-- Entradas
('Vendas de Produtos', 'entrada', NULL, '#10b981'),
('Serviços Prestados', 'entrada', NULL, '#3b82f6'),
('Comissões Recebidas', 'entrada', NULL, '#8b5cf6'),
('Royalties', 'entrada', NULL, '#f59e0b'),

-- Saídas
('Marketing Digital', 'saida', NULL, '#ef4444'),
('Salários e Pessoal', 'saida', NULL, '#f97316'),
('Aluguel e Ocupação', 'saida', NULL, '#84cc16'),
('Tecnologia e Software', 'saida', NULL, '#06b6d4'),
('Impostos e Taxas', 'saida', NULL, '#8b5cf6'),
('Fornecedores', 'saida', NULL, '#ec4899')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para consolidar dados mensais automaticamente
CREATE OR REPLACE FUNCTION consolidar_bpo_mensal(
    p_mes DATE DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_data_ref DATE;
    v_negocio TEXT;
    rec RECORD;
BEGIN
    -- Se não informado, usar mês atual
    v_data_ref := COALESCE(p_mes, DATE_TRUNC('month', CURRENT_DATE));

    -- Para cada negócio com movimentações
    FOR rec IN
        SELECT DISTINCT negocio
        FROM movimentacoes_financeiras
        WHERE data_movimento >= v_data_ref
        AND data_movimento < v_data_ref + INTERVAL '1 month'
    LOOP
        v_negocio := rec.negocio;

        -- Inserir ou atualizar consolidação mensal
        INSERT INTO bpo_faturamento (
            data_referencia, negocio,
            faturamento_bruto, total_despesas,
            pix_total, debito_total, credito_total
        )
        SELECT
            v_data_ref,
            v_negocio,
            COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN tipo = 'entrada' AND forma_pagamento = 'pix' THEN valor ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN tipo = 'entrada' AND forma_pagamento = 'debito' THEN valor ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN tipo = 'entrada' AND forma_pagamento = 'credito' THEN valor ELSE 0 END), 0)
        FROM movimentacoes_financeiras
        WHERE negocio = v_negocio
        AND data_movimento >= v_data_ref
        AND data_movimento < v_data_ref + INTERVAL '1 month'
        AND status = 'realizado'

        ON CONFLICT (data_referencia, negocio)
        DO UPDATE SET
            faturamento_bruto = EXCLUDED.faturamento_bruto,
            total_despesas = EXCLUDED.total_despesas,
            pix_total = EXCLUDED.pix_total,
            debito_total = EXCLUDED.debito_total,
            credito_total = EXCLUDED.credito_total,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar saldo das contas
CREATE OR REPLACE FUNCTION atualizar_saldo_conta(p_conta_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE contas_bancarias
    SET saldo_atual = saldo_inicial + (
        SELECT COALESCE(
            SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0
        )
        FROM movimentacoes_financeiras
        WHERE conta_id = p_conta_id
        AND status = 'realizado'
    ),
    updated_at = NOW()
    WHERE id = p_conta_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE movimentacoes_financeiras IS 'Tabela principal para todas as movimentações financeiras do sistema BPO';
COMMENT ON TABLE bpo_faturamento IS 'Consolidação mensal de faturamento e lucros por negócio';
COMMENT ON TABLE bpo_historico_diario IS 'Histórico diário detalhado de entradas e saídas';
COMMENT ON TABLE bpo_despesas IS 'Detalhamento específico de despesas e custos';
COMMENT ON TABLE bpo_categorias IS 'Categorias personalizáveis para classificação financeira';

-- Executar consolidação inicial
SELECT consolidar_bpo_mensal();