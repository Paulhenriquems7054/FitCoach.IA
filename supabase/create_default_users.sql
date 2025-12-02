-- =====================================================
-- Script SQL para criar usuários padrões no Supabase
-- Desenvolvedor (dev123) e Administrador (admin123)
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Execute (Run)
-- 
-- NOTA: Este script cria os usuários no auth.users e na tabela users
-- =====================================================

-- =====================================================
-- PARTE 1: Criar usuários no auth.users
-- =====================================================
-- Nota: Para inserir diretamente em auth.users, você precisa de permissões de service_role
-- Se não tiver essas permissões, crie os usuários manualmente no Dashboard:
-- Authentication → Users → Add user → Create new user
-- 
-- Alternativamente, você pode usar a função auth.users() se disponível

-- Função auxiliar para criar usuário no auth (se tiver permissões)
DO $$
DECLARE
    dev_user_id UUID;
    admin_user_id UUID;
    dev_email TEXT := 'dev123@fitcoach.ia';
    admin_email TEXT := 'admin123@fitcoach.ia';
    dev_password_hash TEXT;
    admin_password_hash TEXT;
BEGIN
    -- Gerar hash de senha usando crypt (requer extensão pgcrypto)
    -- Senha: dev123
    dev_password_hash := crypt('dev123', gen_salt('bf'));
    -- Senha: admin123
    admin_password_hash := crypt('admin123', gen_salt('bf'));

    -- Verificar se extensão pgcrypto está habilitada
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- Criar usuário Desenvolvedor no auth.users
    -- Nota: Isso requer permissões de service_role ou superuser
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    )
    SELECT
        '00000000-0000-0000-0000-000000000000'::UUID,
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        dev_email,
        dev_password_hash,
        NOW(),
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('nome', 'Desenvolvedor', 'username', 'dev123'),
        false,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = dev_email
    )
    RETURNING id INTO dev_user_id;

    -- Criar usuário Administrador no auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    )
    SELECT
        '00000000-0000-0000-0000-000000000000'::UUID,
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        admin_email,
        admin_password_hash,
        NOW(),
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('nome', 'Administrador', 'username', 'admin123'),
        false,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = admin_email
    )
    RETURNING id INTO admin_user_id;

    -- Se os usuários já existirem, buscar seus IDs
    IF dev_user_id IS NULL THEN
        SELECT id INTO dev_user_id FROM auth.users WHERE email = dev_email LIMIT 1;
    END IF;

    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email LIMIT 1;
    END IF;

    -- =====================================================
    -- PARTE 2: Criar perfis na tabela users
    -- =====================================================

    -- Perfil do Desenvolvedor
    INSERT INTO public.users (
        id,
        nome,
        username,
        email,
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
        gym_role,
        gym_id,
        is_gym_managed,
        plan_type,
        subscription_status,
        data_permissions,
        security_settings,
        access_blocked,
        voice_daily_limit_seconds,
        voice_used_today_seconds,
        voice_balance_upsell,
        text_msg_count_today,
        created_at,
        updated_at
    )
    VALUES (
        dev_user_id,
        'Desenvolvedor',
        'dev123',
        dev_email,
        30,
        'Masculino',
        0,
        0,
        'perder peso',
        0,
        0,
            ARRAY[]::text[],
        false,
        'professional',
        'admin',
        NULL,
        false,
        'monthly',
        'active',
        '{
            "allowWeightHistory": true,
            "allowMealPlans": true,
            "allowPhotoAnalysis": true,
            "allowWorkoutData": true,
            "allowChatHistory": true
        }'::jsonb,
        '{
            "biometricEnabled": false,
            "securityNotifications": true
        }'::jsonb,
        false,
        999999,
        0,
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        username = EXCLUDED.username,
        gym_role = EXCLUDED.gym_role,
        plan_type = EXCLUDED.plan_type,
        subscription_status = EXCLUDED.subscription_status,
        updated_at = NOW();

    -- Perfil do Administrador
    INSERT INTO public.users (
        id,
        nome,
        username,
        email,
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
        gym_role,
        gym_id,
        is_gym_managed,
        plan_type,
        subscription_status,
        data_permissions,
        security_settings,
        access_blocked,
        voice_daily_limit_seconds,
        voice_used_today_seconds,
        voice_balance_upsell,
        text_msg_count_today,
        created_at,
        updated_at
    )
    VALUES (
        admin_user_id,
        'Administrador',
        'admin123',
        admin_email,
        30,
        'Masculino',
        0,
        0,
        'perder peso',
        0,
        0,
            ARRAY[]::text[],
        false,
        'professional',
        'admin',
        NULL,
        false,
        'monthly',
        'active',
        '{
            "allowWeightHistory": true,
            "allowMealPlans": true,
            "allowPhotoAnalysis": true,
            "allowWorkoutData": true,
            "allowChatHistory": true
        }'::jsonb,
        '{
            "biometricEnabled": false,
            "securityNotifications": true
        }'::jsonb,
        false,
        999999,
        0,
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        username = EXCLUDED.username,
        gym_role = EXCLUDED.gym_role,
        plan_type = EXCLUDED.plan_type,
        subscription_status = EXCLUDED.subscription_status,
        updated_at = NOW();

    RAISE NOTICE 'Usuários padrões criados/atualizados com sucesso!';
    RAISE NOTICE 'Desenvolvedor - ID: %', dev_user_id;
    RAISE NOTICE 'Administrador - ID: %', admin_user_id;
END $$;

-- =====================================================
-- VERIFICAÇÃO: Consultar os usuários criados
-- =====================================================
SELECT 
    u.id,
    u.nome,
    u.username,
    au.email,
    u.gym_role,
    u.plan_type,
    u.subscription_status,
    au.email_confirmed_at IS NOT NULL as email_confirmed
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.username IN ('dev123', 'admin123')
ORDER BY u.username;

