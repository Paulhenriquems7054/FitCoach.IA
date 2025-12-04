-- ============================================================================
-- VERIFICAÇÃO: Tabela app_plans
-- Verifica se a tabela está preenchida corretamente
-- ============================================================================

-- 1. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'app_plans'
ORDER BY ordinal_position;

-- 2. Verificar quantos planos existem
SELECT 
    'Total de planos' as metrica,
    COUNT(*)::text as valor
FROM public.app_plans;

-- 3. Listar todos os planos por grupo
SELECT 
    plan_group as grupo,
    slug,
    name as nome,
    price as preco,
    cakto_checkout_id,
    max_licenses as max_licencas,
    minutes_voice_per_day as minutos_voz_dia,
    is_active as ativo
FROM public.app_plans
ORDER BY plan_group, slug;

-- 4. Verificar planos sem cakto_checkout_id (PROBLEMA!)
SELECT 
    '⚠️ PLANOS SEM CHECKOUT_ID' as alerta,
    slug,
    name,
    plan_group
FROM public.app_plans
WHERE cakto_checkout_id IS NULL 
   OR cakto_checkout_id = ''
   OR cakto_checkout_id = 'PREENCHER_ID_CHECKOUT_*'
ORDER BY plan_group, slug;

-- 5. Verificar se todos os grupos de planos estão presentes
SELECT 
    'Grupos de planos presentes' as metrica,
    STRING_AGG(DISTINCT plan_group, ', ' ORDER BY plan_group) as grupos
FROM public.app_plans;

-- 6. Resumo por grupo
SELECT 
    plan_group as grupo,
    COUNT(*) as quantidade_planos,
    COUNT(CASE WHEN cakto_checkout_id IS NOT NULL AND cakto_checkout_id != '' THEN 1 END) as com_checkout_id,
    COUNT(CASE WHEN cakto_checkout_id IS NULL OR cakto_checkout_id = '' THEN 1 END) as sem_checkout_id
FROM public.app_plans
GROUP BY plan_group
ORDER BY plan_group;

-- ============================================================================
-- PLANOS ESPERADOS (conforme página de vendas)
-- ============================================================================

SELECT 
    '=== PLANOS ESPERADOS ===' as secao,
    'Grupo' as item,
    'Planos esperados' as status
UNION ALL
SELECT 
    'B2C' as secao,
    'b2c' as item,
    'b2c_mensal, b2c_anual_vip' as status
UNION ALL
SELECT 
    'B2B Academia' as secao,
    'b2b_academia' as item,
    'b2b_academia_starter_mini, b2b_academia_starter, b2b_academia_growth, b2b_academia_pro' as status
UNION ALL
SELECT 
    'Personal Trainer' as secao,
    'personal' as item,
    'personal_team_5, personal_team_15' as status
UNION ALL
SELECT 
    'Recargas' as secao,
    'recarga' as item,
    'recarga_turbo, recarga_banco_voz_100, recarga_passe_livre_30d' as status;

