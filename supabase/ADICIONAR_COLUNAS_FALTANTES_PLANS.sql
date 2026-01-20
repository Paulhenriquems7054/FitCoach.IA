-- ============================================
-- SCRIPT: Adicionar Colunas Faltantes na Tabela PLANS
-- Adiciona colunas opcionais para completar a estrutura do sistema de billing
-- ============================================

-- Adicionar coluna description (opcional, mas útil)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN description TEXT;
        RAISE NOTICE 'Coluna description adicionada!';
    ELSE
        RAISE NOTICE 'Coluna description já existe.';
    END IF;
END $$;

-- Adicionar coluna stripe_price_id (para integração Stripe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'stripe_price_id'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN stripe_price_id VARCHAR(100);
        RAISE NOTICE 'Coluna stripe_price_id adicionada!';
    ELSE
        RAISE NOTICE 'Coluna stripe_price_id já existe.';
    END IF;
END $$;

-- Adicionar coluna updated_at (controle de atualização)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada!';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe.';
    END IF;
END $$;

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'plans'
ORDER BY ordinal_position;

-- Teste: Verificar se a query funciona agora
SELECT name, price, requests_per_month FROM plans;
