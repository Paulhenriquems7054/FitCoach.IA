-- ============================================================================
-- Migration: Criar Sistema de Ativação de Academias
-- Data: Dezembro 2025
-- Descrição: Cria tabelas e campos necessários para sistema de códigos de ativação
-- ============================================================================
-- 
-- ⚠️ IMPORTANTE:
-- Esta migração pode ser executada MESMO SE a tabela academy_subscriptions
-- não existir ainda. Ela verifica a existência antes de tentar alterar.
-- 
-- Se a tabela academy_subscriptions não existir:
-- - A tabela student_academy_links será criada (sem foreign key)
-- - Os campos licenses_used e activation_code serão adicionados quando
--   a tabela academy_subscriptions for criada pelo webhook
-- 
-- RECOMENDAÇÃO:
-- 1. Execute esta migração AGORA (não dará erro)
-- 2. Quando uma academia comprar um plano, o webhook criará academy_subscriptions
-- 3. Execute esta migração NOVAMENTE para adicionar os campos na tabela criada
-- 
-- INSTRUÇÕES:
-- 1. Copie TODO este conteúdo
-- 2. Cole no SQL Editor do Supabase
-- 3. Execute a query
-- ============================================================================

-- 1. Adicionar campo licenses_used na tabela academy_subscriptions (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'academy_subscriptions'
    ) THEN
        -- Adicionar coluna licenses_used se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions' 
            AND column_name = 'licenses_used'
        ) THEN
            ALTER TABLE public.academy_subscriptions
            ADD COLUMN licenses_used INTEGER DEFAULT 0;
            
            COMMENT ON COLUMN public.academy_subscriptions.licenses_used IS 
            'Quantidade de licenças já utilizadas (alunos que ativaram o código)';
            
            RAISE NOTICE '✅ Coluna licenses_used adicionada em academy_subscriptions';
        ELSE
            RAISE NOTICE 'ℹ️ Coluna licenses_used já existe em academy_subscriptions';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela academy_subscriptions não existe ainda. Será criada pelo webhook na primeira compra.';
        RAISE NOTICE '⚠️ Execute esta migração novamente após a primeira compra de academia.';
    END IF;
END $$;

-- 2. Adicionar campo activation_code na tabela academy_subscriptions (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'academy_subscriptions'
    ) THEN
        -- Adicionar coluna activation_code se não existir
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions' 
            AND column_name = 'activation_code'
        ) THEN
            ALTER TABLE public.academy_subscriptions
            ADD COLUMN activation_code TEXT UNIQUE;
            
            COMMENT ON COLUMN public.academy_subscriptions.activation_code IS 
            'Código único de ativação gerado automaticamente pela Edge Function (ex: ACADEMIA-XYZ123)';
            
            RAISE NOTICE '✅ Coluna activation_code adicionada em academy_subscriptions';
        ELSE
            RAISE NOTICE 'ℹ️ Coluna activation_code já existe em academy_subscriptions';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela academy_subscriptions não existe ainda. Será criada pelo webhook na primeira compra.';
        RAISE NOTICE '⚠️ Execute esta migração novamente após a primeira compra de academia.';
    END IF;
END $$;

-- 3. Criar tabela student_academy_links (sem foreign key se academy_subscriptions não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_academy_links'
    ) THEN
        -- Criar tabela sem foreign key primeiro (será adicionada depois)
        CREATE TABLE public.student_academy_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_user_id UUID NOT NULL,
          academy_subscription_id UUID NOT NULL,
          activation_code TEXT NOT NULL,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired')),
          activated_at TIMESTAMPTZ DEFAULT now(),
          blocked_at TIMESTAMPTZ
        );
        
        -- Adicionar foreign key apenas se academy_subscriptions existir
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions'
        ) THEN
            -- Verificar se a constraint já existe
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.table_constraints 
                WHERE table_schema = 'public' 
                AND table_name = 'student_academy_links'
                AND constraint_name = 'student_academy_links_academy_subscription_id_fkey'
            ) THEN
                ALTER TABLE public.student_academy_links
                ADD CONSTRAINT student_academy_links_academy_subscription_id_fkey
                FOREIGN KEY (academy_subscription_id) 
                REFERENCES public.academy_subscriptions(id) 
                ON DELETE CASCADE;
                
                RAISE NOTICE '✅ Foreign key adicionada em student_academy_links';
            END IF;
        END IF;
        
        RAISE NOTICE '✅ Tabela student_academy_links criada';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela student_academy_links já existe';
        
        -- Verificar se a foreign key existe, se não existir e a tabela academy_subscriptions existir, adicionar
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'academy_subscriptions'
        ) THEN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.table_constraints 
                WHERE table_schema = 'public' 
                AND table_name = 'student_academy_links'
                AND constraint_name = 'student_academy_links_academy_subscription_id_fkey'
            ) THEN
                ALTER TABLE public.student_academy_links
                ADD CONSTRAINT student_academy_links_academy_subscription_id_fkey
                FOREIGN KEY (academy_subscription_id) 
                REFERENCES public.academy_subscriptions(id) 
                ON DELETE CASCADE;
                
                RAISE NOTICE '✅ Foreign key adicionada em student_academy_links (tabela já existia)';
            END IF;
        END IF;
    END IF;
END $$;

COMMENT ON TABLE public.student_academy_links IS 
'Vincula alunos que ativaram código da academia. Um aluno pode estar vinculado a apenas uma academia por vez.';

COMMENT ON COLUMN public.student_academy_links.student_user_id IS 
'ID do usuário (aluno) que ativou o código';

COMMENT ON COLUMN public.student_academy_links.academy_subscription_id IS 
'Referência à assinatura da academia';

COMMENT ON COLUMN public.student_academy_links.activation_code IS 
'Código usado para ativar (mesmo código da academy_subscriptions)';

COMMENT ON COLUMN public.student_academy_links.status IS 
'Status do vínculo: active (ativo), blocked (bloqueado pela academia), expired (expirado)';

-- 4. Criar índices para performance (apenas se a tabela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_academy_links'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_student_academy_links_user 
          ON public.student_academy_links(student_user_id);

        CREATE INDEX IF NOT EXISTS idx_student_academy_links_academy 
          ON public.student_academy_links(academy_subscription_id);

        CREATE INDEX IF NOT EXISTS idx_student_academy_links_status 
          ON public.student_academy_links(status);
        
        RAISE NOTICE '✅ Índices criados em student_academy_links';
    END IF;
END $$;

-- Criar índice em academy_subscriptions apenas se a tabela existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'academy_subscriptions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename = 'academy_subscriptions' 
            AND indexname = 'idx_academy_subscriptions_code'
        ) THEN
            CREATE INDEX idx_academy_subscriptions_code 
            ON public.academy_subscriptions(activation_code) 
            WHERE activation_code IS NOT NULL;
            
            RAISE NOTICE '✅ Índice idx_academy_subscriptions_code criado';
        ELSE
            RAISE NOTICE 'ℹ️ Índice idx_academy_subscriptions_code já existe';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela academy_subscriptions não existe. Índice será criado quando a tabela for criada.';
    END IF;
END $$;

-- 5. Habilitar RLS (Row Level Security) - apenas se a tabela existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_academy_links'
    ) THEN
        ALTER TABLE public.student_academy_links ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado em student_academy_links';
    END IF;
END $$;

-- 6. Políticas RLS para student_academy_links (apenas se a tabela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_academy_links'
    ) THEN
        -- Usuários podem ver seus próprios vínculos
        DROP POLICY IF EXISTS "Users can view own academy links" ON public.student_academy_links;
        CREATE POLICY "Users can view own academy links"
          ON public.student_academy_links
          FOR SELECT
          USING (auth.uid() = student_user_id);

        -- Usuários podem criar seus próprios vínculos (ao ativar código)
        DROP POLICY IF EXISTS "Users can create own academy links" ON public.student_academy_links;
        CREATE POLICY "Users can create own academy links"
          ON public.student_academy_links
          FOR INSERT
          WITH CHECK (auth.uid() = student_user_id);

        -- Service role pode fazer tudo (para Edge Functions)
        DROP POLICY IF EXISTS "Service role can manage academy links" ON public.student_academy_links;
        CREATE POLICY "Service role can manage academy links"
          ON public.student_academy_links
          FOR ALL
          USING (auth.jwt() ->> 'role' = 'service_role');
        
        RAISE NOTICE '✅ Políticas RLS criadas em student_academy_links';
    END IF;
END $$;

-- 7. Função para verificar se há licenças disponíveis
-- Nota: A função será criada mesmo se a tabela não existir.
-- Ela só será usada quando a tabela existir, então não há problema.
CREATE OR REPLACE FUNCTION public.check_available_licenses(
  p_academy_subscription_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_max_licenses INTEGER;
  v_licenses_used INTEGER;
BEGIN
  -- Verificar se a tabela existe antes de tentar acessar
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'academy_subscriptions'
  ) THEN
    RETURN FALSE;
  END IF;
  
  SELECT max_licenses, licenses_used
  INTO v_max_licenses, v_licenses_used
  FROM public.academy_subscriptions
  WHERE id = p_academy_subscription_id;
  
  IF v_max_licenses IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN v_licenses_used < v_max_licenses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_available_licenses IS 
'Verifica se há licenças disponíveis para uma assinatura de academia';

-- 8. Verificação final
DO $$
DECLARE
  v_licenses_column_exists BOOLEAN;
  v_activation_code_column_exists BOOLEAN;
  v_table_exists BOOLEAN;
BEGIN
  -- Verificar se coluna licenses_used existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'academy_subscriptions' 
    AND column_name = 'licenses_used'
  ) INTO v_licenses_column_exists;
  
  -- Verificar se coluna activation_code existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'academy_subscriptions' 
    AND column_name = 'activation_code'
  ) INTO v_activation_code_column_exists;
  
  -- Verificar se tabela student_academy_links existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'student_academy_links'
  ) INTO v_table_exists;
  
  IF v_licenses_column_exists THEN
    RAISE NOTICE '✅ Coluna licenses_used criada/verificada';
  ELSE
    RAISE WARNING '⚠️ Coluna licenses_used não encontrada';
  END IF;
  
  IF v_activation_code_column_exists THEN
    RAISE NOTICE '✅ Coluna activation_code criada/verificada';
  ELSE
    RAISE WARNING '⚠️ Coluna activation_code não encontrada';
  END IF;
  
  IF v_table_exists THEN
    RAISE NOTICE '✅ Tabela student_academy_links criada/verificada';
  ELSE
    RAISE WARNING '⚠️ Tabela student_academy_links não encontrada';
  END IF;
END $$;

