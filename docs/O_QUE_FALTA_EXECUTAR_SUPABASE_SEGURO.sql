-- ============================================================================
-- VERIFICAÇÃO: O Que Falta Executar no Supabase (VERSÃO SEGURA)
-- Esta versão NÃO tenta acessar tabelas que não existem
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
        THEN 'Verificar quantidade manualmente: SELECT COUNT(*) FROM app_plans;'
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
        THEN 'Verificar quantidade manualmente: SELECT COUNT(*) FROM academy_subscriptions;'
        ELSE '0 (será criada na primeira compra de academia)'
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
        THEN 'Verificar quantidade manualmente: SELECT COUNT(*) FROM user_subscriptions;'
        ELSE '0 (será criada na primeira compra B2C)'
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
        THEN 'Verificar quantidade manualmente: SELECT COUNT(*) FROM recharges;'
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
        THEN 'Verificar quantidade manualmente: SELECT COUNT(*) FROM student_academy_links;'
        ELSE '0 (executar: migration_criar_sistema_ativacao_academias_EXECUTAR.sql)'
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
        ELSE '⚠️ TABELA NÃO EXISTE AINDA (será criada pelo webhook)'
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
        ELSE '⚠️ TABELA NÃO EXISTE AINDA (será criada pelo webhook)'
    END as status,
    'N/A' as registros;

-- ============================================================================
-- RESUMO: O QUE EXECUTAR AGORA
-- ============================================================================

SELECT 
    '=== RESUMO ===' as secao,
    'O que falta executar:' as item,
    '' as status
UNION ALL
SELECT 
    '1. MIGRAÇÃO PRINCIPAL' as secao,
    'Executar: supabase/migration_criar_sistema_ativacao_academias_EXECUTAR.sql' as item,
    '⚠️ IMPORTANTE: Mesmo que academy_subscriptions não exista, execute a migração! Ela usa IF NOT EXISTS.' as status
UNION ALL
SELECT 
    '2. VERIFICAR app_plans' as secao,
    'Garantir que app_plans existe e tem todos os planos' as item,
    'Com cakto_checkout_id = product.short_id da Cakto' as status
UNION ALL
SELECT 
    '3. DEPLOY EDGE FUNCTION' as secao,
    'Fazer deploy da Edge Function cakto-webhook atualizada' as item,
    'Para gerar códigos automaticamente quando academias comprarem' as status;

-- ============================================================================
-- NOTA IMPORTANTE
-- ============================================================================
-- A migração migration_criar_sistema_ativacao_academias_EXECUTAR.sql
-- usa "IF NOT EXISTS" e "DO $$ BEGIN ... END $$" para criar campos
-- apenas se a tabela existir. Se a tabela não existir, a migração
-- não dará erro, apenas não criará os campos (que serão criados
-- quando a tabela for criada pelo webhook).
-- 
-- RECOMENDAÇÃO:
-- 1. Execute a migração AGORA (mesmo que academy_subscriptions não exista)
-- 2. Quando uma academia comprar um plano, o webhook criará a tabela
-- 3. Execute a migração NOVAMENTE para adicionar os campos na tabela criada
-- ============================================================================

