-- ============================================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA
-- Página de Vendas → Cakto → Supabase → App
-- ============================================================
-- Execute este script no SQL Editor do Supabase para verificar
-- se tudo está funcionando corretamente
-- ============================================================

-- ============================================================
-- 1. VERIFICAR PLANOS CONFIGURADOS (app_plans)
-- ============================================================
-- Verifica se todos os planos da página de vendas estão cadastrados
SELECT 
    '=== PLANOS CONFIGURADOS ===' as secao,
    plan_group,
    slug,
    name,
    price,
    total_checkout_price,
    cakto_checkout_id,
    max_licenses,
    CASE 
        WHEN cakto_checkout_id IS NULL OR cakto_checkout_id = '' THEN '❌ SEM CHECKOUT ID'
        ELSE '✅ OK'
    END as status_checkout
FROM public.app_plans
ORDER BY 
    CASE plan_group 
        WHEN 'b2b_academia' THEN 1
        WHEN 'b2c' THEN 2
        WHEN 'personal' THEN 3
        WHEN 'recarga' THEN 4
        ELSE 5
    END,
    slug;

-- ============================================================
-- 2. VERIFICAR ACADEMIAS (COMPANIES) E SEUS PLANOS
-- ============================================================
SELECT 
    '=== ACADEMIAS CADASTRADAS ===' as secao,
    c.id,
    c.name as nome_academia,
    c.email,
    c.master_code as codigo_mestre,
    c.plan_type as plano,
    c.plan_name as nome_plano,
    c.max_licenses as max_licencas,
    c.status,
    c.payment_status as status_pagamento,
    c.monthly_amount as valor_mensal,
    c.started_at as data_inicio,
    c.next_billing_date as proxima_cobranca,
    c.cakto_checkout_id,
    c.cakto_transaction_id,
    -- Contar licenças ativas
    (SELECT COUNT(*) 
     FROM company_licenses cl 
     WHERE cl.company_id = c.id 
     AND cl.status = 'active') as licencas_ativas,
    -- Calcular licenças disponíveis
    (c.max_licenses - 
     (SELECT COUNT(*) 
      FROM company_licenses cl 
      WHERE cl.company_id = c.id 
      AND cl.status = 'active')) as licencas_disponiveis,
    CASE 
        WHEN c.status = 'active' AND c.payment_status = 'paid' THEN '✅ ATIVA E PAGA'
        WHEN c.status = 'active' AND c.payment_status != 'paid' THEN '⚠️ ATIVA MAS NÃO PAGA'
        WHEN c.status != 'active' THEN '❌ INATIVA'
        ELSE '❓ DESCONHECIDO'
    END as status_geral
FROM public.companies c
ORDER BY c.created_at DESC;

-- ============================================================
-- 3. VERIFICAR LICENÇAS DE ACADEMIAS (COMPANY_LICENSES)
-- ============================================================
SELECT 
    '=== LICENÇAS DE ACADEMIAS ===' as secao,
    cl.id,
    c.name as academia,
    c.master_code as codigo_academia,
    u.username as usuario,
    u.email as email_usuario,
    cl.status,
    cl.activated_at as data_ativacao,
    cl.revoked_at as data_revogacao,
    CASE 
        WHEN cl.status = 'active' THEN '✅ ATIVA'
        WHEN cl.status = 'revoked' THEN '❌ REVOGADA'
        WHEN cl.status = 'expired' THEN '⏰ EXPIRADA'
        ELSE '❓ DESCONHECIDO'
    END as status_licenca
FROM public.company_licenses cl
LEFT JOIN public.companies c ON cl.company_id = c.id
LEFT JOIN public.users u ON cl.user_id = u.id
ORDER BY cl.activated_at DESC
LIMIT 50;

-- ============================================================
-- 4. VERIFICAR ASSINATURAS B2C (USER_SUBSCRIPTIONS)
-- ============================================================
SELECT 
    '=== ASSINATURAS B2C (INDIVIDUAIS) ===' as secao,
    us.id,
    us.user_email as email,
    u.username,
    us.plan_slug as plano,
    us.plan_group as grupo,
    us.status,
    us.amount_paid as valor_pago,
    us.cakto_checkout_id,
    us.cakto_transaction_id,
    us.created_at as data_criacao,
    us.updated_at as ultima_atualizacao,
    CASE 
        WHEN us.status = 'active' THEN '✅ ATIVA'
        WHEN us.status = 'canceled' THEN '❌ CANCELADA'
        WHEN us.status = 'expired' THEN '⏰ EXPIRADA'
        ELSE '❓ DESCONHECIDO'
    END as status_assinatura
FROM public.user_subscriptions us
LEFT JOIN public.users u ON us.user_email = u.email
ORDER BY us.created_at DESC
LIMIT 50;

-- ============================================================
-- 5. VERIFICAR ASSINATURAS DE ACADEMIAS (ACADEMY_SUBSCRIPTIONS)
-- ============================================================
SELECT 
    '=== ASSINATURAS DE ACADEMIAS ===' as secao,
    acs.id,
    acs.academy_email as email_academia,
    acs.plan_slug as plano,
    acs.plan_group as grupo,
    acs.status,
    acs.amount_paid as valor_pago,
    acs.max_licenses as max_licencas,
    acs.cakto_checkout_id,
    acs.cakto_transaction_id,
    acs.created_at as data_criacao,
    CASE 
        WHEN acs.status = 'active' THEN '✅ ATIVA'
        WHEN acs.status = 'canceled' THEN '❌ CANCELADA'
        WHEN acs.status = 'expired' THEN '⏰ EXPIRADA'
        ELSE '❓ DESCONHECIDO'
    END as status_assinatura
FROM public.academy_subscriptions acs
ORDER BY acs.created_at DESC
LIMIT 50;

-- ============================================================
-- 6. VERIFICAR ASSINATURAS DE PERSONAL TRAINERS
-- ============================================================
SELECT 
    '=== ASSINATURAS DE PERSONAL TRAINERS ===' as secao,
    ps.id,
    ps.personal_email as email_personal,
    ps.plan_slug as plano,
    ps.plan_group as grupo,
    ps.status,
    ps.amount_paid as valor_pago,
    ps.max_licenses as max_licencas,
    ps.cakto_checkout_id,
    ps.cakto_transaction_id,
    ps.created_at as data_criacao,
    CASE 
        WHEN ps.status = 'active' THEN '✅ ATIVA'
        WHEN ps.status = 'canceled' THEN '❌ CANCELADA'
        WHEN ps.status = 'expired' THEN '⏰ EXPIRADA'
        ELSE '❓ DESCONHECIDO'
    END as status_assinatura
FROM public.personal_subscriptions ps
ORDER BY ps.created_at DESC
LIMIT 50;

-- ============================================================
-- 7. VERIFICAR RECARGAS (RECHARGES)
-- ============================================================
SELECT 
    '=== RECARGAS ===' as secao,
    r.id,
    r.user_email as email,
    u.username,
    r.recharge_slug as tipo_recarga,
    r.recharge_name as nome_recarga,
    r.amount_paid as valor_pago,
    r.quantity as quantidade,
    r.status,
    r.valid_from as valido_de,
    r.valid_until as valido_ate,
    r.expires_at as expira_em,
    r.used_at as usado_em,
    r.cakto_checkout_id,
    r.cakto_transaction_id,
    r.created_at as data_criacao,
    CASE 
        WHEN r.status = 'active' AND (r.expires_at IS NULL OR r.expires_at > NOW()) THEN '✅ ATIVA'
        WHEN r.status = 'active' AND r.expires_at <= NOW() THEN '⏰ EXPIRADA'
        WHEN r.status = 'used' THEN '✅ USADA'
        WHEN r.status = 'canceled' THEN '❌ CANCELADA'
        ELSE '❓ DESCONHECIDO'
    END as status_recarga
FROM public.recharges r
LEFT JOIN public.users u ON r.user_email = u.email
ORDER BY r.created_at DESC
LIMIT 50;

-- ============================================================
-- 8. VERIFICAR CUPONS DE CONVITE (COUPONS)
-- ============================================================
SELECT 
    '=== CUPONS DE CONVITE ===' as secao,
    c.id,
    c.code as codigo,
    c.plan_linked as plano_vinculado,
    c.max_uses as max_usos,
    c.current_uses as usos_atuais,
    (c.max_uses - c.current_uses) as usos_restantes,
    c.is_active as ativo,
    c.valid_from as valido_de,
    c.valid_until as valido_ate,
    c.created_at as data_criacao,
    CASE 
        WHEN c.is_active = false THEN '❌ INATIVO'
        WHEN c.current_uses >= c.max_uses THEN '⚠️ ESGOTADO'
        WHEN c.valid_until IS NOT NULL AND c.valid_until < NOW() THEN '⏰ EXPIRADO'
        WHEN c.valid_from IS NOT NULL AND c.valid_from > NOW() THEN '⏳ AINDA NÃO VÁLIDO'
        ELSE '✅ DISPONÍVEL'
    END as status_cupom
FROM public.coupons c
ORDER BY c.created_at DESC
LIMIT 50;

-- ============================================================
-- 9. VERIFICAR WEBHOOKS RECEBIDOS DA CAKTO
-- ============================================================
-- (Se a tabela cakto_webhooks existir)
SELECT 
    '=== WEBHOOKS DA CAKTO ===' as secao,
    cw.id,
    cw.type as tipo_evento,
    cw.status as status_processamento,
    cw.error_message as erro,
    cw.created_at as data_recebimento,
    CASE 
        WHEN cw.status = 'success' THEN '✅ SUCESSO'
        WHEN cw.status = 'failed' THEN '❌ FALHOU'
        WHEN cw.status = 'pending' THEN '⏳ PENDENTE'
        ELSE '❓ DESCONHECIDO'
    END as status_webhook
FROM public.cakto_webhooks cw
ORDER BY cw.created_at DESC
LIMIT 50;

-- ============================================================
-- 10. RESUMO GERAL DO SISTEMA
-- ============================================================
SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Planos Configurados' as metrica,
    COUNT(*)::text as valor
FROM public.app_plans
WHERE cakto_checkout_id IS NOT NULL AND cakto_checkout_id != ''

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Academias Ativas' as metrica,
    COUNT(*)::text as valor
FROM public.companies
WHERE status = 'active' AND payment_status = 'paid'

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Licenças Ativas' as metrica,
    COUNT(*)::text as valor
FROM public.company_licenses
WHERE status = 'active'

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Assinaturas B2C Ativas' as metrica,
    COUNT(*)::text as valor
FROM public.user_subscriptions
WHERE status = 'active'

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Assinaturas de Academias Ativas' as metrica,
    COUNT(*)::text as valor
FROM public.academy_subscriptions
WHERE status = 'active'

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Assinaturas de Personal Trainers Ativas' as metrica,
    COUNT(*)::text as valor
FROM public.personal_subscriptions
WHERE status = 'active'

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Recargas Ativas' as metrica,
    COUNT(*)::text as valor
FROM public.recharges
WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW())

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Cupons Disponíveis' as metrica,
    COUNT(*)::text as valor
FROM public.coupons
WHERE is_active = true 
AND current_uses < max_uses
AND (valid_until IS NULL OR valid_until > NOW());

-- ============================================================
-- 11. VERIFICAR PROBLEMAS COMUNS
-- ============================================================
SELECT 
    '=== PROBLEMAS DETECTADOS ===' as secao,
    'Planos sem checkout_id' as problema,
    COUNT(*)::text as quantidade
FROM public.app_plans
WHERE cakto_checkout_id IS NULL OR cakto_checkout_id = ''

UNION ALL

SELECT 
    '=== PROBLEMAS DETECTADOS ===' as secao,
    'Academias ativas sem pagamento' as problema,
    COUNT(*)::text as quantidade
FROM public.companies
WHERE status = 'active' AND payment_status != 'paid'

UNION ALL

SELECT 
    '=== PROBLEMAS DETECTADOS ===' as secao,
    'Academias com licenças esgotadas' as problema,
    COUNT(*)::text as quantidade
FROM public.companies c
WHERE c.status = 'active'
AND (
    SELECT COUNT(*) 
    FROM public.company_licenses cl 
    WHERE cl.company_id = c.id 
    AND cl.status = 'active'
) >= c.max_licenses

UNION ALL

SELECT 
    '=== PROBLEMAS DETECTADOS ===' as secao,
    'Recargas expiradas ainda marcadas como ativas' as problema,
    COUNT(*)::text as quantidade
FROM public.recharges
WHERE status = 'active' 
AND expires_at IS NOT NULL 
AND expires_at <= NOW()

UNION ALL

SELECT 
    '=== PROBLEMAS DETECTADOS ===' as secao,
    'Cupons expirados ainda marcados como ativos' as problema,
    COUNT(*)::text as quantidade
FROM public.coupons
WHERE is_active = true 
AND valid_until IS NOT NULL 
AND valid_until < NOW();

-- ============================================================
-- 12. VERIFICAR VÍNCULOS USUÁRIO ↔ ACADEMIA
-- ============================================================
SELECT 
    '=== VÍNCULOS USUÁRIO ↔ ACADEMIA ===' as secao,
    u.id as user_id,
    u.username,
    u.email,
    u.gym_id,
    u.gym_role as papel,
    c.name as academia,
    c.master_code as codigo_academia,
    c.status as status_academia,
    cl.status as status_licenca,
    CASE 
        WHEN u.gym_id IS NOT NULL AND c.status = 'active' AND cl.status = 'active' THEN '✅ VÍNCULO ATIVO'
        WHEN u.gym_id IS NOT NULL AND c.status != 'active' THEN '⚠️ ACADEMIA INATIVA'
        WHEN u.gym_id IS NOT NULL AND cl.status != 'active' THEN '⚠️ LICENÇA INATIVA'
        WHEN u.gym_id IS NULL THEN 'ℹ️ SEM VÍNCULO'
        ELSE '❓ DESCONHECIDO'
    END as status_vinculo
FROM public.users u
LEFT JOIN public.companies c ON u.gym_id = c.id
LEFT JOIN public.company_licenses cl ON cl.user_id = u.id AND cl.company_id = c.id
WHERE u.gym_id IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 50;

-- ============================================================
-- FIM DO DIAGNÓSTICO
-- ============================================================
-- 
-- INTERPRETAÇÃO DOS RESULTADOS:
-- 
-- ✅ = Tudo OK
-- ⚠️ = Atenção necessária
-- ❌ = Problema detectado
-- ❓ = Status desconhecido
-- ⏰ = Expirado
-- ⏳ = Ainda não válido
-- 
-- Se encontrar problemas, verifique:
-- 1. Planos sem checkout_id → Configure na tabela app_plans
-- 2. Academias sem pagamento → Verifique webhook da Cakto
-- 3. Licenças esgotadas → Academia precisa fazer upgrade
-- 4. Recargas/Cupons expirados → Atualize status manualmente
-- 
-- ============================================================

