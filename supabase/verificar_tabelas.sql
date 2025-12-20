-- ============================================================================
-- Script de Verificação: Verificar se as tabelas foram criadas corretamente
-- ============================================================================

-- 1. Verificar se as tabelas existem
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ai_usage_logs', 'ai_monthly_usage')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela ai_usage_logs
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ai_usage_logs'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela ai_monthly_usage
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ai_monthly_usage'
ORDER BY ordinal_position;

-- 4. Verificar índices criados
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('ai_usage_logs', 'ai_monthly_usage')
ORDER BY tablename, indexname;

-- 5. Contar registros (deve retornar 0 se não houver dados ainda)
SELECT 
  'ai_usage_logs' as tabela,
  COUNT(*) as total_registros
FROM public.ai_usage_logs
UNION ALL
SELECT 
  'ai_monthly_usage' as tabela,
  COUNT(*) as total_registros
FROM public.ai_monthly_usage;

