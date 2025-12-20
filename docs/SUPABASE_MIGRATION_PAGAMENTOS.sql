-- ============================================
-- Migração: Adicionar colunas faltantes na tabela payments
-- FitCoach.IA - Cakto Integration
-- ============================================

-- Verificar e adicionar coluna external_payment_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'external_payment_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN external_payment_id TEXT UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_payment_id);
    RAISE NOTICE 'Coluna external_payment_id adicionada à tabela payments';
  ELSE
    RAISE NOTICE 'Coluna external_payment_id já existe na tabela payments';
  END IF;
END $$;

-- Verificar e adicionar outras colunas se não existirem
DO $$ 
BEGIN
  -- payment_provider
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_provider TEXT NOT NULL DEFAULT 'cakto';
    RAISE NOTICE 'Coluna payment_provider adicionada à tabela payments';
  END IF;

  -- payment_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_type TEXT NOT NULL DEFAULT 'unknown';
    -- Adicionar constraint se não existir
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'payments_payment_type_check'
    ) THEN
      ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
        CHECK (payment_type IN ('subscription', 'recharge', 'unknown'));
    END IF;
    RAISE NOTICE 'Coluna payment_type adicionada à tabela payments';
  END IF;

  -- metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE payments ADD COLUMN metadata JSONB DEFAULT '{}';
    RAISE NOTICE 'Coluna metadata adicionada à tabela payments';
  END IF;

  -- currency
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'currency'
  ) THEN
    ALTER TABLE payments ADD COLUMN currency TEXT DEFAULT 'BRL';
    RAISE NOTICE 'Coluna currency adicionada à tabela payments';
  END IF;

  -- status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_status_check'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_status_check 
      CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));
    RAISE NOTICE 'Constraint de status adicionada à tabela payments';
  END IF;
END $$;

-- Criar tabelas se não existirem (usando CREATE IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recharge_type TEXT NOT NULL CHECK (recharge_type IN ('turbo', 'reserve', 'pass_libre')),
  quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
  valid_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS b2b_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
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

CREATE TABLE IF NOT EXISTS b2b_code_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES b2b_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code_id, user_id)
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_recharges_user_id ON recharges(user_id);
CREATE INDEX IF NOT EXISTS idx_recharges_status ON recharges(status);
CREATE INDEX IF NOT EXISTS idx_recharges_type ON recharges(recharge_type);

CREATE INDEX IF NOT EXISTS idx_b2b_codes_code ON b2b_codes(code);
CREATE INDEX IF NOT EXISTS idx_b2b_codes_business_id ON b2b_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_b2b_codes_status ON b2b_codes(status);

CREATE INDEX IF NOT EXISTS idx_b2b_activations_code_id ON b2b_code_activations(code_id);
CREATE INDEX IF NOT EXISTS idx_b2b_activations_user_id ON b2b_code_activations(user_id);

-- Adicionar campos de boost na tabela users (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'boost_minutes_balance'
  ) THEN
    ALTER TABLE users ADD COLUMN boost_minutes_balance INTEGER DEFAULT 0;
    RAISE NOTICE 'Coluna boost_minutes_balance adicionada à tabela users';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'boost_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN boost_expires_at TIMESTAMPTZ;
    RAISE NOTICE 'Coluna boost_expires_at adicionada à tabela users';
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

-- Criar triggers se não existirem
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recharges_updated_at ON recharges;
CREATE TRIGGER update_recharges_updated_at
  BEFORE UPDATE ON recharges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_b2b_codes_updated_at ON b2b_codes;
CREATE TRIGGER update_b2b_codes_updated_at
  BEFORE UPDATE ON b2b_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_code_activations ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS se não existirem
DO $$
BEGIN
  -- Política para payments
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payments' 
    AND policyname = 'Users can view their own payments'
  ) THEN
    CREATE POLICY "Users can view their own payments"
      ON payments FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Política para recharges
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'recharges' 
    AND policyname = 'Users can view their own recharges'
  ) THEN
    CREATE POLICY "Users can view their own recharges"
      ON recharges FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Política para b2b_codes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'b2b_codes' 
    AND policyname = 'Users can view their business B2B codes'
  ) THEN
    CREATE POLICY "Users can view their business B2B codes"
      ON b2b_codes FOR SELECT
      USING (auth.uid() = business_id);
  END IF;

  -- Política para b2b_code_activations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'b2b_code_activations' 
    AND policyname = 'Users can view their own activations'
  ) THEN
    CREATE POLICY "Users can view their own activations"
      ON b2b_code_activations FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON TABLE payments IS 'Registra todos os pagamentos processados pela Cakto';
COMMENT ON TABLE recharges IS 'Recargas de minutos de voz compradas pelos usuários';
COMMENT ON TABLE b2b_codes IS 'Códigos de ativação únicos gerados para planos B2B';
COMMENT ON TABLE b2b_code_activations IS 'Registro de ativações de códigos B2B por usuários';

