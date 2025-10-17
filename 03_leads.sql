-- =====================================================
-- 03. TABELA LEADS - Potenciais clientes
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    origem TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'qualificado', 'agendado', 'perdido', 'convertido', 'aprovado', 'rejeitado')),
    sdr_id UUID REFERENCES users(id) ON DELETE SET NULL,
    closer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
    valor_estimado DECIMAL(10,2),
    observacoes TEXT,
    data_qualificacao TIMESTAMP WITH TIME ZONE,
    data_agendamento TIMESTAMP WITH TIME ZONE,
    data_reuniao TIMESTAMP WITH TIME ZONE,
    data_venda TIMESTAMP WITH TIME ZONE,
    aprovado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    aprovado_em TIMESTAMP WITH TIME ZONE,
    rejeitado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    rejeitado_em TIMESTAMP WITH TIME ZONE,
    motivo_rejeicao TEXT,
    status_atribuicao TEXT DEFAULT 'nao_atribuido',
    data_atribuicao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_sdr_id ON leads(sdr_id);
CREATE INDEX IF NOT EXISTS idx_leads_closer_id ON leads(closer_id);
CREATE INDEX IF NOT EXISTS idx_leads_origem ON leads(origem);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();