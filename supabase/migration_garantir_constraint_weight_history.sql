-- ============================================================================
-- Migration: Garantir constraint UNIQUE em weight_history
-- Data: 2025-01-27
-- Prioridade: ALTA (corrige erro ON CONFLICT)
-- ============================================================================
-- 
-- PROBLEMA: Função migrate_weight_history_from_local usa ON CONFLICT mas
--           constraint pode não existir
--
-- SOLUÇÃO: Garantir que constraint UNIQUE(user_id, date) existe
-- ============================================================================

-- Verificar se constraint já existe
DO $$
BEGIN
    -- Se não existir, criar constraint única
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'weight_history_user_id_date_key'
        AND conrelid = 'public.weight_history'::regclass
    ) THEN
        -- Criar constraint única
        ALTER TABLE public.weight_history 
        ADD CONSTRAINT weight_history_user_id_date_key 
        UNIQUE (user_id, date);
        
        RAISE NOTICE 'Constraint weight_history_user_id_date_key criada';
    ELSE
        RAISE NOTICE 'Constraint weight_history_user_id_date_key já existe';
    END IF;
END $$;

-- Verificar se a coluna gym_id existe (adicionada em migration anterior)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'weight_history' 
        AND column_name = 'gym_id'
    ) THEN
        -- Adicionar coluna gym_id se não existir
        ALTER TABLE public.weight_history 
        ADD COLUMN gym_id TEXT;
        
        -- Preencher gym_id com dados dos usuários
        UPDATE public.weight_history wh
        SET gym_id = u.gym_id
        FROM public.users u
        WHERE wh.user_id = u.id AND u.gym_id IS NOT NULL;
        
        -- Criar índice
        CREATE INDEX IF NOT EXISTS idx_weight_history_gym_id 
        ON public.weight_history(gym_id) 
        WHERE gym_id IS NOT NULL;
        
        RAISE NOTICE 'Coluna gym_id adicionada à tabela weight_history';
    ELSE
        RAISE NOTICE 'Coluna gym_id já existe na tabela weight_history';
    END IF;
END $$;

COMMENT ON CONSTRAINT weight_history_user_id_date_key ON public.weight_history IS 
'Garante que um usuário não pode ter múltiplos registros de peso na mesma data';

