-- ============================================
-- SCRIPT: Corrigir/Criar Tabela PLANS Completa
-- Execute este script se a tabela plans não tem a estrutura correta
-- ============================================

-- Opção 1: DROP e RECRIAR (⚠️ APAGA TODOS OS DADOS EXISTENTES)
-- Descomente apenas se quiser recriar do zero:
/*
DROP TABLE IF EXISTS public.plans CASCADE;

CREATE TABLE public.plans (
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
*/

-- Opção 2: ADICIONAR COLUNAS FALTANTES (Seguro, preserva dados)
-- Execute esta parte para adicionar apenas as colunas que faltam:

-- Adicionar coluna price se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'price'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Coluna price adicionada!';
    END IF;
END $$;

-- Adicionar outras colunas faltantes
DO $$
BEGIN
    -- requests_per_month
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'requests_per_month'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN requests_per_month INT NOT NULL DEFAULT 100;
    END IF;
    
    -- image_analysis_per_month
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'image_analysis_per_month'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN image_analysis_per_month INT NOT NULL DEFAULT 50;
    END IF;
    
    -- voice_messages_per_month
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'voice_messages_per_month'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN voice_messages_per_month INT NOT NULL DEFAULT 0;
    END IF;
    
    -- features
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'features'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN features JSONB DEFAULT '{
            "ai_analysis": true,
            "export_pdf": false,
            "advanced_reports": false,
            "priority_support": false,
            "custom_diet": false
        }';
    END IF;
    
    -- is_active
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- is_featured
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
    
    -- display_order
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'plans' 
        AND column_name = 'display_order'
    ) THEN
        ALTER TABLE public.plans 
        ADD COLUMN display_order INT DEFAULT 0;
    END IF;
END $$;

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_plans_active ON public.plans(is_active);

-- Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'plans'
ORDER BY ordinal_position;
