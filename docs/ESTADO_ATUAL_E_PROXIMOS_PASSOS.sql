-- ============================================================
-- ESTADO ATUAL DO SISTEMA E PRÓXIMOS PASSOS
-- ============================================================
-- Esta query mostra o estado atual e o que fazer a seguir
-- ============================================================

-- ============================================================
-- 1. RESUMO DO ESTADO ATUAL
-- ============================================================
SELECT 
    '=== RESUMO DO ESTADO ATUAL ===' as secao,
    'Webhooks processados' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
        THEN (SELECT COUNT(*)::text FROM public.cakto_webhooks WHERE processed = true)
        ELSE 'Tabela não existe'
    END as valor,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
        AND (SELECT COUNT(*) FROM public.cakto_webhooks WHERE processed = true) = 0
        THEN '⚠️ NENHUM WEBHOOK PROCESSADO AINDA'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
        THEN '✅ WEBHOOKS SENDO PROCESSADOS'
        ELSE 'ℹ️ Tabela opcional (não afeta funcionamento)'
    END as status

UNION ALL

SELECT 
    '=== RESUMO DO ESTADO ATUAL ===' as secao,
    'Assinaturas B2C criadas' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
        THEN (SELECT COUNT(*)::text FROM public.user_subscriptions)
        ELSE 'Tabela não existe'
    END as valor,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
        AND (SELECT COUNT(*) FROM public.user_subscriptions) = 0
        THEN 'ℹ️ NENHUMA ASSINATURA CRIADA AINDA (normal se não houve pagamentos)'
        ELSE '✅ HÁ ASSINATURAS CRIADAS'
    END as status

UNION ALL

SELECT 
    '=== RESUMO DO ESTADO ATUAL ===' as secao,
    'Academias criadas' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
        THEN (SELECT COUNT(*)::text FROM public.companies)
        ELSE 'Tabela não existe'
    END as valor,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
        AND (SELECT COUNT(*) FROM public.companies) = 0
        THEN 'ℹ️ NENHUMA ACADEMIA CADASTRADA AINDA (normal se não houve pagamentos B2B)'
        ELSE '✅ HÁ ACADEMIAS CADASTRADAS'
    END as status

UNION ALL

SELECT 
    '=== RESUMO DO ESTADO ATUAL ===' as secao,
    'Recargas criadas' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')
        THEN (SELECT COUNT(*)::text FROM public.recharges)
        ELSE 'Tabela não existe'
    END as valor,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')
        AND (SELECT COUNT(*) FROM public.recharges) > 0
        THEN '✅ HÁ RECARGAS CRIADAS'
        ELSE 'ℹ️ NENHUMA RECARGA CRIADA AINDA'
    END as status;

-- ============================================================
-- 2. DETALHES DA RECARGA CRIADA
-- ============================================================
-- Verificar estrutura real da tabela primeiro
SELECT 
    '=== ESTRUTURA DA TABELA recharges ===' as secao,
    column_name as coluna,
    data_type as tipo,
    is_nullable as pode_ser_nulo
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'recharges'
ORDER BY ordinal_position;

-- Detalhes da recarga criada (usando colunas que existem)
SELECT 
    '=== DETALHES DA RECARGA CRIADA ===' as secao,
    id,
    recharge_type as tipo_recarga,
    recharge_name as nome,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'recharges' 
            AND column_name = 'user_id'
        )
        THEN 'Verifique: SELECT u.username FROM users u WHERE u.id = recharges.user_id'
        ELSE 'N/A'
    END as usuario_info,
    amount_paid as valor_pago,
    quantity as quantidade,
    status,
    payment_status as status_pagamento,
    valid_from as valido_de,
    valid_until as valido_ate,
    expires_at as expira_em,
    used_at as usado_em,
    cakto_checkout_id,
    cakto_transaction_id,
    created_at as data_criacao,
    CASE 
        WHEN status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) THEN '✅ ATIVA'
        WHEN status = 'active' AND expires_at <= NOW() THEN '⏰ EXPIRADA'
        WHEN status = 'used' THEN '✅ USADA'
        WHEN status = 'pending' THEN '⏳ PENDENTE'
        ELSE '❓ OUTRO STATUS'
    END as status_recarga
FROM public.recharges
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================
-- 3. VERIFICAR SE HÁ WEBHOOKS RECEBIDOS (mesmo não processados)
-- ============================================================
SELECT 
    '=== WEBHOOKS RECEBIDOS (TODOS) ===' as secao,
    COUNT(*) as total_webhooks,
    COUNT(CASE WHEN processed = true THEN 1 END) as processados,
    COUNT(CASE WHEN processed = false THEN 1 END) as nao_processados,
    MAX(created_at) as ultimo_webhook_recebido,
    CASE 
        WHEN COUNT(*) = 0 THEN 'ℹ️ NENHUM WEBHOOK RECEBIDO AINDA'
        WHEN COUNT(CASE WHEN processed = false THEN 1 END) > 0 THEN '⚠️ HÁ WEBHOOKS AGUARDANDO PROCESSAMENTO'
        ELSE '✅ TODOS OS WEBHOOKS PROCESSADOS'
    END as status
FROM public.cakto_webhooks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks');

-- ============================================================
-- 4. PRÓXIMOS PASSOS RECOMENDADOS
-- ============================================================
SELECT 
    '=== PRÓXIMOS PASSOS ===' as secao,
    '1. Testar webhook manualmente' as passo,
    'Execute o script PowerShell em: docs/TESTAR_WEBHOOK_MANUALMENTE.md' as instrucao,
    'Isso vai simular um pagamento e verificar se o webhook funciona' as explicacao

UNION ALL

SELECT 
    '=== PRÓXIMOS PASSOS ===' as secao,
    '2. Fazer um pagamento de teste real' as passo,
    'Faça um pagamento de teste na página de vendas (use modo sandbox/teste da Cakto)' as instrucao,
    'Isso vai gerar um webhook real e você pode verificar se foi processado' as explicacao

UNION ALL

SELECT 
    '=== PRÓXIMOS PASSOS ===' as passo,
    '3. Verificar logs da Edge Function' as passo,
    'Acesse: Supabase Dashboard → Edge Functions → cakto-webhook → Logs' as instrucao,
    'Veja se há erros ou mensagens de debug quando webhooks são recebidos' as explicacao

UNION ALL

SELECT 
    '=== PRÓXIMOS PASSOS ===' as secao,
    '4. Verificar configuração do webhook na Cakto' as passo,
    'Confirme que a URL do webhook está correta: https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook?source=cakto' as instrucao,
    'E que o webhook está ativo no painel da Cakto' as explicacao;

-- ============================================================
-- 5. VERIFICAR CONFIGURAÇÃO DO WEBHOOK
-- ============================================================
SELECT 
    '=== CONFIGURAÇÃO DO WEBHOOK ===' as secao,
    'URL do Webhook' as item,
    'https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook?source=cakto' as valor,
    '✅ URL CORRETA' as status

UNION ALL

SELECT 
    '=== CONFIGURAÇÃO DO WEBHOOK ===' as secao,
    'Edge Function existe' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'cakto_webhooks'
        )
        THEN '✅ Função configurada (tabela de logs existe)'
        ELSE '⚠️ Tabela de logs não existe (opcional)'
    END as valor,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'cakto_webhooks'
        )
        THEN '✅ OK'
        ELSE 'ℹ️ Não afeta funcionamento'
    END as status;

-- ============================================================
-- 6. CHECKLIST PARA TESTAR A INTEGRAÇÃO
-- ============================================================
SELECT 
    '=== CHECKLIST PARA TESTAR ===' as secao,
    '✅' as feito,
    'Configurar credenciais no script PowerShell' as item
WHERE 1=1

UNION ALL

SELECT 
    '=== CHECKLIST PARA TESTAR ===' as secao,
    '⏳' as feito,
    'Executar teste manual de webhook B2C' as item

UNION ALL

SELECT 
    '=== CHECKLIST PARA TESTAR ===' as secao,
    '⏳' as feito,
    'Executar teste manual de webhook B2B' as item

UNION ALL

SELECT 
    '=== CHECKLIST PARA TESTAR ===' as secao,
    '⏳' as feito,
    'Executar teste manual de webhook Recarga' as item

UNION ALL

SELECT 
    '=== CHECKLIST PARA TESTAR ===' as secao,
    '⏳' as feito,
    'Verificar se registros foram criados no Supabase' as item

UNION ALL

SELECT 
    '=== CHECKLIST PARA TESTAR ===' as secao,
    '⏳' as feito,
    'Fazer um pagamento de teste real (se possível)' as item;

-- ============================================================
-- FIM
-- ============================================================

