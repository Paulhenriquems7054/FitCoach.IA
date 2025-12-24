-- ============================================================================
-- Script de Teste: Migração com Academia (gym_id)
-- Data: 2025-01-27
-- ============================================================================
-- 
-- Este script testa a migração com um usuário que tem academia associada
-- para verificar se gym_id é preenchido corretamente
-- ============================================================================

-- ============================================================================
-- 1. CRIAR ACADEMIA DE TESTE
-- ============================================================================

DO $$
DECLARE
    v_admin_id UUID;
    v_company_id UUID;
BEGIN
    -- Verificar se admin já existe
    SELECT id INTO v_admin_id
    FROM auth.users
    WHERE email = 'admin-teste-gym@exemplo.com'
    LIMIT 1;

    -- Se não existir, criar
    IF v_admin_id IS NULL THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'admin-teste-gym@exemplo.com',
            crypt('senha123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        )
        RETURNING id INTO v_admin_id;
    END IF;

    -- Criar perfil do admin
    INSERT INTO public.users (
        id, nome, username, email, gym_role, is_gym_managed,
        role, subscription_status
    )
    VALUES (
        v_admin_id,
        'Admin Teste Gym',
        'admin-teste-gym',
        'admin-teste-gym@exemplo.com',
        'admin',
        FALSE,
        'professional',
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET gym_role = 'admin';

    -- Criar academia
    INSERT INTO public.companies (
        id, name, email, owner_id, plan_type, plan_name,
        max_licenses, master_code, status, payment_status,
        monthly_amount, currency
    )
    VALUES (
        gen_random_uuid(),
        'Academia Teste Migração',
        'academia-teste-migracao@exemplo.com',
        v_admin_id,
        'academy_starter_mini',
        'Starter Mini',
        10,
        'TESTE-MIGR',
        'active',
        'paid',
        149.90,
        'BRL'
    )
    ON CONFLICT (master_code) DO NOTHING
    RETURNING id INTO v_company_id;

    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id
        FROM public.companies
        WHERE master_code = 'TESTE-MIGR';
    END IF;

    -- Atualizar admin com gym_id
    UPDATE public.users
    SET gym_id = v_company_id::text
    WHERE id = v_admin_id;

    RAISE NOTICE 'Academia criada: %', v_company_id;
END $$;

-- ============================================================================
-- 2. CRIAR USUÁRIO DE TESTE COM ACADEMIA
-- ============================================================================

DO $$
DECLARE
    v_test_user_id UUID;
    v_company_id UUID;
BEGIN
    -- Buscar ID da academia
    SELECT id INTO v_company_id
    FROM public.companies
    WHERE master_code = 'TESTE-MIGR'
    LIMIT 1;

    -- Verificar se usuário já existe
    SELECT id INTO v_test_user_id
    FROM auth.users
    WHERE email = 'usuario-com-gym@exemplo.com'
    LIMIT 1;

    -- Se não existir, criar
    IF v_test_user_id IS NULL THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'usuario-com-gym@exemplo.com',
            crypt('senha123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        )
        RETURNING id INTO v_test_user_id;
    END IF;

    -- Criar perfil com gym_id
    INSERT INTO public.users (
        id, nome, username, email, gym_id, gym_role,
        is_gym_managed, role, subscription_status
    )
    VALUES (
        v_test_user_id,
        'Usuário com Academia',
        'usuario-com-gym',
        'usuario-com-gym@exemplo.com',
        v_company_id::text,
        'student',
        TRUE,
        'user',
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET gym_id = v_company_id::text,
        gym_role = 'student';

    RAISE NOTICE 'Usuário criado com gym_id: %', v_test_user_id;
END $$;

-- ============================================================================
-- 3. LIMPAR DADOS ANTERIORES
-- ============================================================================

DELETE FROM public.weight_history 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario-com-gym@exemplo.com');

DELETE FROM public.chat_messages 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario-com-gym@exemplo.com');

-- ============================================================================
-- 4. TESTAR MIGRAÇÃO COM gym_id
-- ============================================================================

-- Testar migração de peso (gym_id deve ser preenchido automaticamente pelo trigger)
SELECT 
    'Migração de Peso com gym_id' as teste,
    migrate_weight_history_from_local(
        (SELECT id FROM auth.users WHERE email = 'usuario-com-gym@exemplo.com'),
        '[
            {"date": "2025-01-20", "weight": 75.5},
            {"date": "2025-01-21", "weight": 75.3},
            {"date": "2025-01-22", "weight": 75.1}
        ]'::JSONB
    ) as registros_processados;

-- Verificar se gym_id foi preenchido
SELECT 
    'Verificação gym_id em weight_history' as teste,
    COUNT(*) as total,
    COUNT(CASE WHEN gym_id IS NOT NULL THEN 1 END) as com_gym_id,
    COUNT(CASE WHEN gym_id IS NULL THEN 1 END) as sem_gym_id,
    CASE 
        WHEN COUNT(CASE WHEN gym_id IS NULL THEN 1 END) = 0 THEN '✅ Todos os registros têm gym_id'
        ELSE '⚠️ Alguns registros não têm gym_id'
    END as status
FROM public.weight_history
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario-com-gym@exemplo.com');

-- Testar migração de mensagens (gym_id deve ser preenchido automaticamente pelo trigger)
SELECT 
    'Migração de Mensagens com gym_id' as teste,
    migrate_chat_messages_from_local(
        (SELECT id FROM auth.users WHERE email = 'usuario-com-gym@exemplo.com'),
        '[
            {
                "message": "Teste com academia",
                "timestamp": "2025-01-20T10:00:00Z"
            }
        ]'::JSONB
    ) as mensagens_processadas;

-- Verificar se gym_id foi preenchido nas mensagens
SELECT 
    'Verificação gym_id em chat_messages' as teste,
    COUNT(*) as total,
    COUNT(CASE WHEN gym_id IS NOT NULL THEN 1 END) as com_gym_id,
    COUNT(CASE WHEN gym_id IS NULL THEN 1 END) as sem_gym_id,
    CASE 
        WHEN COUNT(CASE WHEN gym_id IS NULL THEN 1 END) = 0 THEN '✅ Todas as mensagens têm gym_id'
        ELSE '⚠️ Algumas mensagens não têm gym_id'
    END as status
FROM public.chat_messages
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario-com-gym@exemplo.com');

-- ============================================================================
-- 5. RESUMO
-- ============================================================================

SELECT 
    '📊 RESUMO - Teste com Academia' as categoria,
    jsonb_build_object(
        'usuario', 'usuario-com-gym@exemplo.com',
        'academia', (SELECT name FROM public.companies WHERE master_code = 'TESTE-MIGR'),
        'gym_id_usuario', (SELECT gym_id FROM public.users WHERE email = 'usuario-com-gym@exemplo.com'),
        'registros_peso', (
            SELECT COUNT(*) 
            FROM public.weight_history 
            WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario-com-gym@exemplo.com')
        ),
        'registros_peso_com_gym_id', (
            SELECT COUNT(*) 
            FROM public.weight_history 
            WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario-com-gym@exemplo.com')
            AND gym_id IS NOT NULL
        ),
        'mensagens_chat', (
            SELECT COUNT(*) 
            FROM public.chat_messages 
            WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario-com-gym@exemplo.com')
        ),
        'mensagens_chat_com_gym_id', (
            SELECT COUNT(*) 
            FROM public.chat_messages 
            WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario-com-gym@exemplo.com')
            AND gym_id IS NOT NULL
        ),
        'status', '✅ Teste concluído'
    ) as resultado;

