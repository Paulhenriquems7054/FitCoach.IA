-- ============================================================================
-- Migration: Criar Sistema de Ativação de Academias
-- Data: Dezembro 2025
-- Descrição: Cria tabelas e campos necessários para sistema de códigos de ativação
-- ============================================================================

-- 1. Adicionar campo licenses_used na tabela academy_subscriptions
ALTER TABLE public.academy_subscriptions
ADD COLUMN IF NOT EXISTS licenses_used INTEGER DEFAULT 0;

COMMENT ON COLUMN public.academy_subscriptions.licenses_used IS 
'Quantidade de licenças já utilizadas (alunos que ativaram o código)';

-- 2. Adicionar campo activation_code na tabela academy_subscriptions (se não existir)
DO $$
BEGIN
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
    END IF;
END $$;

-- 3. Criar tabela student_academy_links
CREATE TABLE IF NOT EXISTS public.student_academy_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL,
  academy_subscription_id UUID NOT NULL,
  activation_code TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired')),
  activated_at TIMESTAMPTZ DEFAULT now(),
  blocked_at TIMESTAMPTZ,
  FOREIGN KEY (academy_subscription_id) REFERENCES public.academy_subscriptions(id) ON DELETE CASCADE
);

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

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_student_academy_links_user 
  ON public.student_academy_links(student_user_id);

CREATE INDEX IF NOT EXISTS idx_student_academy_links_academy 
  ON public.student_academy_links(academy_subscription_id);

CREATE INDEX IF NOT EXISTS idx_student_academy_links_status 
  ON public.student_academy_links(status);

CREATE INDEX IF NOT EXISTS idx_academy_subscriptions_code 
  ON public.academy_subscriptions(activation_code) 
  WHERE activation_code IS NOT NULL;

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.student_academy_links ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para student_academy_links
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

-- 7. Função para verificar se há licenças disponíveis
CREATE OR REPLACE FUNCTION public.check_available_licenses(
  p_academy_subscription_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_max_licenses INTEGER;
  v_licenses_used INTEGER;
BEGIN
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

