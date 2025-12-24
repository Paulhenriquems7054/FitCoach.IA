-- ============================================
-- VERIFICAÇÃO COMPLETA DE PLANOS INSERIDOS
-- Execute este script para verificar se todos os planos foram criados
-- ============================================

-- 1. Verificar todos os planos por categoria
SELECT 
    plan_category,
    name,
    display_name,
    price_monthly,
    price_yearly,
    checkout_url_monthly,
    checkout_url_yearly,
    checkout_price_monthly,
    checkout_price_yearly,
    is_active,
    is_visible
FROM public.subscription_plans
WHERE plan_category IS NOT NULL
ORDER BY 
    CASE plan_category
        WHEN 'b2c_ai' THEN 1
        WHEN 'b2b_platform' THEN 2
        WHEN 'personal_platform' THEN 3
        WHEN 'recharge' THEN 4
        ELSE 5
    END,
    price_monthly;

-- 2. Contar planos por categoria
SELECT 
    plan_category,
    COUNT(*) as total_planos,
    COUNT(CASE WHEN checkout_url_monthly IS NOT NULL OR checkout_url_yearly IS NOT NULL THEN 1 END) as com_checkout
FROM public.subscription_plans
WHERE plan_category IS NOT NULL
GROUP BY plan_category
ORDER BY plan_category;

-- 3. Verificar planos B2C (deve ter 2)
SELECT 
    name,
    display_name,
    price_monthly,
    price_yearly,
    checkout_url_monthly,
    checkout_url_yearly,
    checkout_price_monthly,
    checkout_price_yearly
FROM public.subscription_plans
WHERE plan_category = 'b2c_ai'
ORDER BY price_monthly;

-- 4. Verificar planos B2B (deve ter 4)
SELECT 
    name,
    display_name,
    price_monthly,
    checkout_url_monthly,
    checkout_price_monthly
FROM public.subscription_plans
WHERE plan_category = 'b2b_platform'
ORDER BY price_monthly;

-- 5. Verificar planos Personal (deve ter 2)
SELECT 
    name,
    display_name,
    price_monthly,
    checkout_url_monthly,
    checkout_price_monthly
FROM public.subscription_plans
WHERE plan_category = 'personal_platform'
ORDER BY price_monthly;

-- 6. Verificar Recargas (deve ter 3)
SELECT 
    name,
    display_name,
    price_monthly,
    checkout_url_monthly,
    checkout_price_monthly
FROM public.subscription_plans
WHERE plan_category = 'recharge'
ORDER BY price_monthly;

-- 7. Verificar se há planos sem checkout URL (problema)
SELECT 
    name,
    display_name,
    plan_category,
    checkout_url_monthly,
    checkout_url_yearly
FROM public.subscription_plans
WHERE plan_category IS NOT NULL
    AND checkout_url_monthly IS NULL 
    AND checkout_url_yearly IS NULL;

-- 8. Resumo geral
SELECT 
    'Total de planos' as metric,
    COUNT(*)::text as value
FROM public.subscription_plans
WHERE plan_category IS NOT NULL
UNION ALL
SELECT 
    'Planos B2C' as metric,
    COUNT(*)::text as value
FROM public.subscription_plans
WHERE plan_category = 'b2c_ai'
UNION ALL
SELECT 
    'Planos B2B' as metric,
    COUNT(*)::text as value
FROM public.subscription_plans
WHERE plan_category = 'b2b_platform'
UNION ALL
SELECT 
    'Planos Personal' as metric,
    COUNT(*)::text as value
FROM public.subscription_plans
WHERE plan_category = 'personal_platform'
UNION ALL
SELECT 
    'Recargas' as metric,
    COUNT(*)::text as value
FROM public.subscription_plans
WHERE plan_category = 'recharge';

