-- Script para verificar e corrigir permissões da função RPC
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar permissões atuais
SELECT 
    grantee, 
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_user_profile_after_signup'
ORDER BY grantee, privilege_type;

-- 2. Se não houver permissões, executar os GRANTs abaixo:
-- (Remova os comentários -- e execute se necessário)

/*
-- Obter a assinatura completa da função
SELECT pg_get_function_identity_arguments(oid) as function_signature
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
*/

-- 3. Conceder permissões (ajuste a assinatura conforme necessário)
GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, TIMESTAMPTZ
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, TIMESTAMPTZ
) TO anon;

-- 4. Verificar novamente após conceder permissões
SELECT 
    grantee, 
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name = 'insert_user_profile_after_signup'
ORDER BY grantee, privilege_type;

