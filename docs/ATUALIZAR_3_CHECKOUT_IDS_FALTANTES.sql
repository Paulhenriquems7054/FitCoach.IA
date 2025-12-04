-- ============================================================================
-- ATUALIZAR APENAS OS 3 CHECKOUT IDs FALTANTES
-- ============================================================================
-- 
-- ⚠️ IMPORTANTE:
-- 1. Obtenha os product.short_id da Cakto para os 3 planos abaixo
-- 2. Substitua "PREENCHER_SHORT_ID_*" pelos IDs reais
-- 3. Execute esta query
-- ============================================================================

-- ===========================
-- 1. Personal Team 5
-- ===========================
UPDATE public.app_plans
SET cakto_checkout_id = 'PREENCHER_SHORT_ID_TEAM5'  -- ⚠️ SUBSTITUIR PELO ID REAL
WHERE slug = 'personal_team_5';

-- ===========================
-- 2. Personal Team 15
-- ===========================
UPDATE public.app_plans
SET cakto_checkout_id = 'PREENCHER_SHORT_ID_TEAM15'  -- ⚠️ SUBSTITUIR PELO ID REAL
WHERE slug = 'personal_team_15';

-- ===========================
-- 3. Recarga Passe Livre 30 Dias
-- ===========================
UPDATE public.app_plans
SET cakto_checkout_id = 'PREENCHER_SHORT_ID_PASSE_LIVRE'  -- ⚠️ SUBSTITUIR PELO ID REAL
WHERE slug = 'recarga_passe_livre_30d';

-- ============================================================================
-- VERIFICAÇÃO APÓS ATUALIZAÇÃO
-- ============================================================================

SELECT 
    slug,
    name,
    plan_group,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL 
             OR cakto_checkout_id = '' 
             OR cakto_checkout_id LIKE 'PREENCHER%'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
WHERE slug IN ('personal_team_5', 'personal_team_15', 'recarga_passe_livre_30d')
ORDER BY slug;

-- ============================================================================
-- VERIFICAÇÃO COMPLETA (TODOS OS PLANOS)
-- ============================================================================

SELECT 
    plan_group,
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL 
             OR cakto_checkout_id = '' 
             OR cakto_checkout_id LIKE 'PREENCHER%'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
ORDER BY plan_group, slug;

