-- Script para criar todos os cupons de teste mencionados em CUPONS_DISPONIVEIS.md
-- Data: 2025-01-27
-- Descrição: Cria cupons para teste do sistema de cupons com vínculo Cakto

-- ============================================================================
-- CUPONS BÁSICOS (SEM CAKTO) - Funcionam imediatamente
-- ============================================================================

-- 1. TESTE-FREE - Plano gratuito, 100 usos
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    description,
    valid_from,
    valid_until,
    cakto_customer_id,
    linked_accounts_count,
    max_linked_accounts
)
VALUES (
    'TESTE-FREE',
    'free',
    100,
    0,
    TRUE,
    'Cupom de teste para plano gratuito - Use para teste básico',
    NOW(),
    NULL, -- Sem expiração
    NULL, -- Sem vínculo Cakto
    0,
    NULL -- Sem limite de contas
)
ON CONFLICT (code) DO UPDATE
SET 
    plan_linked = EXCLUDED.plan_linked,
    max_uses = EXCLUDED.max_uses,
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description,
    cakto_customer_id = EXCLUDED.cakto_customer_id,
    linked_accounts_count = COALESCE(coupons.linked_accounts_count, 0),
    max_linked_accounts = EXCLUDED.max_linked_accounts;

-- 2. TESTE-MONTHLY - Plano mensal, 50 usos
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    description,
    valid_from,
    valid_until,
    cakto_customer_id,
    linked_accounts_count,
    max_linked_accounts
)
VALUES (
    'TESTE-MONTHLY',
    'monthly',
    50,
    0,
    TRUE,
    'Cupom de teste para plano mensal premium',
    NOW(),
    NULL,
    NULL,
    0,
    NULL
)
ON CONFLICT (code) DO UPDATE
SET 
    plan_linked = EXCLUDED.plan_linked,
    max_uses = EXCLUDED.max_uses,
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description,
    cakto_customer_id = EXCLUDED.cakto_customer_id,
    linked_accounts_count = COALESCE(coupons.linked_accounts_count, 0),
    max_linked_accounts = EXCLUDED.max_linked_accounts;

-- 3. TESTE-ANNUAL - Plano anual, 30 usos
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    description,
    valid_from,
    valid_until,
    cakto_customer_id,
    linked_accounts_count,
    max_linked_accounts
)
VALUES (
    'TESTE-ANNUAL',
    'annual',
    30,
    0,
    TRUE,
    'Cupom de teste para plano anual premium',
    NOW(),
    NULL,
    NULL,
    0,
    NULL
)
ON CONFLICT (code) DO UPDATE
SET 
    plan_linked = EXCLUDED.plan_linked,
    max_uses = EXCLUDED.max_uses,
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description,
    cakto_customer_id = EXCLUDED.cakto_customer_id,
    linked_accounts_count = COALESCE(coupons.linked_accounts_count, 0),
    max_linked_accounts = EXCLUDED.max_linked_accounts;

-- ============================================================================
-- CUPONS COM VÍNCULO CAKTO - Requerem pagamento ativo
-- ============================================================================

-- 4. ACADEMIA-STARTER - Plano academy_starter, 50 usos, 50 contas
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    description,
    valid_from,
    valid_until,
    cakto_customer_id,
    linked_accounts_count,
    max_linked_accounts
)
VALUES (
    'ACADEMIA-STARTER',
    'academy_starter',
    50,
    0,
    TRUE,
    'Cupom para academias - Plano Starter - Requer pagamento Cakto ativo',
    NOW(),
    NULL,
    'cakto_customer_academia_starter', -- ID do cliente Cakto
    0,
    50 -- Limite de 50 contas vinculadas
)
ON CONFLICT (code) DO UPDATE
SET 
    plan_linked = EXCLUDED.plan_linked,
    max_uses = EXCLUDED.max_uses,
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description,
    cakto_customer_id = EXCLUDED.cakto_customer_id,
    linked_accounts_count = COALESCE(coupons.linked_accounts_count, 0),
    max_linked_accounts = EXCLUDED.max_linked_accounts;

-- 5. ACADEMIA-GROWTH - Plano academy_growth, 100 usos, 100 contas
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    description,
    valid_from,
    valid_until,
    cakto_customer_id,
    linked_accounts_count,
    max_linked_accounts
)
VALUES (
    'ACADEMIA-GROWTH',
    'academy_growth',
    100,
    0,
    TRUE,
    'Cupom para academias - Plano Growth - Requer pagamento Cakto ativo',
    NOW(),
    NULL,
    'cakto_customer_academia_growth',
    0,
    100
)
ON CONFLICT (code) DO UPDATE
SET 
    plan_linked = EXCLUDED.plan_linked,
    max_uses = EXCLUDED.max_uses,
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description,
    cakto_customer_id = EXCLUDED.cakto_customer_id,
    linked_accounts_count = COALESCE(coupons.linked_accounts_count, 0),
    max_linked_accounts = EXCLUDED.max_linked_accounts;

-- 6. PERSONAL-TEAM - Plano personal_team, 30 usos, 30 contas
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    description,
    valid_from,
    valid_until,
    cakto_customer_id,
    linked_accounts_count,
    max_linked_accounts
)
VALUES (
    'PERSONAL-TEAM',
    'personal_team',
    30,
    0,
    TRUE,
    'Cupom para personal trainers - Plano Team - Requer pagamento Cakto ativo',
    NOW(),
    NULL,
    'cakto_customer_personal_team',
    0,
    30
)
ON CONFLICT (code) DO UPDATE
SET 
    plan_linked = EXCLUDED.plan_linked,
    max_uses = EXCLUDED.max_uses,
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description,
    cakto_customer_id = EXCLUDED.cakto_customer_id,
    linked_accounts_count = COALESCE(coupons.linked_accounts_count, 0),
    max_linked_accounts = EXCLUDED.max_linked_accounts;

-- 7. PERSONAL-LIMITADO - Plano personal_team, 10 usos, 2 contas (para teste de limite)
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    description,
    valid_from,
    valid_until,
    cakto_customer_id,
    linked_accounts_count,
    max_linked_accounts
)
VALUES (
    'PERSONAL-LIMITADO',
    'personal_team',
    10,
    0,
    TRUE,
    'Cupom limitado para teste - Apenas 2 contas permitidas - Requer pagamento Cakto ativo',
    NOW(),
    NULL,
    'cakto_customer_personal_limitado',
    0,
    2 -- Apenas 2 contas para testar limite
)
ON CONFLICT (code) DO UPDATE
SET 
    plan_linked = EXCLUDED.plan_linked,
    max_uses = EXCLUDED.max_uses,
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description,
    cakto_customer_id = EXCLUDED.cakto_customer_id,
    linked_accounts_count = COALESCE(coupons.linked_accounts_count, 0),
    max_linked_accounts = EXCLUDED.max_linked_accounts;

-- ============================================================================
-- CUPONS PARA TESTE DE BLOQUEIO
-- ============================================================================

-- 8. TESTE-ESGOTADO - Esgotado (5/5 usos)
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    description,
    valid_from,
    valid_until,
    cakto_customer_id,
    linked_accounts_count,
    max_linked_accounts
)
VALUES (
    'TESTE-ESGOTADO',
    'free',
    5,
    5, -- Já esgotado
    TRUE,
    'Cupom esgotado para teste - Deve bloquear uso',
    NOW(),
    NULL,
    NULL,
    0,
    NULL
)
ON CONFLICT (code) DO UPDATE
SET 
    plan_linked = EXCLUDED.plan_linked,
    max_uses = EXCLUDED.max_uses,
    current_uses = EXCLUDED.current_uses, -- Manter esgotado
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description,
    cakto_customer_id = EXCLUDED.cakto_customer_id,
    linked_accounts_count = COALESCE(coupons.linked_accounts_count, 0),
    max_linked_accounts = EXCLUDED.max_linked_accounts;

-- 9. TESTE-INATIVO - Inativo
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    description,
    valid_from,
    valid_until,
    cakto_customer_id,
    linked_accounts_count,
    max_linked_accounts
)
VALUES (
    'TESTE-INATIVO',
    'free',
    10,
    0,
    FALSE, -- Inativo
    'Cupom inativo para teste - Deve bloquear uso',
    NOW(),
    NULL,
    NULL,
    0,
    NULL
)
ON CONFLICT (code) DO UPDATE
SET 
    plan_linked = EXCLUDED.plan_linked,
    max_uses = EXCLUDED.max_uses,
    is_active = EXCLUDED.is_active, -- Manter inativo
    description = EXCLUDED.description,
    cakto_customer_id = EXCLUDED.cakto_customer_id,
    linked_accounts_count = COALESCE(coupons.linked_accounts_count, 0),
    max_linked_accounts = EXCLUDED.max_linked_accounts;

-- 10. ACADEMIA-INATIVO - Ativo, mas pagamento inativo
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    description,
    valid_from,
    valid_until,
    cakto_customer_id,
    linked_accounts_count,
    max_linked_accounts
)
VALUES (
    'ACADEMIA-INATIVO',
    'academy_starter',
    20,
    0,
    TRUE, -- Cupom ativo
    'Cupom ativo mas com pagamento inativo - Para teste de validação de pagamento',
    NOW(),
    NULL,
    'cakto_customer_academia_inativo', -- ID que não terá pagamento ativo
    0,
    20
)
ON CONFLICT (code) DO UPDATE
SET 
    plan_linked = EXCLUDED.plan_linked,
    max_uses = EXCLUDED.max_uses,
    is_active = EXCLUDED.is_active,
    description = EXCLUDED.description,
    cakto_customer_id = EXCLUDED.cakto_customer_id,
    linked_accounts_count = COALESCE(coupons.linked_accounts_count, 0),
    max_linked_accounts = EXCLUDED.max_linked_accounts;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se todos os cupons foram criados
DO $$
DECLARE
    coupon_count INTEGER;
    expected_coupons TEXT[] := ARRAY[
        'TESTE-FREE',
        'TESTE-MONTHLY',
        'TESTE-ANNUAL',
        'ACADEMIA-STARTER',
        'ACADEMIA-GROWTH',
        'PERSONAL-TEAM',
        'PERSONAL-LIMITADO',
        'TESTE-ESGOTADO',
        'TESTE-INATIVO',
        'ACADEMIA-INATIVO'
    ];
    missing_coupons TEXT[];
BEGIN
    -- Contar cupons criados
    SELECT COUNT(*) INTO coupon_count
    FROM public.coupons
    WHERE code = ANY(expected_coupons);
    
    -- Verificar quais estão faltando
    SELECT array_agg(code) INTO missing_coupons
    FROM unnest(expected_coupons) AS code
    WHERE NOT EXISTS (
        SELECT 1 FROM public.coupons WHERE coupons.code = code
    );
    
    IF coupon_count < array_length(expected_coupons, 1) THEN
        RAISE WARNING 'Alguns cupons não foram criados: %', array_to_string(missing_coupons, ', ');
    ELSE
        RAISE NOTICE 'Todos os % cupons foram criados com sucesso!', coupon_count;
    END IF;
END $$;

-- Mostrar resumo dos cupons criados
SELECT 
    code,
    plan_linked,
    max_uses,
    current_uses,
    is_active,
    CASE 
        WHEN cakto_customer_id IS NOT NULL THEN 'Sim (Cakto)'
        ELSE 'Não'
    END AS tem_cakto,
    linked_accounts_count,
    max_linked_accounts,
    description
FROM public.coupons
WHERE code IN (
    'TESTE-FREE',
    'TESTE-MONTHLY',
    'TESTE-ANNUAL',
    'ACADEMIA-STARTER',
    'ACADEMIA-GROWTH',
    'PERSONAL-TEAM',
    'PERSONAL-LIMITADO',
    'TESTE-ESGOTADO',
    'TESTE-INATIVO',
    'ACADEMIA-INATIVO'
)
ORDER BY 
    CASE 
        WHEN code LIKE 'TESTE-%' AND code != 'TESTE-ESGOTADO' AND code != 'TESTE-INATIVO' THEN 1
        WHEN code LIKE 'ACADEMIA-%' OR code LIKE 'PERSONAL-%' THEN 2
        ELSE 3
    END,
    code;

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Cupons criados com sucesso!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Cupons básicos (sem Cakto):';
    RAISE NOTICE '  - TESTE-FREE (100 usos)';
    RAISE NOTICE '  - TESTE-MONTHLY (50 usos)';
    RAISE NOTICE '  - TESTE-ANNUAL (30 usos)';
    RAISE NOTICE '';
    RAISE NOTICE 'Cupons com Cakto (requerem pagamento):';
    RAISE NOTICE '  - ACADEMIA-STARTER (50 usos, 50 contas)';
    RAISE NOTICE '  - ACADEMIA-GROWTH (100 usos, 100 contas)';
    RAISE NOTICE '  - PERSONAL-TEAM (30 usos, 30 contas)';
    RAISE NOTICE '  - PERSONAL-LIMITADO (10 usos, 2 contas)';
    RAISE NOTICE '';
    RAISE NOTICE 'Cupons para teste de bloqueio:';
    RAISE NOTICE '  - TESTE-ESGOTADO (esgotado)';
    RAISE NOTICE '  - TESTE-INATIVO (inativo)';
    RAISE NOTICE '  - ACADEMIA-INATIVO (pagamento inativo)';
    RAISE NOTICE '';
    RAISE NOTICE 'Comece testando com: TESTE-FREE';
    RAISE NOTICE '========================================';
END $$;

