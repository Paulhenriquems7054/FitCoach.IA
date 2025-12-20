-- ============================================================================
-- Migration: Políticas RLS completas para multi-tenancy
-- Data: 2025-01-27
-- Prioridade: CRÍTICA
-- ============================================================================
-- 
-- PROBLEMA: Políticas RLS atuais não permitem admins/trainers ver dados
-- de alunos da mesma academia de forma eficiente
--
-- SOLUÇÃO: Adicionar políticas específicas para multi-tenancy usando gym_id
-- ============================================================================

-- ============================================================================
-- WEIGHT HISTORY - Políticas Multi-tenant
-- ============================================================================

-- Manter política existente para usuários
DROP POLICY IF EXISTS "Users can manage own weight history" ON public.weight_history;
CREATE POLICY "Users can manage own weight history"
    ON public.weight_history FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins podem ver dados de alunos da sua academia
DROP POLICY IF EXISTS "Gym admins can view gym students weight history" ON public.weight_history;
CREATE POLICY "Gym admins can view gym students weight history"
    ON public.weight_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = weight_history.gym_id
            AND weight_history.gym_id IS NOT NULL
        )
    );

-- Trainers podem ver dados de alunos que treinam
DROP POLICY IF EXISTS "Trainers can view students weight history" ON public.weight_history;
CREATE POLICY "Trainers can view students weight history"
    ON public.weight_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS trainer
            WHERE trainer.id = auth.uid()
            AND trainer.gym_role = 'trainer'
            AND trainer.gym_id = weight_history.gym_id
            AND weight_history.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- WELLNESS PLANS - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own wellness plans" ON public.wellness_plans;
CREATE POLICY "Users can manage own wellness plans"
    ON public.wellness_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students wellness plans" ON public.wellness_plans;
CREATE POLICY "Gym admins can view gym students wellness plans"
    ON public.wellness_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = wellness_plans.gym_id
            AND wellness_plans.gym_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Trainers can view students wellness plans" ON public.wellness_plans;
CREATE POLICY "Trainers can view students wellness plans"
    ON public.wellness_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS trainer
            WHERE trainer.id = auth.uid()
            AND trainer.gym_role = 'trainer'
            AND trainer.gym_id = wellness_plans.gym_id
            AND wellness_plans.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- COMPLETED WORKOUTS - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own completed workouts" ON public.completed_workouts;
CREATE POLICY "Users can manage own completed workouts"
    ON public.completed_workouts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students workouts" ON public.completed_workouts;
CREATE POLICY "Gym admins can view gym students workouts"
    ON public.completed_workouts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = completed_workouts.gym_id
            AND completed_workouts.gym_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Trainers can view students workouts" ON public.completed_workouts;
CREATE POLICY "Trainers can view students workouts"
    ON public.completed_workouts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS trainer
            WHERE trainer.id = auth.uid()
            AND trainer.gym_role = 'trainer'
            AND trainer.gym_id = completed_workouts.gym_id
            AND completed_workouts.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- MEAL PLANS - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.meal_plans;
CREATE POLICY "Users can manage own meal plans"
    ON public.meal_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students meal plans" ON public.meal_plans;
CREATE POLICY "Gym admins can view gym students meal plans"
    ON public.meal_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = meal_plans.gym_id
            AND meal_plans.gym_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Trainers can view students meal plans" ON public.meal_plans;
CREATE POLICY "Trainers can view students meal plans"
    ON public.meal_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS trainer
            WHERE trainer.id = auth.uid()
            AND trainer.gym_role = 'trainer'
            AND trainer.gym_id = meal_plans.gym_id
            AND meal_plans.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- MEAL ANALYSES - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own meal analyses" ON public.meal_analyses;
CREATE POLICY "Users can manage own meal analyses"
    ON public.meal_analyses FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students meal analyses" ON public.meal_analyses;
CREATE POLICY "Gym admins can view gym students meal analyses"
    ON public.meal_analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = meal_analyses.gym_id
            AND meal_analyses.gym_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Trainers can view students meal analyses" ON public.meal_analyses;
CREATE POLICY "Trainers can view students meal analyses"
    ON public.meal_analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS trainer
            WHERE trainer.id = auth.uid()
            AND trainer.gym_role = 'trainer'
            AND trainer.gym_id = meal_analyses.gym_id
            AND meal_analyses.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- RECIPES - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own recipes" ON public.recipes;
CREATE POLICY "Users can manage own recipes"
    ON public.recipes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students recipes" ON public.recipes;
CREATE POLICY "Gym admins can view gym students recipes"
    ON public.recipes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = recipes.gym_id
            AND recipes.gym_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Trainers can view students recipes" ON public.recipes;
CREATE POLICY "Trainers can view students recipes"
    ON public.recipes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS trainer
            WHERE trainer.id = auth.uid()
            AND trainer.gym_role = 'trainer'
            AND trainer.gym_id = recipes.gym_id
            AND recipes.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- CHAT MESSAGES - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage own chat messages"
    ON public.chat_messages FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students chat messages" ON public.chat_messages;
CREATE POLICY "Gym admins can view gym students chat messages"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = chat_messages.gym_id
            AND chat_messages.gym_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Trainers can view students chat messages" ON public.chat_messages;
CREATE POLICY "Trainers can view students chat messages"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS trainer
            WHERE trainer.id = auth.uid()
            AND trainer.gym_role = 'trainer'
            AND trainer.gym_id = chat_messages.gym_id
            AND chat_messages.gym_id IS NOT NULL
        )
    );

