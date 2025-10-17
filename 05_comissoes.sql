-- =====================================================
-- 05. TABELA COMISSÕES - Controle de comissões
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS comissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chamada_id UUID REFERENCES chamadas(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    sdr_id UUID REFERENCES users(id) ON DELETE SET NULL,
    closer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
    user_id UUID, -- Removida foreign key para evitar problemas
    valor_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    percentual_sdr DECIMAL(5,2) DEFAULT 1.00,
    percentual_closer DECIMAL(5,2) DEFAULT 5.00,
    comissao_sdr DECIMAL(10,2) NOT NULL DEFAULT 0,
    comissao_closer DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'cancelada')),
    data_venda TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_pagamento TIMESTAMP WITH TIME ZONE,
    motor_type TEXT DEFAULT 'mentoria',
    tipo TEXT DEFAULT 'venda',
    tipo_comissao TEXT DEFAULT 'sdr',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comissoes_status ON comissoes(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_sdr_id ON comissoes(sdr_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_closer_id ON comissoes(closer_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_chamada_id ON comissoes(chamada_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_tipo ON comissoes(tipo);
CREATE INDEX IF NOT EXISTS idx_comissoes_data_venda ON comissoes(data_venda);

-- Trigger para updated_at
CREATE TRIGGER update_comissoes_updated_at BEFORE UPDATE ON comissoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();