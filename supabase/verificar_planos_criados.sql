-- Script para verificar se os planos foram criados corretamente
-- Execute este script para confirmar que todos os planos estão no banco

-- Ver todos os planos ativos por categoria
SELECT 
    name,
    display_name,
    plan_category,
    price_monthly,
    price_yearly,
    is_active,
    is_visible,
    created_at,
    updated_at
FROM public.subscription_plans
WHERE is_active = true
ORDER BY 
    CASE plan_category
        WHEN 'b2c' THEN 1
        WHEN 'b2b' THEN 2
        WHEN 'personal' THEN 3
        ELSE 4
    END,
    price_monthly;

-- Contar planos por categoria
SELECT 
    plan_category,
    COUNT(*) as total_planos,
    COUNT(CASE WHEN is_active = true THEN 1 END) as planos_ativos,
    COUNT(CASE WHEN is_visible = true THEN 1 END) as planos_visiveis
FROM public.subscription_plans
GROUP BY plan_category
ORDER BY plan_category;

-- Verificar se a coluna plan_category existe e tem valores
SELECT 
    COUNT(*) as total_planos,
    COUNT(plan_category) as planos_com_categoria,
    COUNT(DISTINCT plan_category) as categorias_diferentes
FROM public.subscription_plans
WHERE is_active = true;

