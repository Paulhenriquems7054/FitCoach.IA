-- Script para testar a função RPC manualmente
-- Execute este script no SQL Editor do Supabase para testar a função

-- Substitua o UUID abaixo por um UUID válido do seu auth.users
-- Ou use um UUID de teste temporário
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000000';
    test_result RECORD;
BEGIN
    -- Testar a função com valores de exemplo
    SELECT * INTO test_result
    FROM insert_user_profile_after_signup(
        p_user_id => test_user_id,
        p_nome => 'Usuário Teste',
        p_username => 'usuario_teste',
        p_plan_type => 'free',
        p_subscription_status => 'active',
        p_user_data => '{"idade": 25, "genero": "Masculino", "peso": 75, "altura": 175, "objetivo": "perder peso", "points": 0, "disciplineScore": 0, "completedChallengeIds": [], "isAnonymized": false, "role": "user"}'::jsonb,
        p_email => 'teste@exemplo.com',
        p_voice_daily_limit_seconds => 900,
        p_expiry_date => NULL
    );
    
    RAISE NOTICE 'Resultado: id=%, nome=%, username=%', test_result.result_id, test_result.result_nome, test_result.result_username;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao executar função: % - %', SQLSTATE, SQLERRM;
END $$;

-- Para testar com um UUID real, primeiro crie um usuário de teste no auth:
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--     gen_random_uuid(),
--     'teste@exemplo.com',
--     crypt('senha123', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW()
-- )
-- RETURNING id;

