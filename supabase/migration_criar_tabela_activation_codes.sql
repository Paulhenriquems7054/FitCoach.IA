-- Migration: Criar tabela de códigos de ativação (B2B e Personais)
-- Data: 2025-01-27

-- Tabela para armazenar códigos de ativação para planos B2B e Personais
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Código de ativação (ex: "ACADEMIA-X", "PERSONAL-Y")
    code TEXT NOT NULL UNIQUE,
    
    -- Tipo de código
    type TEXT NOT NULL CHECK (type IN ('b2b', 'personal')),
    
    -- Vinculação (opcional)
    company_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
    personal_trainer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Plano vinculado
    plan_type TEXT NOT NULL, -- Referência ao name do subscription_plans
    
    -- Controle de licenças
    licenses_total INTEGER NOT NULL DEFAULT 1,
    licenses_used INTEGER NOT NULL DEFAULT 0,
    
    -- Validade
    expires_at TIMESTAMPTZ, -- NULL = não expira
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadados
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON public.activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_type ON public.activation_codes(type);
CREATE INDEX IF NOT EXISTS idx_activation_codes_company_id ON public.activation_codes(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activation_codes_personal_trainer_id ON public.activation_codes(personal_trainer_id) WHERE personal_trainer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activation_codes_is_active ON public.activation_codes(is_active) WHERE is_active = true;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_activation_codes_updated_at ON public.activation_codes;
CREATE TRIGGER update_activation_codes_updated_at BEFORE UPDATE ON public.activation_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.activation_codes IS 'Códigos de ativação para planos B2B (academias) e Personais (personal trainers)';
COMMENT ON COLUMN public.activation_codes.code IS 'Código único de ativação (ex: "ACADEMIA-X")';
COMMENT ON COLUMN public.activation_codes.type IS 'Tipo: b2b (academia) ou personal (personal trainer)';
COMMENT ON COLUMN public.activation_codes.plan_type IS 'Tipo de plano vinculado (name do subscription_plans)';
COMMENT ON COLUMN public.activation_codes.licenses_total IS 'Total de licenças disponíveis no código';
COMMENT ON COLUMN public.activation_codes.licenses_used IS 'Número de licenças já utilizadas';

-- RLS (Row Level Security)
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler códigos ativos (para validação)
CREATE POLICY "Anyone can read active activation codes"
    ON public.activation_codes
    FOR SELECT
    USING (is_active = true);

-- Política: Apenas admins podem criar/atualizar códigos
-- (Ajustar conforme necessário baseado no seu sistema de permissões)
CREATE POLICY "Admins can manage activation codes"
    ON public.activation_codes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND (users.gym_role = 'admin' OR users.role = 'professional')
        )
    );

