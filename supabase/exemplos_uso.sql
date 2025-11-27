-- ============================================================================
-- Exemplos Práticos de Uso - Controle de Planos, Voz e Chat
-- ============================================================================

-- ============================================================================
-- EXEMPLOS COM CUPONS
-- ============================================================================

-- 1. Criar um cupom para academias parceiras
INSERT INTO public.coupons (
    code, 
    plan_linked, 
    max_uses, 
    description,
    valid_until
) VALUES (
    'ACADEMIA-VIP',
    'academy_starter',
    100,
    'Cupom especial para academias parceiras - Plano Starter',
    NOW() + INTERVAL '1 year'
);

-- 2. Criar um cupom com desconto percentual
INSERT INTO public.coupons (
    code,
    plan_linked,
    max_uses,
    description,
    discount_percentage,
    valid_until
) VALUES (
    'DESCONTO50',
    'monthly',
    50,
    '50% de desconto no plano mensal',
    50.00,
    NOW() + INTERVAL '30 days'
);

-- 3. Aplicar um cupom a um usuário
-- Substitua 'user-uuid-aqui' pelo UUID real do usuário
SELECT validate_and_apply_coupon('ACADEMIA-VIP', 'user-uuid-aqui');

-- 4. Verificar cupons disponíveis
SELECT 
    code,
    plan_linked,
    max_uses,
    current_uses,
    (max_uses - current_uses) as remaining_uses,
    is_active,
    valid_until,
    description
FROM public.coupons
WHERE is_active = TRUE
  AND (valid_until IS NULL OR valid_until > NOW())
  AND current_uses < max_uses
ORDER BY created_at DESC;

-- ============================================================================
-- EXEMPLOS COM CONTROLE DE PLANOS
-- ============================================================================

-- 5. Atualizar plano de um usuário
UPDATE public.users
SET 
    plan_type = 'monthly',
    subscription_status = 'active',
    expiry_date = NOW() + INTERVAL '1 month',
    updated_at = NOW()
WHERE id = 'user-uuid-aqui';

-- 6. Verificar status de planos dos usuários
SELECT 
    id,
    nome,
    username,
    plan_type,
    subscription_status,
    expiry_date,
    CASE 
        WHEN expiry_date IS NULL THEN 'Sem expiração'
        WHEN expiry_date > NOW() THEN 'Válido'
        ELSE 'Expirado'
    END as status_descricao
FROM public.users
WHERE plan_type != 'free'
ORDER BY expiry_date DESC;

-- 7. Marcar plano como expirado (executar periodicamente)
UPDATE public.users
SET subscription_status = 'expired'
WHERE expiry_date IS NOT NULL
  AND expiry_date < NOW()
  AND subscription_status = 'active';

-- ============================================================================
-- EXEMPLOS COM CONTROLE DE VOZ
-- ============================================================================

-- 8. Verificar limite de voz de um usuário
SELECT 
    id,
    nome,
    voice_daily_limit_seconds,
    voice_used_today_seconds,
    voice_balance_upsell,
    (voice_daily_limit_seconds - voice_used_today_seconds) as remaining_today,
    (voice_daily_limit_seconds - voice_used_today_seconds + voice_balance_upsell) as total_available,
    last_usage_date
FROM public.users
WHERE id = 'user-uuid-aqui';

-- 9. Registrar uso de voz (exemplo: 60 segundos usados)
UPDATE public.users
SET 
    voice_used_today_seconds = voice_used_today_seconds + 60,
    last_usage_date = CURRENT_DATE,
    updated_at = NOW()
WHERE id = 'user-uuid-aqui';

-- 10. Comprar minutos adicionais (upsell)
UPDATE public.users
SET 
    voice_balance_upsell = voice_balance_upsell + 1800, -- +30 minutos
    updated_at = NOW()
WHERE id = 'user-uuid-aqui';

-- 11. Resetar contadores diários (executar diariamente via cron)
SELECT reset_daily_counters();

-- ============================================================================
-- EXEMPLOS COM CONTROLE DE CHAT
-- ============================================================================

-- 12. Verificar limite de mensagens de um usuário
SELECT 
    id,
    nome,
    text_msg_count_today,
    last_msg_date,
    CASE 
        WHEN plan_type = 'free' THEN 50
        WHEN plan_type = 'monthly' THEN 500
        WHEN plan_type = 'annual' THEN 500
        ELSE -1 -- Ilimitado
    END as daily_limit
FROM public.users
WHERE id = 'user-uuid-aqui';

-- 13. Registrar envio de mensagem
UPDATE public.users
SET 
    text_msg_count_today = text_msg_count_today + 1,
    last_msg_date = CURRENT_DATE,
    updated_at = NOW()
WHERE id = 'user-uuid-aqui';

-- 14. Verificar se usuário pode enviar mais mensagens hoje
SELECT 
    id,
    nome,
    text_msg_count_today,
    CASE 
        WHEN plan_type = 'free' THEN 50
        WHEN plan_type = 'monthly' THEN 500
        WHEN plan_type = 'annual' THEN 500
        ELSE 999999 -- Ilimitado
    END as daily_limit,
    CASE 
        WHEN plan_type IN ('academy_starter', 'academy_growth', 'personal_team') THEN TRUE
        WHEN text_msg_count_today < CASE 
            WHEN plan_type = 'free' THEN 50
            WHEN plan_type = 'monthly' THEN 500
            WHEN plan_type = 'annual' THEN 500
            ELSE 999999
        END THEN TRUE
        ELSE FALSE
    END as can_send_message
FROM public.users
WHERE id = 'user-uuid-aqui';

-- ============================================================================
-- EXEMPLOS DE CONSULTAS ÚTEIS
-- ============================================================================

-- 15. Usuários com plano expirando nos próximos 7 dias
SELECT 
    id,
    nome,
    username,
    plan_type,
    expiry_date,
    (expiry_date - NOW())::interval as days_until_expiry
FROM public.users
WHERE expiry_date IS NOT NULL
  AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND subscription_status = 'active'
ORDER BY expiry_date ASC;

-- 16. Estatísticas de uso de voz
SELECT 
    plan_type,
    COUNT(*) as total_users,
    AVG(voice_used_today_seconds) as avg_usage_today,
    SUM(voice_used_today_seconds) as total_usage_today,
    SUM(voice_balance_upsell) as total_upsell_balance
FROM public.users
WHERE plan_type IS NOT NULL
GROUP BY plan_type;

-- 17. Cupons mais usados
SELECT 
    code,
    plan_linked,
    current_uses,
    max_uses,
    ROUND((current_uses::numeric / max_uses::numeric) * 100, 2) as usage_percentage,
    description
FROM public.coupons
WHERE is_active = TRUE
ORDER BY current_uses DESC;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. Sempre substitua 'user-uuid-aqui' pelo UUID real do usuário
-- 2. Execute reset_daily_counters() diariamente (via cron job ou função agendada)
-- 3. Monitore planos expirados regularmente
-- 4. Use transações quando necessário para garantir consistência
-- ============================================================================

