-- ============================================================================
-- ATUALIZAR 2 IDs DE CHECKOUT FALTANTES
-- Execute esta query APENAS após obter os IDs reais da Cakto
-- ============================================================================
-- 
-- ⚠️ IMPORTANTE:
-- 1. Obtenha os product.short_id da Cakto para os 2 planos abaixo
-- 2. Substitua "SEU_ID_AQUI" pelos IDs reais
-- 3. Execute esta query no SQL Editor do Supabase
-- ============================================================================

-- 1. Atualizar Personal Team 5
UPDATE public.app_plans
SET cakto_checkout_id = 'SEU_ID_AQUI_TEAM5'  -- ⚠️ SUBSTITUIR PELO ID REAL DA CAKTO
WHERE slug = 'personal_team_5';

-- 2. Atualizar Personal Team 15
UPDATE public.app_plans
SET cakto_checkout_id = 'SEU_ID_AQUI_TEAM15'  -- ⚠️ SUBSTITUIR PELO ID REAL DA CAKTO
WHERE slug = 'personal_team_15';

-- ============================================================================
-- VERIFICAÇÃO APÓS ATUALIZAÇÃO
-- Execute esta query para verificar se funcionou
-- ============================================================================

SELECT 
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL 
             OR cakto_checkout_id = '' 
             OR cakto_checkout_id LIKE 'PREENCHER%'
             OR cakto_checkout_id = 'SEU_ID_AQUI_TEAM5'
             OR cakto_checkout_id = 'SEU_ID_AQUI_TEAM15'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
WHERE slug IN ('personal_team_5', 'personal_team_15')
ORDER BY slug;

-- ============================================================================
-- VERIFICAÇÃO COMPLETA DE TODOS OS PLANOS
-- Execute para ver todos os planos e seus status
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

