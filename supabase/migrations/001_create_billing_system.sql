-- ============================================
-- MIGRATION: Sistema Completo de Billing
-- Criado: 17/01/2026
-- ============================================

-- =============================================
-- 1. TABELA: PLANS (Planos de Assinatura)
-- =============================================
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stripe_price_id VARCHAR(100),
  
  -- Limites
  requests_per_month INT NOT NULL DEFAULT 100,
  image_analysis_per_month INT NOT NULL DEFAULT 50,
  voice_messages_per_month INT NOT NULL DEFAULT 0,
  
  -- Features JSONB
  features JSONB DEFAULT '{
    "ai_analysis": true,
    "export_pdf": false,
    "advanced_reports": false,
    "priority_support": false,
    "custom_diet": false
  }',
  
  -- Meta
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_plans_active ON public.plans(is_active);

-- =============================================
-- 2. TABELA: SUBSCRIPTIONS (Assinaturas dos Usuários)
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  
  -- Períodos
  current_period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  current_period_end DATE NOT NULL,
  renewal_type VARCHAR(20) NOT NULL CHECK (renewal_type IN ('monthly', 'yearly', 'lifetime')),
  
  -- Integração Stripe
  stripe_subscription_id VARCHAR(100),
  stripe_customer_id VARCHAR(100),
  
  -- Auto-renovação
  auto_renew BOOLEAN DEFAULT true,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, plan_id)
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions(current_period_end);

-- =============================================
-- 3. TABELA: USAGE_TRACKING (Rastreamento de Uso)
-- =============================================
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  
  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Contadores
  text_requests INT DEFAULT 0,
  image_requests INT DEFAULT 0,
  voice_requests INT DEFAULT 0,
  api_calls_total INT DEFAULT 0,
  
  -- Tokens Gemini
  gemini_input_tokens INT DEFAULT 0,
  gemini_output_tokens INT DEFAULT 0,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, period_start, period_end)
);

CREATE INDEX idx_usage_tracking_user_period ON public.usage_tracking(user_id, period_start);

-- =============================================
-- 4. TABELA: SPENDING_LOGS (Log de Gastos Detalhado)
-- =============================================
CREATE TABLE IF NOT EXISTS public.spending_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de operação
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN (
    'text_analysis', 
    'image_analysis', 
    'voice_analysis',
    'meal_tracking',
    'custom_report',
    'pdf_export'
  )),
  
  -- Custos
  tokens_used INT DEFAULT 0,
  estimated_cost DECIMAL(10, 4) NOT NULL DEFAULT 0,
  
  -- Features utilizadas
  features_used JSONB DEFAULT '{}',
  
  -- Metadata
  request_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_spending_logs_user_created ON public.spending_logs(user_id, created_at);
CREATE INDEX idx_spending_logs_operation ON public.spending_logs(operation_type);

-- =============================================
-- 5. TABELA: SPENDING_ANALYSIS (Análise IA de Gastos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.spending_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Período analisado
  period_month DATE NOT NULL,
  
  -- Totalizadores
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_requests INT DEFAULT 0,
  average_request_cost DECIMAL(10, 4),
  
  -- Padrão de uso
  peak_hour VARCHAR(5), -- HH:MM
  peak_day_of_week VARCHAR(10),
  usage_pattern JSONB DEFAULT '{}', -- {text: 40%, image: 55%, voice: 5%}
  
  -- Insights IA
  ai_insights TEXT,
  ai_recommendations TEXT,
  predicted_monthly_cost DECIMAL(10, 2),
  saving_opportunity DECIMAL(10, 2),
  suggested_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  
  -- Meta
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_spending_analysis_user_month ON public.spending_analysis(user_id, period_month);

-- =============================================
-- 6. TABELA: EMAIL_TEMPLATES (Templates de Email)
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'usage_alert',
    'monthly_report',
    'invoice',
    'subscription_renewal',
    'warning',
    'upgrade_offer',
    'announcement'
  )),
  
  -- Conteúdo
  subject VARCHAR(200) NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,
  
  -- Variáveis necessárias
  variables_required JSONB DEFAULT '[]',
  variables_example JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_templates_active ON public.email_templates(is_active);

-- =============================================
-- 7. TABELA: EMAIL_QUEUE (Fila de Emails)
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email
  recipient_email VARCHAR(255) NOT NULL,
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE RESTRICT,
  
  -- Tipo e Prioridade
  type VARCHAR(50) NOT NULL,
  priority INT DEFAULT 1, -- 1 (baixa) a 5 (crítica)
  
  -- Variáveis
  variables JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'bounced')),
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  
  -- Agendamento
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Erro
  error_message TEXT,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status_scheduled ON public.email_queue(status, scheduled_for);
CREATE INDEX idx_email_queue_user_id ON public.email_queue(user_id);

-- =============================================
-- 8. TABELA: INVOICES (Faturas)
-- =============================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  
  -- Invoice ID
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  stripe_invoice_id VARCHAR(100),
  
  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Valores
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'sent', 'paid', 'failed', 'refunded')),
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Arquivo
  pdf_url TEXT,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- =============================================
-- 9. TABELA: USAGE_ALERTS (Alertas de Uso)
-- =============================================
CREATE TABLE IF NOT EXISTS public.usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Alerta
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'usage_80_percent',
    'usage_100_percent',
    'subscription_expiring_7days',
    'subscription_expired',
    'payment_failed',
    'anomalous_activity'
  )),
  
  -- Dados
  alert_data JSONB DEFAULT '{}',
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_usage_alerts_user_id ON public.usage_alerts(user_id, is_read);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Plans (public read)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT USING (is_active = true);

-- Subscriptions (only own data)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_user_read" ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_user_update" ON public.subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Usage Tracking (only own data)
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_tracking_user_read" ON public.usage_tracking FOR SELECT 
  USING (auth.uid() = user_id);

-- Spending Logs (only own data)
ALTER TABLE public.spending_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spending_logs_user_read" ON public.spending_logs FOR SELECT 
  USING (auth.uid() = user_id);

-- Spending Analysis (only own data)
ALTER TABLE public.spending_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spending_analysis_user_read" ON public.spending_analysis FOR SELECT 
  USING (auth.uid() = user_id);

-- Email Templates (public read)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_public_read" ON public.email_templates FOR SELECT 
  USING (is_active = true);

-- Email Queue (only own data for read, system for insert)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_queue_user_read" ON public.email_queue FOR SELECT 
  USING (auth.uid() = user_id);

-- Invoices (only own data)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_user_read" ON public.invoices FOR SELECT 
  USING (auth.uid() = user_id);

-- Usage Alerts (only own data)
ALTER TABLE public.usage_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_alerts_user_read" ON public.usage_alerts FOR SELECT 
  USING (auth.uid() = user_id);

-- =============================================
-- SEED DATA: Planos Padrão
-- =============================================

INSERT INTO public.plans (name, description, price, requests_per_month, image_analysis_per_month, features, is_active, display_order) VALUES
  (
    'Free',
    'Plano gratuito com funcionalidades básicas',
    0,
    50,
    10,
    '{"ai_analysis": true, "export_pdf": false, "advanced_reports": false, "priority_support": false, "custom_diet": false}'::jsonb,
    true,
    1
  ),
  (
    'Pro',
    'Plano profissional para uso regular',
    9.99,
    500,
    100,
    '{"ai_analysis": true, "export_pdf": true, "advanced_reports": false, "priority_support": false, "custom_diet": true}'::jsonb,
    true,
    2
  ),
  (
    'Premium',
    'Plano premium com todos os recursos',
    29.99,
    2000,
    500,
    '{"ai_analysis": true, "export_pdf": true, "advanced_reports": true, "priority_support": true, "custom_diet": true}'::jsonb,
    true,
    3
  )
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED DATA: Email Templates
-- =============================================

INSERT INTO public.email_templates (name, category, subject, html_template, variables_required, is_active) VALUES
  (
    'usage_alert_80percent',
    'usage_alert',
    '⚠️ Você atingiu {{percentage}}% do seu limite mensal',
    '<h2>⚠️ Aviso de Limite de Uso</h2>
    <p>Período: {{period_start}} a {{period_end}}</p>
    <p><strong>Uso atual: {{used}}/{{limit}} requisições ({{percentage}}%)</strong></p>
    <p>Você está próximo do limite do seu plano. Considere:</p>
    <ul>
      <li>Fazer upgrade para um plano superior</li>
      <li>Aguardar a renovação automática em {{renewal_date}}</li>
    </ul>
    <a href="{{upgrade_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Upgrade Agora</a>',
    '["percentage", "period_start", "period_end", "used", "limit", "renewal_date", "upgrade_url"]'::jsonb,
    true
  ),
  (
    'monthly_report',
    'monthly_report',
    '📊 Seu Relatório de Uso - {{month}}',
    '<h2>📊 Relatório Mensal - {{month}}</h2>
    <table style="border-collapse: collapse; width: 100%;">
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px;">Total de requisições</td>
        <td style="padding: 10px;"><strong>{{total_requests}}</strong></td>
      </tr>
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px;">Custo estimado</td>
        <td style="padding: 10px;"><strong>R$ {{cost}}</strong></td>
      </tr>
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px;">Economia com upgrade</td>
        <td style="padding: 10px;"><strong>R$ {{savings}}</strong></td>
      </tr>
    </table>
    <h3>💡 Insight IA</h3>
    <p>{{ai_insight}}</p>
    <h3>✅ Recomendações</h3>
    <p>{{recommendation}}</p>
    <a href="{{dashboard_url}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver Detalhes</a>',
    '["month", "total_requests", "cost", "savings", "ai_insight", "recommendation", "dashboard_url"]'::jsonb,
    true
  ),
  (
    'invoice_notification',
    'invoice',
    '💳 Sua Fatura {{invoice_number}} - {{period}}',
    '<h2>💳 Fatura {{invoice_number}}</h2>
    <p>Período: {{period_start}} a {{period_end}}</p>
    <h3>Detalhes</h3>
    <table style="border-collapse: collapse; width: 100%;">
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px;">Subtotal</td>
        <td style="padding: 10px;">R$ {{subtotal}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px;">Impostos</td>
        <td style="padding: 10px;">R$ {{tax}}</td>
      </tr>
      <tr style="border-bottom: 2px solid #333;">
        <td style="padding: 10px;"><strong>Total</strong></td>
        <td style="padding: 10px;"><strong>R$ {{total}}</strong></td>
      </tr>
    </table>
    <a href="{{invoice_pdf_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download PDF</a>',
    '["invoice_number", "period_start", "period_end", "subtotal", "tax", "total", "invoice_pdf_url"]'::jsonb,
    true
  ),
  (
    'subscription_renewal_reminder',
    'subscription_renewal',
    '🔄 Sua assinatura vence em {{days}} dias',
    '<h2>🔄 Lembrete de Renovação</h2>
    <p>Sua assinatura {{plan_name}} vence em <strong>{{days}} dias</strong> ({{expiration_date}}).</p>
    <p>Se você deseja continuar utilizando FitCoach.IA, sua assinatura será renovada automaticamente.</p>
    <p><strong>Data de renovação:</strong> {{renewal_date}}</p>
    <p>Se quiser fazer alterações no seu plano, acesse sua conta agora.</p>
    <a href="{{account_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Gerenciar Assinatura</a>',
    '["plan_name", "days", "expiration_date", "renewal_date", "account_url"]'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- COMENTÁRIOS
-- =============================================

COMMENT ON TABLE public.plans IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE public.subscriptions IS 'Assinaturas dos usuários com status e períodos';
COMMENT ON TABLE public.usage_tracking IS 'Rastreamento de requisições por período/usuário';
COMMENT ON TABLE public.spending_logs IS 'Log detalhado de cada operação e seu custo';
COMMENT ON TABLE public.spending_analysis IS 'Análise IA mensal de padrões de gasto';
COMMENT ON TABLE public.email_templates IS 'Templates reutilizáveis para emails automáticos';
COMMENT ON TABLE public.email_queue IS 'Fila de emails a enviar com status de entrega';
COMMENT ON TABLE public.invoices IS 'Faturas geradas para usuários';
COMMENT ON TABLE public.usage_alerts IS 'Alertas de uso para notificar usuários';
