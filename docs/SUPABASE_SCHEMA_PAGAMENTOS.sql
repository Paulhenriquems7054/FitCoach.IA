-- ============================================
-- Schema Supabase para Sistema de Pagamentos
-- FitCoach.IA - Cakto Integration
-- ============================================

-- Tabela de Pagamentos
-- NOTA: Se a tabela já existir, use SUPABASE_MIGRATION_PAGAMENTOS.sql para adicionar colunas faltantes
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_payment_id TEXT UNIQUE, -- ID do pagamento na Cakto
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_provider TEXT NOT NULL DEFAULT 'cakto',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'recharge', 'unknown')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Tabela de Recargas
CREATE TABLE IF NOT EXISTS recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recharge_type TEXT NOT NULL CHECK (recharge_type IN ('turbo', 'reserve', 'pass_libre')),
  quantity INTEGER NOT NULL DEFAULT 0, -- minutos (0 = ilimitado para pass_libre)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
  valid_until TIMESTAMPTZ, -- Para turbo (24h)
  expires_at TIMESTAMPTZ, -- Para pass_libre (30 dias)
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recharges_user_id ON recharges(user_id);
CREATE INDEX IF NOT EXISTS idx_recharges_status ON recharges(status);
CREATE INDEX IF NOT EXISTS idx_recharges_type ON recharges(recharge_type);

-- Tabela de Códigos B2B
CREATE TABLE IF NOT EXISTS b2b_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- Código único (ex: ABC12345)
  business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('academy_starter', 'academy_growth', 'academy_pro', 'personal_team_5', 'personal_team_15')),
  max_activations INTEGER NOT NULL DEFAULT 20,
  current_activations INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2b_codes_code ON b2b_codes(code);
CREATE INDEX IF NOT EXISTS idx_b2b_codes_business_id ON b2b_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_b2b_codes_status ON b2b_codes(status);

-- Tabela de Ativações de Códigos B2B
CREATE TABLE IF NOT EXISTS b2b_code_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES b2b_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code_id, user_id) -- Um usuário só pode ativar o mesmo código uma vez
);

CREATE INDEX IF NOT EXISTS idx_b2b_activations_code_id ON b2b_code_activations(code_id);
CREATE INDEX IF NOT EXISTS idx_b2b_activations_user_id ON b2b_code_activations(user_id);

-- Adicionar campos de boost na tabela users (se não existirem)
DO $$ 
BEGIN
  -- boost_minutes_balance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'boost_minutes_balance'
  ) THEN
    ALTER TABLE users ADD COLUMN boost_minutes_balance INTEGER DEFAULT 0;
  END IF;

  -- boost_expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'boost_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN boost_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recharges_updated_at
  BEFORE UPDATE ON recharges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_b2b_codes_updated_at
  BEFORE UPDATE ON b2b_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_code_activations ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seus próprios pagamentos
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem ver suas próprias recargas
CREATE POLICY "Users can view their own recharges"
  ON recharges FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem ver códigos B2B de sua empresa
CREATE POLICY "Users can view their business B2B codes"
  ON b2b_codes FOR SELECT
  USING (auth.uid() = business_id);

-- Política: Usuários podem ver suas próprias ativações
CREATE POLICY "Users can view their own activations"
  ON b2b_code_activations FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Service role pode fazer tudo (para webhooks)
-- Nota: Service role não precisa de políticas RLS, mas vamos criar para clareza
-- Na prática, webhooks devem usar service_role_key que bypassa RLS

-- Comentários para documentação
COMMENT ON TABLE payments IS 'Registra todos os pagamentos processados pela Cakto';
COMMENT ON TABLE recharges IS 'Recargas de minutos de voz compradas pelos usuários';
COMMENT ON TABLE b2b_codes IS 'Códigos de ativação únicos gerados para planos B2B';
COMMENT ON TABLE b2b_code_activations IS 'Registro de ativações de códigos B2B por usuários';

