-- ============================================================================
-- SOLUÇÃO 1: Criar Perfil Manualmente para um Usuário Específico
-- ============================================================================
-- Substitua '3197d46e-6a2c-4e2e-8714-b18e08c4f114' pelo ID do seu usuário
-- Para encontrar o ID: Authentication → Users → Procure pelo email

INSERT INTO public.users (
    id,
    nome,
    username,
    email,
    plan_type,
    subscription_status,
    idade,
    genero,
    peso,
    altura,
    objetivo,
    points,
    discipline_score,
    completed_challenge_ids,
    is_anonymized,
    role,
    voice_daily_limit_seconds,
    voice_used_today_seconds,
    voice_balance_upsell,
    text_msg_count_today,
    created_at,
    updated_at
)
SELECT 
    id,
    COALESCE(
        raw_user_meta_data->>'nome',
        raw_user_meta_data->>'name',
        SPLIT_PART(COALESCE(email, ''), '@', 1)
    ) as nome,
    COALESCE(
        raw_user_meta_data->>'username',
        LOWER(REGEXP_REPLACE(
            COALESCE(
                raw_user_meta_data->>'nome',
                raw_user_meta_data->>'name',
                SPLIT_PART(COALESCE(email, ''), '@', 1)
            ),
            '[^a-zA-Z0-9]', '_', 'g'
        ))
    ) as username,
    email,
    'free',
    'active',
    0,
    'Masculino',
    0,
    0,
    'perder peso',
    0,
    0,
    ARRAY[]::TEXT[],
    false,
    'user',
    900,
    0,
    0,
    0,
    NOW(),
    NOW()
FROM auth.users
WHERE id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114'
  AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SOLUÇÃO 2: Criar Perfil para Todos os Usuários Sem Perfil
-- ============================================================================
-- Execute esta query para criar perfis para TODOS os usuários que não têm

INSERT INTO public.users (
    id,
    nome,
    username,
    email,
    plan_type,
    subscription_status,
    idade,
    genero,
    peso,
    altura,
    objetivo,
    points,
    discipline_score,
    completed_challenge_ids,
    is_anonymized,
    role,
    voice_daily_limit_seconds,
    voice_used_today_seconds,
    voice_balance_upsell,
    text_msg_count_today,
    created_at,
    updated_at
)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data->>'nome',
        au.raw_user_meta_data->>'name',
        SPLIT_PART(COALESCE(au.email, ''), '@', 1)
    ) as nome,
    COALESCE(
        au.raw_user_meta_data->>'username',
        LOWER(REGEXP_REPLACE(
            COALESCE(
                au.raw_user_meta_data->>'nome',
                au.raw_user_meta_data->>'name',
                SPLIT_PART(COALESCE(au.email, ''), '@', 1)
            ),
            '[^a-zA-Z0-9]', '_', 'g'
        ))
    ) as username,
    au.email,
    'free',
    'active',
    0,
    'Masculino',
    0,
    0,
    'perder peso',
    0,
    0,
    ARRAY[]::TEXT[],
    false,
    'user',
    900,
    0,
    0,
    0,
    NOW(),
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICAÇÕES
-- ============================================================================

-- Verificar se o perfil foi criado
SELECT * FROM public.users WHERE id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';

-- Verificar se o trigger existe
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Verificar se a função handle_new_user existe
SELECT 
    proname as function_name,
    prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Listar usuários sem perfil
SELECT 
    au.id,
    au.email,
    au.created_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
);
