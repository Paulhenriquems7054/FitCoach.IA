-- Migration: Corrigir RLS para permitir inserção via função RPC
-- Data: 2026-01-18
-- Descrição: Garante que a função RPC possa inserir na tabela users mesmo com RLS habilitado

-- ============================================================================
-- VERIFICAR E CORRIGIR POLÍTICA DE INSERT
-- ============================================================================

-- Remover política existente se houver
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Criar política que permite inserção do próprio perfil
-- IMPORTANTE: Esta política permite que usuários criem seu próprio perfil
-- após fazer signup no Supabase Auth
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (
        -- Permitir se o id corresponde ao usuário autenticado
        auth.uid() = id
    );

-- ============================================================================
-- CRIAR OU RECRIAR FUNÇÃO RPC COM SECURITY DEFINER
-- ============================================================================

-- Remover TODAS as versões existentes da função (com diferentes assinaturas)
-- Isso garante que não haverá conflito ao criar a nova versão
DO $$ 
DECLARE
    func_sig TEXT;
BEGIN
    -- Encontrar e remover todas as funções com este nome
    FOR func_sig IN 
        SELECT pg_get_function_identity_arguments(oid)
        FROM pg_proc 
        WHERE proname = 'insert_user_profile_after_signup'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.insert_user_profile_after_signup(%s) CASCADE', func_sig);
    END LOOP;
END $$;

-- Criar a função RPC com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.insert_user_profile_after_signup(
    p_user_id UUID,
    p_nome TEXT,
    p_username TEXT,
    p_plan_type TEXT DEFAULT 'free',
    p_subscription_status TEXT DEFAULT 'active',
    p_user_data JSONB DEFAULT '{}'::JSONB,
    p_email TEXT DEFAULT NULL,
    p_voice_daily_limit_seconds INTEGER DEFAULT 900,
    p_expiry_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(result_id UUID, result_nome TEXT, result_username TEXT) AS $$
DECLARE
    inserted_id UUID;
    inserted_nome TEXT;
    inserted_username TEXT;
    auth_user_exists BOOLEAN;
    retry_count INTEGER := 0;
    max_retries INTEGER := 5;
    retry_delay INTEGER := 200; -- 200ms entre tentativas
BEGIN
    -- Tentar inserir com retry para lidar com timing issues
    -- O usuário pode não estar disponível imediatamente em auth.users após signup
    LOOP
        -- Verificar se o usuário existe em auth.users
        SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO auth_user_exists;
        
        -- Se o usuário existe, tentar inserir
        IF auth_user_exists THEN
            BEGIN
                -- Inserir perfil do usuário
                -- Esta função usa SECURITY DEFINER para bypass RLS
                -- IMPORTANTE: SECURITY DEFINER faz a função executar com os privilégios do criador,
                -- permitindo que ela ignore as políticas RLS
                INSERT INTO public.users (
                    id,
                    nome,
                    username,
                    email,
                    plan_type,
                    subscription_status,
                    expiry_date,
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
                    voice_daily_limit_seconds,
                    voice_used_today_seconds,
                    voice_balance_upsell,
                    text_msg_count_today,
                    created_at,
                    updated_at
                ) VALUES (
                    p_user_id,
                    p_nome,
                    p_username,
                    p_email,
                    p_plan_type::TEXT,  -- plan_type é TEXT com CHECK constraint
                    p_subscription_status::TEXT,  -- subscription_status é TEXT com CHECK constraint
                    p_expiry_date,
                    COALESCE((p_user_data->>'idade')::INTEGER, 0),
                    COALESCE((p_user_data->>'genero')::TEXT, 'Masculino'),
                    COALESCE((p_user_data->>'peso')::NUMERIC, 0),
                    COALESCE((p_user_data->>'altura')::NUMERIC, 0),
                    COALESCE((p_user_data->>'objetivo')::TEXT, 'perder peso'),
                    COALESCE((p_user_data->>'points')::INTEGER, 0),
                    COALESCE((p_user_data->>'disciplineScore')::INTEGER, 0),
                    CASE 
                        WHEN p_user_data->>'completedChallengeIds' IS NULL OR p_user_data->>'completedChallengeIds' = '[]' OR p_user_data->>'completedChallengeIds' = '' THEN ARRAY[]::TEXT[]
                        WHEN jsonb_typeof(p_user_data->'completedChallengeIds') = 'array' THEN 
                            ARRAY(SELECT jsonb_array_elements_text(p_user_data->'completedChallengeIds'))
                        ELSE ARRAY[]::TEXT[]
                    END,
                    COALESCE((p_user_data->>'isAnonymized')::BOOLEAN, false),
                    COALESCE((p_user_data->>'role')::TEXT, 'user'),
                    p_voice_daily_limit_seconds,
                    0,  -- voice_used_today_seconds
                    0,  -- voice_balance_upsell
                    0,  -- text_msg_count_today
                    NOW(),
                    NOW()
                )
                ON CONFLICT (id) DO NOTHING
                RETURNING 
                    public.users.id,
                    public.users.nome,
                    public.users.username
                INTO inserted_id, inserted_nome, inserted_username;
                
                -- Se inserted_id é NULL, significa que o registro já existe (ON CONFLICT DO NOTHING)
                -- Nesse caso, buscar o registro existente
                IF inserted_id IS NULL THEN
                    SELECT id, nome, username 
                    INTO inserted_id, inserted_nome, inserted_username
                    FROM public.users
                    WHERE id = p_user_id;
                END IF;
                
                -- Se chegou aqui, a inserção foi bem-sucedida ou o registro já existe
                -- Retornar os valores
                IF inserted_id IS NOT NULL THEN
                    RETURN QUERY SELECT inserted_id, inserted_nome, inserted_username;
                    EXIT; -- Sair do loop
                ELSE
                    -- Se ainda não temos o ID, pode ser problema de RLS ou timing
                    -- Tentar novamente
                    IF retry_count < max_retries THEN
                        retry_count := retry_count + 1;
                        PERFORM pg_sleep(retry_delay / 1000.0);
                        CONTINUE;
                    ELSE
                        RAISE EXCEPTION 'Não foi possível criar ou recuperar o perfil do usuário após % tentativas.', max_retries;
                    END IF;
                END IF;
            EXCEPTION
                WHEN foreign_key_violation THEN
                    -- Se for erro de foreign key, aguardar e tentar novamente
                    IF retry_count < max_retries THEN
                        retry_count := retry_count + 1;
                        PERFORM pg_sleep(retry_delay / 1000.0); -- Converter ms para segundos
                        CONTINUE; -- Tentar novamente
                    ELSE
                        RAISE EXCEPTION 'Usuário com ID % não existe em auth.users após % tentativas. Aguarde a conclusão do cadastro antes de criar o perfil.', p_user_id, max_retries;
                    END IF;
                WHEN OTHERS THEN
                    -- Para outros erros, relançar
                    RAISE;
            END;
        ELSE
            -- Usuário ainda não existe em auth.users
            IF retry_count < max_retries THEN
                retry_count := retry_count + 1;
                PERFORM pg_sleep(retry_delay / 1000.0); -- Converter ms para segundos
                CONTINUE; -- Tentar novamente
            ELSE
                RAISE EXCEPTION 'Usuário com ID % não existe em auth.users após % tentativas. Aguarde a conclusão do cadastro antes de criar o perfil.', p_user_id, max_retries;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GARANTIR PERMISSÕES NA FUNÇÃO
-- ============================================================================

-- Permitir que usuários autenticados executem a função
GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, TIMESTAMPTZ
) TO authenticated;

-- Permitir que usuários anônimos executem a função (necessário durante signup)
GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, TIMESTAMPTZ
) TO anon;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.insert_user_profile_after_signup IS 
'Insere perfil de usuário após signup. Usa SECURITY DEFINER para bypass RLS. 
Útil quando confirmação de email está habilitada e a sessão não está disponível imediatamente após signup.
Parâmetros:
- p_user_id: UUID do usuário (deve corresponder a auth.uid())
- p_nome: Nome do usuário
- p_username: Nome de usuário único
- p_plan_type: Tipo de plano (default: free)
- p_subscription_status: Status da assinatura (default: active)
- p_user_data: JSONB com dados adicionais (idade, genero, peso, altura, objetivo, points, disciplineScore, completedChallengeIds, isAnonymized, role)
- p_email: Email do usuário (opcional)
- p_voice_daily_limit_seconds: Limite diário de voz em segundos (default: 900)
- p_expiry_date: Data de expiração do plano (opcional)';

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
    insert_policy_count INTEGER;
    rpc_policy_count INTEGER;
    rls_enabled BOOLEAN;
    function_has_definer BOOLEAN;
BEGIN
    -- Contar políticas de INSERT
    SELECT COUNT(*) INTO insert_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'users'
    AND cmd = 'INSERT';
    
    -- Verificar se RLS está habilitado
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'users'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    -- Verificar função
    SELECT COALESCE(prosecdef, false) INTO function_has_definer
    FROM pg_proc
    WHERE proname = 'insert_user_profile_after_signup'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LIMIT 1;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verificação de Configuração RLS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS habilitado: %', rls_enabled;
    RAISE NOTICE 'Políticas de INSERT: %', insert_policy_count;
    RAISE NOTICE 'Função tem SECURITY DEFINER: %', CASE WHEN function_has_definer THEN 'SIM' ELSE 'NÃO' END;
    RAISE NOTICE '========================================';
    
    IF insert_policy_count >= 1 AND rls_enabled THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ Configuração parece correta';
        RAISE NOTICE '✅ Políticas de INSERT configuradas';
        IF function_has_definer THEN
            RAISE NOTICE '✅ Função RPC tem SECURITY DEFINER';
            RAISE NOTICE '';
            RAISE NOTICE 'NOTA: Se ainda houver erro 42501, verifique:';
            RAISE NOTICE '1. Se o usuário está autenticado (auth.uid() não é NULL)';
            RAISE NOTICE '2. Se o id passado para a função corresponde a auth.uid()';
            RAISE NOTICE '3. Se há outras políticas RLS conflitantes';
        ELSE
            RAISE WARNING '⚠️ Função RPC não tem SECURITY DEFINER - execute migration_criar_funcao_insert_user_profile.sql';
        END IF;
    ELSE
        RAISE WARNING '⚠️ Configuração incompleta!';
    END IF;
END $$;

-- Comentário
COMMENT ON POLICY "Users can insert own profile" ON public.users IS 
'Permite que usuários criem seu próprio perfil na tabela users após fazer signup no Supabase Auth. A função RPC insert_user_profile_after_signup usa SECURITY DEFINER para bypassar RLS.';
