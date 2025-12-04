-- ============================================================================
-- Migration: Adicionar campo user_email na tabela user_subscriptions
-- Data: 2025-01-27
-- 
-- PROBLEMA:
-- O webhook do Cakto tenta inserir user_email ao criar assinaturas B2C,
-- mas o campo não existe na tabela, causando falha silenciosa.
-- 
-- SOLUÇÃO:
-- Adicionar campo user_email para permitir busca por email.
-- ============================================================================

-- 1. Adicionar coluna user_email
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN public.user_subscriptions.user_email IS 
'E-mail do usuário que comprou a assinatura. Usado para verificar assinaturas B2C quando user_id não está disponível.';

-- 3. Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_email 
ON public.user_subscriptions(user_email) 
WHERE user_email IS NOT NULL;

-- 4. Adicionar índice composto para busca eficiente
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_email_status 
ON public.user_subscriptions(user_email, status) 
WHERE user_email IS NOT NULL AND status = 'active';

-- ============================================================================
-- Verificação
-- ============================================================================

-- Verificar se a coluna foi criada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_subscriptions' 
AND column_name = 'user_email';

-- Verificar se os índices foram criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'user_subscriptions'
AND indexname LIKE '%email%';

