-- Verificação Completa da Função RPC
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar função e argumentos
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosecdef as has_security_definer,
    pg_get_functiondef(oid) LIKE '%SECURITY DEFINER%' as security_definer_check
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Verificar permissões (GRANTs) - CRÍTICO
SELECT 
    grantee, 
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_user_profile_after_signup'
ORDER BY grantee, privilege_type;

-- 3. Verificar se tem verificação de auth.users
SELECT 
    pg_get_functiondef(oid) LIKE '%auth.users%' as has_auth_users_check,
    pg_get_functiondef(oid) LIKE '%auth_user_exists%' as has_auth_user_exists_var,
    pg_get_functiondef(oid) LIKE '%EXISTS(SELECT 1 FROM auth.users%' as has_exists_check
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Verificar RLS policy na tabela users
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
AND policyname = 'Users can insert own profile';

