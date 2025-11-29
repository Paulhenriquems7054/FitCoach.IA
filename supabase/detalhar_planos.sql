-- Script para ver detalhes completos dos planos criados

-- Ver todos os planos com categoria (os novos)
SELECT 
    name,
    display_name,
    plan_category,
    price_monthly,
    price_yearly,
    CASE 
        WHEN price_yearly IS NOT NULL THEN 
            ROUND((price_monthly * 12) - price_yearly, 2)
        ELSE NULL
    END as economia_anual,
    is_active,
    is_visible,
    array_length(features::text::jsonb::text::jsonb, 1) as total_features
FROM public.subscription_plans
WHERE plan_category IS NOT NULL
ORDER BY 
    CASE plan_category
        WHEN 'b2c' THEN 1
        WHEN 'b2b' THEN 2
        WHEN 'personal' THEN 3
    END,
    price_monthly;

-- Ver planos antigos (sem categoria) - para referência
SELECT 
    name,
    display_name,
    plan_category,
    price_monthly,
    price_yearly,
    is_active,
    is_visible
FROM public.subscription_plans
WHERE plan_category IS NULL
ORDER BY name;

-- Resumo por categoria
SELECT 
    plan_category,
    COUNT(*) as total,
    MIN(price_monthly) as preco_minimo,
    MAX(price_monthly) as preco_maximo,
    AVG(price_monthly)::numeric(10,2) as preco_medio
FROM public.subscription_plans
WHERE plan_category IS NOT NULL AND is_active = true
GROUP BY plan_category
ORDER BY plan_category;

