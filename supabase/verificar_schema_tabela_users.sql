-- Script para verificar o schema completo da tabela users
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela users existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'users'
AND table_schema = 'public';

-- 2. Listar TODAS as colunas da tabela users com seus tipos
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar constraints (CHECK constraints especialmente importantes)
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'users'
AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY', 'PRIMARY KEY', 'UNIQUE');

-- 4. Verificar se existe campo de expiração (pode ter nomes diferentes)
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND (
    column_name ILIKE '%expir%' 
    OR column_name ILIKE '%expiry%'
    OR column_name ILIKE '%trial%'
    OR column_name ILIKE '%subscription%'
);

-- 5. Verificar foreign keys
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name = 'users';

-- 6. Verificar se há índices na tabela
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'users';

-- 7. Verificar valores permitidos para subscription_status (CHECK constraint)
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
AND contype = 'c'
AND pg_get_constraintdef(oid) ILIKE '%subscription_status%';

-- 8. Verificar valores permitidos para plan_type (CHECK constraint)
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
AND contype = 'c'
AND pg_get_constraintdef(oid) ILIKE '%plan_type%';

