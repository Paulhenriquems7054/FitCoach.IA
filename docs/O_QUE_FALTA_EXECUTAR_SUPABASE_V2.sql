-- ============================================================================
-- VERIFICAÇÃO: O Que Falta Executar no Supabase (VERSÃO SEGURA)
-- Execute esta query para ver o status atual
-- Esta versão não tenta acessar tabelas que não existem
-- ============================================================================

-- 1. Verificar se tabela app_plans existe
SELECT 
    'app_plans' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - CRIAR!'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
        THEN (
            SELECT COUNT(*)::text 
            FROM public.app_plans
        )
        ELSE '0'
    END as registros
UNION ALL

-- 2. Verificar se tabela academy_subscriptions existe
SELECT 
    'academy_subscriptions' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_subscriptions')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - SERÁ CRIADA PELO WEBHOOK'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_subscriptions')
        THEN (
            SELECT COUNT(*)::text 
            FROM public.academy_subscriptions
        )
        ELSE '0 (será criada na primeira compra)'
    END as registros
UNION ALL

-- 3. Verificar se tabela user_subscriptions existe
SELECT 
    'user_subscriptions' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - SERÁ CRIADA PELO WEBHOOK'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
        THEN (
            SELECT COUNT(*)::text 
            FROM public.user_subscriptions
        )
        ELSE '0 (será criada na primeira compra)'
    END as registros
UNION ALL

-- 4. Verificar se tabela recharges existe
SELECT 
    'recharges' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - CRIAR!'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')
        THEN (
            SELECT COUNT(*)::text 
            FROM public.recharges
        )
        ELSE '0'
    END as registros
UNION ALL

-- 5. Verificar se tabela student_academy_links existe
SELECT 
    'student_academy_links' as tabela,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_academy_links')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - EXECUTAR MIGRAÇÃO!'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_academy_links')
        THEN (
            SELECT COUNT(*)::text 
            FROM public.student_academy_links
        )
        ELSE '0 (executar migração)'
    END as registros
UNION ALL

-- 6. Verificar se campo licenses_used existe em academy_subscriptions
SELECT 
    'academy_subscriptions.licenses_used' as tabela,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions' 
            AND column_name = 'licenses_used'
        )
        THEN '✅ EXISTE'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_subscriptions')
        THEN '❌ NÃO EXISTE - EXECUTAR MIGRAÇÃO!'
        ELSE '⚠️ TABELA NÃO EXISTE AINDA'
    END as status,
    'N/A' as registros
UNION ALL

-- 7. Verificar se campo activation_code existe em academy_subscriptions
SELECT 
    'academy_subscriptions.activation_code' as tabela,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions' 
            AND column_name = 'activation_code'
        )
        THEN '✅ EXISTE'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_subscriptions')
        THEN '❌ NÃO EXISTE - EXECUTAR MIGRAÇÃO!'
        ELSE '⚠️ TABELA NÃO EXISTE AINDA'
    END as status,
    'N/A' as registros;

-- ============================================================================
-- RESUMO: O QUE EXECUTAR
-- ============================================================================

SELECT 
    '=== RESUMO ===' as secao,
    'O que falta executar:' as item,
    '' as status
UNION ALL
SELECT 
    '1. MIGRAÇÃO PRINCIPAL' as secao,
    'Executar: supabase/migration_criar_sistema_ativacao_academias_EXECUTAR.sql' as item,
    'Adiciona campos e cria tabela student_academy_links' as status
UNION ALL
SELECT 
    '2. VERIFICAR TABELAS' as secao,
    'Verificar se todas as tabelas existem (academy_subscriptions, user_subscriptions, recharges)' as item,
    'Se não existirem, serão criadas pelo webhook na primeira compra' as status
UNION ALL
SELECT 
    '3. PREENCHER app_plans' as secao,
    'Garantir que app_plans tem todos os planos da página de vendas' as item,
    'Com cakto_checkout_id = product.short_id da Cakto' as status
UNION ALL
SELECT 
    '4. DEPLOY EDGE FUNCTION' as secao,
    'Fazer deploy da Edge Function cakto-webhook atualizada' as item,
    'Para gerar códigos automaticamente' as status;

