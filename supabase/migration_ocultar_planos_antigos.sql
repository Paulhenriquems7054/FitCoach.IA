-- Migration: Ocultar Planos Antigos
-- Data: 2025-01-27
-- Objetivo: Ocultar planos antigos que não estão na página de vendas atual
-- NOTA: Não deletamos os planos, apenas os ocultamos para manter compatibilidade

-- ============================================
-- OCULTAR PLANOS ANTIGOS
-- ============================================

-- Ocultar plano Enterprise (não está na página de vendas)
UPDATE public.subscription_plans
SET 
    is_visible = FALSE,
    is_active = FALSE,
    updated_at = NOW()
WHERE name = 'enterprise';

-- Ocultar plano Basic (não está na página de vendas)
UPDATE public.subscription_plans
SET 
    is_visible = FALSE,
    is_active = FALSE,
    updated_at = NOW()
WHERE name = 'basic';

-- Ocultar plano Premium (não está na página de vendas)
UPDATE public.subscription_plans
SET 
    is_visible = FALSE,
    is_active = FALSE,
    updated_at = NOW()
WHERE name = 'premium';

-- Manter plano Free como oculto mas ativo (usado internamente)
-- O plano free não deve aparecer na página de vendas, mas pode ser usado
-- como plano padrão para novos usuários
UPDATE public.subscription_plans
SET 
    is_visible = FALSE,
    is_active = TRUE, -- Mantém ativo para uso interno
    updated_at = NOW()
WHERE name = 'free';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar planos visíveis (devem ser apenas os da página de vendas)
-- SELECT name, display_name, is_visible, is_active, plan_category
-- FROM public.subscription_plans
-- WHERE is_visible = TRUE
-- ORDER BY plan_category, price_monthly;

-- Resultado esperado:
-- - monthly (b2c)
-- - annual_vip (b2c)
-- - academy_starter_mini (b2b)
-- - academy_starter (b2b)
-- - academy_growth (b2b)
-- - academy_pro (b2b)
-- - personal_team_5 (personal)
-- - personal_team_15 (personal)

