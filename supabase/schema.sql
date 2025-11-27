-- ============================================================================
-- FitCoach.IA - Schema do Banco de Dados Supabase
-- Sistema de Assinatura e Multi-tenancy para Academias
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABELAS DE USUÁRIOS E AUTENTICAÇÃO
-- ============================================================================

-- Tabela de usuários (integração com auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT, -- Email do usuário (para envio de links de acesso)
    photo_url TEXT,
    idade INTEGER DEFAULT 0,
    genero TEXT CHECK (genero IN ('Masculino', 'Feminino')) DEFAULT 'Masculino',
    peso DECIMAL(5,2) DEFAULT 0,
    altura DECIMAL(5,2) DEFAULT 0,
    objetivo TEXT CHECK (objetivo IN ('perder peso', 'ganhar massa muscular', 'manter peso')) DEFAULT 'perder peso',
    points INTEGER DEFAULT 0,
    discipline_score INTEGER DEFAULT 0,
    completed_challenge_ids TEXT[] DEFAULT '{}',
    is_anonymized BOOLEAN DEFAULT FALSE,
    role TEXT CHECK (role IN ('user', 'professional')) DEFAULT 'user',
    
    -- Multi-tenancy: campos para academias
    gym_id TEXT,
    gym_role TEXT CHECK (gym_role IN ('student', 'admin', 'trainer', 'receptionist')),
    is_gym_managed BOOLEAN DEFAULT FALSE,
    matricula TEXT, -- Matrícula do aluno na academia
    
    -- Permissões de dados
    data_permissions JSONB DEFAULT '{
        "allowWeightHistory": true,
        "allowMealPlans": true,
        "allowPhotoAnalysis": true,
        "allowWorkoutData": true,
        "allowChatHistory": true
    }'::jsonb,
    
    -- Configurações de segurança
    security_settings JSONB DEFAULT '{
        "biometricEnabled": false,
        "securityNotifications": true
    }'::jsonb,
    
    -- Controle de acesso
    access_blocked BOOLEAN DEFAULT FALSE,
    blocked_at TIMESTAMPTZ,
    blocked_by UUID REFERENCES public.users(id),
    blocked_reason TEXT,
    
    -- Sincronização
    last_sync_at TIMESTAMPTZ,
    gym_server_url TEXT,
    
    -- Controle de Plano
    plan_type TEXT CHECK (plan_type IN ('free', 'monthly', 'annual', 'academy_starter', 'academy_growth', 'personal_team')) DEFAULT 'free',
    subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'expired')) DEFAULT 'active',
    expiry_date TIMESTAMPTZ,
    
    -- Controle de Voz (Gemini Live)
    voice_daily_limit_seconds INTEGER DEFAULT 900, -- 15 minutos padrão
    voice_used_today_seconds INTEGER DEFAULT 0,
    voice_balance_upsell INTEGER DEFAULT 0, -- Saldo de minutos comprados que não expiram
    last_usage_date DATE, -- Para resetar contador diário
    
    -- Controle de Chat (Texto)
    text_msg_count_today INTEGER DEFAULT 0,
    last_msg_date DATE, -- Para resetar contador diário
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para usuários
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_gym_id ON public.users(gym_id);
CREATE INDEX IF NOT EXISTS idx_users_gym_role ON public.users(gym_role);
CREATE INDEX IF NOT EXISTS idx_users_matricula ON public.users(matricula);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON public.users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_expiry_date ON public.users(expiry_date);
CREATE INDEX IF NOT EXISTS idx_users_last_usage_date ON public.users(last_usage_date);
CREATE INDEX IF NOT EXISTS idx_users_last_msg_date ON public.users(last_msg_date);

-- ============================================================================
-- TABELAS DE ASSINATURA
-- ============================================================================

-- Planos de assinatura disponíveis
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- 'free', 'basic', 'premium', 'enterprise'
    display_name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2),
    currency TEXT DEFAULT 'BRL',
    
    -- Limites do plano
    limits JSONB DEFAULT '{
        "maxUsers": 1,
        "maxGyms": 0,
        "maxStudentsPerGym": 0,
        "maxReportsPerWeek": 5,
        "maxPhotoAnalysesPerDay": 10,
        "maxChatMessages": 100,
        "storageGB": 1,
        "apiCallsPerMonth": 1000
    }'::jsonb,
    
    -- Recursos incluídos
    features JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assinaturas dos usuários
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    
    -- Status da assinatura
    status TEXT CHECK (status IN ('active', 'canceled', 'expired', 'past_due', 'trialing')) DEFAULT 'active',
    
    -- Período da assinatura
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    
    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    -- Métodos de pagamento
    payment_method_id TEXT, -- ID do método de pagamento (Stripe, etc)
    payment_provider TEXT DEFAULT 'stripe', -- 'stripe', 'pix', 'boleto', etc
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para assinaturas
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON public.user_subscriptions(current_period_end);

-- Índice único parcial: garantir apenas uma assinatura ativa por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_one_active 
    ON public.user_subscriptions(user_id) 
    WHERE status = 'active';

-- Pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Informações do pagamento
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    status TEXT CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled')) DEFAULT 'pending',
    
    -- Método de pagamento
    payment_method TEXT, -- 'credit_card', 'pix', 'boleto', 'bank_transfer'
    payment_provider TEXT DEFAULT 'stripe',
    provider_payment_id TEXT, -- ID do pagamento no provedor (Stripe, etc)
    
    -- Informações adicionais
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para pagamentos
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(provider_payment_id);

-- Faturas/Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Informações da fatura
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    status TEXT CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')) DEFAULT 'draft',
    
    -- Período cobrado
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    
    -- Informações do cliente
    customer_name TEXT,
    customer_email TEXT,
    customer_address JSONB,
    
    -- Items da fatura
    line_items JSONB DEFAULT '[]'::jsonb,
    
    -- PDF/URL da fatura
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,
    
    -- Timestamps
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para faturas
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- ============================================================================
-- TABELAS DE ACADEMIAS (MULTI-TENANCY)
-- ============================================================================

-- Academias
CREATE TABLE IF NOT EXISTS public.gyms (
    id TEXT PRIMARY KEY, -- ID customizado (ex: 'default-gym')
    name TEXT NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Informações da academia
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Configurações
    settings JSONB DEFAULT '{}'::jsonb,
    subscription_plan_id UUID REFERENCES public.subscription_plans(id),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para academias
CREATE INDEX IF NOT EXISTS idx_gyms_owner_id ON public.gyms(owner_id);
CREATE INDEX IF NOT EXISTS idx_gyms_subscription_plan_id ON public.gyms(subscription_plan_id);

-- ============================================================================
-- TABELAS DE DADOS DO APLICATIVO
-- ============================================================================

-- Histórico de peso
CREATE TABLE IF NOT EXISTS public.weight_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_weight_history_user_id ON public.weight_history(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_date ON public.weight_history(date);

-- Planos de bem-estar
CREATE TABLE IF NOT EXISTS public.wellness_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wellness_plans_user_id ON public.wellness_plans(user_id);

-- Treinos concluídos
CREATE TABLE IF NOT EXISTS public.completed_workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL,
    plan_id UUID REFERENCES public.wellness_plans(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completed_workouts_user_id ON public.completed_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_workouts_plan_id ON public.completed_workouts(plan_id);

-- Planos alimentares
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON public.meal_plans(user_id);

-- Análises de refeições
CREATE TABLE IF NOT EXISTS public.meal_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    image_data TEXT, -- Base64 ou URL
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_analyses_user_id ON public.meal_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_analyses_created_at ON public.meal_analyses(created_at);

-- Receitas
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipe_data JSONB NOT NULL,
    favorited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_favorited ON public.recipes(favorited);

-- Mensagens do chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Configurações do app
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABELA DE CUPONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Código do cupom (único)
    code TEXT NOT NULL UNIQUE,
    
    -- Plano vinculado ao cupom
    plan_linked TEXT NOT NULL CHECK (plan_linked IN ('free', 'monthly', 'annual', 'academy_starter', 'academy_growth', 'personal_team')),
    
    -- Limites de uso
    max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
    current_uses INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
    
    -- Status do cupom
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Informações adicionais
    description TEXT,
    discount_percentage DECIMAL(5,2), -- Percentual de desconto (opcional)
    discount_amount DECIMAL(10,2), -- Valor fixo de desconto (opcional)
    valid_from TIMESTAMPTZ DEFAULT NOW(), -- Data de início da validade
    valid_until TIMESTAMPTZ, -- Data de fim da validade (NULL = sem expiração)
    
    -- Metadata
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para cupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_plan_linked ON public.coupons(plan_linked);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);

-- ============================================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gyms_updated_at ON public.gyms;
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON public.gyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_plans_updated_at ON public.wellness_plans;
CREATE TRIGGER update_wellness_plans_updated_at BEFORE UPDATE ON public.wellness_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON public.meal_plans;
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON public.meal_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de fatura único
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Verificar se já existe
    WHILE EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = new_number) LOOP
        new_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END LOOP;
    
    RETURN new_number;
END;
$$ language 'plpgsql';

-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Inserir planos de assinatura padrão
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active, is_visible)
VALUES
    ('free', 'Gratuito', 'Plano gratuito com recursos básicos', 0, 0, 
     '{"maxUsers": 1, "maxGyms": 0, "maxStudentsPerGym": 0, "maxReportsPerWeek": 5, "maxPhotoAnalysesPerDay": 10, "maxChatMessages": 100, "storageGB": 1, "apiCallsPerMonth": 1000}'::jsonb,
     '["basic_chat", "basic_reports", "weight_tracking"]'::jsonb,
     TRUE, TRUE),
    
    ('basic', 'Basic', 'Treinos Personalizados, Nutrição Básica, Suporte por Email', 29.90, 299.00,
     '{"maxUsers": 1, "maxGyms": 0, "maxStudentsPerGym": 0, "maxReportsPerWeek": 20, "maxPhotoAnalysesPerDay": 50, "maxChatMessages": 500, "storageGB": 5, "apiCallsPerMonth": 5000}'::jsonb,
     '["basic_chat", "advanced_reports", "weight_tracking", "meal_plans", "photo_analysis", "personalized_workouts", "basic_nutrition", "email_support"]'::jsonb,
     TRUE, TRUE),
    
    ('premium', 'Premium', 'Tudo do Basic, Nutrição Avançada + Receitas, Análise de Desempenho IA, Suporte Prioritário', 59.90, 599.00,
     '{"maxUsers": 1, "maxGyms": 0, "maxStudentsPerGym": 0, "maxReportsPerWeek": -1, "maxPhotoAnalysesPerDay": -1, "maxChatMessages": -1, "storageGB": 20, "apiCallsPerMonth": 20000}'::jsonb,
     '["unlimited_chat", "unlimited_reports", "weight_tracking", "meal_plans", "photo_analysis", "priority_support", "advanced_analytics", "advanced_nutrition", "recipes", "personalized_workouts"]'::jsonb,
     TRUE, TRUE),
    
    ('enterprise', 'Enterprise', 'Para academias: Tudo do Premium, Gestão de Múltiplos Alunos, Dashboard de Academia, Suporte Dedicado 24/7', 199.90, 1999.00,
     '{"maxUsers": -1, "maxGyms": 10, "maxStudentsPerGym": 1000, "maxReportsPerWeek": -1, "maxPhotoAnalysesPerDay": -1, "maxChatMessages": -1, "storageGB": 100, "apiCallsPerMonth": 100000}'::jsonb,
     '["unlimited_chat", "unlimited_reports", "weight_tracking", "meal_plans", "photo_analysis", "priority_support", "advanced_analytics", "multi_gym", "student_management", "custom_branding", "api_access", "gym_dashboard", "dedicated_support"]'::jsonb,
     TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;

