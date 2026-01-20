-- ============================================
-- SCRIPT: Criar Tabelas Faltantes do Sistema de Billing
-- Cria apenas as tabelas que ainda não existem
-- ============================================

-- =============================================
-- 1. TABELA: USAGE_TRACKING (Rastreamento de Uso)
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
  
  UNIQUE(user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period_start ON public.usage_tracking(period_start);

-- =============================================
-- 2. TABELA: SPENDING_LOGS (Log Detalhado de Gastos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.spending_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  
  -- Operação
  operation_type VARCHAR(50) NOT NULL,
  tokens_used INT DEFAULT 0,
  estimated_cost DECIMAL(10, 4) DEFAULT 0,
  
  -- Features usadas
  features_used JSONB DEFAULT '{}',
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spending_logs_user_id ON public.spending_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_logs_created_at ON public.spending_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_spending_logs_operation_type ON public.spending_logs(operation_type);

-- =============================================
-- 3. TABELA: SPENDING_ANALYSIS (Análise IA de Padrões)
-- =============================================
CREATE TABLE IF NOT EXISTS public.spending_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_month VARCHAR(7), -- Formato: YYYY-MM
  
  -- Dados da análise
  total_cost DECIMAL(10, 2) DEFAULT 0,
  total_requests INT DEFAULT 0,
  ai_insights TEXT,
  ai_recommendations TEXT,
  predicted_monthly_cost DECIMAL(10, 2),
  saving_opportunity DECIMAL(10, 2),
  
  -- Dados brutos (JSONB)
  analysis_data JSONB DEFAULT '{}',
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spending_analysis_user_id ON public.spending_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_analysis_period_month ON public.spending_analysis(period_month);

-- =============================================
-- 4. TABELA: EMAIL_TEMPLATES (Templates de Email)
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  subject TEXT NOT NULL,
  html_template TEXT NOT NULL,
  variables_required JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON public.email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);

-- =============================================
-- 5. TABELA: EMAIL_QUEUE (Fila de Envio de Emails)
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Email
  recipient_email VARCHAR(255) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  subject TEXT,
  html_content TEXT,
  
  -- Variáveis do template
  template_variables JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Controle de envio
  provider VARCHAR(20), -- 'sendgrid', 'mailgun'
  sent_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  retry_count INT DEFAULT 0,
  error_message TEXT,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON public.email_queue(priority);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at);

-- =============================================
-- 6. TABELA: USAGE_ALERTS (Alertas de Limite)
-- =============================================
CREATE TABLE IF NOT EXISTS public.usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  
  -- Tipo de alerta
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('warning', 'blocked', 'anomaly')),
  percentage DECIMAL(5, 2) NOT NULL, -- 80, 100, etc
  
  -- Dados do uso
  used INT NOT NULL,
  limit_amount INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'resolved')),
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_usage_alerts_user_id ON public.usage_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_status ON public.usage_alerts(status);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_created_at ON public.usage_alerts(created_at);

-- Verificar tabelas criadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = t.table_name) as num_colunas
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
  'usage_tracking',
  'spending_logs',
  'spending_analysis',
  'email_templates',
  'email_queue',
  'usage_alerts'
)
ORDER BY table_name;
