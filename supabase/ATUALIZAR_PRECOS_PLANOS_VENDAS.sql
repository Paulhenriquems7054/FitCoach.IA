-- ============================================
-- ATUALIZAÇÃO DE PREÇOS DOS PLANOS DE VENDAS
-- Data: 2026-01-17
-- Descrição: Atualiza preços dos planos conforme página de vendas
-- ============================================

-- Verificar se a tabela plans existe e tem os planos
-- A tabela 'plans' é usada pela página de billing
-- Se os planos não existirem, criá-los. Se existirem, atualizar preços.

-- ============================================
-- 1. PLANOS B2C (Consumidor Final)
-- ============================================

-- ============================================
-- GARANTIR CONSTRAINT UNIQUE NO NAME (se não existir)
-- ============================================
-- Se a constraint não existir, criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'plans_name_key' 
    AND conrelid = 'public.plans'::regclass
  ) THEN
    ALTER TABLE public.plans ADD CONSTRAINT plans_name_key UNIQUE (name);
  END IF;
END $$;

-- ============================================
-- 1. PLANOS B2C (Consumidor Final)
-- ============================================

-- Plano Mensal B2C
INSERT INTO public.plans (
  name, description, price, 
  requests_per_month, image_analysis_per_month, voice_messages_per_month,
  features, is_active, is_featured, display_order
) VALUES (
  'Plano Mensal', 
  'Plano mensal com acesso completo à IA', 
  34.90,
  1000,  -- Requisições mensais generosas
  100,   -- Análises de imagem
  0,     -- Mensagens de voz (incluído no plano base)
  '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
  true,
  false,
  1
)
ON CONFLICT (name) 
DO UPDATE SET 
  price = 34.90,
  description = 'Plano mensal com acesso completo à IA',
  updated_at = NOW();

-- Plano Anual B2C (VIP)
INSERT INTO public.plans (
  name, description, price, 
  requests_per_month, image_analysis_per_month, voice_messages_per_month,
  features, is_active, is_featured, display_order
) VALUES (
  'Plano Anual VIP', 
  'Plano anual com desconto - economia de R$ 121,80', 
  297.00,
  1000,  -- Requisições mensais generosas
  100,   -- Análises de imagem
  0,     -- Mensagens de voz
  '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
  true,
  true,  -- Destaque: Mais Popular
  2
)
ON CONFLICT (name) 
DO UPDATE SET 
  price = 297.00,
  description = 'Plano anual com desconto - economia de R$ 121,80',
  is_featured = true,
  updated_at = NOW();

-- ============================================
-- 2. PLANOS B2B (Academias)
-- ============================================

-- Pack Starter (20 licenças)
INSERT INTO public.plans (
  name, description, price, 
  requests_per_month, image_analysis_per_month, voice_messages_per_month,
  features, is_active, is_featured, display_order
) VALUES (
  'Pack Starter', 
  'Plano para academias - 20 licenças (R$ 14,99/aluno)', 
  299.90,
  5000,  -- Requisições mensais para 20 alunos
  500,   -- Análises de imagem
  0,
  '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
  true,
  false,
  3
)
ON CONFLICT (name) 
DO UPDATE SET 
  price = 299.90,
  description = 'Plano para academias - 20 licenças (R$ 14,99/aluno)',
  updated_at = NOW();

-- Pack Growth (50 licenças)
INSERT INTO public.plans (
  name, description, price, 
  requests_per_month, image_analysis_per_month, voice_messages_per_month,
  features, is_active, is_featured, display_order
) VALUES (
  'Pack Growth', 
  'Plano para academias - 50 licenças (R$ 12,99/aluno)', 
  649.90,
  12000,  -- Requisições mensais para 50 alunos
  1200,   -- Análises de imagem
  0,
  '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
  true,
  false,
  4
)
ON CONFLICT (name) 
DO UPDATE SET 
  price = 649.90,
  description = 'Plano para academias - 50 licenças (R$ 12,99/aluno)',
  updated_at = NOW();

-- Pack Pro (100 licenças)
INSERT INTO public.plans (
  name, description, price, 
  requests_per_month, image_analysis_per_month, voice_messages_per_month,
  features, is_active, is_featured, display_order
) VALUES (
  'Pack Pro', 
  'Plano para academias - 100 licenças (R$ 11,99/aluno)', 
  1199.90,
  25000,  -- Requisições mensais para 100 alunos
  2500,   -- Análises de imagem
  0,
  '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
  true,
  false,
  5
)
ON CONFLICT (name) 
DO UPDATE SET 
  price = 1199.90,
  description = 'Plano para academias - 100 licenças (R$ 11,99/aluno)',
  updated_at = NOW();

-- ============================================
-- 3. PLANOS PERSONAL TRAINER
-- ============================================

-- Team 5 (5 licenças)
INSERT INTO public.plans (
  name, description, price, 
  requests_per_month, image_analysis_per_month, voice_messages_per_month,
  features, is_active, is_featured, display_order
) VALUES (
  'Team 5', 
  'Plano para Personal Trainers - 5 licenças (R$ 19,98/cliente)', 
  99.90,
  2000,  -- Requisições mensais para 5 clientes
  200,   -- Análises de imagem
  0,
  '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
  true,
  false,
  6
)
ON CONFLICT (name) 
DO UPDATE SET 
  price = 99.90,
  description = 'Plano para Personal Trainers - 5 licenças (R$ 19,98/cliente)',
  updated_at = NOW();

-- Team 15 (15 licenças)
INSERT INTO public.plans (
  name, description, price, 
  requests_per_month, image_analysis_per_month, voice_messages_per_month,
  features, is_active, is_featured, display_order
) VALUES (
  'Team 15', 
  'Plano para Personal Trainers - 15 licenças (R$ 16,66/cliente)', 
  249.90,
  6000,  -- Requisições mensais para 15 clientes
  600,   -- Análises de imagem
  0,
  '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
  true,
  false,
  7
)
ON CONFLICT (name) 
DO UPDATE SET 
  price = 249.90,
  description = 'Plano para Personal Trainers - 15 licenças (R$ 16,66/cliente)',
  updated_at = NOW();

-- ============================================
-- 4. RECARGAS (One-Time)
-- ============================================
-- Nota: Recargas normalmente não ficam na tabela 'plans' 
-- mas em uma tabela separada (recharges ou app_plans)
-- Se precisar adicionar recargas na tabela plans, descomente abaixo:

-- Sessão Turbo (R$ 5,00)
-- INSERT INTO public.plans (
--   name, description, price, 
--   requests_per_month, image_analysis_per_month, voice_messages_per_month,
--   features, is_active, is_featured, display_order
-- ) VALUES (
--   'Sessão Turbo', 
--   '30 minutos de acesso ilimitado, válido por 24h', 
--   5.00,
--   999999,  -- Ilimitado durante a sessão
--   999999,
--   0,
--   '{"ai_analysis": true, "export_pdf": false, "advanced_reports": false, "priority_support": false, "custom_diet": false}'::jsonb,
--   true,
--   false,
--   8
-- )
-- ON CONFLICT (name) 
-- DO UPDATE SET 
--   price = 5.00,
--   description = '30 minutos de acesso ilimitado, válido por 24h',
--   updated_at = NOW();

-- Banco de Voz 100 (R$ 12,90)
-- INSERT INTO public.plans (
--   name, description, price, 
--   requests_per_month, image_analysis_per_month, voice_messages_per_month,
--   features, is_active, is_featured, display_order
-- ) VALUES (
--   'Banco de Voz 100', 
--   '100 minutos de voz, não expira', 
--   12.90,
--   100,   -- Não se aplica
--   0,
--   100,   -- 100 minutos de voz
--   '{"ai_analysis": false, "export_pdf": false, "advanced_reports": false, "priority_support": false, "custom_diet": false}'::jsonb,
--   true,
--   false,
--   9
-- )
-- ON CONFLICT (name) 
-- DO UPDATE SET 
--   price = 12.90,
--   description = '100 minutos de voz, não expira',
--   updated_at = NOW();

-- Passe Livre 30 dias (R$ 19,90)
-- INSERT INTO public.plans (
--   name, description, price, 
--   requests_per_month, image_analysis_per_month, voice_messages_per_month,
--   features, is_active, is_featured, display_order
-- ) VALUES (
--   'Passe Livre 30 dias', 
--   'Acesso ilimitado por 30 dias', 
--   19.90,
--   999999,  -- Ilimitado durante 30 dias
--   999999,
--   0,
--   '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": false, "custom_diet": true}'::jsonb,
--   true,
--   false,
--   10
-- )
-- ON CONFLICT (name) 
-- DO UPDATE SET 
--   price = 19.90,
--   description = 'Acesso ilimitado por 30 dias',
--   updated_at = NOW();

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Ver todos os planos atualizados
SELECT 
  id, name, price, description, 
  requests_per_month, image_analysis_per_month,
  is_active, is_featured, display_order,
  created_at, updated_at
FROM public.plans
WHERE is_active = true
ORDER BY display_order, name;
