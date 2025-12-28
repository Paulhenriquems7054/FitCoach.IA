-- Script para testar a função RPC manualmente
-- Execute este script no SQL Editor do Supabase para testar se a função funciona

-- IMPORTANTE: Substitua os valores pelos dados reais antes de executar
-- Você precisa de um UUID válido de um usuário do auth.users

-- Exemplo de teste (substitua pelos valores reais):
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID; -- SUBSTITUA pelo UUID real
    test_result RECORD;
BEGIN
    -- Testar a função
    SELECT * INTO test_result
    FROM insert_user_profile_after_signup(
        test_user_id,                                    -- p_user_id
        'Nome Teste',                                    -- p_nome
        'usuario_teste_' || extract(epoch from now()),  -- p_username (único)
        'free',                                          -- p_plan_type
        'active',                                        -- p_subscription_status
        '{"idade": 25, "genero": "Masculino", "peso": 70, "altura": 175, "objetivo": "perder peso", "points": 0, "disciplineScore": 0, "completedChallengeIds": [], "isAnonymized": false, "role": "user"}'::JSONB,  -- p_user_data
        'teste@exemplo.com',                             -- p_email
        900,                                             -- p_voice_daily_limit_seconds
        NULL                                             -- p_expiry_date
    );
    
    RAISE NOTICE '✅ Função executada com sucesso!';
    RAISE NOTICE 'ID retornado: %', test_result.result_id;
    RAISE NOTICE 'Nome retornado: %', test_result.result_nome;
    RAISE NOTICE 'Username retornado: %', test_result.result_username;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Erro ao executar função: %', SQLERRM;
        RAISE WARNING 'Código do erro: %', SQLSTATE;
END $$;

-- Verificar se o registro foi criado
-- SELECT * FROM users WHERE username LIKE 'usuario_teste_%' ORDER BY created_at DESC LIMIT 1;

