-- ============================================
-- QUERY PARA VERIFICAR RESULTADO DO TESTE
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se o usuário de teste existe
SELECT 
    'Usuário de Teste' as verificacao,
    id,
    nome,
    email,
    username,
    role,
    plan_type,
    subscription_status,
    created_at
FROM public.users 
WHERE email = 'teste@exemplo.com';

-- 2. Verificar recargas criadas recentemente
SELECT 
    'Recargas Criadas' as verificacao,
    id,
    user_id,
    recharge_type,
    recharge_name,
    amount_paid,
    quantity,
    status,
    payment_status,
    cakto_transaction_id,
    cakto_checkout_id,
    created_at
FROM public.recharges
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar webhooks recebidos
SELECT 
    'Webhooks Recebidos' as verificacao,
    id,
    event_type,
    cakto_transaction_id,
    checkout_id,
    processed,
    error_message,
    created_at
FROM public.cakto_webhooks
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar se há recargas para o usuário de teste
SELECT 
    'Recargas do Usuário de Teste' as verificacao,
    r.id,
    r.recharge_type,
    r.recharge_name,
    r.amount_paid,
    r.quantity,
    r.status,
    r.payment_status,
    r.created_at,
    u.email as usuario_email
FROM public.recharges r
LEFT JOIN public.users u ON r.user_id = u.id
WHERE u.email = 'teste@exemplo.com'
ORDER BY r.created_at DESC;

