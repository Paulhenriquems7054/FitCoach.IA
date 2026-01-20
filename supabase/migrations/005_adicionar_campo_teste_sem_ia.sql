-- ============================================
-- MIGRATION: Adicionar Campo de Teste SEM IA
-- Data: 2026-01-18
-- Objetivo: Adicionar campo para rastrear teste SEM IA e bloquear após 3 dias
-- ============================================

-- Adicionar coluna para data de início do teste SEM IA
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS teste_sem_ia_inicio TIMESTAMP WITH TIME ZONE;

-- Adicionar comentário
COMMENT ON COLUMN public.users.teste_sem_ia_inicio IS 
  'Data de início do teste SEM IA. Após 3 dias, o acesso será bloqueado e o usuário será redirecionado para página de vendas.';

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_users_teste_sem_ia_inicio 
ON public.users(teste_sem_ia_inicio) 
WHERE teste_sem_ia_inicio IS NOT NULL;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se a coluna foi criada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name = 'teste_sem_ia_inicio';
