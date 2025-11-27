-- ============================================================================
-- Script de Verificação da Migração
-- Execute este script para verificar se todos os campos e tabelas foram criados
-- ============================================================================

-- 1. Verificar campos adicionados na tabela users
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN (
    'plan_type', 
    'subscription_status', 
    'expiry_date',
    'voice_daily_limit_seconds',
    'voice_used_today_seconds',
    'voice_balance_upsell',
    'last_usage_date',
    'text_msg_count_today',
    'last_msg_date'
  )
ORDER BY column_name;

-- 2. Verificar se a tabela coupons foi criada
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'coupons';

-- 3. Verificar colunas da tabela coupons
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'coupons'
ORDER BY ordinal_position;

-- 4. Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'validate_and_apply_coupon',
    'reset_daily_counters'
  );

-- 5. Verificar se os índices foram criados
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND (
    indexname LIKE 'idx_users_plan%' OR
    indexname LIKE 'idx_users_subscription%' OR
    indexname LIKE 'idx_users_expiry%' OR
    indexname LIKE 'idx_users_last_usage%' OR
    indexname LIKE 'idx_users_last_msg%' OR
    indexname LIKE 'idx_coupons%'
  )
ORDER BY tablename, indexname;

-- 6. Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
  AND trigger_name = 'update_coupons_updated_at';

-- ============================================================================
-- Resumo: Se todas as queries acima retornarem resultados, a migração foi bem-sucedida!
-- ============================================================================

