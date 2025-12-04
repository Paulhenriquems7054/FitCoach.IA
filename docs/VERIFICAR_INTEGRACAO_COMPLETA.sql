-- ============================================================
-- VERIFICAÇÃO DE INTEGRAÇÃO COMPLETA
-- Página de Vendas → Cakto → Supabase → App
-- ============================================================
-- Esta query verifica se toda a cadeia de integração está funcionando
-- ============================================================

-- ============================================================
-- 1. VERIFICAR CONFIGURAÇÃO DA PÁGINA DE VENDAS (app_plans)
-- ============================================================
SELECT 
    '=== 1. PÁGINA DE VENDAS (app_plans) ===' as secao,
    COUNT(*) as total_planos,
    COUNT(CASE WHEN cakto_checkout_id IS NOT NULL AND cakto_checkout_id != '' THEN 1 END) as planos_com_checkout_id,
    COUNT(CASE WHEN cakto_checkout_id IS NULL OR cakto_checkout_id = '' THEN 1 END) as planos_sem_checkout_id,
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN cakto_checkout_id IS NOT NULL AND cakto_checkout_id != '' THEN 1 END) 
        THEN '✅ TODOS OS PLANOS CONFIGURADOS'
        ELSE '⚠️ ALGUNS PLANOS SEM CHECKOUT_ID'
    END as status
FROM public.app_plans
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans');

-- Detalhes dos planos
SELECT 
    '=== 1.1. DETALHES DOS PLANOS ===' as secao,
    plan_group as grupo,
    slug,
    name as nome,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL OR cakto_checkout_id = '' THEN '❌ SEM CHECKOUT_ID'
        WHEN cakto_checkout_id LIKE '%PREENCHER%' THEN '⚠️ CHECKOUT_ID PENDENTE'
        ELSE '✅ CONFIGURADO'
    END as status_checkout
FROM public.app_plans
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
ORDER BY plan_group, slug;

-- ============================================================
-- 2. VERIFICAR WEBHOOKS DA CAKTO (cakto_webhooks)
-- ============================================================
SELECT 
    '=== 2. WEBHOOKS DA CAKTO (cakto_webhooks) ===' as secao,
    COUNT(*) as total_webhooks,
    COUNT(CASE WHEN processed = true THEN 1 END) as webhooks_processados,
    COUNT(CASE WHEN processed = false THEN 1 END) as webhooks_pendentes,
    COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as webhooks_com_erro,
    CASE 
        WHEN COUNT(*) = 0 THEN '⚠️ NENHUM WEBHOOK RECEBIDO AINDA'
        WHEN COUNT(CASE WHEN processed = false THEN 1 END) > 0 THEN '⚠️ WEBHOOKS PENDENTES DE PROCESSAMENTO'
        WHEN COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) > 0 THEN '⚠️ ALGUNS WEBHOOKS COM ERRO'
        ELSE '✅ TODOS OS WEBHOOKS PROCESSADOS'
    END as status
FROM public.cakto_webhooks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks');

-- Últimos webhooks recebidos
SELECT 
    '=== 2.1. ÚLTIMOS WEBHOOKS RECEBIDOS ===' as secao,
    event_type as tipo_evento,
    checkout_id,
    cakto_transaction_id,
    processed as processado,
    error_message as erro,
    created_at as data_recebimento,
    CASE 
        WHEN processed = true THEN '✅ PROCESSADO'
        WHEN processed = false AND error_message IS NULL THEN '⏳ PENDENTE'
        WHEN processed = false AND error_message IS NOT NULL THEN '❌ ERRO'
        ELSE '❓ DESCONHECIDO'
    END as status
FROM public.cakto_webhooks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- 3. VERIFICAR ASSINATURAS CRIADAS (user_subscriptions)
-- ============================================================
SELECT 
    '=== 3. ASSINATURAS B2C (user_subscriptions) ===' as secao,
    COUNT(*) as total_assinaturas,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as assinaturas_ativas,
    COUNT(CASE WHEN status = 'canceled' THEN 1 END) as assinaturas_canceladas,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as assinaturas_expiradas,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ℹ️ NENHUMA ASSINATURA CRIADA AINDA'
        WHEN COUNT(CASE WHEN status = 'active' THEN 1 END) > 0 THEN '✅ HÁ ASSINATURAS ATIVAS'
        ELSE '⚠️ NENHUMA ASSINATURA ATIVA'
    END as status
FROM public.user_subscriptions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions');

-- ============================================================
-- 4. VERIFICAR ACADEMIAS (companies) - B2B
-- ============================================================
SELECT 
    '=== 4. ACADEMIAS B2B (companies) ===' as secao,
    COUNT(*) as total_academias,
    COUNT(CASE WHEN status = 'active' AND payment_status = 'paid' THEN 1 END) as academias_ativas_pagas,
    COUNT(CASE WHEN status = 'active' AND payment_status != 'paid' THEN 1 END) as academias_ativas_sem_pagamento,
    COUNT(CASE WHEN status != 'active' THEN 1 END) as academias_inativas,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ℹ️ NENHUMA ACADEMIA CADASTRADA AINDA'
        WHEN COUNT(CASE WHEN status = 'active' AND payment_status = 'paid' THEN 1 END) > 0 THEN '✅ HÁ ACADEMIAS ATIVAS E PAGAS'
        WHEN COUNT(CASE WHEN status = 'active' AND payment_status != 'paid' THEN 1 END) > 0 THEN '⚠️ ACADEMIAS ATIVAS MAS SEM PAGAMENTO'
        ELSE '⚠️ NENHUMA ACADEMIA ATIVA'
    END as status
FROM public.companies
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies');

-- ============================================================
-- 5. VERIFICAR LICENÇAS DE ACADEMIAS (company_licenses)
-- ============================================================
SELECT 
    '=== 5. LICENÇAS DE ACADEMIAS (company_licenses) ===' as secao,
    COUNT(*) as total_licencas,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as licencas_ativas,
    COUNT(CASE WHEN status = 'revoked' THEN 1 END) as licencas_revogadas,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ℹ️ NENHUMA LICENÇA CRIADA AINDA'
        WHEN COUNT(CASE WHEN status = 'active' THEN 1 END) > 0 THEN '✅ HÁ LICENÇAS ATIVAS'
        ELSE '⚠️ NENHUMA LICENÇA ATIVA'
    END as status
FROM public.company_licenses
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses');

-- ============================================================
-- 6. VERIFICAR RECARGAS (recharges)
-- ============================================================
SELECT 
    '=== 6. RECARGAS (recharges) ===' as secao,
    COUNT(*) as total_recargas,
    COUNT(CASE WHEN status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 END) as recargas_ativas,
    COUNT(CASE WHEN status = 'used' THEN 1 END) as recargas_usadas,
    COUNT(CASE WHEN status = 'active' AND expires_at <= NOW() THEN 1 END) as recargas_expiradas,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ℹ️ NENHUMA RECARGA CRIADA AINDA'
        WHEN COUNT(CASE WHEN status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 END) > 0 THEN '✅ HÁ RECARGAS ATIVAS'
        ELSE '⚠️ NENHUMA RECARGA ATIVA'
    END as status
FROM public.recharges
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges');

-- ============================================================
-- 7. VERIFICAR CUPONS (coupons)
-- ============================================================
SELECT 
    '=== 7. CUPONS DE CONVITE (coupons) ===' as secao,
    COUNT(*) as total_cupons,
    COUNT(CASE WHEN is_active = true AND current_uses < max_uses AND (valid_until IS NULL OR valid_until > NOW()) THEN 1 END) as cupons_disponiveis,
    COUNT(CASE WHEN is_active = false THEN 1 END) as cupons_inativos,
    COUNT(CASE WHEN current_uses >= max_uses THEN 1 END) as cupons_esgotados,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ℹ️ NENHUM CUPOM CRIADO AINDA'
        WHEN COUNT(CASE WHEN is_active = true AND current_uses < max_uses AND (valid_until IS NULL OR valid_until > NOW()) THEN 1 END) > 0 THEN '✅ HÁ CUPONS DISPONÍVEIS'
        ELSE '⚠️ NENHUM CUPOM DISPONÍVEL'
    END as status
FROM public.coupons
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons');

-- ============================================================
-- 8. RESUMO DA INTEGRAÇÃO COMPLETA
-- ============================================================
SELECT 
    '=== 8. RESUMO DA INTEGRAÇÃO ===' as secao,
    'Página de Vendas' as componente,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
        AND (SELECT COUNT(*) FROM public.app_plans WHERE cakto_checkout_id IS NOT NULL AND cakto_checkout_id != '') > 0
        THEN '✅ CONFIGURADA'
        ELSE '❌ NÃO CONFIGURADA'
    END as status

UNION ALL

SELECT 
    '=== 8. RESUMO DA INTEGRAÇÃO ===' as secao,
    'Cakto → Supabase (Webhooks)' as componente,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
        AND (SELECT COUNT(*) FROM public.cakto_webhooks) > 0
        THEN '✅ RECEBENDO WEBHOOKS'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
        THEN '⚠️ TABELA EXISTE MAS NENHUM WEBHOOK RECEBIDO'
        ELSE '⚠️ TABELA NÃO EXISTE (opcional)'
    END as status

UNION ALL

SELECT 
    '=== 8. RESUMO DA INTEGRAÇÃO ===' as secao,
    'Supabase → App (Assinaturas)' as componente,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
        AND (SELECT COUNT(*) FROM public.user_subscriptions WHERE status = 'active') > 0
        THEN '✅ ASSINATURAS ATIVAS NO APP'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
        THEN '⚠️ TABELA EXISTE MAS NENHUMA ASSINATURA ATIVA'
        ELSE '❌ TABELA NÃO EXISTE'
    END as status

UNION ALL

SELECT 
    '=== 8. RESUMO DA INTEGRAÇÃO ===' as secao,
    'B2B (Academias)' as componente,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
        AND (SELECT COUNT(*) FROM public.companies WHERE status = 'active' AND payment_status = 'paid') > 0
        THEN '✅ ACADEMIAS ATIVAS'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
        THEN '⚠️ TABELA EXISTE MAS NENHUMA ACADEMIA ATIVA'
        ELSE '⚠️ TABELA NÃO EXISTE (execute migração)'
    END as status;

-- ============================================================
-- 9. VERIFICAR FLUXO COMPLETO (Exemplo de integração)
-- ============================================================
-- Verifica se há um exemplo completo de: Plano → Webhook → Assinatura
SELECT 
    '=== 9. EXEMPLO DE FLUXO COMPLETO ===' as secao,
    'Verificando se há um exemplo de integração completa...' as verificacao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
        AND (SELECT COUNT(*) FROM public.cakto_webhooks cw 
             INNER JOIN public.app_plans ap ON cw.checkout_id = ap.cakto_checkout_id
             WHERE cw.processed = true) > 0
        THEN '✅ FLUXO FUNCIONANDO: Webhooks processados com sucesso'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
        AND (SELECT COUNT(*) FROM public.cakto_webhooks) > 0
        THEN '⚠️ WEBHOOKS RECEBIDOS MAS VERIFIQUE SE FORAM PROCESSADOS'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
        THEN '⚠️ PLANOS CONFIGURADOS MAS NENHUM WEBHOOK RECEBIDO AINDA'
        ELSE '❌ CONFIGURAÇÃO INCOMPLETA'
    END as status;

-- ============================================================
-- 10. CHECKLIST DE INTEGRAÇÃO
-- ============================================================
SELECT 
    '=== 10. CHECKLIST DE INTEGRAÇÃO ===' as secao,
    'Planos configurados com checkout_id' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
        AND (SELECT COUNT(*) FROM public.app_plans WHERE cakto_checkout_id IS NULL OR cakto_checkout_id = '') = 0
        THEN '✅ OK'
        ELSE '❌ FALTA CONFIGURAR'
    END as status

UNION ALL

SELECT 
    '=== 10. CHECKLIST DE INTEGRAÇÃO ===' as secao,
    'Webhook da Cakto configurado no Supabase' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
        THEN '✅ TABELA EXISTE'
        ELSE '⚠️ TABELA NÃO EXISTE (opcional para logs)'
    END as status

UNION ALL

SELECT 
    '=== 10. CHECKLIST DE INTEGRAÇÃO ===' as secao,
    'Tabela de assinaturas criada' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
        THEN '✅ OK'
        ELSE '❌ FALTA CRIAR'
    END as status

UNION ALL

SELECT 
    '=== 10. CHECKLIST DE INTEGRAÇÃO ===' as secao,
    'Tabela de academias criada (B2B)' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
        THEN '✅ OK'
        ELSE '⚠️ FALTA CRIAR (execute migration_criar_companies_licenses_SIMPLIFICADA.sql)'
    END as status

UNION ALL

SELECT 
    '=== 10. CHECKLIST DE INTEGRAÇÃO ===' as secao,
    'Tabela de recargas criada' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')
        THEN '✅ OK'
        ELSE '⚠️ FALTA CRIAR (execute migration_criar_tabela_recharges.sql)'
    END as status;

-- ============================================================
-- FIM DA VERIFICAÇÃO
-- ============================================================
-- 
-- INTERPRETAÇÃO:
-- 
-- ✅ = Tudo OK
-- ⚠️ = Atenção necessária
-- ❌ = Problema detectado
-- ℹ️ = Informação (normal se não houver dados ainda)
-- 
-- Se encontrar problemas:
-- 1. Verifique se todas as migrações foram executadas
-- 2. Verifique se os checkout_ids estão configurados
-- 3. Verifique os logs da Edge Function cakto-webhook
-- 4. Teste um pagamento real para verificar o fluxo completo
-- 
-- ============================================================

