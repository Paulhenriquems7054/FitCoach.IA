-- ============================================================================
-- Verificação Completa: Trigger, Função e RLS
-- ============================================================================

-- 1. Verificar se o trigger on_auth_user_created existe
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name,
    CASE tgenabled 
        WHEN 'O' THEN 'enabled'
        WHEN 'D' THEN 'disabled'
        WHEN 'R' THEN 'replica'
        WHEN 'A' THEN 'always'
        ELSE 'unknown'
    END as trigger_status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- 2. Verificar se a função handle_new_user existe e tem SECURITY DEFINER
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    proowner::regrole as owner,
    pronargs as num_args
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Verificar TODAS as políticas RLS da tabela users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'users'
  AND schemaname = 'public'
ORDER BY policyname, cmd;

-- 4. Verificar se RLS está habilitado na tabela users
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users'
  AND schemaname = 'public';

-- 5. Verificar se há política que permite INSERT via trigger
SELECT 
    policyname,
    cmd as command,
    with_check as with_check_expression,
    CASE 
        WHEN with_check = 'true' THEN '✅ Permite INSERT via trigger'
        ELSE '❌ Pode bloquear INSERT via trigger'
    END as status
FROM pg_policies
WHERE tablename = 'users'
  AND schemaname = 'public'
  AND cmd = 'INSERT';

-- 6. Listar usuários que têm auth mas não têm perfil
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    CASE 
        WHEN u.id IS NULL THEN '❌ Sem perfil'
        ELSE '✅ Tem perfil'
    END as profile_status
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;
