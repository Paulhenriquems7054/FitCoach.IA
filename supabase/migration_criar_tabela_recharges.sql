-- Migration: Criar tabela de recargas/upgrades
-- Data: 2025-01-27

-- Tabela para armazenar compras de recargas (Turbo, Banco de Voz, Passe Livre)
CREATE TABLE IF NOT EXISTS public.recharges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Tipo de recarga
    recharge_type TEXT NOT NULL CHECK (recharge_type IN ('turbo', 'voice_bank', 'pass_libre')),
    recharge_name TEXT NOT NULL, -- 'Sessão Turbo', 'Banco de Voz 100', 'Passe Livre 30 Dias'
    
    -- Valor e quantidade
    amount_paid DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    quantity INTEGER NOT NULL, -- Minutos ou dias
    
    -- Validade
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ, -- NULL para Banco de Voz (não expira)
    expires_at TIMESTAMPTZ, -- Para Passe Livre: 30 dias após compra
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'used', 'expired')),
    used_at TIMESTAMPTZ, -- Quando foi utilizado (se aplicável)
    
    -- Pagamento
    cakto_transaction_id TEXT UNIQUE,
    cakto_checkout_id TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    
    -- Metadados
    metadata JSONB DEFAULT '{}'::jsonb, -- Informações adicionais específicas do tipo
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_recharges_user_id ON public.recharges(user_id);
CREATE INDEX IF NOT EXISTS idx_recharges_type ON public.recharges(recharge_type);
CREATE INDEX IF NOT EXISTS idx_recharges_status ON public.recharges(status);
CREATE INDEX IF NOT EXISTS idx_recharges_valid_until ON public.recharges(valid_until);
CREATE INDEX IF NOT EXISTS idx_recharges_expires_at ON public.recharges(expires_at);
CREATE INDEX IF NOT EXISTS idx_recharges_cakto_transaction ON public.recharges(cakto_transaction_id);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_recharges_updated_at ON public.recharges;
CREATE TRIGGER update_recharges_updated_at BEFORE UPDATE ON public.recharges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.recharges IS 'Recargas e upgrades comprados pelos usuários (Turbo, Banco de Voz, Passe Livre)';
COMMENT ON COLUMN public.recharges.recharge_type IS 'Tipo: turbo (30min/24h), voice_bank (100min/não expira), pass_libre (30 dias sem limite)';
COMMENT ON COLUMN public.recharges.quantity IS 'Quantidade: minutos para turbo/voice_bank, dias para pass_libre';

