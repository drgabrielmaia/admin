-- =====================================================
-- 02. TABELA PRODUTOS - Produtos/Serviços vendidos
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('infoproduto', 'fisico', 'mentoria', 'evento', 'saas', 'parceria')),
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL DEFAULT 0,
    custo DECIMAL(10,2) NOT NULL DEFAULT 0,
    margem_lucro DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN preco > 0 THEN ((preco - custo) / preco * 100) ELSE 0 END
    ) STORED,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    comissao_sdr_percent DECIMAL(5,2) DEFAULT 1.00,
    comissao_closer_percent DECIMAL(5,2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);

-- Dados exemplo
INSERT INTO produtos (nome, tipo, preco, custo) VALUES
('Mentoria Premium', 'mentoria', 5000, 500),
('Curso Online', 'infoproduto', 2500, 200),
('Consultoria Empresarial', 'mentoria', 10000, 1000)
ON CONFLICT DO NOTHING;