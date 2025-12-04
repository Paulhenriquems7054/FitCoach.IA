-- ============================================================
-- MIGRAÇÃO SIMPLIFICADA: Companies e Company Licenses
-- Esta versão funciona mesmo se algumas dependências não existirem
-- ============================================================

-- ============================================
-- 1. CRIAR FUNÇÃO update_updated_at_column (se não existir)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. TABELA COMPANIES (Academias B2B)
-- ============================================

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações da empresa
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  cnpj TEXT,
  address JSONB,
  
  -- Plano contratado
  plan_type TEXT NOT NULL CHECK (plan_type IN ('academy_starter_mini', 'academy_starter', 'academy_growth', 'academy_pro')),
  plan_name TEXT NOT NULL,
  max_licenses INTEGER NOT NULL,
  
  -- Código Mestre
  master_code TEXT UNIQUE NOT NULL,
  code_generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  
  -- Pagamento
  cakto_transaction_id TEXT UNIQUE,
  cakto_checkout_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  monthly_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  
  -- Datas
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  
  -- Relacionamentos (podem ser NULL se as tabelas não existirem)
  subscription_id UUID,
  owner_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar foreign keys apenas se as tabelas existirem
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions') THEN
    ALTER TABLE public.companies 
    ADD CONSTRAINT fk_companies_subscription 
    FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE SET NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.companies 
    ADD CONSTRAINT fk_companies_owner 
    FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_companies_email ON public.companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_master_code ON public.companies(master_code);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_plan_type ON public.companies(plan_type);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_id ON public.companies(subscription_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. TABELA COMPANY_LICENSES (Licenças Ativas)
-- ============================================

CREATE TABLE IF NOT EXISTS public.company_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  
  -- Datas
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Metadados
  activated_by TEXT,
  notes TEXT,
  
  -- Relacionamento com subscription
  subscription_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Uma licença por usuário por empresa
  CONSTRAINT unique_user_company UNIQUE (company_id, user_id)
);

-- Adicionar foreign keys apenas se as tabelas existirem
DO $$
BEGIN
  ALTER TABLE public.company_licenses 
  ADD CONSTRAINT fk_company_licenses_company 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.company_licenses 
    ADD CONSTRAINT fk_company_licenses_user 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions') THEN
    ALTER TABLE public.company_licenses 
    ADD CONSTRAINT fk_company_licenses_subscription 
    FOREIGN KEY (subscription_id) REFERENCES public.user_subscriptions(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_company_licenses_company_id ON public.company_licenses(company_id);
CREATE INDEX IF NOT EXISTS idx_company_licenses_user_id ON public.company_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_company_licenses_status ON public.company_licenses(status);
CREATE INDEX IF NOT EXISTS idx_company_licenses_subscription_id ON public.company_licenses(subscription_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_company_licenses_updated_at ON public.company_licenses;
CREATE TRIGGER update_company_licenses_updated_at 
  BEFORE UPDATE ON public.company_licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. FUNÇÃO PARA GERAR CÓDIGO MESTRE ÚNICO
-- ============================================

CREATE OR REPLACE FUNCTION generate_master_code()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'ACADEMIA';
  random_suffix TEXT;
  final_code TEXT;
BEGIN
  LOOP
    -- Gerar sufixo aleatório (3 letras maiúsculas)
    random_suffix := upper(substring(md5(random()::text) from 1 for 3));
    final_code := prefix || '-' || random_suffix;
    
    -- Verificar se já existe
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.companies WHERE master_code = final_code);
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. FUNÇÃO PARA CONTAR LICENÇAS ATIVAS
-- ============================================

CREATE OR REPLACE FUNCTION get_active_licenses_count(company_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.company_licenses
    WHERE company_id = company_uuid
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. VIEW PARA RESUMO DE COMPANIES
-- ============================================

CREATE OR REPLACE VIEW public.companies_summary AS
SELECT 
  c.id,
  c.name,
  c.email,
  c.master_code,
  c.plan_type,
  c.plan_name,
  c.max_licenses,
  c.status,
  c.payment_status,
  c.monthly_amount,
  c.started_at,
  c.next_billing_date,
  get_active_licenses_count(c.id) as licenses_used,
  (c.max_licenses - get_active_licenses_count(c.id)) as licenses_available,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
    THEN (SELECT u.username FROM public.users u WHERE u.id = c.owner_id)
    ELSE NULL
  END as owner_username,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
    THEN (SELECT u.nome FROM public.users u WHERE u.id = c.owner_id)
    ELSE NULL
  END as owner_name
FROM public.companies c;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS apenas em tabelas (não em views)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_licenses ENABLE ROW LEVEL SECURITY;

-- Política simplificada: Companies podem ver seus próprios dados
DROP POLICY IF EXISTS "Companies can view own data" ON public.companies;
CREATE POLICY "Companies can view own data"
  ON public.companies FOR SELECT
  USING (
    auth.uid() = owner_id OR
    (EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
     AND EXISTS (
       SELECT 1 FROM public.users
       WHERE users.id = auth.uid()
         AND users.gym_role = 'admin'
         AND users.gym_id = companies.id::text
     ))
  );

-- Política: Apenas admins podem criar/editar companies
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
CREATE POLICY "Admins can manage companies"
  ON public.companies FOR ALL
  USING (
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND (users.username = 'dev123' OR users.username = 'Desenvolvedor' OR users.username = 'Administrador')
    )
  );

-- Política: Company licenses podem ser vistas por admins da empresa
DROP POLICY IF EXISTS "Company admins can view licenses" ON public.company_licenses;
CREATE POLICY "Company admins can view licenses"
  ON public.company_licenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_licenses.company_id
        AND (
          c.owner_id = auth.uid() OR
          (EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
           AND EXISTS (
             SELECT 1 FROM public.users
             WHERE users.id = auth.uid()
               AND users.gym_role = 'admin'
               AND users.gym_id = c.id::text
           ))
        )
    )
  );

-- Política: Usuários podem ver suas próprias licenças
DROP POLICY IF EXISTS "Users can view own license" ON public.company_licenses;
CREATE POLICY "Users can view own license"
  ON public.company_licenses FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- 8. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE public.companies IS 'Empresas B2B (Academias) que contratam planos';
COMMENT ON COLUMN public.companies.master_code IS 'Código Mestre único para ativação de alunos';
COMMENT ON COLUMN public.companies.max_licenses IS 'Número máximo de licenças do plano (10, 20, 50, 100)';
COMMENT ON COLUMN public.companies.owner_id IS 'ID do usuário admin da academia';

COMMENT ON TABLE public.company_licenses IS 'Licenças ativas vinculadas a empresas B2B';
COMMENT ON COLUMN public.company_licenses.company_id IS 'ID da empresa (academia)';
COMMENT ON COLUMN public.company_licenses.user_id IS 'ID do aluno que está usando a licença';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================

