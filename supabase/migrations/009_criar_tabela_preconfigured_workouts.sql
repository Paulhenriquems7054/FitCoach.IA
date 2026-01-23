-- ============================================================================
-- Migration: Criar tabela para treinos pré-configurados criados pelo usuário
-- Data: 2026-01-23
-- ============================================================================
-- 
-- OBJETIVO: Armazenar treinos pré-configurados criados pelos usuários
-- na área "Treinos Pré-Configurados"
-- ============================================================================

-- Tabela de treinos pré-configurados criados pelo usuário
CREATE TABLE IF NOT EXISTS public.preconfigured_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    gym_id TEXT, -- Para suporte multi-tenancy
    
    -- Dados do treino (baseado em PreconfiguredWorkout)
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('corpo-inteiro', 'hipertrofia', 'emagrecimento', 'definicao', 'forca', 'resistencia', 'funcional', 'cardio')),
    nivel TEXT NOT NULL CHECK (nivel IN ('iniciante', 'intermediario', 'avancado')),
    objetivo TEXT[] NOT NULL, -- Array de objetivos (perder peso, ganhar massa muscular, manter peso)
    genero TEXT CHECK (genero IN ('masculino', 'feminino', 'unisex')) DEFAULT 'unisex',
    duracao_semanas INTEGER,
    mes INTEGER,
    
    -- Dados completos do treino em JSONB
    workout_data JSONB NOT NULL, -- PreconfiguredWorkout completo serializado
    
    -- Metadados
    arquivo_origem TEXT DEFAULT 'criado-pelo-usuario',
    data_importacao TIMESTAMPTZ DEFAULT NOW(),
    versao INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_preconfigured_workouts_user_id 
ON public.preconfigured_workouts(user_id);

CREATE INDEX IF NOT EXISTS idx_preconfigured_workouts_gym_id 
ON public.preconfigured_workouts(gym_id) 
WHERE gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_preconfigured_workouts_categoria 
ON public.preconfigured_workouts(categoria);

CREATE INDEX IF NOT EXISTS idx_preconfigured_workouts_nivel 
ON public.preconfigured_workouts(nivel);

CREATE INDEX IF NOT EXISTS idx_preconfigured_workouts_created_at 
ON public.preconfigured_workouts(created_at DESC);

-- Índice GIN para busca em workout_data (JSONB)
CREATE INDEX IF NOT EXISTS idx_preconfigured_workouts_workout_data 
ON public.preconfigured_workouts USING GIN (workout_data);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_preconfigured_workouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se já existir antes de criar
DROP TRIGGER IF EXISTS trigger_update_preconfigured_workouts_updated_at ON public.preconfigured_workouts;

CREATE TRIGGER trigger_update_preconfigured_workouts_updated_at
    BEFORE UPDATE ON public.preconfigured_workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_preconfigured_workouts_updated_at();

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.preconfigured_workouts ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes antes de criar (se já existirem)
DROP POLICY IF EXISTS "Users can insert their own workouts" ON public.preconfigured_workouts;
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.preconfigured_workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON public.preconfigured_workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.preconfigured_workouts;
DROP POLICY IF EXISTS "Trainers can view gym workouts" ON public.preconfigured_workouts;

-- Política: Usuários podem inserir seus próprios treinos
CREATE POLICY "Users can insert their own workouts"
    ON public.preconfigured_workouts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem ver seus próprios treinos
CREATE POLICY "Users can view their own workouts"
    ON public.preconfigured_workouts
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios treinos
CREATE POLICY "Users can update their own workouts"
    ON public.preconfigured_workouts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios treinos
CREATE POLICY "Users can delete their own workouts"
    ON public.preconfigured_workouts
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Política: Trainers podem ver treinos de sua academia
CREATE POLICY "Trainers can view gym workouts"
    ON public.preconfigured_workouts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.gym_id = preconfigured_workouts.gym_id
            AND users.gym_role IN ('admin', 'trainer')
        )
    );

-- Comentários
COMMENT ON TABLE public.preconfigured_workouts IS 'Armazena treinos pré-configurados criados pelos usuários na área Treinos Pré-Configurados';
COMMENT ON COLUMN public.preconfigured_workouts.workout_data IS 'Dados completos do treino em formato JSONB (PreconfiguredWorkout serializado)';
COMMENT ON COLUMN public.preconfigured_workouts.user_id IS 'ID do usuário que criou o treino';
COMMENT ON COLUMN public.preconfigured_workouts.gym_id IS 'ID da academia (para suporte multi-tenancy)';
