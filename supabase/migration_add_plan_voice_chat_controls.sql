-- ============================================================================
-- FitCoach.IA - Migração: Controle de Planos, Voz e Chat
-- Adiciona campos para controle de planos, uso de voz (Gemini Live) e chat
-- ============================================================================

-- ============================================================================
-- ADICIONAR CAMPOS NA TABELA USERS
-- ============================================================================

-- Controle de Plano
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS plan_type TEXT CHECK (plan_type IN ('free', 'monthly', 'annual', 'academy_starter', 'academy_growth', 'personal_team')) DEFAULT 'free';

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'expired')) DEFAULT 'active';

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

-- Controle de Voz (Gemini Live)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS voice_daily_limit_seconds INTEGER DEFAULT 900; -- 15 minutos padrão

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS voice_used_today_seconds INTEGER DEFAULT 0;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS voice_balance_upsell INTEGER DEFAULT 0; -- Saldo de minutos comprados que não expiram

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_usage_date DATE; -- Para resetar contador diário

-- Controle de Chat (Texto)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS text_msg_count_today INTEGER DEFAULT 0;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_msg_date DATE; -- Para resetar contador diário

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON public.users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_expiry_date ON public.users(expiry_date);
CREATE INDEX IF NOT EXISTS idx_users_last_usage_date ON public.users(last_usage_date);
CREATE INDEX IF NOT EXISTS idx_users_last_msg_date ON public.users(last_msg_date);

-- ============================================================================
-- CRIAR TABELA DE CUPONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Código do cupom (único)
    code TEXT NOT NULL UNIQUE,
    
    -- Plano vinculado ao cupom
    plan_linked TEXT NOT NULL CHECK (plan_linked IN ('free', 'monthly', 'annual', 'academy_starter', 'academy_growth', 'personal_team')),
    
    -- Limites de uso
    max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
    current_uses INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
    
    -- Status do cupom
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Informações adicionais
    description TEXT,
    discount_percentage DECIMAL(5,2), -- Percentual de desconto (opcional)
    discount_amount DECIMAL(10,2), -- Valor fixo de desconto (opcional)
    valid_from TIMESTAMPTZ DEFAULT NOW(), -- Data de início da validade
    valid_until TIMESTAMPTZ, -- Data de fim da validade (NULL = sem expiração)
    
    -- Metadata
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para cupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_plan_linked ON public.coupons(plan_linked);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÃO PARA VALIDAR E APLICAR CUPOM
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_and_apply_coupon(
    coupon_code TEXT,
    user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    coupon_record public.coupons%ROWTYPE;
    result JSONB;
BEGIN
    -- Buscar cupom
    SELECT * INTO coupon_record
    FROM public.coupons
    WHERE code = coupon_code;
    
    -- Verificar se cupom existe
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cupom não encontrado'
        );
    END IF;
    
    -- Verificar se está ativo
    IF NOT coupon_record.is_active THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cupom não está ativo'
        );
    END IF;
    
    -- Verificar se ainda pode ser usado
    IF coupon_record.current_uses >= coupon_record.max_uses THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cupom esgotado'
        );
    END IF;
    
    -- Verificar validade (se houver)
    IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cupom expirado'
        );
    END IF;
    
    IF coupon_record.valid_from > NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cupom ainda não está válido'
        );
    END IF;
    
    -- Incrementar uso
    UPDATE public.coupons
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = coupon_record.id;
    
    -- Aplicar plano ao usuário
    UPDATE public.users
    SET plan_type = coupon_record.plan_linked,
        subscription_status = 'active',
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'plan', coupon_record.plan_linked,
        'message', 'Cupom aplicado com sucesso'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNÇÃO PARA RESETAR CONTADORES DIÁRIOS
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_daily_counters()
RETURNS void AS $$
BEGIN
    -- Resetar contador de voz se a data mudou
    UPDATE public.users
    SET voice_used_today_seconds = 0
    WHERE last_usage_date IS NULL 
       OR last_usage_date < CURRENT_DATE;
    
    -- Resetar contador de mensagens se a data mudou
    UPDATE public.users
    SET text_msg_count_today = 0
    WHERE last_msg_date IS NULL 
       OR last_msg_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS NAS COLUNAS
-- ============================================================================

COMMENT ON COLUMN public.users.plan_type IS 'Tipo de plano: free, monthly, annual, academy_starter, academy_growth, personal_team';
COMMENT ON COLUMN public.users.subscription_status IS 'Status da assinatura: active, inactive, expired';
COMMENT ON COLUMN public.users.expiry_date IS 'Data de validade do plano';
COMMENT ON COLUMN public.users.voice_daily_limit_seconds IS 'Limite diário de uso de voz em segundos (padrão: 900 = 15 minutos)';
COMMENT ON COLUMN public.users.voice_used_today_seconds IS 'Segundos de voz usados hoje';
COMMENT ON COLUMN public.users.voice_balance_upsell IS 'Saldo de minutos comprados à parte que não expiram';
COMMENT ON COLUMN public.users.last_usage_date IS 'Data do último uso de voz (para resetar contador diário)';
COMMENT ON COLUMN public.users.text_msg_count_today IS 'Contador de mensagens de texto enviadas hoje';
COMMENT ON COLUMN public.users.last_msg_date IS 'Data da última mensagem (para resetar contador diário)';

COMMENT ON TABLE public.coupons IS 'Tabela de cupons de desconto e promoções';
COMMENT ON COLUMN public.coupons.code IS 'Código único do cupom (ex: ACADEMIA-VIP)';
COMMENT ON COLUMN public.coupons.plan_linked IS 'Plano que este cupom libera';
COMMENT ON COLUMN public.coupons.max_uses IS 'Número máximo de vezes que o cupom pode ser usado';
COMMENT ON COLUMN public.coupons.current_uses IS 'Número atual de vezes que o cupom foi usado';

