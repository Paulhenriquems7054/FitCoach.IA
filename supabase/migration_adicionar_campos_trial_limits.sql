-- Migração: Adicionar campos para rastrear limites de trial
-- Campos necessários:
-- - trial_voice_total_seconds: Total de segundos de voz usados durante todo o trial
-- - trial_photo_analysis_count: Quantidade de análises de prato feitas durante o trial
-- - trial_meal_plan_count: Quantidade de planos alimentares gerados durante o trial

-- Executar no SQL Editor do Supabase

-- 1. Adicionar campo trial_voice_total_seconds (INTEGER, default 0)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_voice_total_seconds INTEGER DEFAULT 0;

-- 2. Adicionar campo trial_photo_analysis_count (INTEGER, default 0)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_photo_analysis_count INTEGER DEFAULT 0;

-- 3. Adicionar campo trial_meal_plan_count (INTEGER, default 0)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_meal_plan_count INTEGER DEFAULT 0;

-- 4. Adicionar comentários para documentação
COMMENT ON COLUMN public.users.trial_voice_total_seconds IS 'Total de segundos de voz usados durante todo o período de trial (máximo 900 = 15 minutos)';
COMMENT ON COLUMN public.users.trial_photo_analysis_count IS 'Quantidade de análises de prato feitas durante o trial (máximo 1)';
COMMENT ON COLUMN public.users.trial_meal_plan_count IS 'Quantidade de planos alimentares gerados durante o trial (máximo 1)';

-- 5. Verificar se os campos foram criados
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name IN ('trial_voice_total_seconds', 'trial_photo_analysis_count', 'trial_meal_plan_count')
ORDER BY column_name;

