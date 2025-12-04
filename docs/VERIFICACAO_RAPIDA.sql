-- ============================================================
-- VERIFICAÇÃO RÁPIDA DO SISTEMA
-- Use esta query para verificar rapidamente o estado do banco
-- ============================================================

-- 1. Verificar quais tabelas principais existem
SELECT 
    '=== TABELAS EXISTENTES ===' as secao,
    table_name as tabela,
    CASE 
        WHEN table_name IN ('app_plans', 'user_subscriptions', 'academy_subscriptions', 
                           'personal_subscriptions', 'recharges', 'coupons', 
                           'companies', 'company_licenses', 'users', 'cakto_webhooks') 
        THEN '✅ TABELA PRINCIPAL'
        ELSE 'ℹ️ OUTRA TABELA'
    END as tipo
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY 
    CASE 
        WHEN table_name IN ('app_plans', 'user_subscriptions', 'academy_subscriptions', 
                           'personal_subscriptions', 'recharges', 'coupons', 
                           'companies', 'company_licenses', 'users', 'cakto_webhooks') 
        THEN 1
        ELSE 2
    END,
    table_name;

-- 2. Contar registros apenas nas tabelas que existem (queries separadas)
-- app_plans
SELECT 
    '=== CONTAGEM DE REGISTROS ===' as secao,
    'app_plans' as tabela,
    COUNT(*)::text as total_registros
FROM public.app_plans
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')

UNION ALL

-- user_subscriptions
SELECT 
    '=== CONTAGEM DE REGISTROS ===' as secao,
    'user_subscriptions' as tabela,
    COUNT(*)::text as total_registros
FROM public.user_subscriptions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')

UNION ALL

-- recharges
SELECT 
    '=== CONTAGEM DE REGISTROS ===' as secao,
    'recharges' as tabela,
    COUNT(*)::text as total_registros
FROM public.recharges
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')

UNION ALL

-- coupons
SELECT 
    '=== CONTAGEM DE REGISTROS ===' as secao,
    'coupons' as tabela,
    COUNT(*)::text as total_registros
FROM public.coupons
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons')

UNION ALL

-- companies
SELECT 
    '=== CONTAGEM DE REGISTROS ===' as secao,
    'companies' as tabela,
    COUNT(*)::text as total_registros
FROM public.companies
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')

UNION ALL

-- company_licenses
SELECT 
    '=== CONTAGEM DE REGISTROS ===' as secao,
    'company_licenses' as tabela,
    COUNT(*)::text as total_registros
FROM public.company_licenses
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses')

UNION ALL

-- users
SELECT 
    '=== CONTAGEM DE REGISTROS ===' as secao,
    'users' as tabela,
    COUNT(*)::text as total_registros
FROM public.users
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');

-- 2b. Mostrar tabelas que não existem
SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'app_plans' as tabela,
    'Execute: migration_planos_vendas_completa.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'academy_subscriptions' as tabela,
    'Criada automaticamente pelo webhook da Cakto' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_subscriptions')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'personal_subscriptions' as tabela,
    'Criada automaticamente pelo webhook da Cakto' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personal_subscriptions')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'companies' as tabela,
    'Execute: migration_criar_companies_licenses_SIMPLIFICADA.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'company_licenses' as tabela,
    'Execute: migration_criar_companies_licenses_SIMPLIFICADA.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses');

-- 3. Verificar se app_plans tem dados (tabela mais importante)
SELECT 
    '=== PLANOS CONFIGURADOS ===' as secao,
    plan_group,
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL OR cakto_checkout_id = '' THEN '❌ SEM CHECKOUT ID'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
ORDER BY plan_group, slug
LIMIT 20;

-- 4. Mensagem se app_plans não existir
SELECT 
    '=== PLANOS CONFIGURADOS ===' as secao,
    '⚠️ TABELA app_plans NÃO EXISTE' as mensagem,
    'Execute a migração: migration_planos_vendas_completa.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans');

