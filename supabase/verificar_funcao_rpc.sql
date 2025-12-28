-- Script para verificar se a função RPC foi criada corretamente
-- Execute este script no SQL Editor do Supabase para confirmar

-- Verificar se a função existe e seus parâmetros
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    prosecdef as is_security_definer,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verificar se a função tem SECURITY DEFINER (deve retornar true)
SELECT 
    proname,
    prosecdef as has_security_definer
FROM pg_proc 
WHERE proname = 'insert_user_profile_after_signup'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- A função deve ter os seguintes parâmetros:
-- p_user_id UUID
-- p_nome TEXT
-- p_username TEXT
-- p_plan_type TEXT DEFAULT 'free'
-- p_subscription_status TEXT DEFAULT 'active'
-- p_user_data JSONB DEFAULT '{}'::JSONB
-- p_email TEXT DEFAULT NULL
-- p_voice_daily_limit_seconds INTEGER DEFAULT 900
-- p_expiry_date TIMESTAMPTZ DEFAULT NULL

