-- ============================================================================
-- CRIAR PLANOS FALTANTES E ATUALIZAR ID DO PASSE LIVRE
-- Execute no SQL Editor do Supabase
-- ============================================================================
-- 
-- PLANOS QUE FALTAM:
-- 1. B2C Mensal (b2c_mensal)
-- 2. B2C Anual VIP (b2c_anual_vip)
-- 3. Atualizar ID do Passe Livre (já existe, só precisa atualizar ID)
-- 
-- NOTA: Planos Personal Trainer (Team 5 e Team 15) NÃO EXISTEM na página de vendas
-- nem na Cakto, portanto NÃO devem ser criados.
-- ============================================================================

-- ============================================================================
-- 1. ATUALIZAR ID DO PASSE LIVRE (já existe, só atualizar ID)
-- ============================================================================

UPDATE public.app_plans
SET cakto_checkout_id = 'trszqtv_668453'
WHERE slug = 'recarga_passe_livre_30d'
  AND (cakto_checkout_id = 'PREENCHER_SHORT_ID_PASSE_LIVRE' 
       OR cakto_checkout_id LIKE 'PREENCHER%');

-- ============================================================================
-- 2. CRIAR PLANOS B2C FALTANTES (IDs já conhecidos)
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

-- ============================================================================
-- RESUMO ESPERADO APÓS EXECUÇÃO
-- ============================================================================
-- 
-- Total de planos esperados: 9 planos
-- 
-- B2C (2):
--   ✅ b2c_mensal
--   ✅ b2c_anual_vip
-- 
-- B2B Academia (4):
--   ✅ b2b_academia_starter_mini
--   ✅ b2b_academia_starter
--   ✅ b2b_academia_growth
--   ✅ b2b_academia_pro
-- 
-- Recargas (3):
--   ✅ recarga_turbo
--   ✅ recarga_banco_voz_100
--   ✅ recarga_passe_livre_30d
-- 
-- ============================================================================

