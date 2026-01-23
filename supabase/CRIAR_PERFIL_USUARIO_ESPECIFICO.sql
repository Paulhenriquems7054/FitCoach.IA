-- ============================================================================
-- Criar Perfil para Usuário Específico por Email
-- ============================================================================
-- Substitua 'paulohmorais@hotmail.com' pelo email do usuário que precisa de perfil

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
WHERE au.email = 'paulohmorais@hotmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Verificar se foi criado
SELECT 
    id,
    email,
    nome,
    username,
    created_at
FROM public.users
WHERE email = 'paulohmorais@hotmail.com';
