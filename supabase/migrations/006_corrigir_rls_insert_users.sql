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
-- VERIFICAR E CORRIGIR FUNÇÃO RPC
-- ============================================================================

-- Verificar se a função existe e tem SECURITY DEFINER
DO $$
DECLARE
    func_exists BOOLEAN;
    has_security_definer BOOLEAN;
BEGIN
    -- Verificar se função existe
    SELECT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'insert_user_profile_after_signup'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) INTO func_exists;
    
    IF func_exists THEN
        -- Verificar se tem SECURITY DEFINER
        SELECT prosecdef INTO has_security_definer
        FROM pg_proc
        WHERE proname = 'insert_user_profile_after_signup'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        IF NOT has_security_definer THEN
            RAISE WARNING 'Função existe mas não tem SECURITY DEFINER. Recrie a função com SECURITY DEFINER.';
        ELSE
            RAISE NOTICE '✅ Função existe e tem SECURITY DEFINER';
        END IF;
    ELSE
        RAISE WARNING 'Função insert_user_profile_after_signup não existe. Execute migration_criar_funcao_insert_user_profile.sql primeiro.';
    END IF;
END $$;

-- ============================================================================
-- RECRIAR FUNÇÃO RPC COM SECURITY DEFINER (se necessário)
-- ============================================================================

-- Verificar se a função precisa ser recriada
DO $$
DECLARE
    func_has_definer BOOLEAN;
BEGIN
    SELECT prosecdef INTO func_has_definer
    FROM pg_proc
    WHERE proname = 'insert_user_profile_after_signup'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    IF NOT func_has_definer THEN
        RAISE WARNING 'Função não tem SECURITY DEFINER. Execute migration_criar_funcao_insert_user_profile.sql para recriar.';
    END IF;
END $$;

-- ============================================================================
-- GARANTIR PERMISSÕES NA FUNÇÃO
-- ============================================================================

-- Garantir que a função tem permissões para anon e authenticated
GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, TIMESTAMPTZ
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.insert_user_profile_after_signup(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INTEGER, TIMESTAMPTZ
) TO anon;

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
    SELECT prosecdef INTO function_has_definer
    FROM pg_proc
    WHERE proname = 'insert_user_profile_after_signup'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
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
