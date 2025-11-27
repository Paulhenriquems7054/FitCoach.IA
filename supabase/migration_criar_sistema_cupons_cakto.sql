-- Migration: Sistema completo de cupons com vínculo Cakto
-- Data: 2025-01-27
-- Descrição: Adiciona campos para vínculo com Cakto e tabela de rastreamento de vínculos

-- ============================================================================
-- 1. ADICIONAR CAMPOS À TABELA COUPONS PARA VÍNCULO COM CAKTO
-- ============================================================================

-- Adicionar campos se não existirem
DO $$ 
BEGIN
    -- Adicionar cakto_customer_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coupons' 
        AND column_name = 'cakto_customer_id'
    ) THEN
        ALTER TABLE public.coupons 
        ADD COLUMN cakto_customer_id TEXT;
        
        COMMENT ON COLUMN public.coupons.cakto_customer_id IS 'ID do cliente Cakto vinculado ao cupom';
    END IF;

    -- Adicionar linked_accounts_count se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coupons' 
        AND column_name = 'linked_accounts_count'
    ) THEN
        ALTER TABLE public.coupons 
        ADD COLUMN linked_accounts_count INTEGER NOT NULL DEFAULT 0 CHECK (linked_accounts_count >= 0);
        
        COMMENT ON COLUMN public.coupons.linked_accounts_count IS 'Número de contas já vinculadas a este cupom/pagamento';
    END IF;

    -- Adicionar max_linked_accounts se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coupons' 
        AND column_name = 'max_linked_accounts'
    ) THEN
        ALTER TABLE public.coupons 
        ADD COLUMN max_linked_accounts INTEGER CHECK (max_linked_accounts IS NULL OR max_linked_accounts > 0);
        
        COMMENT ON COLUMN public.coupons.max_linked_accounts IS 'Limite máximo de contas que podem ser vinculadas (NULL = ilimitado)';
    END IF;
END $$;

-- Criar índice para cakto_customer_id
CREATE INDEX IF NOT EXISTS idx_coupons_cakto_customer_id ON public.coupons(cakto_customer_id) WHERE cakto_customer_id IS NOT NULL;

-- ============================================================================
-- 2. CRIAR TABELA USER_COUPON_LINKS PARA RASTREAR VÍNCULOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_coupon_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Vínculos
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    
    -- Informações do vínculo
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadados
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: um usuário só pode ter um vínculo ativo por cupom
    CONSTRAINT unique_user_coupon_link UNIQUE (user_id, coupon_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_coupon_links_user_id ON public.user_coupon_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_links_coupon_id ON public.user_coupon_links(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_links_linked_at ON public.user_coupon_links(linked_at);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_coupon_links_updated_at ON public.user_coupon_links;
CREATE TRIGGER update_user_coupon_links_updated_at BEFORE UPDATE ON public.user_coupon_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.user_coupon_links IS 'Rastreia vínculos entre usuários e cupons (para controle de limites com Cakto)';
COMMENT ON COLUMN public.user_coupon_links.user_id IS 'ID do usuário vinculado ao cupom';
COMMENT ON COLUMN public.user_coupon_links.coupon_id IS 'ID do cupom vinculado ao usuário';

-- ============================================================================
-- 3. FUNÇÃO PARA VALIDAR CUPOM COM VERIFICAÇÃO DE PAGAMENTO CAKTO
-- ============================================================================

CREATE OR REPLACE FUNCTION check_coupon_payment_access(
    coupon_code TEXT
)
RETURNS JSONB AS $$
DECLARE
    coupon_record public.coupons%ROWTYPE;
    payment_record RECORD;
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
            'error', 'CUPOM_INEXISTENTE',
            'message', 'Cupom não encontrado'
        );
    END IF;
    
    -- Verificar se está ativo
    IF NOT coupon_record.is_active THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CUPOM_INATIVO',
            'message', 'Cupom não está ativo'
        );
    END IF;
    
    -- Verificar se ainda pode ser usado (current_uses < max_uses)
    IF coupon_record.current_uses >= coupon_record.max_uses THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CUPOM_ESGOTADO',
            'message', 'Cupom esgotado'
        );
    END IF;
    
    -- Verificar validade (se houver)
    IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CUPOM_EXPIRADO',
            'message', 'Cupom expirado'
        );
    END IF;
    
    IF coupon_record.valid_from > NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CUPOM_NAO_VALIDO',
            'message', 'Cupom ainda não está válido'
        );
    END IF;
    
    -- Se cupom está vinculado a Cakto, verificar pagamento
    IF coupon_record.cakto_customer_id IS NOT NULL THEN
        -- Buscar pagamento ativo na tabela cakto_payments (se existir)
        -- Por enquanto, vamos verificar se há limite de contas
        IF coupon_record.max_linked_accounts IS NOT NULL THEN
            IF coupon_record.linked_accounts_count >= coupon_record.max_linked_accounts THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'LIMITE_CONTAS_ATINGIDO',
                    'message', 'Limite de contas vinculadas atingido para este pagamento'
                );
            END IF;
        END IF;
        
        -- TODO: Verificar status do pagamento na tabela cakto_payments quando disponível
        -- Por enquanto, assumimos que se tem cakto_customer_id, o pagamento está ativo
        -- Esta verificação será implementada quando a integração com Cakto estiver completa
    END IF;
    
    -- Cupom válido
    RETURN jsonb_build_object(
        'success', true,
        'coupon_id', coupon_record.id,
        'plan_linked', coupon_record.plan_linked,
        'cakto_customer_id', coupon_record.cakto_customer_id,
        'linked_accounts_count', coupon_record.linked_accounts_count,
        'max_linked_accounts', coupon_record.max_linked_accounts,
        'current_uses', coupon_record.current_uses,
        'max_uses', coupon_record.max_uses
    );
END;
$$ LANGUAGE plpgsql;

-- Comentário da função
COMMENT ON FUNCTION check_coupon_payment_access IS 'Valida cupom e verifica se há acesso baseado em pagamento Cakto';

-- ============================================================================
-- 4. TRIGGERS PARA ATUALIZAR CONTADORES AUTOMATICAMENTE
-- ============================================================================

-- Função para incrementar current_uses e linked_accounts_count quando um vínculo é criado
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrementar current_uses
    UPDATE public.coupons
    SET current_uses = current_uses + 1
    WHERE id = NEW.coupon_id;
    
    -- Se cupom está vinculado a Cakto, incrementar linked_accounts_count
    UPDATE public.coupons
    SET linked_accounts_count = linked_accounts_count + 1
    WHERE id = NEW.coupon_id 
    AND cakto_customer_id IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para incrementar contadores quando vínculo é criado
DROP TRIGGER IF EXISTS trigger_increment_coupon_usage ON public.user_coupon_links;
CREATE TRIGGER trigger_increment_coupon_usage
    AFTER INSERT ON public.user_coupon_links
    FOR EACH ROW
    EXECUTE FUNCTION increment_coupon_usage();

-- Função para decrementar contadores quando um vínculo é removido
CREATE OR REPLACE FUNCTION decrement_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrementar current_uses
    UPDATE public.coupons
    SET current_uses = GREATEST(0, current_uses - 1)
    WHERE id = OLD.coupon_id;
    
    -- Se cupom está vinculado a Cakto, decrementar linked_accounts_count
    UPDATE public.coupons
    SET linked_accounts_count = GREATEST(0, linked_accounts_count - 1)
    WHERE id = OLD.coupon_id 
    AND cakto_customer_id IS NOT NULL;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para decrementar contadores quando vínculo é removido
DROP TRIGGER IF EXISTS trigger_decrement_coupon_usage ON public.user_coupon_links;
CREATE TRIGGER trigger_decrement_coupon_usage
    AFTER DELETE ON public.user_coupon_links
    FOR EACH ROW
    EXECUTE FUNCTION decrement_coupon_usage();

-- ============================================================================
-- 5. GARANTIR CONSTRAINT UNIQUE NA COLUNA CODE
-- ============================================================================

-- Verificar se já existe constraint UNIQUE
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'coupons_code_key' 
        AND conrelid = 'public.coupons'::regclass
    ) THEN
        -- Adicionar constraint UNIQUE se não existir
        ALTER TABLE public.coupons 
        ADD CONSTRAINT coupons_code_key UNIQUE (code);
    END IF;
END $$;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se todas as colunas foram criadas
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT array_agg(column_name) INTO missing_columns
    FROM (
        SELECT 'cakto_customer_id' AS column_name
        WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'coupons' 
            AND column_name = 'cakto_customer_id'
        )
        UNION ALL
        SELECT 'linked_accounts_count' AS column_name
        WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'coupons' 
            AND column_name = 'linked_accounts_count'
        )
        UNION ALL
        SELECT 'max_linked_accounts' AS column_name
        WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'coupons' 
            AND column_name = 'max_linked_accounts'
        )
    ) AS missing;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Colunas faltando: %', array_to_string(missing_columns, ', ');
    END IF;
END $$;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Migração concluída com sucesso!';
    RAISE NOTICE 'Campos adicionados à tabela coupons: cakto_customer_id, linked_accounts_count, max_linked_accounts';
    RAISE NOTICE 'Tabela user_coupon_links criada';
    RAISE NOTICE 'Função check_coupon_payment_access criada';
    RAISE NOTICE 'Triggers de atualização automática de contadores criados';
END $$;

