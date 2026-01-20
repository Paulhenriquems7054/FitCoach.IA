-- ============================================
-- SCRIPT: Verificar Estrutura da Tabela PLANS
-- Use este script para verificar qual estrutura a tabela plans tem
-- ============================================

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'plans';

-- 2. Se existir, mostrar todas as colunas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'plans'
ORDER BY ordinal_position;

-- 3. Contar quantos planos existem
SELECT COUNT(*) as total_planos FROM public.plans;

-- 4. Listar planos (se existir a coluna name)
SELECT * FROM public.plans LIMIT 5;
