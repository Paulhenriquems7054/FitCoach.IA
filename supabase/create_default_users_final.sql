-- =====================================================
-- Script SQL FINAL para criar usuários padrões no Supabase
-- Desenvolvedor (dev123) e Administrador (admin123)
-- =====================================================
-- 
-- MÉTODO RECOMENDADO (2 passos):
-- 
-- PASSO 1: Criar usuários no auth via Dashboard
--   1. Vá em Authentication → Users → Add user
--   2. Crie:
--      - Email: dev123@fitcoach.ia, Senha: dev123, Auto Confirm: ✓
--      - Email: admin123@fitcoach.ia, Senha: admin123, Auto Confirm: ✓
-- 
-- PASSO 2: Execute este script SQL para criar os perfis
-- =====================================================

DO $$
DECLARE
    dev_user_id UUID;
    admin_user_id UUID;
    dev_email TEXT := 'dev123@fitcoach.ia';
    admin_email TEXT := 'admin123@fitcoach.ia';
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Criando usuários padrões...';
    RAISE NOTICE '========================================';
    
    -- =====================================================
    -- Buscar IDs dos usuários no auth.users
    -- =====================================================
    
    -- Buscar Desenvolvedor
    SELECT id INTO dev_user_id 
    FROM auth.users 
    WHERE email = dev_email 
    LIMIT 1;
    
    -- Buscar Administrador
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email 
    LIMIT 1;
    
    -- =====================================================
    -- Verificar se usuários existem no auth
    -- =====================================================
    
    IF dev_user_id IS NULL THEN
        RAISE WARNING '⚠️  Usuário Desenvolvedor NÃO encontrado no auth.users!';
        RAISE WARNING '   Crie primeiro no Dashboard: Authentication → Users → Add user';
        RAISE WARNING '   Email: %, Senha: dev123, Auto Confirm: ✓', dev_email;
    ELSE
        RAISE NOTICE '✓ Usuário Desenvolvedor encontrado (ID: %)', dev_user_id;
    END IF;
    
    IF admin_user_id IS NULL THEN
        RAISE WARNING '⚠️  Usuário Administrador NÃO encontrado no auth.users!';
        RAISE WARNING '   Crie primeiro no Dashboard: Authentication → Users → Add user';
        RAISE WARNING '   Email: %, Senha: admin123, Auto Confirm: ✓', admin_email;
    ELSE
        RAISE NOTICE '✓ Usuário Administrador encontrado (ID: %)', admin_user_id;
    END IF;
    
    -- =====================================================
    -- Criar/Atualizar perfil do Desenvolvedor
    -- =====================================================
    
    IF dev_user_id IS NOT NULL THEN
        INSERT INTO public.users (
            id,
            nome,
            username,
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
        
        RAISE NOTICE '✓ Perfil do Desenvolvedor criado/atualizado';
    END IF;
    
    -- =====================================================
    -- Criar/Atualizar perfil do Administrador
    -- =====================================================
    
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.users (
            id,
            nome,
            username,
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
        
        RAISE NOTICE '✓ Perfil do Administrador criado/atualizado';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Processo concluído!';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- VERIFICAÇÃO: Consultar os usuários criados
-- =====================================================
SELECT 
    u.id,
    u.nome,
    u.username,
    au.email,
    u.gym_role as role,
    u.plan_type as plano,
    u.subscription_status as status,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN '✓ Sim' 
        ELSE '✗ Não' 
    END as email_confirmado,
    au.created_at as criado_em
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.username IN ('dev123', 'admin123')
ORDER BY u.username;

