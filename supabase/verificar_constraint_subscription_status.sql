-- Verificar constraint de subscription_status para confirmar valores permitidos
-- Execute este script no SQL Editor do Supabase

SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
AND contype = 'c'
AND pg_get_constraintdef(oid) ILIKE '%subscription_status%';

-- Verificar todos os CHECK constraints da tabela users (para referência)
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
AND contype = 'c'
ORDER BY conname;

