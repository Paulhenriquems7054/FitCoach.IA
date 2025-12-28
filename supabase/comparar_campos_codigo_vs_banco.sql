-- Script para comparar campos usados no código vs campos no banco
-- Execute este script no SQL Editor do Supabase

-- Campos que o código espera usar (baseado na análise do código):
-- - id (UUID)
-- - nome (TEXT)
-- - username (TEXT)
-- - email (TEXT) - pode não existir
-- - idade (INTEGER)
-- - genero (TEXT)
-- - peso (NUMERIC)
-- - altura (NUMERIC)
-- - objetivo (TEXT)
-- - points (INTEGER)
-- - discipline_score (INTEGER)
-- - completed_challenge_ids (TEXT[] ou JSONB)
-- - is_anonymized (BOOLEAN)
-- - role (TEXT)
-- - plan_type (TEXT)
-- - subscription_status (TEXT)
-- - expiry_date (TIMESTAMPTZ) ou subscription_expiry
-- - voice_daily_limit_seconds (INTEGER)
-- - voice_used_today_seconds (INTEGER)
-- - voice_balance_upsell (INTEGER)
-- - text_msg_count_today (INTEGER)
-- - created_at (TIMESTAMPTZ)
-- - updated_at (TIMESTAMPTZ)

-- Verificar quais desses campos existem
-- Incluindo campos extras identificados na tabela
WITH campos_esperados AS (
    SELECT unnest(ARRAY[
        'id', 'nome', 'username', 'email', 'idade', 'genero', 'peso', 'altura',
        'objetivo', 'points', 'discipline_score', 'completed_challenge_ids',
        'is_anonymized', 'role', 'plan_type', 'subscription_status',
        'expiry_date', 'subscription_expiry', 'trial_end_date',
        'voice_daily_limit_seconds', 'voice_used_today_seconds',
        'voice_balance_upsell', 'text_msg_count_today',
        'created_at', 'updated_at',
        -- Campos extras identificados
        'photo_url', 'gym_id', 'gym_role', 'is_gym_managed', 'matricula',
        'data_permissions', 'security_settings', 'access_blocked', 'blocked_at',
        'blocked_by', 'blocked_reason', 'last_sync_at', 'gym_server_url',
        'last_usage_date', 'last_msg_date', 'academy_id', 'tenant_role',
        'ai_subscription_status', 'ai_trial_start_at', 'ai_trial_end_at', 'ai_plan_type'
    ]) AS campo_esperado
)
SELECT 
    ce.campo_esperado,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END AS status,
    c.data_type AS tipo_dados,
    c.is_nullable AS pode_ser_null
FROM campos_esperados ce
LEFT JOIN information_schema.columns c
    ON c.table_schema = 'public'
    AND c.table_name = 'users'
    AND LOWER(c.column_name) = LOWER(ce.campo_esperado)
ORDER BY 
    CASE WHEN c.column_name IS NOT NULL THEN 0 ELSE 1 END,
    ce.campo_esperado;

-- Verificar campos que existem mas não estão na lista esperada (pode ser campos extras não documentados)
SELECT 
    c.column_name AS campo_extra,
    c.data_type,
    c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
AND c.table_name = 'users'
AND LOWER(c.column_name) NOT IN (
    'id', 'nome', 'username', 'email', 'idade', 'genero', 'peso', 'altura',
    'objetivo', 'points', 'discipline_score', 'completed_challenge_ids',
    'is_anonymized', 'role', 'plan_type', 'subscription_status',
    'expiry_date', 'subscription_expiry', 'trial_end_date',
    'voice_daily_limit_seconds', 'voice_used_today_seconds',
    'voice_balance_upsell', 'text_msg_count_today',
    'created_at', 'updated_at',
    -- Campos extras já identificados
    'photo_url', 'gym_id', 'gym_role', 'is_gym_managed', 'matricula',
    'data_permissions', 'security_settings', 'access_blocked', 'blocked_at',
    'blocked_by', 'blocked_reason', 'last_sync_at', 'gym_server_url',
    'last_usage_date', 'last_msg_date', 'academy_id', 'tenant_role',
    'ai_subscription_status', 'ai_trial_start_at', 'ai_trial_end_at', 'ai_plan_type'
)
ORDER BY c.ordinal_position;

