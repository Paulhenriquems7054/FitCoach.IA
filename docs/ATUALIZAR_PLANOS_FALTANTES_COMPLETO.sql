-- ============================================================================
-- ATUALIZAR E CRIAR TODOS OS PLANOS FALTANTES
-- Execute no SQL Editor do Supabase
-- ============================================================================
-- 
-- PROBLEMA ENCONTRADO:
-- - Faltam 4 planos completamente na tabela app_plans
-- - 1 plano tem ID placeholder (Passe Livre)
-- 
-- ESTE SCRIPT:
-- 1. Atualiza ID do Passe Livre (de placeholder para ID real)
-- 2. Cria os 2 planos B2C faltantes (b2c_mensal e b2c_anual_vip)
-- 3. Cria os 2 planos Personal Trainer faltantes (personal_team_5 e personal_team_15)
-- ============================================================================

-- ============================================================================
-- 1. ATUALIZAR ID DO PASSE LIVRE (já existe, só atualizar ID)
-- ============================================================================

UPDATE public.app_plans
SET cakto_checkout_id = 'trszqtv_668453'
WHERE slug = 'recarga_passe_livre_30d'
  AND (cakto_checkout_id = 'PREENCHER_SHORT_ID_PASSE_LIVRE' OR cakto_checkout_id LIKE 'PREENCHER%');

-- ============================================================================
-- 2. CRIAR PLANOS B2C FALTANTES
-- ============================================================================

-- B2C Mensal
INSERT INTO public.app_plans (
  id, slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id, 
  cakto_product_type, minutes_voice_per_day, is_unlimited_voice, is_active,
  created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'b2c_mensal',
  'Plano Mensal',
  'Para quem quer testar - Cancele quando quiser',
  'b2c',
  'recorrente',
  'mensal',
  34.90,
  35.89,
  'BRL',
  'zeygxve_668421',
  'subscription',
  15,
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  plan_group = EXCLUDED.plan_group,
  billing_type = EXCLUDED.billing_type,
  billing_period = EXCLUDED.billing_period,
  price = EXCLUDED.price,
  total_checkout_price = EXCLUDED.total_checkout_price,
  currency = EXCLUDED.currency,
  cakto_checkout_id = EXCLUDED.cakto_checkout_id,
  cakto_product_type = EXCLUDED.cakto_product_type,
  minutes_voice_per_day = EXCLUDED.minutes_voice_per_day,
  is_unlimited_voice = EXCLUDED.is_unlimited_voice,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- B2C Anual VIP
INSERT INTO public.app_plans (
  id, slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id,
  cakto_product_type, minutes_voice_per_day, is_unlimited_voice, is_active,
  created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'b2c_anual_vip',
  'Plano Anual VIP',
  'Recomendado - Economia de R$ 121,80',
  'b2c',
  'recorrente',
  'anual',
  297.00,
  297.99,
  'BRL',
  'wvbkepi_668441',
  'subscription',
  15,
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  plan_group = EXCLUDED.plan_group,
  billing_type = EXCLUDED.billing_type,
  billing_period = EXCLUDED.billing_period,
  price = EXCLUDED.price,
  total_checkout_price = EXCLUDED.total_checkout_price,
  currency = EXCLUDED.currency,
  cakto_checkout_id = EXCLUDED.cakto_checkout_id,
  cakto_product_type = EXCLUDED.cakto_product_type,
  minutes_voice_per_day = EXCLUDED.minutes_voice_per_day,
  is_unlimited_voice = EXCLUDED.is_unlimited_voice,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- 3. CRIAR PLANOS PERSONAL TRAINER FALTANTES
-- ⚠️ IMPORTANTE: Obter os IDs da Cakto e substituir antes de executar
-- ============================================================================

-- Personal Team 5
INSERT INTO public.app_plans (
  id, slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id,
  cakto_product_type, max_licenses, minutes_voice_per_day, is_unlimited_voice, is_active,
  created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'personal_team_5',
  'Team 5',
  'Ideal para quem está começando na consultoria',
  'personal',
  'recorrente',
  'mensal',
  99.90,
  100.89,
  'BRL',
  'PREENCHER_ID_TEAM5',  -- ⚠️ SUBSTITUIR PELO ID REAL DA CAKTO
  'subscription',
  5,
  15,
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  plan_group = EXCLUDED.plan_group,
  billing_type = EXCLUDED.billing_type,
  billing_period = EXCLUDED.billing_period,
  price = EXCLUDED.price,
  total_checkout_price = EXCLUDED.total_checkout_price,
  currency = EXCLUDED.currency,
  cakto_checkout_id = CASE 
    WHEN EXCLUDED.cakto_checkout_id != 'PREENCHER_ID_TEAM5' 
    THEN EXCLUDED.cakto_checkout_id 
    ELSE app_plans.cakto_checkout_id 
  END,
  cakto_product_type = EXCLUDED.cakto_product_type,
  max_licenses = EXCLUDED.max_licenses,
  minutes_voice_per_day = EXCLUDED.minutes_voice_per_day,
  is_unlimited_voice = EXCLUDED.is_unlimited_voice,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Personal Team 15
INSERT INTO public.app_plans (
  id, slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id,
  cakto_product_type, max_licenses, minutes_voice_per_day, is_unlimited_voice, is_active,
  created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  'personal_team_15',
  'Team 15',
  'Mais Vantajoso - Maior margem de lucro',
  'personal',
  'recorrente',
  'mensal',
  249.90,
  250.89,
  'BRL',
  'PREENCHER_ID_TEAM15',  -- ⚠️ SUBSTITUIR PELO ID REAL DA CAKTO
  'subscription',
  15,
  15,
  false,
  true,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  plan_group = EXCLUDED.plan_group,
  billing_type = EXCLUDED.billing_type,
  billing_period = EXCLUDED.billing_period,
  price = EXCLUDED.price,
  total_checkout_price = EXCLUDED.total_checkout_price,
  currency = EXCLUDED.currency,
  cakto_checkout_id = CASE 
    WHEN EXCLUDED.cakto_checkout_id != 'PREENCHER_ID_TEAM15' 
    THEN EXCLUDED.cakto_checkout_id 
    ELSE app_plans.cakto_checkout_id 
  END,
  cakto_product_type = EXCLUDED.cakto_product_type,
  max_licenses = EXCLUDED.max_licenses,
  minutes_voice_per_day = EXCLUDED.minutes_voice_per_day,
  is_unlimited_voice = EXCLUDED.is_unlimited_voice,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- VERIFICAÇÃO FINAL - Ver todos os planos
-- ============================================================================

SELECT 
    plan_group,
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL 
             OR cakto_checkout_id = '' 
             OR cakto_checkout_id LIKE 'PREENCHER%'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
ORDER BY plan_group, slug;

