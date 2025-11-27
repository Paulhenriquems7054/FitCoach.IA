-- Migration: Criar tabela de log de webhooks do Cakto
-- Data: 2025-01-27

-- Tabela para armazenar todos os webhooks recebidos da Cakto para auditoria e debug
CREATE TABLE IF NOT EXISTS public.cakto_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Dados do webhook
    event_type TEXT NOT NULL, -- 'payment.completed', 'payment.failed', etc.
    cakto_transaction_id TEXT,
    checkout_id TEXT,
    
    -- Payload completo
    payload JSONB NOT NULL,
    
    -- Status de processamento
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Relacionamentos (podem ser NULL se não processado ainda)
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cakto_webhooks_event_type ON public.cakto_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_cakto_webhooks_transaction_id ON public.cakto_webhooks(cakto_transaction_id);
CREATE INDEX IF NOT EXISTS idx_cakto_webhooks_checkout_id ON public.cakto_webhooks(checkout_id);
CREATE INDEX IF NOT EXISTS idx_cakto_webhooks_processed ON public.cakto_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_cakto_webhooks_created_at ON public.cakto_webhooks(created_at);

-- Comentários para documentação
COMMENT ON TABLE public.cakto_webhooks IS 'Log de todos os webhooks recebidos da Cakto para auditoria e debug';
COMMENT ON COLUMN public.cakto_webhooks.event_type IS 'Tipo de evento: payment.completed, payment.failed, etc.';
COMMENT ON COLUMN public.cakto_webhooks.processed IS 'Indica se o webhook foi processado com sucesso';
COMMENT ON COLUMN public.cakto_webhooks.payload IS 'Payload completo do webhook em formato JSON';

