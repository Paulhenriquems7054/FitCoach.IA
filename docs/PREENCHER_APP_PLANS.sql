-- ============================================================================
-- PREENCHER TABELA app_plans
-- Execute esta query para preencher a tabela com todos os planos
-- ============================================================================
-- 
-- ⚠️ IMPORTANTE:
-- 1. Verifique os cakto_checkout_id antes de executar
-- 2. Substitua "PREENCHER_ID_CHECKOUT_*" pelos IDs reais da Cakto
-- 3. Os cakto_checkout_id devem corresponder ao product.short_id da Cakto
-- ============================================================================

-- Inserir/Atualizar planos B2C
INSERT INTO public.app_plans (
  slug, name, plan_group, billing_type, billing_period, 
  price, total_checkout_price, cakto_checkout_id, max_licenses, minutes_voice_per_day, is_active
) VALUES
-- B2C - Plano Mensal
('b2c_mensal', 'Plano Mensal', 'b2c', 'recorrente', 'mensal', 
 34.90, 35.89, 'zeygxve_668421', NULL, 15, TRUE),
-- B2C - Plano Anual VIP
('b2c_anual_vip', 'Plano Anual VIP', 'b2c', 'recorrente', 'anual', 
 297.00, 297.99, 'wvbkepi_668441', NULL, 15, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  plan_group = EXCLUDED.plan_group,
  billing_type = EXCLUDED.billing_type,
  billing_period = EXCLUDED.billing_period,
  price = EXCLUDED.price,
  total_checkout_price = EXCLUDED.total_checkout_price,
  cakto_checkout_id = EXCLUDED.cakto_checkout_id,
  max_licenses = EXCLUDED.max_licenses,
  minutes_voice_per_day = EXCLUDED.minutes_voice_per_day,
  is_active = EXCLUDED.is_active;

-- Inserir/Atualizar planos B2B Academia
INSERT INTO public.app_plans (
  slug, name, plan_group, billing_type, billing_period, 
  price, total_checkout_price, cakto_checkout_id, max_licenses, minutes_voice_per_day, is_active
) VALUES
-- B2B - Starter Mini
('b2b_academia_starter_mini', 'Pack Starter Mini', 'b2b_academia', 'recorrente', 'mensal', 
 149.90, 150.89, '3b2kpwc_671196', 10, 15, TRUE),
-- B2B - Starter
('b2b_academia_starter', 'Pack Starter', 'b2b_academia', 'recorrente', 'mensal', 
 299.90, 300.89, 'cemyp2n_668537', 20, 15, TRUE),
-- B2B - Growth
('b2b_academia_growth', 'Pack Growth', 'b2b_academia', 'recorrente', 'mensal', 
 649.90, 650.89, 'vi6djzq_668541', 50, 15, TRUE),
-- B2B - Pro
('b2b_academia_pro', 'Pack Pro', 'b2b_academia', 'recorrente', 'mensal', 
 1199.90, 1200.89, '3dis6ds_668546', 100, 15, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  plan_group = EXCLUDED.plan_group,
  billing_type = EXCLUDED.billing_type,
  billing_period = EXCLUDED.billing_period,
  price = EXCLUDED.price,
  total_checkout_price = EXCLUDED.total_checkout_price,
  cakto_checkout_id = EXCLUDED.cakto_checkout_id,
  max_licenses = EXCLUDED.max_licenses,
  minutes_voice_per_day = EXCLUDED.minutes_voice_per_day,
  is_active = EXCLUDED.is_active;

-- Inserir/Atualizar planos Personal Trainer
INSERT INTO public.app_plans (
  slug, name, plan_group, billing_type, billing_period, 
  price, total_checkout_price, cakto_checkout_id, max_licenses, minutes_voice_per_day, is_active
) VALUES
-- Personal - Team 5
('personal_team_5', 'Team 5', 'personal', 'recorrente', 'mensal', 
 99.90, 100.89, 'PREENCHER_ID_CHECKOUT_TEAM5', 5, 15, TRUE),
-- Personal - Team 15
('personal_team_15', 'Team 15', 'personal', 'recorrente', 'mensal', 
 249.90, 250.89, 'PREENCHER_ID_CHECKOUT_TEAM15', 15, 15, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  plan_group = EXCLUDED.plan_group,
  billing_type = EXCLUDED.billing_type,
  billing_period = EXCLUDED.billing_period,
  price = EXCLUDED.price,
  total_checkout_price = EXCLUDED.total_checkout_price,
  cakto_checkout_id = EXCLUDED.cakto_checkout_id,
  max_licenses = EXCLUDED.max_licenses,
  minutes_voice_per_day = EXCLUDED.minutes_voice_per_day,
  is_active = EXCLUDED.is_active;

-- Inserir/Atualizar Recargas
INSERT INTO public.app_plans (
  slug, name, plan_group, billing_type, billing_period, 
  price, total_checkout_price, cakto_checkout_id, max_licenses, minutes_voice_per_day, is_active
) VALUES
-- Recarga - Turbo
('recarga_turbo', 'Sessão Turbo', 'recarga', 'one_time', NULL, 
 5.00, 5.99, 'ihfy8cz_668443', NULL, NULL, TRUE),
-- Recarga - Banco de Voz 100
('recarga_banco_voz_100', 'Banco de Voz 100', 'recarga', 'one_time', NULL, 
 12.90, 13.89, 'hhxugxb_668446', NULL, NULL, TRUE),
-- Recarga - Passe Livre 30 Dias
('recarga_passe_livre_30d', 'Passe Livre 30 Dias', 'recarga', 'one_time', NULL, 
 19.90, 20.89, 'PREENCHER_ID_CHECKOUT_PASSE_LIVRE', NULL, NULL, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  plan_group = EXCLUDED.plan_group,
  billing_type = EXCLUDED.billing_type,
  billing_period = EXCLUDED.billing_period,
  price = EXCLUDED.price,
  total_checkout_price = EXCLUDED.total_checkout_price,
  cakto_checkout_id = EXCLUDED.cakto_checkout_id,
  max_licenses = EXCLUDED.max_licenses,
  minutes_voice_per_day = EXCLUDED.minutes_voice_per_day,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

SELECT 
    '✅ PLANOS INSERIDOS/ATUALIZADOS' as status,
    COUNT(*)::text as total_planos
FROM public.app_plans;

-- Listar todos os planos para verificação
SELECT 
    plan_group,
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL OR cakto_checkout_id = '' OR cakto_checkout_id LIKE 'PREENCHER%'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status_checkout_id
FROM public.app_plans
ORDER BY plan_group, slug;

