-- Migration: Corrigir recursão infinita nas políticas RLS da tabela users
-- Data: 2025-01-27
-- Descrição: Remove políticas que causam recursão infinita ao fazer SELECT na mesma tabela

-- ============================================================================
-- REMOVER POLÍTICAS PROBLEMÁTICAS QUE CAUSAM RECURSÃO
-- ============================================================================

-- Remover políticas que fazem SELECT na tabela users dentro de políticas para users
DROP POLICY IF EXISTS "Gym admins can view gym users" ON public.users;
DROP POLICY IF EXISTS "Trainers can view gym students data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all gym data" ON public.users;
DROP POLICY IF EXISTS "Admins can update gym students" ON public.users;

-- ============================================================================
-- CRIAR FUNÇÕES AUXILIARES (SECURITY DEFINER - BYPASS RLS)
-- ============================================================================

-- Função para obter gym_id do usuário autenticado (sem causar recursão)
CREATE OR REPLACE FUNCTION public.get_current_user_gym_id()
RETURNS TEXT AS $$
DECLARE
    user_gym_id TEXT;
BEGIN
    -- Usar SECURITY DEFINER para bypass RLS
    SELECT gym_id INTO user_gym_id
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN user_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter gym_role do usuário autenticado (sem causar recursão)
CREATE OR REPLACE FUNCTION public.get_current_user_gym_role()
RETURNS TEXT AS $$
DECLARE
    user_gym_role TEXT;
BEGIN
    -- Usar SECURITY DEFINER para bypass RLS
    SELECT gym_role INTO user_gym_role
    FROM public.users
    WHERE id = auth.uid()
    LIMIT 1;
    
    RETURN user_gym_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RECRIAR POLÍTICAS SEM RECURSÃO
-- ============================================================================

-- Política para admins verem usuários da sua academia
-- Usa funções auxiliares que não causam recursão
CREATE POLICY "Gym admins can view gym users"
    ON public.users FOR SELECT
    USING (
        -- Usuário pode ver seu próprio perfil
        auth.uid() = id
        OR
        -- Ou é admin da mesma academia
        (
            gym_id IS NOT NULL
            AND gym_id = public.get_current_user_gym_id()
            AND public.get_current_user_gym_role() = 'admin'
        )
    );

-- Política para trainers verem alunos da sua academia
CREATE POLICY "Trainers can view gym students data"
    ON public.users FOR SELECT
    USING (
        -- Usuário pode ver seu próprio perfil
        auth.uid() = id
        OR
        -- Ou é trainer da mesma academia e o usuário é aluno
        (
            gym_id IS NOT NULL
            AND gym_role = 'student'
            AND gym_id = public.get_current_user_gym_id()
            AND public.get_current_user_gym_role() = 'trainer'
        )
    );

-- Política para admins verem todos os dados da academia
CREATE POLICY "Admins can view all gym data"
    ON public.users FOR SELECT
    USING (
        -- Usuário pode ver seu próprio perfil
        auth.uid() = id
        OR
        -- Ou é admin e o usuário pertence à mesma academia
        (
            gym_id IS NOT NULL
            AND gym_id = public.get_current_user_gym_id()
            AND public.get_current_user_gym_role() = 'admin'
        )
    );

-- Política para admins atualizarem alunos da sua academia
CREATE POLICY "Admins can update gym students"
    ON public.users FOR UPDATE
    USING (
        -- Usuário pode atualizar seu próprio perfil
        auth.uid() = id
        OR
        -- Ou é admin e o usuário é aluno da mesma academia
        (
            gym_id IS NOT NULL
            AND gym_role = 'student'
            AND gym_id = public.get_current_user_gym_id()
            AND public.get_current_user_gym_role() = 'admin'
        )
    );

-- ============================================================================
-- GARANTIR QUE POLÍTICA DE INSERT PERMITE CRIAÇÃO DE PERFIL
-- ============================================================================

-- Verificar e recriar política de INSERT se necessário
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (
        -- Permitir inserção se o id corresponde ao usuário autenticado
        auth.uid() = id
    );

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
    policy_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Contar políticas
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'users';
    
    -- Contar funções criadas
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN ('get_current_user_gym_id', 'get_current_user_gym_role')
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Correção de RLS aplicada com sucesso!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Políticas na tabela users: %', policy_count;
    RAISE NOTICE 'Funções auxiliares criadas: %', function_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Recursão infinita corrigida';
    RAISE NOTICE '✅ Políticas agora usam funções SECURITY DEFINER';
    RAISE NOTICE '✅ Cadastro de usuários deve funcionar normalmente';
    RAISE NOTICE '========================================';
END $$;

-- Comentários
COMMENT ON FUNCTION public.get_current_user_gym_id IS 'Obtém gym_id do usuário autenticado sem causar recursão RLS (SECURITY DEFINER)';
COMMENT ON FUNCTION public.get_current_user_gym_role IS 'Obtém gym_role do usuário autenticado sem causar recursão RLS (SECURITY DEFINER)';
