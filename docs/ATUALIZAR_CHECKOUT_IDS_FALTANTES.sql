-- ============================================================================
-- ATUALIZAR CHECKOUT IDs FALTANTES
-- Execute esta query APENAS após obter os IDs reais da Cakto
-- ============================================================================
-- 
-- ⚠️ IMPORTANTE:
-- 1. Obtenha os product.short_id da Cakto para os 2 planos abaixo
-- 2. Substitua "PREENCHER_ID_CHECKOUT_*" pelos IDs reais
-- 3. Execute esta query no SQL Editor do Supabase
-- ============================================================================
-- 
-- NOTA: O Passe Livre já está preenchido com o ID: trszqtv_668453
-- ============================================================================

-- 1. Atualizar Personal Team 5
UPDATE public.app_plans
SET cakto_checkout_id = 'PREENCHER_ID_CHECKOUT_TEAM5'  -- ⚠️ SUBSTITUIR PELO ID REAL
WHERE slug = 'personal_team_5';

-- 2. Atualizar Personal Team 15
UPDATE public.app_plans
SET cakto_checkout_id = 'PREENCHER_ID_CHECKOUT_TEAM15'  -- ⚠️ SUBSTITUIR PELO ID REAL
WHERE slug = 'personal_team_15';

-- ============================================================================
-- VERIFICAÇÃO APÓS ATUALIZAÇÃO
-- ============================================================================

SELECT 
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL OR cakto_checkout_id = '' OR cakto_checkout_id LIKE 'PREENCHER%'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
WHERE slug IN ('personal_team_5', 'personal_team_15')
ORDER BY slug;

