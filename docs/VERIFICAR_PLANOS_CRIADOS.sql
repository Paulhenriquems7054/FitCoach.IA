-- ============================================
-- VERIFICAÇÃO DE PLANOS CRIADOS
-- Execute este script para verificar se os planos foram criados corretamente
-- ============================================

-- Verificar todos os planos criados
SELECT 
    id,
    name,
    display_name,
    plan_category,
    price_monthly,
    price_yearly,
    checkout_url_monthly,
    checkout_url_yearly,
    checkout_price_monthly,
    checkout_price_yearly,
    is_active,
    is_visible,
    created_at
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

-- Contar planos por categoria
SELECT 
    plan_category,
    COUNT(*) as total_planos
FROM public.subscription_plans
WHERE plan_category IS NOT NULL
GROUP BY plan_category
ORDER BY plan_category;

-- Verificar se os campos de checkout foram adicionados
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'subscription_plans'
    AND column_name IN ('plan_category', 'checkout_url_monthly', 'checkout_url_yearly', 'checkout_price_monthly', 'checkout_price_yearly')
ORDER BY column_name;

