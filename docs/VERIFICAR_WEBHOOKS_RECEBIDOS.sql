-- ============================================================
-- VERIFICAR WEBHOOKS RECEBIDOS DA CAKTO
-- Use esta query para verificar se os webhooks estão chegando
-- ============================================================

-- 1. Últimos webhooks recebidos
SELECT 
    '=== ÚLTIMOS WEBHOOKS RECEBIDOS ===' as secao,
    id,
    event_type as tipo_evento,
    checkout_id,
    cakto_transaction_id as transaction_id,
    processed as processado,
    error_message as erro,
    processed_at as data_processamento,
    created_at as data_recebimento,
    CASE 
        WHEN processed = true THEN '✅ PROCESSADO COM SUCESSO'
        WHEN processed = false AND error_message IS NULL THEN '⏳ AGUARDANDO PROCESSAMENTO'
        WHEN processed = false AND error_message IS NOT NULL THEN '❌ ERRO: ' || error_message
        ELSE '❓ STATUS DESCONHECIDO'
    END as status
FROM public.cakto_webhooks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
ORDER BY created_at DESC
LIMIT 20;

-- 2. Estatísticas de webhooks
SELECT 
    '=== ESTATÍSTICAS DE WEBHOOKS ===' as secao,
    COUNT(*) as total_webhooks,
    COUNT(CASE WHEN processed = true THEN 1 END) as processados_com_sucesso,
    COUNT(CASE WHEN processed = false AND error_message IS NULL THEN 1 END) as pendentes,
    COUNT(CASE WHEN processed = false AND error_message IS NOT NULL THEN 1 END) as com_erro,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as ultimas_24h,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as ultimos_7_dias
FROM public.cakto_webhooks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks');

-- 3. Webhooks por tipo de evento
SELECT 
    '=== WEBHOOKS POR TIPO DE EVENTO ===' as secao,
    event_type as tipo_evento,
    COUNT(*) as quantidade,
    COUNT(CASE WHEN processed = true THEN 1 END) as processados,
    COUNT(CASE WHEN processed = false THEN 1 END) as pendentes
FROM public.cakto_webhooks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
GROUP BY event_type
ORDER BY quantidade DESC;

-- 4. Webhooks por checkout_id (verificar quais planos estão sendo pagos)
SELECT 
    '=== WEBHOOKS POR PLANO (checkout_id) ===' as secao,
    checkout_id,
    COUNT(*) as total_webhooks,
    COUNT(CASE WHEN processed = true THEN 1 END) as processados,
    COUNT(CASE WHEN processed = false THEN 1 END) as pendentes,
    MAX(created_at) as ultimo_webhook
FROM public.cakto_webhooks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
AND checkout_id IS NOT NULL
GROUP BY checkout_id
ORDER BY total_webhooks DESC;

-- 5. Webhooks com erro (para debug)
SELECT 
    '=== WEBHOOKS COM ERRO ===' as secao,
    id,
    event_type as tipo_evento,
    checkout_id,
    error_message as erro,
    payload,
    created_at as data_recebimento
FROM public.cakto_webhooks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
AND error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 6. Verificar se webhooks estão criando assinaturas
SELECT 
    '=== VERIFICAR SE WEBHOOKS CRIARAM ASSINATURAS ===' as secao,
    'Webhooks processados' as metrica,
    COUNT(*)::text as quantidade
FROM public.cakto_webhooks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
AND processed = true

UNION ALL

SELECT 
    '=== VERIFICAR SE WEBHOOKS CRIARAM ASSINATURAS ===' as secao,
    'Assinaturas B2C criadas' as metrica,
    COUNT(*)::text as quantidade
FROM public.user_subscriptions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')

UNION ALL

SELECT 
    '=== VERIFICAR SE WEBHOOKS CRIARAM ASSINATURAS ===' as secao,
    'Academias criadas' as metrica,
    COUNT(*)::text as quantidade
FROM public.companies
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')

UNION ALL

SELECT 
    '=== VERIFICAR SE WEBHOOKS CRIARAM ASSINATURAS ===' as secao,
    'Recargas criadas' as metrica,
    COUNT(*)::text as quantidade
FROM public.recharges
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges');

-- 7. Mensagem se a tabela não existir
SELECT 
    '=== WEBHOOKS DA CAKTO ===' as secao,
    '⚠️ TABELA cakto_webhooks NÃO EXISTE' as mensagem,
    'Execute: migration_criar_tabela_cakto_webhooks.sql (opcional - apenas para logs)' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks');

