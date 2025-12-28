-- Script para adicionar permissões GRANT à função RPC
-- Execute este script se a função já existe mas não tem permissões

-- Permitir que usuários autenticados executem a função
GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, TIMESTAMPTZ
) TO authenticated;

-- Permitir que usuários anônimos executem a função (necessário durante signup)
GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, TIMESTAMPTZ
) TO anon;

-- Verificar permissões após grant
SELECT 
    proname,
    prosecdef,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

