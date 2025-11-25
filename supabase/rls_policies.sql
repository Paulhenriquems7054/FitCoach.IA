-- ============================================================================
-- FitCoach.IA - Políticas de Segurança (RLS - Row Level Security)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS PARA USUÁRIOS
-- ============================================================================

-- Usuários podem ver e editar apenas seus próprios dados
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Admins de academia podem ver usuários da sua academia
DROP POLICY IF EXISTS "Gym admins can view gym users" ON public.users;
CREATE POLICY "Gym admins can view gym users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = users.gym_id
        )
    );

-- ============================================================================
-- POLÍTICAS PARA PLANOS DE ASSINATURA
-- ============================================================================

-- Todos podem ver planos ativos e visíveis
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans"
    ON public.subscription_plans FOR SELECT
    USING (is_active = TRUE AND is_visible = TRUE);

-- ============================================================================
-- POLÍTICAS PARA ASSINATURAS DE USUÁRIOS
-- ============================================================================

-- Usuários podem ver apenas suas próprias assinaturas
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions"
    ON public.user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias assinaturas
DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can create own subscriptions"
    ON public.user_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias assinaturas
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can update own subscriptions"
    ON public.user_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- POLÍTICAS PARA PAGAMENTOS
-- ============================================================================

-- Usuários podem ver apenas seus próprios pagamentos
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios pagamentos
DROP POLICY IF EXISTS "Users can create own payments" ON public.payments;
CREATE POLICY "Users can create own payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- POLÍTICAS PARA FATURAS
-- ============================================================================

-- Usuários podem ver apenas suas próprias faturas
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- POLÍTICAS PARA ACADEMIAS
-- ============================================================================

-- Usuários podem ver academias que pertencem ou são donos
DROP POLICY IF EXISTS "Users can view own gyms" ON public.gyms;
CREATE POLICY "Users can view own gyms"
    ON public.gyms FOR SELECT
    USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.gym_id = gyms.id
        )
    );

-- Apenas donos podem atualizar suas academias
DROP POLICY IF EXISTS "Gym owners can update own gyms" ON public.gyms;
CREATE POLICY "Gym owners can update own gyms"
    ON public.gyms FOR UPDATE
    USING (owner_id = auth.uid());

-- ============================================================================
-- POLÍTICAS PARA DADOS DO APLICATIVO
-- ============================================================================

-- Histórico de peso: usuários veem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can manage own weight history" ON public.weight_history;
CREATE POLICY "Users can manage own weight history"
    ON public.weight_history FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Planos de bem-estar: usuários veem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can manage own wellness plans" ON public.wellness_plans;
CREATE POLICY "Users can manage own wellness plans"
    ON public.wellness_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Treinos concluídos: usuários veem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can manage own completed workouts" ON public.completed_workouts;
CREATE POLICY "Users can manage own completed workouts"
    ON public.completed_workouts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Planos alimentares: usuários veem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.meal_plans;
CREATE POLICY "Users can manage own meal plans"
    ON public.meal_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Análises de refeições: usuários veem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can manage own meal analyses" ON public.meal_analyses;
CREATE POLICY "Users can manage own meal analyses"
    ON public.meal_analyses FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Receitas: usuários veem apenas suas próprias receitas
DROP POLICY IF EXISTS "Users can manage own recipes" ON public.recipes;
CREATE POLICY "Users can manage own recipes"
    ON public.recipes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Mensagens do chat: usuários veem apenas suas próprias mensagens
DROP POLICY IF EXISTS "Users can manage own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage own chat messages"
    ON public.chat_messages FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Configurações do app: todos podem ler, mas apenas autenticados podem escrever
DROP POLICY IF EXISTS "Anyone can view app settings" ON public.app_settings;
CREATE POLICY "Anyone can view app settings"
    ON public.app_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can update app settings" ON public.app_settings;
CREATE POLICY "Authenticated users can update app settings"
    ON public.app_settings FOR UPDATE
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- POLÍTICAS ESPECIAIS PARA ACADEMIAS
-- ============================================================================

-- Trainers podem ver dados de alunos da sua academia
DROP POLICY IF EXISTS "Trainers can view gym students data" ON public.users;
CREATE POLICY "Trainers can view gym students data"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS trainer
            WHERE trainer.id = auth.uid()
            AND trainer.gym_role = 'trainer'
            AND trainer.gym_id = users.gym_id
            AND users.gym_role = 'student'
        )
    );

-- Admins podem ver todos os dados da academia
DROP POLICY IF EXISTS "Admins can view all gym data" ON public.users;
CREATE POLICY "Admins can view all gym data"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = users.gym_id
        )
    );

-- Admins podem atualizar dados de alunos da sua academia
DROP POLICY IF EXISTS "Admins can update gym students" ON public.users;
CREATE POLICY "Admins can update gym students"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = users.gym_id
            AND users.gym_role = 'student'
        )
    );

