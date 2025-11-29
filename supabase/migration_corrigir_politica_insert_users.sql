-- Migration: Corrigir política de INSERT para permitir criação de perfil após signup
-- Data: 2025-01-27
-- Descrição: Ajusta a política de INSERT para permitir que usuários criem seu próprio perfil após signup

-- ============================================================================
-- REMOVER POLÍTICA DE INSERT ATUAL
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- ============================================================================
-- RECRIAR POLÍTICA DE INSERT (SIMPLIFICADA E MAIS ROBUSTA)
-- ============================================================================

-- Política que permite inserção do próprio perfil
-- IMPORTANTE: Esta política permite que usuários criem seu próprio perfil
-- após fazer signup no Supabase Auth
-- A verificação auth.uid() = id garante que o usuário só pode criar seu próprio perfil
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (
        -- Permitir se o id corresponde ao usuário autenticado
        -- Isso permite que o usuário crie seu perfil logo após signup
        auth.uid() = id
    );

-- ============================================================================
-- VERIFICAÇÃO E DIAGNÓSTICO
-- ============================================================================

DO $$
DECLARE
    insert_policy_exists BOOLEAN;
    rls_enabled BOOLEAN;
BEGIN
    -- Verificar se a política existe
    SELECT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'users'
        AND policyname = 'Users can insert own profile'
    ) INTO insert_policy_exists;
    
    -- Verificar se RLS está habilitado
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'users'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verificação de Política de INSERT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS habilitado na tabela users: %', rls_enabled;
    RAISE NOTICE 'Política "Users can insert own profile" existe: %', insert_policy_exists;
    
    IF insert_policy_exists AND rls_enabled THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ Política de INSERT configurada corretamente';
        RAISE NOTICE '✅ Usuários podem criar seu próprio perfil após signup';
        RAISE NOTICE '';
        RAISE NOTICE 'NOTA: Se ainda houver problemas, verifique:';
        RAISE NOTICE '1. Se o usuário está autenticado após signup';
        RAISE NOTICE '2. Se o id do usuário corresponde a auth.uid()';
        RAISE NOTICE '3. Se há outras políticas conflitantes';
    ELSE
        RAISE WARNING '⚠️ Configuração incompleta!';
        IF NOT rls_enabled THEN
            RAISE WARNING '   - RLS não está habilitado na tabela users';
        END IF;
        IF NOT insert_policy_exists THEN
            RAISE WARNING '   - Política de INSERT não foi criada';
        END IF;
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- Comentário
COMMENT ON POLICY "Users can insert own profile" ON public.users IS 
'Permite que usuários criem seu próprio perfil na tabela users após fazer signup no Supabase Auth. A verificação auth.uid() = id garante que o usuário só pode criar seu próprio perfil.';
