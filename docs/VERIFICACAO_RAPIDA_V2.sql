-- ============================================================
-- VERIFICAÇÃO RÁPIDA DO SISTEMA (VERSÃO SEGURA)
-- Esta versão não tenta acessar tabelas que não existem
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

-- 2. Mostrar tabelas que deveriam existir mas não existem
SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'app_plans' as tabela,
    'Execute: migration_planos_vendas_completa.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'user_subscriptions' as tabela,
    'Verifique se foi criada pelo schema.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'academy_subscriptions' as tabela,
    'Criada automaticamente pelo webhook da Cakto (pode não existir ainda)' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_subscriptions')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'personal_subscriptions' as tabela,
    'Criada automaticamente pelo webhook da Cakto (pode não existir ainda)' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personal_subscriptions')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'recharges' as tabela,
    'Execute: migration_criar_tabela_recharges.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'coupons' as tabela,
    'Execute: migration_criar_sistema_cupons_cakto.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons')

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
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'users' as tabela,
    'Verifique se foi criada pelo schema.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')

UNION ALL

SELECT 
    '=== TABELAS FALTANDO ===' as secao,
    'cakto_webhooks' as tabela,
    'Execute: migration_criar_tabela_cakto_webhooks.sql (opcional)' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks');

-- 3. Verificar app_plans (apenas se existir - usando DO block)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans') THEN
        RAISE NOTICE 'Tabela app_plans existe - execute: SELECT * FROM public.app_plans LIMIT 20;';
    ELSE
        RAISE NOTICE 'Tabela app_plans NÃO existe - execute: migration_planos_vendas_completa.sql';
    END IF;
END $$;

-- 4. Instruções para verificar planos
SELECT 
    '=== INSTRUÇÕES ===' as secao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
        THEN '✅ Tabela app_plans existe. Execute: SELECT * FROM public.app_plans;'
        ELSE '⚠️ Tabela app_plans NÃO existe. Execute: migration_planos_vendas_completa.sql'
    END as instrucao;

-- ============================================================
-- NOTA: Para contar registros de tabelas específicas,
-- execute queries separadas para cada tabela que existe.
-- Exemplo:
-- SELECT COUNT(*) FROM public.app_plans;
-- SELECT COUNT(*) FROM public.user_subscriptions;
-- etc.
-- ============================================================

