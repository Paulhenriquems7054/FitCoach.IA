-- ============================================================================
-- Script de Teste: Fluxo Completo Multi-Tenant
-- Data: 2025-01-27
-- ============================================================================
-- 
-- Este script testa:
-- 1. Criação de academia
-- 2. Criação de alunos
-- 3. Isolamento de dados entre academias
-- 4. Cancelamento e revogação
-- ============================================================================

-- ============================================================================
-- 1. CRIAR ACADEMIA DE TESTE
-- ============================================================================

-- Criar usuário admin da academia
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin-academia-teste@exemplo.com',
    crypt('senha123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Obter ID do usuário criado
DO $$
DECLARE
    v_admin_id UUID;
    v_company_id UUID;
BEGIN
    -- Buscar ou criar admin
    SELECT id INTO v_admin_id
    FROM auth.users
    WHERE email = 'admin-academia-teste@exemplo.com'
    LIMIT 1;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Erro ao criar usuário admin';
    END IF;

    -- Criar perfil do admin
    INSERT INTO public.users (
        id, nome, username, email, gym_role, is_gym_managed,
        role, subscription_status
    )
    VALUES (
        v_admin_id,
        'Admin Academia Teste',
        'admin-academia-teste',
        'admin-academia-teste@exemplo.com',
        'admin',
        FALSE,
        'professional',
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET gym_role = 'admin';

    -- Criar company (academia)
    INSERT INTO public.companies (
        id, name, email, owner_id, plan_type, plan_name,
        max_licenses, master_code, status, payment_status,
        monthly_amount, currency
    )
    VALUES (
        gen_random_uuid(),
        'Academia Teste A',
        'academia-teste-a@exemplo.com',
        v_admin_id,
        'academy_starter_mini',
        'Starter Mini',
        10,
        'ACADEMIA-TESTA',
        'active',
        'paid',
        149.90,
        'BRL'
    )
    ON CONFLICT (master_code) DO NOTHING
    RETURNING id INTO v_company_id;

    -- Atualizar admin com gym_id
    UPDATE public.users
    SET gym_id = v_company_id::text
    WHERE id = v_admin_id;

    RAISE NOTICE 'Academia criada: %', v_company_id;
END $$;

-- ============================================================================
-- 2. CRIAR SEGUNDA ACADEMIA (PARA TESTE DE ISOLAMENTO)
-- ============================================================================

DO $$
DECLARE
    v_admin_id UUID;
    v_company_id UUID;
BEGIN
    -- Criar segundo admin
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'admin-academia-teste-b@exemplo.com',
        crypt('senha123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO v_admin_id;

    IF v_admin_id IS NULL THEN
        SELECT id INTO v_admin_id
        FROM auth.users
        WHERE email = 'admin-academia-teste-b@exemplo.com';
    END IF;

    -- Criar perfil
    INSERT INTO public.users (
        id, nome, username, email, gym_role, is_gym_managed,
        role, subscription_status
    )
    VALUES (
        v_admin_id,
        'Admin Academia Teste B',
        'admin-academia-teste-b',
        'admin-academia-teste-b@exemplo.com',
        'admin',
        FALSE,
        'professional',
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET gym_role = 'admin';

    -- Criar segunda academia
    INSERT INTO public.companies (
        id, name, email, owner_id, plan_type, plan_name,
        max_licenses, master_code, status, payment_status,
        monthly_amount, currency
    )
    VALUES (
        gen_random_uuid(),
        'Academia Teste B',
        'academia-teste-b@exemplo.com',
        v_admin_id,
        'academy_starter',
        'Pack Starter',
        20,
        'ACADEMIA-TESTB',
        'active',
        'paid',
        299.90,
        'BRL'
    )
    ON CONFLICT (master_code) DO NOTHING
    RETURNING id INTO v_company_id;

    -- Atualizar admin
    UPDATE public.users
    SET gym_id = v_company_id::text
    WHERE id = v_admin_id;

    RAISE NOTICE 'Segunda academia criada: %', v_company_id;
END $$;

-- ============================================================================
-- 3. CRIAR ALUNOS DE TESTE
-- ============================================================================

-- Alunos da Academia A
DO $$
DECLARE
    v_gym_id TEXT;
    v_user_id UUID;
    i INTEGER;
BEGIN
    -- Buscar ID da Academia A
    SELECT id::text INTO v_gym_id
    FROM public.companies
    WHERE master_code = 'ACADEMIA-TESTA'
    LIMIT 1;

    IF v_gym_id IS NULL THEN
        RAISE EXCEPTION 'Academia A não encontrada';
    END IF;

    -- Criar 3 alunos
    FOR i IN 1..3 LOOP
        -- Criar usuário auth
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'aluno-a-' || i || '@exemplo.com',
            crypt('senha123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        )
        RETURNING id INTO v_user_id;

        -- Criar perfil do aluno
        INSERT INTO public.users (
            id, nome, username, email, gym_id, gym_role,
            is_gym_managed, matricula, role, subscription_status
        )
        VALUES (
            v_user_id,
            'Aluno A ' || i,
            'aluno-a-' || i,
            'aluno-a-' || i || '@exemplo.com',
            v_gym_id,
            'student',
            TRUE,
            'MAT' || LPAD(i::text, 4, '0'),
            'user',
            'active'
        );

        -- Criar alguns dados de teste
        INSERT INTO public.weight_history (user_id, date, weight, gym_id)
        VALUES (
            v_user_id,
            CURRENT_DATE - (i * 7), -- Dados de semanas diferentes
            70.0 + (i * 2),
            v_gym_id
        );

        INSERT INTO public.chat_messages (user_id, message_data, gym_id)
        VALUES (
            v_user_id,
            jsonb_build_object('message', 'Mensagem de teste do aluno ' || i),
            v_gym_id
        );
    END LOOP;

    RAISE NOTICE 'Alunos da Academia A criados';
END $$;

-- Alunos da Academia B
DO $$
DECLARE
    v_gym_id TEXT;
    v_user_id UUID;
    i INTEGER;
BEGIN
    -- Buscar ID da Academia B
    SELECT id::text INTO v_gym_id
    FROM public.companies
    WHERE master_code = 'ACADEMIA-TESTB'
    LIMIT 1;

    IF v_gym_id IS NULL THEN
        RAISE EXCEPTION 'Academia B não encontrada';
    END IF;

    -- Criar 2 alunos
    FOR i IN 1..2 LOOP
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'aluno-b-' || i || '@exemplo.com',
            crypt('senha123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        )
        RETURNING id INTO v_user_id;

        INSERT INTO public.users (
            id, nome, username, email, gym_id, gym_role,
            is_gym_managed, matricula, role, subscription_status
        )
        VALUES (
            v_user_id,
            'Aluno B ' || i,
            'aluno-b-' || i,
            'aluno-b-' || i || '@exemplo.com',
            v_gym_id,
            'student',
            TRUE,
            'MAT' || LPAD(i::text, 4, '0'),
            'user',
            'active'
        );

        INSERT INTO public.weight_history (user_id, date, weight, gym_id)
        VALUES (
            v_user_id,
            CURRENT_DATE - (i * 7),
            75.0 + (i * 1.5),
            v_gym_id
        );
    END LOOP;

    RAISE NOTICE 'Alunos da Academia B criados';
END $$;

-- ============================================================================
-- 4. VERIFICAR ISOLAMENTO DE DADOS
-- ============================================================================

-- Verificar que cada academia vê apenas seus alunos
SELECT 
    'Academia A - Alunos' as teste,
    COUNT(*) as total_alunos
FROM public.users u
JOIN public.companies c ON c.id::text = u.gym_id
WHERE c.master_code = 'ACADEMIA-TESTA'
AND u.gym_role = 'student';

SELECT 
    'Academia B - Alunos' as teste,
    COUNT(*) as total_alunos
FROM public.users u
JOIN public.companies c ON c.id::text = u.gym_id
WHERE c.master_code = 'ACADEMIA-TESTB'
AND u.gym_role = 'student';

-- Verificar que dados estão isolados por gym_id
SELECT 
    'Dados Academia A' as teste,
    COUNT(*) as total_registros
FROM public.weight_history wh
JOIN public.companies c ON c.id::text = wh.gym_id
WHERE c.master_code = 'ACADEMIA-TESTA';

SELECT 
    'Dados Academia B' as teste,
    COUNT(*) as total_registros
FROM public.weight_history wh
JOIN public.companies c ON c.id::text = wh.gym_id
WHERE c.master_code = 'ACADEMIA-TESTB';

-- ============================================================================
-- 5. TESTAR CANCELAMENTO E REVOGAÇÃO
-- ============================================================================

-- Cancelar Academia A
UPDATE public.companies
SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    payment_status = 'failed'
WHERE master_code = 'ACADEMIA-TESTA';

-- Executar função de revogação
SELECT * FROM revoke_expired_subscriptions();

-- Verificar que alunos foram bloqueados
SELECT 
    'Alunos bloqueados Academia A' as teste,
    COUNT(*) as total_bloqueados
FROM public.users u
JOIN public.companies c ON c.id::text = u.gym_id
WHERE c.master_code = 'ACADEMIA-TESTA'
AND u.access_blocked = TRUE;

-- ============================================================================
-- 6. RESUMO DOS TESTES
-- ============================================================================

SELECT 
    'RESUMO DOS TESTES' as categoria,
    jsonb_build_object(
        'academias_criadas', (SELECT COUNT(*) FROM public.companies WHERE master_code LIKE 'ACADEMIA-TEST%'),
        'alunos_criados', (SELECT COUNT(*) FROM public.users WHERE username LIKE 'aluno-%'),
        'dados_weight_history', (SELECT COUNT(*) FROM public.weight_history WHERE gym_id IN (SELECT id::text FROM public.companies WHERE master_code LIKE 'ACADEMIA-TEST%')),
        'alunos_bloqueados', (SELECT COUNT(*) FROM public.users WHERE access_blocked = TRUE AND gym_id IN (SELECT id::text FROM public.companies WHERE master_code LIKE 'ACADEMIA-TEST%'))
    ) as resultado;

-- ============================================================================
-- LIMPEZA (OPCIONAL - DESCOMENTAR PARA LIMPAR DADOS DE TESTE)
-- ============================================================================

-- DELETE FROM public.weight_history WHERE gym_id IN (SELECT id::text FROM public.companies WHERE master_code LIKE 'ACADEMIA-TEST%');
-- DELETE FROM public.chat_messages WHERE gym_id IN (SELECT id::text FROM public.companies WHERE master_code LIKE 'ACADEMIA-TEST%');
-- DELETE FROM public.users WHERE gym_id IN (SELECT id::text FROM public.companies WHERE master_code LIKE 'ACADEMIA-TEST%');
-- DELETE FROM public.company_licenses WHERE company_id IN (SELECT id FROM public.companies WHERE master_code LIKE 'ACADEMIA-TEST%');
-- DELETE FROM public.companies WHERE master_code LIKE 'ACADEMIA-TEST%';
-- DELETE FROM auth.users WHERE email LIKE '%academia-teste%' OR email LIKE '%aluno-%';

