-- =====================================================
-- Script SQL SIMPLIFICADO para criar usuários padrões
-- Desenvolvedor (dev123) e Administrador (admin123)
-- =====================================================
-- 
-- IMPORTANTE: Este script assume que os usuários já foram
-- criados no auth.users via Dashboard ou API.
-- 
-- Se os usuários ainda não existem no auth:
-- 1. Vá em Authentication → Users → Add user
-- 2. Crie manualmente:
--    - Desenvolvedor: dev123@fitcoach.ia / dev123
--    - Administrador: admin123@fitcoach.ia / admin123
-- 3. Marque "Auto Confirm User" em ambos
-- 4. Depois execute este script para criar os perfis
-- 
-- =====================================================

-- =====================================================
-- PARTE 1: Buscar IDs dos usuários do auth.users
-- =====================================================
-- Esta parte busca os IDs dos usuários que já existem no auth
-- Se não existirem, você precisa criá-los primeiro no Dashboard

DO $$
DECLARE
    dev_user_id UUID;
    admin_user_id UUID;
    dev_email TEXT := 'dev123@fitcoach.ia';
    admin_email TEXT := 'admin123@fitcoach.ia';
BEGIN
    -- Buscar ID do usuário Desenvolvedor
    SELECT id INTO dev_user_id 
    FROM auth.users 
    WHERE email = dev_email 
    LIMIT 1;

    -- Buscar ID do usuário Administrador
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email 
    LIMIT 1;

    -- Se não encontrou os usuários, avisar
    IF dev_user_id IS NULL THEN
        RAISE WARNING 'Usuário Desenvolvedor não encontrado no auth.users. Crie primeiro no Dashboard: Authentication → Users → Add user (email: %, senha: dev123)', dev_email;
    END IF;

    IF admin_user_id IS NULL THEN
        RAISE WARNING 'Usuário Administrador não encontrado no auth.users. Crie primeiro no Dashboard: Authentication → Users → Add user (email: %, senha: admin123)', admin_email;
    END IF;

    -- =====================================================
    -- PARTE 2: Criar/Atualizar perfis na tabela users
    -- =====================================================

    -- Perfil do Desenvolvedor
    IF dev_user_id IS NOT NULL THEN
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
            data_permissions = EXCLUDED.data_permissions,
            security_settings = EXCLUDED.security_settings,
            voice_daily_limit_seconds = EXCLUDED.voice_daily_limit_seconds,
            updated_at = NOW();

        RAISE NOTICE 'Perfil do Desenvolvedor criado/atualizado (ID: %)', dev_user_id;
    END IF;

    -- Perfil do Administrador
    IF admin_user_id IS NOT NULL THEN
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
            data_permissions = EXCLUDED.data_permissions,
            security_settings = EXCLUDED.security_settings,
            voice_daily_limit_seconds = EXCLUDED.voice_daily_limit_seconds,
            updated_at = NOW();

        RAISE NOTICE 'Perfil do Administrador criado/atualizado (ID: %)', admin_user_id;
    END IF;
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
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN 'Sim' 
        ELSE 'Não' 
    END as email_confirmado,
    au.created_at as criado_em
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.username IN ('dev123', 'admin123')
ORDER BY u.username;

