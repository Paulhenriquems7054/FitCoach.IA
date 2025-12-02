-- Migration: Planos de Vendas Completos - B2C, B2B e Personal Trainer
-- Data: 2025-01-27
-- Baseado no guia de vendas completo

-- ============================================
-- ADICIONAR COLUNA plan_category SE NÃO EXISTIR
-- ============================================
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS plan_category TEXT;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_category ON public.subscription_plans(plan_category) WHERE plan_category IS NOT NULL;

-- ============================================
-- PLANOS B2C (CONSUMIDOR FINAL)
-- ============================================

-- Plano Mensal - R$ 34,90/mês
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible, plan_category)
VALUES
    ('monthly', 'Plano Mensal', 'Para quem quer testar - Cancele quando quiser', 34.90, NULL,
     '{"voice_daily_limit_seconds": 900, "text_msg_daily_limit": -1, "photo_analysis_unlimited": true, "workout_unlimited": true, "chat_unlimited": true}'::jsonb,
     '["Análise de Fotos Ilimitada (Comida + Treinos)", "Treinos Personalizados Ilimitados", "Chat de Texto Ilimitado", "15 min/dia de Consultoria de Voz (Live)", "Cancele quando quiser", "Acesso Imediato após Pagamento", "Renovação Automática até Cancelar"]'::jsonb,
     TRUE, TRUE, 'b2c')
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
    plan_category = EXCLUDED.plan_category,
    updated_at = NOW();

-- Plano Anual VIP - R$ 297,00/ano (ou 12x de R$ 34,53)
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible, plan_category)
VALUES
    ('annual_vip', 'Plano Anual VIP', 'Recomendado - Economia de R$ 121,80', 34.53, 297.00,
     '{"voice_daily_limit_seconds": 900, "text_msg_daily_limit": -1, "photo_analysis_unlimited": true, "workout_unlimited": true, "chat_unlimited": true}'::jsonb,
     '["Tudo do Plano Mensal", "Economia de R$ 121,80 (vs. 12 meses do mensal)", "Acesso Imediato", "Garantia de Satisfação", "Pague à vista ou 12x de R$ 34,53"]'::jsonb,
     TRUE, TRUE, 'b2c')
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
    plan_category = EXCLUDED.plan_category,
    updated_at = NOW();

-- ============================================
-- PLANOS B2B (ACADEMIAS)
-- ============================================

-- Pack Starter Mini - R$ 149,90/mês (10 licenças)
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible, plan_category)
VALUES
    ('academy_starter_mini', 'Starter Mini', 'Ideal para academias pequenas ou para testar', 149.90, NULL,
     '{"voice_daily_limit_seconds": 900, "text_msg_daily_limit": -1, "photo_analysis_unlimited": true, "workout_unlimited": true, "chat_unlimited": true, "max_licenses": 10}'::jsonb,
     '["10 Licenças Premium", "Código Mestre Único", "Custo por aluno: R$ 14,99/mês", "Todas as features Premium para cada aluno", "Acesso gratuito para os alunos", "Ideal para testar o sistema"]'::jsonb,
     TRUE, TRUE, 'b2b')
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
    plan_category = EXCLUDED.plan_category,
    updated_at = NOW();

-- Pack Starter - R$ 299,90/mês (20 licenças)
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible, plan_category)
VALUES
    ('academy_starter', 'Pack Starter', 'Ideal para academias pequenas ou para testar', 299.90, NULL,
     '{"voice_daily_limit_seconds": 900, "text_msg_daily_limit": -1, "photo_analysis_unlimited": true, "workout_unlimited": true, "chat_unlimited": true, "max_licenses": 20}'::jsonb,
     '["20 Licenças Premium", "Código Mestre Único", "Custo por aluno: R$ 14,99/mês", "Todas as features Premium para cada aluno", "Acesso gratuito para os alunos"]'::jsonb,
     TRUE, TRUE, 'b2b')
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
    plan_category = EXCLUDED.plan_category,
    updated_at = NOW();

-- Pack Growth - R$ 649,90/mês (50 licenças) - MAIS VENDIDO
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible, plan_category)
VALUES
    ('academy_growth', 'Pack Growth', 'Mais Vendido - Melhor custo-benefício', 649.90, NULL,
     '{"voice_daily_limit_seconds": 900, "text_msg_daily_limit": -1, "photo_analysis_unlimited": true, "workout_unlimited": true, "chat_unlimited": true, "max_licenses": 50}'::jsonb,
     '["50 Licenças Premium", "Código Mestre Único", "Custo por aluno: R$ 12,99/mês (melhor custo-benefício)", "Suporte Prioritário", "Todas as features Premium", "Ideal para academias médias (30-50 alunos)"]'::jsonb,
     TRUE, TRUE, 'b2b')
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
    plan_category = EXCLUDED.plan_category,
    updated_at = NOW();

-- Pack Pro - R$ 1.199,90/mês (100 licenças)
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible, plan_category)
VALUES
    ('academy_pro', 'Pack Pro', 'Ideal para academias grandes ou redes', 1199.90, NULL,
     '{"voice_daily_limit_seconds": 900, "text_msg_daily_limit": -1, "photo_analysis_unlimited": true, "workout_unlimited": true, "chat_unlimited": true, "max_licenses": 100}'::jsonb,
     '["100 Licenças Premium", "Código Mestre Único", "Custo por aluno: R$ 11,99/mês (menor custo)", "Todas as features Premium", "Ideal para academias grandes ou redes"]'::jsonb,
     TRUE, TRUE, 'b2b')
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
    plan_category = EXCLUDED.plan_category,
    updated_at = NOW();

-- ============================================
-- PLANOS PERSONAL TRAINER
-- ============================================

-- Team 5 - R$ 99,90/mês (5 clientes)
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible, plan_category)
VALUES
    ('personal_team_5', 'Team 5', 'Ideal para quem está começando na consultoria', 99.90, NULL,
     '{"voice_daily_limit_seconds": 900, "text_msg_daily_limit": -1, "photo_analysis_unlimited": true, "workout_unlimited": true, "chat_unlimited": true, "max_licenses": 5}'::jsonb,
     '["5 Licenças Premium", "Código de Equipe Único", "Custo por cliente: R$ 19,98/mês", "Análise de Pratos + Treinos Ilimitada", "Treinos Personalizados", "Relatórios Básicos", "Acesso gratuito para os clientes"]'::jsonb,
     TRUE, TRUE, 'personal')
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
    plan_category = EXCLUDED.plan_category,
    updated_at = NOW();

-- Team 15 - R$ 249,90/mês (15 clientes) - MAIS VANTAJOSO
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible, plan_category)
VALUES
    ('personal_team_15', 'Team 15', 'Mais Vantajoso - Maior margem de lucro', 249.90, NULL,
     '{"voice_daily_limit_seconds": 900, "text_msg_daily_limit": -1, "photo_analysis_unlimited": true, "workout_unlimited": true, "chat_unlimited": true, "max_licenses": 15}'::jsonb,
     '["15 Licenças Premium", "Código de Equipe Único", "Custo por cliente: R$ 16,66/mês (mais barato)", "Todas as features do Team 5", "Suporte Prioritário", "Maior margem de lucro", "Ideal para personais com agenda cheia"]'::jsonb,
     TRUE, TRUE, 'personal')
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
    plan_category = EXCLUDED.plan_category,
    updated_at = NOW();

