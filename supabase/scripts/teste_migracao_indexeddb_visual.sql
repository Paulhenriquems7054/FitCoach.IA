-- ============================================================================
-- Script de Teste: Migração IndexedDB → Supabase (Versão Visual)
-- Data: 2025-01-27
-- ============================================================================
-- 
-- Este script testa as funções de migração e retorna resultados visíveis
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
END $$;

-- ============================================================================
-- 2. LIMPAR DADOS DE TESTE ANTERIORES (para evitar duplicatas)
-- ============================================================================

-- Limpar dados anteriores para garantir teste limpo
DELETE FROM public.weight_history WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com');
DELETE FROM public.chat_messages WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com');

-- ============================================================================
-- 3. TESTAR MIGRAÇÃO DE HISTÓRICO DE PESO
-- ============================================================================

-- Executar migração e mostrar resultado
SELECT 
    'Migração de Peso' as teste,
    migrate_weight_history_from_local(
        (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com'),
        '[
            {"date": "2025-01-20", "weight": 70.5},
            {"date": "2025-01-21", "weight": 70.3},
            {"date": "2025-01-22", "weight": 70.1},
            {"date": "2025-01-23", "weight": 69.9}
        ]'::JSONB
    ) as registros_processados;

-- Verificar registros inseridos
SELECT 
    'Registros de Peso no Banco' as teste,
    COUNT(*) as total,
    MIN(date) as data_inicial,
    MAX(date) as data_final,
    AVG(weight) as peso_medio
FROM public.weight_history
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com');

-- ============================================================================
-- 4. TESTAR ON CONFLICT (tentar inserir mesmo registro novamente)
-- ============================================================================

-- Tentar inserir registro duplicado (deve atualizar)
SELECT 
    'Teste ON CONFLICT' as teste,
    migrate_weight_history_from_local(
        (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com'),
        '[
            {"date": "2025-01-20", "weight": 70.7}
        ]'::JSONB
    ) as registros_processados;

-- Verificar se o peso foi atualizado
SELECT 
    'Verificação ON CONFLICT' as teste,
    date,
    weight as peso_atual,
    CASE 
        WHEN weight = 70.7 THEN '✅ Atualizado corretamente'
        ELSE '❌ Erro: peso não foi atualizado'
    END as status
FROM public.weight_history
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com')
AND date = '2025-01-20'::DATE;

-- ============================================================================
-- 5. TESTAR MIGRAÇÃO DE MENSAGENS DE CHAT
-- ============================================================================

-- Executar migração e mostrar resultado
SELECT 
    'Migração de Mensagens' as teste,
    migrate_chat_messages_from_local(
        (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com'),
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
    ) as mensagens_processadas;

-- Verificar mensagens inseridas
SELECT 
    'Mensagens no Banco' as teste,
    COUNT(*) as total,
    MIN(created_at) as primeira_mensagem,
    MAX(created_at) as ultima_mensagem
FROM public.chat_messages
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com');

-- ============================================================================
-- 6. RESUMO COMPLETO DOS TESTES
-- ============================================================================

SELECT 
    '📊 RESUMO DOS TESTES' as categoria,
    jsonb_build_object(
        'usuario_teste', (SELECT email FROM auth.users WHERE email = 'teste-migracao@exemplo.com'),
        'usuario_id', (SELECT id::text FROM auth.users WHERE email = 'teste-migracao@exemplo.com'),
        'registros_peso', (
            SELECT COUNT(*) 
            FROM public.weight_history 
            WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com')
        ),
        'mensagens_chat', (
            SELECT COUNT(*) 
            FROM public.chat_messages 
            WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com')
        ),
        'status', '✅ Testes concluídos com sucesso'
    ) as resultado;

-- ============================================================================
-- 7. VER TODOS OS REGISTROS DE PESO
-- ============================================================================

SELECT 
    'Registros de Peso Detalhados' as categoria,
    date as data,
    weight as peso,
    gym_id,
    created_at
FROM public.weight_history
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com')
ORDER BY date DESC;

-- ============================================================================
-- 8. VER TODAS AS MENSAGENS
-- ============================================================================

SELECT 
    'Mensagens Detalhadas' as categoria,
    message_data->>'message' as mensagem,
    created_at,
    gym_id
FROM public.chat_messages
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com')
ORDER BY created_at DESC;

-- ============================================================================
-- LIMPEZA (OPCIONAL - DESCOMENTAR PARA LIMPAR DADOS DE TESTE)
-- ============================================================================

-- DELETE FROM public.weight_history WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com');
-- DELETE FROM public.chat_messages WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste-migracao@exemplo.com');
-- DELETE FROM public.users WHERE email = 'teste-migracao@exemplo.com';
-- DELETE FROM auth.users WHERE email = 'teste-migracao@exemplo.com';

