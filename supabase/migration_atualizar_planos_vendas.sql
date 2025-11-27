-- Migration: Atualizar planos de assinatura conforme documentação de vendas
-- Data: 2025-01-27

-- 1. Atualizar planos existentes ou inserir novos planos conforme documentação
-- Plano Mensal (R$ 34,90/mês)
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible)
VALUES
    ('monthly', 'Plano Mensal', 'Para quem quer testar', 34.90, NULL,
     '{"voice_daily_limit_seconds": 900, "text_msg_daily_limit": -1, "photo_analysis_unlimited": true, "workout_unlimited": true, "chat_unlimited": true}'::jsonb,
     '["Análise de Fotos Ilimitada (Comida + Treinos)", "Treinos Personalizados Ilimitados", "Chat de Texto Ilimitado", "15 min/dia de Consultoria de Voz (Live)", "Cancele quando quiser"]'::jsonb,
     TRUE, TRUE)
ON CONFLICT (name) 
DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    limits = EXCLUDED.limits,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    is_visible = EXCLUDED.is_visible,
    updated_at = NOW();

-- Plano Anual VIP (R$ 297,00/ano ou 12x de R$ 34,53)
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible)
VALUES
    ('annual_vip', 'Plano Anual VIP', 'Recomendado - Economia de R$ 200,00', 34.53, 297.00,
     '{"voice_daily_limit_seconds": 900, "text_msg_daily_limit": -1, "photo_analysis_unlimited": true, "workout_unlimited": true, "chat_unlimited": true}'::jsonb,
     '["Análise de Fotos Ilimitada (Comida + Treinos)", "Treinos Personalizados Ilimitados", "Chat de Texto Ilimitado", "15 min/dia de Consultoria de Voz (Live)", "Acesso Imediato", "Garantia de Satisfação"]'::jsonb,
     TRUE, TRUE)
ON CONFLICT (name) 
DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    limits = EXCLUDED.limits,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    is_visible = EXCLUDED.is_visible,
    updated_at = NOW();

-- 2. Desativar planos antigos que não são mais usados (opcional - comentado para não quebrar assinaturas existentes)
-- UPDATE public.subscription_plans SET is_visible = FALSE, is_active = FALSE 
-- WHERE name IN ('basic', 'premium', 'enterprise') AND name NOT IN ('monthly', 'annual_vip');

