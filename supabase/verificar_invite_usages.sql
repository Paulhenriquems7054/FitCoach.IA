-- Script de Verificação: Verificar se a tabela invite_usages foi criada corretamente
-- Execute este script para confirmar que a migration foi aplicada com sucesso
-- ============================================================================

-- 1. Verificar se a tabela existe
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'invite_usages';

-- 2. Verificar estrutura da tabela invite_usages
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invite_usages'
ORDER BY ordinal_position;

-- 3. Verificar índices criados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'invite_usages';

-- 4. Verificar políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'invite_usages';

-- 5. Verificar constraint CHECK (role)
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'invite_usages'::regclass
  AND contype = 'c';

-- 6. Verificar foreign key para users
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
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
  AND tc.table_name = 'invite_usages';

