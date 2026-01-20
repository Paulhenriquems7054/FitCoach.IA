-- ============================================
-- MIGRATION: Adicionar Planos Manual (Sem IA)
-- Data: 2026-01-18
-- Objetivo: Criar planos para clientes que querem usar o app sem IA
-- ============================================

-- ============================================
-- PLANOS B2B MANUAL (Academias sem IA)
-- ============================================

INSERT INTO public.subscription_plans (
  name, 
  display_name, 
  description, 
  price_monthly, 
  plan_category, 
  features, 
  limits, 
  checkout_url_monthly, 
  checkout_price_monthly, 
  currency, 
  is_active, 
  is_visible,
  created_at,
  updated_at
) VALUES
-- FitCoach Manual 50 (sem IA)
(
  'FitCoachManual50',
  'FitCoach Manual 50',
  'Plano para academias com até 50 alunos - Apenas gestão manual, sem IA.',
  59.90,
  'b2b_manual',
  '["gestao_alunos", "relatorios", "dashboard", "convites", "cadastro_manual", "treinos_manuais"]'::jsonb,
  '{"maxUsers": 50, "maxGyms": 1}'::jsonb,
  NULL, -- Será preenchido após criar checkout na Cakto
  NULL, -- Será preenchido após criar checkout na Cakto
  'BRL',
  true,
  true,
  NOW(),
  NOW()
),
-- FitCoach Manual 100 (sem IA)
(
  'FitCoachManual100',
  'FitCoach Manual 100',
  'Plano para academias com até 100 alunos - Apenas gestão manual, sem IA.',
  129.90,
  'b2b_manual',
  '["gestao_alunos", "relatorios", "dashboard", "convites", "cadastro_manual", "treinos_manuais"]'::jsonb,
  '{"maxUsers": 100, "maxGyms": 1}'::jsonb,
  NULL,
  NULL,
  'BRL',
  true,
  true,
  NOW(),
  NOW()
),
-- FitCoach Manual 200 (sem IA)
(
  'FitCoachManual200',
  'FitCoach Manual 200',
  'Plano para academias com até 200 alunos - Apenas gestão manual, sem IA.',
  229.90,
  'b2b_manual',
  '["gestao_alunos", "relatorios", "dashboard", "convites", "cadastro_manual", "treinos_manuais"]'::jsonb,
  '{"maxUsers": 200, "maxGyms": 1}'::jsonb,
  NULL,
  NULL,
  'BRL',
  true,
  true,
  NOW(),
  NOW()
),
-- FitCoach Manual 300 (sem IA)
(
  'FitCoachManual300',
  'FitCoach Manual 300',
  'Plano para academias com até 300 alunos - Apenas gestão manual, sem IA.',
  329.90,
  'b2b_manual',
  '["gestao_alunos", "relatorios", "dashboard", "convites", "cadastro_manual", "treinos_manuais"]'::jsonb,
  '{"maxUsers": 300, "maxGyms": 1}'::jsonb,
  NULL,
  NULL,
  'BRL',
  true,
  true,
  NOW(),
  NOW()
),
-- FitCoach Manual 400 (sem IA)
(
  'FitCoachManual400',
  'FitCoach Manual 400',
  'Plano para academias com até 400 alunos - Apenas gestão manual, sem IA.',
  429.90,
  'b2b_manual',
  '["gestao_alunos", "relatorios", "dashboard", "convites", "cadastro_manual", "treinos_manuais"]'::jsonb,
  '{"maxUsers": 400, "maxGyms": 1}'::jsonb,
  NULL,
  NULL,
  'BRL',
  true,
  true,
  NOW(),
  NOW()
),
-- FitCoach Manual 500 (sem IA)
(
  'FitCoachManual500',
  'FitCoach Manual 500',
  'Plano para academias com até 500 alunos - Apenas gestão manual, sem IA.',
  529.90,
  'b2b_manual',
  '["gestao_alunos", "relatorios", "dashboard", "convites", "cadastro_manual", "treinos_manuais"]'::jsonb,
  '{"maxUsers": 500, "maxGyms": 1}'::jsonb,
  NULL,
  NULL,
  'BRL',
  true,
  true,
  NOW(),
  NOW()
),
-- FitCoach Manual 600 (sem IA)
(
  'FitCoachManual600',
  'FitCoach Manual 600',
  'Plano para academias com até 600 alunos - Apenas gestão manual, sem IA.',
  629.90,
  'b2b_manual',
  '["gestao_alunos", "relatorios", "dashboard", "convites", "cadastro_manual", "treinos_manuais"]'::jsonb,
  '{"maxUsers": 600, "maxGyms": 1}'::jsonb,
  NULL,
  NULL,
  'BRL',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- ============================================
-- PLANOS B2C MANUAL (Individuais sem IA)
-- ============================================

INSERT INTO public.subscription_plans (
  name, 
  display_name, 
  description, 
  price_monthly, 
  plan_category, 
  features, 
  limits, 
  checkout_url_monthly, 
  checkout_price_monthly, 
  currency, 
  is_active, 
  is_visible,
  created_at,
  updated_at
) VALUES
(
  'manual_monthly',
  'Plano Manual Mensal',
  'Acesso ao app sem IA - apenas gestão manual de treinos e nutrição. Economia de 43% comparado ao plano com IA.',
  14.90, -- R$ 15/mês (vs R$ 34,90 com IA) - Economia de 57%
  'b2c_manual',
  '["treinos_manuais", "nutricao_manual", "acompanhamento", "cadastro_manual"]'::jsonb,
  '{"maxUsers": 1}'::jsonb,
  NULL,
  NULL,
  'BRL',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  plan_category = EXCLUDED.plan_category,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON COLUMN public.subscription_plans.plan_category IS 
  'Categoria do plano: b2c_ai (individual com IA), b2b_platform (academia com IA), b2b_manual (academia sem IA), b2c_manual (individual sem IA), personal_platform, recharge';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se os planos foram criados
SELECT 
  name,
  display_name,
  plan_category,
  price_monthly,
  is_active,
  is_visible
FROM public.subscription_plans
WHERE plan_category IN ('b2b_manual', 'b2c_manual')
ORDER BY plan_category, price_monthly;
