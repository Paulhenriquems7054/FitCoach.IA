-- ============================================================================
-- Migration: Adicionar gym_id em tabelas de dados do app
-- Data: 2025-01-27
-- Prioridade: CRÍTICA
-- ============================================================================
-- 
-- PROBLEMA: Tabelas de dados do app não possuem gym_id, dificultando:
-- - Consultas agregadas por academia
-- - Isolamento de dados
-- - Performance em relatórios
--
-- SOLUÇÃO: Adicionar gym_id e índices em todas as tabelas de dados
-- ============================================================================

-- 1. WEIGHT HISTORY
ALTER TABLE public.weight_history 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.weight_history wh
SET gym_id = u.gym_id
FROM public.users u
WHERE wh.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_weight_history_gym_id 
ON public.weight_history(gym_id) 
WHERE gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_weight_history_gym_user 
ON public.weight_history(gym_id, user_id) 
WHERE gym_id IS NOT NULL;

-- 2. WELLNESS PLANS
ALTER TABLE public.wellness_plans 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.wellness_plans wp
SET gym_id = u.gym_id
FROM public.users u
WHERE wp.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wellness_plans_gym_id 
ON public.wellness_plans(gym_id) 
WHERE gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wellness_plans_gym_user 
ON public.wellness_plans(gym_id, user_id) 
WHERE gym_id IS NOT NULL;

-- 3. COMPLETED WORKOUTS
ALTER TABLE public.completed_workouts 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.completed_workouts cw
SET gym_id = u.gym_id
FROM public.users u
WHERE cw.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_completed_workouts_gym_id 
ON public.completed_workouts(gym_id) 
WHERE gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_completed_workouts_gym_user 
ON public.completed_workouts(gym_id, user_id) 
WHERE gym_id IS NOT NULL;

-- 4. MEAL PLANS
ALTER TABLE public.meal_plans 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.meal_plans mp
SET gym_id = u.gym_id
FROM public.users u
WHERE mp.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meal_plans_gym_id 
ON public.meal_plans(gym_id) 
WHERE gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meal_plans_gym_user 
ON public.meal_plans(gym_id, user_id) 
WHERE gym_id IS NOT NULL;

-- 5. MEAL ANALYSES
ALTER TABLE public.meal_analyses 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.meal_analyses ma
SET gym_id = u.gym_id
FROM public.users u
WHERE ma.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meal_analyses_gym_id 
ON public.meal_analyses(gym_id) 
WHERE gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meal_analyses_gym_user 
ON public.meal_analyses(gym_id, user_id) 
WHERE gym_id IS NOT NULL;

-- 6. RECIPES
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.recipes r
SET gym_id = u.gym_id
FROM public.users u
WHERE r.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_gym_id 
ON public.recipes(gym_id) 
WHERE gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_gym_user 
ON public.recipes(gym_id, user_id) 
WHERE gym_id IS NOT NULL;

-- 7. CHAT MESSAGES
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.chat_messages cm
SET gym_id = u.gym_id
FROM public.users u
WHERE cm.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_gym_id 
ON public.chat_messages(gym_id) 
WHERE gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_gym_user 
ON public.chat_messages(gym_id, user_id) 
WHERE gym_id IS NOT NULL;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN public.weight_history.gym_id IS 'ID da academia (para isolamento multi-tenant)';
COMMENT ON COLUMN public.wellness_plans.gym_id IS 'ID da academia (para isolamento multi-tenant)';
COMMENT ON COLUMN public.completed_workouts.gym_id IS 'ID da academia (para isolamento multi-tenant)';
COMMENT ON COLUMN public.meal_plans.gym_id IS 'ID da academia (para isolamento multi-tenant)';
COMMENT ON COLUMN public.meal_analyses.gym_id IS 'ID da academia (para isolamento multi-tenant)';
COMMENT ON COLUMN public.recipes.gym_id IS 'ID da academia (para isolamento multi-tenant)';
COMMENT ON COLUMN public.chat_messages.gym_id IS 'ID da academia (para isolamento multi-tenant)';

