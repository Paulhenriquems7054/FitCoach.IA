-- ============================================================
-- ESTADO COMPLETO DO SISTEMA
-- Esta query mostra o estado atual de todas as tabelas principais
-- ============================================================

-- 1. RESUMO: Quais tabelas existem
SELECT 
    '=== RESUMO: TABELAS EXISTENTES ===' as secao,
    table_name as tabela,
    '✅ EXISTE' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN ('app_plans', 'user_subscriptions', 'academy_subscriptions', 
                   'personal_subscriptions', 'recharges', 'coupons', 
                   'companies', 'company_licenses', 'users', 'cakto_webhooks')
ORDER BY table_name;

-- 2. RESUMO: Quais tabelas estão faltando
SELECT 
    '=== RESUMO: TABELAS FALTANDO ===' as secao,
    'app_plans' as tabela,
    '❌ NÃO EXISTE' as status,
    'migration_planos_vendas_completa.sql' as migracao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')

UNION ALL

SELECT 
    '=== RESUMO: TABELAS FALTANDO ===' as secao,
    'user_subscriptions' as tabela,
    '❌ NÃO EXISTE' as status,
    'schema.sql' as migracao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')

UNION ALL

SELECT 
    '=== RESUMO: TABELAS FALTANDO ===' as secao,
    'academy_subscriptions' as tabela,
    '❌ NÃO EXISTE' as status,
    'Criada pelo webhook da Cakto' as migracao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_subscriptions')

UNION ALL

SELECT 
    '=== RESUMO: TABELAS FALTANDO ===' as secao,
    'personal_subscriptions' as tabela,
    '❌ NÃO EXISTE' as status,
    'Criada pelo webhook da Cakto' as migracao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personal_subscriptions')

UNION ALL

SELECT 
    '=== RESUMO: TABELAS FALTANDO ===' as secao,
    'recharges' as tabela,
    '❌ NÃO EXISTE' as status,
    'migration_criar_tabela_recharges.sql' as migracao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')

UNION ALL

SELECT 
    '=== RESUMO: TABELAS FALTANDO ===' as secao,
    'coupons' as tabela,
    '❌ NÃO EXISTE' as status,
    'migration_criar_sistema_cupons_cakto.sql' as migracao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons')

UNION ALL

SELECT 
    '=== RESUMO: TABELAS FALTANDO ===' as secao,
    'companies' as tabela,
    '❌ NÃO EXISTE' as status,
    'migration_criar_companies_licenses_SIMPLIFICADA.sql' as migracao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')

UNION ALL

SELECT 
    '=== RESUMO: TABELAS FALTANDO ===' as secao,
    'company_licenses' as tabela,
    '❌ NÃO EXISTE' as status,
    'migration_criar_companies_licenses_SIMPLIFICADA.sql' as migracao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses')

UNION ALL

SELECT 
    '=== RESUMO: TABELAS FALTANDO ===' as secao,
    'users' as tabela,
    '❌ NÃO EXISTE' as status,
    'schema.sql' as migracao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')

UNION ALL

SELECT 
    '=== RESUMO: TABELAS FALTANDO ===' as secao,
    'cakto_webhooks' as tabela,
    '❌ NÃO EXISTE' as status,
    'migration_criar_tabela_cakto_webhooks.sql (opcional)' as migracao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks');

-- 3. Verificar planos configurados (se app_plans existir)
SELECT 
    '=== PLANOS CONFIGURADOS ===' as secao,
    plan_group as grupo,
    slug,
    name as nome,
    price as preco,
    cakto_checkout_id as checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL OR cakto_checkout_id = '' THEN '❌ SEM CHECKOUT ID'
        WHEN cakto_checkout_id LIKE '%PREENCHER%' THEN '⚠️ CHECKOUT ID PENDENTE'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
ORDER BY 
    CASE plan_group 
        WHEN 'b2b_academia' THEN 1
        WHEN 'b2c' THEN 2
        WHEN 'personal' THEN 3
        WHEN 'recarga' THEN 4
        ELSE 5
    END,
    slug;

-- 4. Verificar se há planos sem checkout_id
SELECT 
    '=== PROBLEMAS: PLANOS SEM CHECKOUT ID ===' as secao,
    slug,
    name as nome,
    plan_group as grupo,
    'Execute: UPDATE app_plans SET cakto_checkout_id = ''SEU_ID'' WHERE slug = ''' || slug || ''';' as solucao
FROM public.app_plans
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
AND (cakto_checkout_id IS NULL OR cakto_checkout_id = '' OR cakto_checkout_id LIKE '%PREENCHER%');

-- ============================================================
-- PRÓXIMOS PASSOS
-- ============================================================
-- 1. Execute as migrações das tabelas que estão faltando
-- 2. Verifique se todos os planos têm checkout_id configurado
-- 3. Execute o diagnóstico completo: DIAGNOSTICO_SISTEMA_SEGURO.sql
-- ============================================================

