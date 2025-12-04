-- ============================================================================
-- VERIFICAR CHECKOUT IDs FALTANTES
-- ============================================================================
-- Esta query mostra apenas os planos que ainda precisam de checkout_id
-- ============================================================================

SELECT 
    slug,
    name,
    plan_group,
    cakto_checkout_id,
    price,
    CASE 
        WHEN cakto_checkout_id IS NULL 
             OR cakto_checkout_id = '' 
             OR cakto_checkout_id LIKE 'PREENCHER%'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
WHERE cakto_checkout_id IS NULL 
   OR cakto_checkout_id = '' 
   OR cakto_checkout_id LIKE 'PREENCHER%'
ORDER BY plan_group, slug;

-- ============================================================================
-- RESUMO POR GRUPO
-- ============================================================================

SELECT 
    plan_group,
    COUNT(*) as total_planos,
    COUNT(CASE 
        WHEN cakto_checkout_id IS NOT NULL 
         AND cakto_checkout_id != '' 
         AND cakto_checkout_id NOT LIKE 'PREENCHER%'
        THEN 1 
    END) as planos_com_id,
    COUNT(CASE 
        WHEN cakto_checkout_id IS NULL 
         OR cakto_checkout_id = '' 
         OR cakto_checkout_id LIKE 'PREENCHER%'
        THEN 1 
    END) as planos_sem_id
FROM public.app_plans
GROUP BY plan_group
ORDER BY plan_group;

