-- =====================================================
-- 01. TABELA USERS - Usuários do sistema
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    funcao TEXT NOT NULL CHECK (funcao IN ('admin', 'sdr', 'closer', 'mentorado')),
    data_nascimento DATE,
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    primeiro_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo TEXT DEFAULT 'usuario'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_funcao ON users(funcao);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Dados exemplo (se não existirem)
INSERT INTO users (email, nome, funcao) VALUES
('admin@sistema.com', 'Gabriel Maia', 'admin'),
('sdr@sistema.com', 'Emerson', 'sdr'),
('closer@sistema.com', 'Emerson G Costa', 'closer')
ON CONFLICT (email) DO NOTHING;