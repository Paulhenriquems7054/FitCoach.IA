-- =====================================================
-- Script SQL COMPLETO para criar usuários padrões no Supabase
-- Desenvolvedor (dev123) e Administrador (admin123)
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Execute (Run)
-- 
-- Este script cria:
-- - Usuários no auth.users (autenticação)
-- - Perfis na tabela users (dados do aplicativo)
-- =====================================================

-- Habilitar extensão pgcrypto para hash de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- FUNÇÃO AUXILIAR: Criar usuário no auth.users
-- =====================================================
CREATE OR REPLACE FUNCTION create_auth_user(
    p_email TEXT,
    p_password TEXT,
    p_meta_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_password_hash TEXT;
BEGIN
    -- Gerar hash da senha usando bcrypt (padrão do Supabase)
    v_password_hash := crypt(p_password, gen_salt('bf', 10));
    
    -- Gerar UUID único para o usuário
    v_user_id := gen_random_uuid();
    
    -- Inserir no auth.users
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
    VALUES (
        '00000000-0000-0000-0000-000000000000'::UUID,
        v_user_id,
        'authenticated',
        'authenticated',
        p_email,
        v_password_hash,
        NOW(), -- Email confirmado automaticamente
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
        p_meta_data,
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
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO v_user_id;
    
    -- Se já existir, buscar o ID existente
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
    END IF;
    
    RETURN v_user_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Se falhar por permissões, retornar NULL e continuar
        RAISE WARNING 'Não foi possível criar usuário no auth.users: %', SQLERRM;
        SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
        RETURN v_user_id;
END;
$$;

-- =====================================================
-- CRIAR USUÁRIOS PADRÕES
-- =====================================================
DO $$
DECLARE
    dev_user_id UUID;
    admin_user_id UUID;
    dev_email TEXT := 'dev123@fitcoach.ia';
    admin_email TEXT := 'admin123@fitcoach.ia';
BEGIN
    RAISE NOTICE 'Iniciando criação de usuários padrões...';
    
    -- =====================================================
    -- Criar Desenvolvedor
    -- =====================================================
    RAISE NOTICE 'Criando usuário Desenvolvedor...';
    
    -- Tentar criar no auth.users usando a função
    dev_user_id := create_auth_user(
        dev_email,
        'dev123',
        jsonb_build_object('nome', 'Desenvolvedor', 'username', 'dev123')
    );
    
    -- Se não conseguiu criar, tentar buscar existente
    IF dev_user_id IS NULL THEN
        SELECT id INTO dev_user_id FROM auth.users WHERE email = dev_email LIMIT 1;
        IF dev_user_id IS NULL THEN
            RAISE WARNING 'Usuário Desenvolvedor não encontrado no auth.users. Crie manualmente no Dashboard: Authentication → Users → Add user (email: %, senha: dev123)', dev_email;
        END IF;
    END IF;
    
    -- Criar/Atualizar perfil na tabela users
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
        
        RAISE NOTICE 'Perfil do Desenvolvedor criado/atualizado (ID: %)', dev_user_id;
    END IF;
    
    -- =====================================================
    -- Criar Administrador
    -- =====================================================
    RAISE NOTICE 'Criando usuário Administrador...';
    
    -- Tentar criar no auth.users usando a função
    admin_user_id := create_auth_user(
        admin_email,
        'admin123',
        jsonb_build_object('nome', 'Administrador', 'username', 'admin123')
    );
    
    -- Se não conseguiu criar, tentar buscar existente
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email LIMIT 1;
        IF admin_user_id IS NULL THEN
            RAISE WARNING 'Usuário Administrador não encontrado no auth.users. Crie manualmente no Dashboard: Authentication → Users → Add user (email: %, senha: admin123)', admin_email;
        END IF;
    END IF;
    
    -- Criar/Atualizar perfil na tabela users
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
        
        RAISE NOTICE 'Perfil do Administrador criado/atualizado (ID: %)', admin_user_id;
    END IF;
    
    RAISE NOTICE 'Processo concluído!';
END $$;

-- =====================================================
-- LIMPAR FUNÇÃO AUXILIAR (opcional)
-- =====================================================
-- Descomente a linha abaixo se quiser remover a função após o uso
-- DROP FUNCTION IF EXISTS create_auth_user(TEXT, TEXT, JSONB);

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

