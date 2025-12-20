-- ============================================================================
-- Migration: Criar tabelas de uso de IA por academia/usuário
-- ============================================================================

-- 1) Tabela de logs de uso de IA (nível de chamada)
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id text REFERENCES public.gyms(id),
  user_id uuid REFERENCES public.users(id),
  feature text NOT NULL, -- 'chat', 'meal_plan', 'coach_tip', 'live_audio', etc.
  model text NOT NULL,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  cost_usd numeric(10,4) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_gym_id
  ON public.ai_usage_logs(gym_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at
  ON public.ai_usage_logs(created_at);

-- 2) Tabela de agregados mensais por academia
CREATE TABLE IF NOT EXISTS public.ai_monthly_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id text REFERENCES public.gyms(id),
  year_month text NOT NULL, -- formato 'YYYY-MM'
  total_tokens_in bigint NOT NULL DEFAULT 0,
  total_tokens_out bigint NOT NULL DEFAULT 0,
  total_cost_usd numeric(12,4) NOT NULL DEFAULT 0,
  hard_limit_usd numeric(12,4), -- orçamento/limite opcional por mês
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (gym_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_ai_monthly_usage_gym_id
  ON public.ai_monthly_usage(gym_id);

CREATE INDEX IF NOT EXISTS idx_ai_monthly_usage_year_month
  ON public.ai_monthly_usage(year_month);


