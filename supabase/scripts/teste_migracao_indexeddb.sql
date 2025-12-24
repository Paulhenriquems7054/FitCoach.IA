-- ============================================================================
-- Script de Teste: Migração IndexedDB → Supabase
-- Data: 2025-01-27
-- ============================================================================
-- 
-- Este script testa as funções de migração criadas
-- ============================================================================

-- ============================================================================
-- 1. CRIAR USUÁRIO DE TESTE (se não existir)
-- ============================================================================

DO $$
DECLARE
    v_test_user_id UUID;
BEGIN
    -- Verificar se usuário de teste já existe
    SELECT id INTO v_test_user_id
    FROM auth.users
    WHERE email = 'teste-migracao@exemplo.com'
    LIMIT 1;

    -- Se não existir, criar
    IF v_test_user_id IS NULL THEN
        -- Criar usuário no auth.users
        INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            created_at, 
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            'teste-migracao@exemplo.com',
            crypt('senha123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        )
        RETURNING id INTO v_test_user_id;

        -- Criar perfil do usuário
        INSERT INTO public.users (
            id, 
            nome, 
            username, 
            email, 
            role, 
            subscription_status
        )
        VALUES (
            v_test_user_id,
            'Usuário Teste Migração',
            'teste-migracao',
            'teste-migracao@exemplo.com',
            'user',
            'active'
        );
    END IF;

    RAISE NOTICE 'Usuário de teste ID: %', v_test_user_id;
END $$;

-- ============================================================================
-- 2. TESTAR MIGRAÇÃO DE HISTÓRICO DE PESO
-- ============================================================================

DO $$
DECLARE
    v_test_user_id UUID;
    v_result INTEGER;
BEGIN
    -- Buscar ID do usuário de teste
    SELECT id INTO v_test_user_id
    FROM auth.users
    WHERE email = 'teste-migracao@exemplo.com'
    LIMIT 1;

    IF v_test_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário de teste não encontrado';
    END IF;

    -- Testar migração de histórico de peso
    SELECT migrate_weight_history_from_local(
        v_test_user_id,
        '[
            {"date": "2025-01-20", "weight": 70.5},
            {"date": "2025-01-21", "weight": 70.3},
            {"date": "2025-01-22", "weight": 70.1},
            {"date": "2025-01-23", "weight": 69.9}
        ]'::JSONB
    ) INTO v_result;

    RAISE NOTICE 'Migração de peso: % registros inseridos/atualizados', v_result;

    -- Verificar se os dados foram inseridos
    SELECT COUNT(*) INTO v_result
    FROM public.weight_history
    WHERE user_id = v_test_user_id;

    RAISE NOTICE 'Total de registros de peso no banco: %', v_result;

    -- Testar ON CONFLICT (tentar inserir mesmo registro novamente)
    SELECT migrate_weight_history_from_local(
        v_test_user_id,
        '[
            {"date": "2025-01-20", "weight": 70.7}
        ]'::JSONB
    ) INTO v_result;

    RAISE NOTICE 'Teste ON CONFLICT: % registros processados (deve atualizar existente)', v_result;

    -- Verificar se o peso foi atualizado
    SELECT weight INTO v_result
    FROM public.weight_history
    WHERE user_id = v_test_user_id
    AND date = '2025-01-20'::DATE;

    IF v_result = 70.7 THEN
        RAISE NOTICE '✅ ON CONFLICT funcionou corretamente! Peso atualizado para 70.7';
    ELSE
        RAISE WARNING '⚠️ ON CONFLICT pode não ter funcionado. Peso esperado: 70.7, encontrado: %', v_result;
    END IF;
END $$;

-- ============================================================================
-- 3. TESTAR MIGRAÇÃO DE MENSAGENS DE CHAT
-- ============================================================================

DO $$
DECLARE
    v_test_user_id UUID;
    v_result INTEGER;
BEGIN
    -- Buscar ID do usuário de teste
    SELECT id INTO v_test_user_id
    FROM auth.users
    WHERE email = 'teste-migracao@exemplo.com'
    LIMIT 1;

    IF v_test_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário de teste não encontrado';
    END IF;

    -- Testar migração de mensagens
    SELECT migrate_chat_messages_from_local(
        v_test_user_id,
        '[
            {
                "message": "Olá, como posso perder peso?",
                "timestamp": "2025-01-20T10:00:00Z"
            },
            {
                "message": "Preciso de ajuda com minha dieta",
                "timestamp": "2025-01-20T11:00:00Z"
            },
            {
                "message": "Qual o melhor horário para treinar?",
                "timestamp": "2025-01-21T09:00:00Z"
            }
        ]'::JSONB
    ) INTO v_result;

    RAISE NOTICE 'Migração de mensagens: % mensagens inseridas', v_result;

    -- Verificar se as mensagens foram inseridas
    SELECT COUNT(*) INTO v_result
    FROM public.chat_messages
    WHERE user_id = v_test_user_id;

    RAISE NOTICE 'Total de mensagens no banco: %', v_result;
END $$;

-- ============================================================================
-- 4. RESUMO DOS TESTES
-- ============================================================================

SELECT 
    'RESUMO DOS TESTES DE MIGRAÇÃO' as categoria,
    jsonb_build_object(
        'usuario_teste', (SELECT email FROM auth.users WHERE email = 'teste-migracao@exemplo.com'),
        'registros_peso', (SELECT COUNT(*) FROM public.weight_history WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com')),
        'mensagens_chat', (SELECT COUNT(*) FROM public.chat_messages WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com')),
        'status', 'Testes concluídos'
    ) as resultado;

-- ============================================================================
-- 5. LIMPEZA (OPCIONAL - DESCOMENTAR PARA LIMPAR DADOS DE TESTE)
-- ============================================================================

-- DELETE FROM public.weight_history WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com');
-- DELETE FROM public.chat_messages WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com');
-- DELETE FROM public.users WHERE email = 'teste-migracao@exemplo.com';
-- DELETE FROM auth.users WHERE email = 'teste-migracao@exemplo.com';

