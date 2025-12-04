-- ============================================================================
-- CRIAR PLANOS FALTANTES E ATUALIZAR ID DO PASSE LIVRE
-- Execute no SQL Editor do Supabase
-- ============================================================================
-- 
-- Este script:
-- 1. Atualiza o ID do Passe Livre (já tem ID, só precisa atualizar)
-- 2. Cria os 2 planos B2C faltantes
-- 3. Cria os 2 planos Personal Trainer faltantes (IDs precisam ser preenchidos)
-- ============================================================================

-- ============================================================================
-- 1. ATUALIZAR ID DO PASSE LIVRE
-- ============================================================================

UPDATE public.app_plans
SET cakto_checkout_id = 'trszqtv_668453'
WHERE slug = 'recarga_passe_livre_30d';

-- ============================================================================
-- 2. CRIAR PLANOS B2C FALTANTES
-- ============================================================================

-- B2C Mensal
INSERT INTO public.app_plans (
  slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id, 
  cakto_product_type, minutes_voice_per_day, is_unlimited_voice, is_active
) VALUES (
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
  true
) ON CONFLICT (slug) DO UPDATE SET
  cakto_checkout_id = EXCLUDED.cakto_checkout_id,
  updated_at = NOW();

-- B2C Anual VIP
INSERT INTO public.app_plans (
  slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id,
  cakto_product_type, minutes_voice_per_day, is_unlimited_voice, is_active
) VALUES (
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
  true
) ON CONFLICT (slug) DO UPDATE SET
  cakto_checkout_id = EXCLUDED.cakto_checkout_id,
  updated_at = NOW();

-- ============================================================================
-- 3. CRIAR PLANOS PERSONAL TRAINER FALTANTES
-- ⚠️ IMPORTANTE: Obter os IDs da Cakto antes de executar
-- ============================================================================

-- Personal Team 5
INSERT INTO public.app_plans (
  slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id,
  cakto_product_type, max_licenses, minutes_voice_per_day, is_unlimited_voice, is_active
) VALUES (
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
  true
) ON CONFLICT (slug) DO UPDATE SET
  cakto_checkout_id = EXCLUDED.cakto_checkout_id,
  updated_at = NOW();

-- Personal Team 15
INSERT INTO public.app_plans (
  slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id,
  cakto_product_type, max_licenses, minutes_voice_per_day, is_unlimited_voice, is_active
) VALUES (
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
  true
) ON CONFLICT (slug) DO UPDATE SET
  cakto_checkout_id = EXCLUDED.cakto_checkout_id,
  updated_at = NOW();

-- ============================================================================
-- VERIFICAÇÃO FINAL
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

