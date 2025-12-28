-- Verificar se a função foi criada corretamente após a migração
-- Execute este script no SQL Editor do Supabase para confirmar

-- 1. Verificar se a função existe e tem SECURITY DEFINER
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosecdef as has_security_definer,
    pg_get_functiondef(oid) LIKE '%SECURITY DEFINER%' as security_definer_check
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Verificar permissões (GRANTs)
SELECT 
    grantee, 
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_user_profile_after_signup'
ORDER BY grantee, privilege_type;

-- 3. Verificar se a função tem a verificação de auth.users
SELECT 
    pg_get_functiondef(oid) LIKE '%auth.users%' as has_auth_users_check,
    pg_get_functiondef(oid) LIKE '%auth_user_exists%' as has_auth_user_exists_var
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

