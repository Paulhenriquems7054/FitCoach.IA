-- Migration: Criar função para inserir perfil de usuário após signup
-- Data: 2025-01-27
-- Descrição: Função SQL que permite inserir perfil de usuário mesmo sem sessão ativa
--            Útil quando confirmação de email está habilitada no Supabase

-- ============================================================================
-- FUNÇÃO PARA INSERIR PERFIL DE USUÁRIO (SECURITY DEFINER)
-- ============================================================================

-- Remover função existente se houver (para permitir mudança de tipo de retorno)
DROP FUNCTION IF EXISTS public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB
);

CREATE OR REPLACE FUNCTION public.insert_user_profile_after_signup(
    p_user_id UUID,
    p_nome TEXT,
    p_username TEXT,
    p_plan_type TEXT DEFAULT 'free',
    p_subscription_status TEXT DEFAULT 'active',
    p_user_data JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(result_id UUID, result_nome TEXT, result_username TEXT) AS $$
DECLARE
    inserted_id UUID;
    inserted_nome TEXT;
    inserted_username TEXT;
BEGIN
    -- Inserir perfil do usuário
    -- Esta função usa SECURITY DEFINER para bypass RLS
    INSERT INTO public.users (
        id,
        nome,
        username,
        plan_type,
        subscription_status,
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
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_nome,
        p_username,
        p_plan_type::TEXT,  -- plan_type é TEXT com CHECK constraint
        p_subscription_status::TEXT,  -- subscription_status é TEXT com CHECK constraint
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
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING 
        public.users.id,
        public.users.nome,
        public.users.username
    INTO inserted_id, inserted_nome, inserted_username;
    
    -- Retornar os valores
    RETURN QUERY SELECT inserted_id, inserted_nome, inserted_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.insert_user_profile_after_signup IS 
'Insere perfil de usuário após signup. Usa SECURITY DEFINER para bypass RLS. 
Útil quando confirmação de email está habilitada e a sessão não está disponível imediatamente após signup.';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'insert_user_profile_after_signup'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ Função insert_user_profile_after_signup criada com sucesso';
    ELSE
        RAISE WARNING '⚠️ Função não foi criada corretamente';
    END IF;
END $$;

