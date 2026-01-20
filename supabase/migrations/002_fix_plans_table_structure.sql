-- ============================================
-- MIGRATION: Corrigir Estrutura da Tabela PLANS
-- Criado: 17/01/2026
-- Problema: Tabela plans pode não ter a coluna "price"
-- ============================================

-- Verificar se a tabela existe e qual estrutura tem
DO $$
BEGIN
    -- Se a tabela não existe, criar do zero
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'plans') THEN
        
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
        
        RAISE NOTICE 'Tabela plans criada com sucesso!';
        
    ELSE
        -- Tabela existe, verificar se tem a coluna price
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'plans' 
            AND column_name = 'price'
        ) THEN
            -- Adicionar coluna price se não existir
            ALTER TABLE public.plans 
            ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0;
            
            RAISE NOTICE 'Coluna price adicionada à tabela plans!';
        ELSE
            RAISE NOTICE 'Tabela plans já tem a coluna price.';
        END IF;
        
        -- Verificar e adicionar outras colunas se necessário
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'plans' 
            AND column_name = 'requests_per_month'
        ) THEN
            ALTER TABLE public.plans 
            ADD COLUMN requests_per_month INT NOT NULL DEFAULT 100;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'plans' 
            AND column_name = 'image_analysis_per_month'
        ) THEN
            ALTER TABLE public.plans 
            ADD COLUMN image_analysis_per_month INT NOT NULL DEFAULT 50;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'plans' 
            AND column_name = 'voice_messages_per_month'
        ) THEN
            ALTER TABLE public.plans 
            ADD COLUMN voice_messages_per_month INT NOT NULL DEFAULT 0;
        END IF;
        
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
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'plans' 
            AND column_name = 'is_active'
        ) THEN
            ALTER TABLE public.plans 
            ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'plans' 
            AND column_name = 'is_featured'
        ) THEN
            ALTER TABLE public.plans 
            ADD COLUMN is_featured BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'plans' 
            AND column_name = 'display_order'
        ) THEN
            ALTER TABLE public.plans 
            ADD COLUMN display_order INT DEFAULT 0;
        END IF;
    END IF;
END $$;

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
