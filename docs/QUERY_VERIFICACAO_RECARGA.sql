-- ============================================================================
-- Query de Verificação de Recarga Turbo (sem boost_minutes_balance)
-- Use esta query se a coluna boost_minutes_balance ainda não foi criada
-- ============================================================================

-- 1. Verificar recarga turbo ativa
SELECT 
  r.id,
  r.recharge_name,
  r.quantity,
  r.status,
  r.valid_until,
  r.expires_at,
  CASE 
    WHEN (r.valid_until > NOW() OR (r.expires_at IS NOT NULL AND r.expires_at > NOW())) 
    THEN '✅ VÁLIDA' 
    ELSE '❌ EXPIRADA' 
  END as status_validade,
  u.username,
  u.nome
FROM recharges r
JOIN users u ON u.id = r.user_id
WHERE r.id = '037a0198-464e-4e03-a473-39156df45908';

-- 2. Verificar dados do usuário (sem boost_minutes_balance)
SELECT 
  u.username,
  u.nome,
  u.voice_used_today_seconds,
  u.voice_daily_limit_seconds,
  u.voice_balance_upsell,
  -- Calcular total disponível (sem boost)
  (u.voice_daily_limit_seconds - COALESCE(u.voice_used_today_seconds, 0)) + 
  COALESCE(u.voice_balance_upsell, 0) as total_available_seconds_sem_boost,
  -- Calcular minutos disponíveis
  ROUND(
    ((u.voice_daily_limit_seconds - COALESCE(u.voice_used_today_seconds, 0)) + 
     COALESCE(u.voice_balance_upsell, 0)) / 60.0, 
    2
  ) as total_available_minutes_sem_boost
FROM users u
WHERE u.id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114';

-- 3. Verificar todas as recargas turbo ativas do usuário
SELECT 
  r.id,
  r.recharge_name,
  r.quantity,
  r.status,
  r.valid_until,
  r.expires_at,
  CASE 
    WHEN (r.valid_until > NOW() OR (r.expires_at IS NOT NULL AND r.expires_at > NOW())) 
    THEN '✅ VÁLIDA' 
    ELSE '❌ EXPIRADA' 
  END as status_validade,
  r.created_at
FROM recharges r
WHERE r.user_id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114'
  AND r.recharge_type = 'turbo'
  AND r.status = 'active'
ORDER BY r.created_at DESC;

-- 4. Calcular total de minutos de recargas turbo válidas
SELECT 
  COALESCE(SUM(r.quantity), 0) as total_turbo_minutes_validas
FROM recharges r
WHERE r.user_id = '3197d46e-6a2c-4e2e-8714-b18e08c4f114'
  AND r.recharge_type = 'turbo'
  AND r.status = 'active'
  AND (r.valid_until > NOW() OR (r.expires_at IS NOT NULL AND r.expires_at > NOW()));

