-- =====================================================
-- 04. TABELA CHAMADAS - Registro de chamadas/vendas
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS chamadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    closer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinica_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
    produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
    duracao_minutos INTEGER DEFAULT 0,
    resultado TEXT NOT NULL CHECK (resultado IN ('venda', 'perda', 'reagendamento')),
    valor DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT,
    data_chamada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status_aprovacao TEXT DEFAULT 'pendente' CHECK (status_aprovacao IN ('pendente', 'aprovada', 'rejeitada')),
    aprovado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    motivo_rejeicao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_chamadas_resultado ON chamadas(resultado);
CREATE INDEX IF NOT EXISTS idx_chamadas_status_aprovacao ON chamadas(status_aprovacao);
CREATE INDEX IF NOT EXISTS idx_chamadas_closer_id ON chamadas(closer_id);
CREATE INDEX IF NOT EXISTS idx_chamadas_lead_id ON chamadas(lead_id);
CREATE INDEX IF NOT EXISTS idx_chamadas_data ON chamadas(data_chamada);

-- Trigger para updated_at
CREATE TRIGGER update_chamadas_updated_at BEFORE UPDATE ON chamadas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();