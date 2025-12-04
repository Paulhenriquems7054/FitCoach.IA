-- ============================================================================
-- VERIFICAÇÃO: O Que Foi Criado pela Migração
-- Execute esta query para verificar se tudo foi criado corretamente
-- ============================================================================

-- 1. Verificar se tabela student_academy_links foi criada
SELECT 
    'student_academy_links' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'student_academy_links'
        )
        THEN '✅ CRIADA'
        ELSE '❌ NÃO FOI CRIADA'
    END as status
UNION ALL

-- 2. Verificar se função check_available_licenses foi criada
SELECT 
    'check_available_licenses (função)' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname = 'check_available_licenses'
        )
        THEN '✅ CRIADA'
        ELSE '❌ NÃO FOI CRIADA'
    END as status
UNION ALL

-- 3. Verificar se índices foram criados
SELECT 
    'Índices em student_academy_links' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename = 'student_academy_links'
            AND indexname = 'idx_student_academy_links_user'
        )
        THEN '✅ CRIADOS'
        ELSE '❌ NÃO FORAM CRIADOS'
    END as status
UNION ALL

-- 4. Verificar se RLS foi habilitado
SELECT 
    'RLS em student_academy_links' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'student_academy_links'
            AND rowsecurity = true
        )
        THEN '✅ HABILITADO'
        ELSE '❌ NÃO HABILITADO'
    END as status
UNION ALL

-- 5. Verificar se políticas RLS foram criadas
SELECT 
    'Políticas RLS' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'student_academy_links'
        )
        THEN '✅ CRIADAS'
        ELSE '❌ NÃO FORAM CRIADAS'
    END as status
UNION ALL

-- 6. Verificar se tabela academy_subscriptions existe (será criada pelo webhook)
SELECT 
    'academy_subscriptions' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions'
        )
        THEN '✅ EXISTE - Campos serão adicionados agora'
        ELSE '⚠️ NÃO EXISTE AINDA - Será criada pelo webhook na primeira compra'
    END as status
UNION ALL

-- 7. Se academy_subscriptions existir, verificar campos
SELECT 
    'academy_subscriptions.licenses_used' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions' 
            AND column_name = 'licenses_used'
        )
        THEN '✅ EXISTE'
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions'
        )
        THEN '❌ NÃO EXISTE - Execute a migração novamente'
        ELSE '⚠️ TABELA NÃO EXISTE AINDA'
    END as status
UNION ALL

SELECT 
    'academy_subscriptions.activation_code' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions' 
            AND column_name = 'activation_code'
        )
        THEN '✅ EXISTE'
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions'
        )
        THEN '❌ NÃO EXISTE - Execute a migração novamente'
        ELSE '⚠️ TABELA NÃO EXISTE AINDA'
    END as status;

-- ============================================================================
-- RESUMO
-- ============================================================================

SELECT 
    '=== RESUMO ===' as secao,
    'Status da migração:' as item,
    '' as status
UNION ALL
SELECT 
    '✅ MIGRAÇÃO EXECUTADA' as secao,
    'Tabela student_academy_links criada' as item,
    'Pronta para vincular alunos a academias' as status
UNION ALL
SELECT 
    '⚠️ PRÓXIMO PASSO' as secao,
    'Quando uma academia comprar um plano:' as item,
    '1. Webhook criará academy_subscriptions 2. Execute a migração novamente para adicionar campos' as status;

