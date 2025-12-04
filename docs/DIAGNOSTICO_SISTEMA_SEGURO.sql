-- ============================================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA (VERSÃO SEGURA)
-- Página de Vendas → Cakto → Supabase → App
-- ============================================================
-- Esta versão verifica quais tabelas existem antes de consultá-las
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 0. VERIFICAR QUAIS TABELAS EXISTEM
-- ============================================================
SELECT 
    '=== TABELAS DISPONÍVEIS ===' as secao,
    table_schema as schema,
    table_name as tabela,
    CASE 
        WHEN table_name IN ('app_plans', 'companies', 'company_licenses', 'user_subscriptions', 
                           'academy_subscriptions', 'personal_subscriptions', 'recharges', 
                           'coupons', 'cakto_webhooks', 'users') THEN '✅ TABELA PRINCIPAL'
        ELSE 'ℹ️ OUTRA TABELA'
    END as tipo
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY 
    CASE 
        WHEN table_name IN ('app_plans', 'companies', 'company_licenses', 'user_subscriptions', 
                           'academy_subscriptions', 'personal_subscriptions', 'recharges', 
                           'coupons', 'cakto_webhooks', 'users') THEN 1
        ELSE 2
    END,
    table_name;

-- ============================================================
-- 1. VERIFICAR PLANOS CONFIGURADOS (app_plans)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans') THEN
        RAISE NOTICE 'Tabela app_plans encontrada';
    ELSE
        RAISE NOTICE '⚠️ Tabela app_plans NÃO encontrada - pulando verificação';
    END IF;
END $$;

-- Verifica se a tabela existe antes de consultar
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
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
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
-- 2. VERIFICAR ACADEMIAS (COMPANIES) - SE EXISTIR
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
    -- Contar licenças ativas (se a tabela existir)
    COALESCE((
        SELECT COUNT(*) 
        FROM public.company_licenses cl 
        WHERE cl.company_id = c.id 
        AND cl.status = 'active'
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses')
    ), 0) as licencas_ativas,
    -- Calcular licenças disponíveis
    (c.max_licenses - 
     COALESCE((
        SELECT COUNT(*) 
        FROM public.company_licenses cl 
        WHERE cl.company_id = c.id 
        AND cl.status = 'active'
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses')
    ), 0)) as licencas_disponiveis,
    CASE 
        WHEN c.status = 'active' AND c.payment_status = 'paid' THEN '✅ ATIVA E PAGA'
        WHEN c.status = 'active' AND c.payment_status != 'paid' THEN '⚠️ ATIVA MAS NÃO PAGA'
        WHEN c.status != 'active' THEN '❌ INATIVA'
        ELSE '❓ DESCONHECIDO'
    END as status_geral
FROM public.companies c
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
ORDER BY c.created_at DESC;

-- Se a tabela companies não existir, mostrar mensagem
SELECT 
    '=== ACADEMIAS CADASTRADAS ===' as secao,
    '⚠️ TABELA companies NÃO EXISTE' as mensagem,
    'Execute a migração: migration_criar_companies_licenses.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies');

-- ============================================================
-- 3. VERIFICAR LICENÇAS DE ACADEMIAS (COMPANY_LICENSES) - SE EXISTIR
-- ============================================================
SELECT 
    '=== LICENÇAS DE ACADEMIAS ===' as secao,
    cl.id,
    COALESCE(c.name, 'N/A') as academia,
    COALESCE(c.master_code, 'N/A') as codigo_academia,
    COALESCE(u.username, 'N/A') as usuario,
    -- Email do usuário (apenas se a coluna existir)
    'N/A' as email_usuario, -- Email não disponível (coluna pode não existir na tabela users)
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
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
LEFT JOIN public.users u ON cl.user_id = u.id
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses')
ORDER BY cl.activated_at DESC
LIMIT 50;

-- Se a tabela não existir, mostrar mensagem
SELECT 
    '=== LICENÇAS DE ACADEMIAS ===' as secao,
    '⚠️ TABELA company_licenses NÃO EXISTE' as mensagem,
    'Execute a migração: migration_criar_companies_licenses.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses');

-- ============================================================
-- 4. VERIFICAR ASSINATURAS B2C (USER_SUBSCRIPTIONS)
-- ============================================================
-- Verificar estrutura da tabela user_subscriptions
-- Nota: A estrutura pode variar (user_id/plan_id vs user_email/plan_slug)
SELECT 
    '=== ASSINATURAS B2C (INDIVIDUAIS) ===' as secao,
    us.id,
    us.status,
    us.created_at as data_criacao,
    CASE 
        WHEN us.status = 'active' THEN '✅ ATIVA'
        WHEN us.status = 'canceled' THEN '❌ CANCELADA'
        WHEN us.status = 'expired' THEN '⏰ EXPIRADA'
        ELSE '❓ DESCONHECIDO'
    END as status_assinatura,
    'Verifique a estrutura da tabela para ver todas as colunas' as nota
FROM public.user_subscriptions us
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
ORDER BY us.created_at DESC
LIMIT 50;

-- Mostrar estrutura real da tabela user_subscriptions
SELECT 
    '=== ESTRUTURA: user_subscriptions ===' as secao,
    column_name as coluna,
    data_type as tipo,
    is_nullable as pode_ser_nulo
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- ============================================================
-- 5. VERIFICAR ASSINATURAS DE ACADEMIAS (ACADEMY_SUBSCRIPTIONS)
-- ============================================================
-- Nota: Esta tabela é criada automaticamente pelo webhook da Cakto
-- Se não existir, é normal - será criada quando houver o primeiro pagamento B2B
SELECT 
    '=== ASSINATURAS DE ACADEMIAS ===' as secao,
    '⚠️ TABELA academy_subscriptions NÃO EXISTE' as mensagem,
    'Esta tabela será criada automaticamente pelo webhook da Cakto quando houver o primeiro pagamento de academia' as nota
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_subscriptions');

-- ============================================================
-- 6. VERIFICAR ASSINATURAS DE PERSONAL TRAINERS
-- ============================================================
-- Nota: Esta tabela é criada automaticamente pelo webhook da Cakto
-- Se não existir, é normal - será criada quando houver o primeiro pagamento de personal trainer
SELECT 
    '=== ASSINATURAS DE PERSONAL TRAINERS ===' as secao,
    '⚠️ TABELA personal_subscriptions NÃO EXISTE' as mensagem,
    'Esta tabela será criada automaticamente pelo webhook da Cakto quando houver o primeiro pagamento de personal trainer' as nota
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personal_subscriptions');

-- ============================================================
-- 7. VERIFICAR RECARGAS (RECHARGES)
-- ============================================================
-- Nota: Se a tabela não existir, execute: migration_criar_tabela_recharges.sql
SELECT 
    '=== RECARGAS ===' as secao,
    '⚠️ TABELA recharges NÃO EXISTE' as mensagem,
    'Execute a migração: migration_criar_tabela_recharges.sql' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges');

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
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons')
ORDER BY c.created_at DESC
LIMIT 50;

-- ============================================================
-- 9. VERIFICAR WEBHOOKS RECEBIDOS DA CAKTO (SE EXISTIR)
-- ============================================================
-- Nota: Se a tabela não existir, execute: migration_criar_tabela_cakto_webhooks.sql (opcional)
SELECT 
    '=== WEBHOOKS DA CAKTO ===' as secao,
    cw.id,
    cw.event_type as tipo_evento,
    cw.processed as processado,
    cw.error_message as erro,
    cw.cakto_transaction_id as transaction_id,
    cw.checkout_id,
    cw.created_at as data_recebimento,
    CASE 
        WHEN cw.processed = true THEN '✅ PROCESSADO'
        WHEN cw.processed = false AND cw.error_message IS NULL THEN '⏳ PENDENTE'
        WHEN cw.processed = false AND cw.error_message IS NOT NULL THEN '❌ FALHOU'
        ELSE '❓ DESCONHECIDO'
    END as status_webhook
FROM public.cakto_webhooks cw
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks')
ORDER BY cw.created_at DESC
LIMIT 50;

-- Mensagem se a tabela não existir
SELECT 
    '=== WEBHOOKS DA CAKTO ===' as secao,
    '⚠️ TABELA cakto_webhooks NÃO EXISTE' as mensagem,
    'Execute a migração: migration_criar_tabela_cakto_webhooks.sql (opcional - apenas para logs)' as solucao
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cakto_webhooks');

-- ============================================================
-- 10. RESUMO GERAL DO SISTEMA
-- ============================================================
SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Planos Configurados' as metrica,
    COUNT(*)::text as valor
FROM public.app_plans
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
AND cakto_checkout_id IS NOT NULL AND cakto_checkout_id != ''

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Academias Ativas' as metrica,
    COUNT(*)::text as valor
FROM public.companies
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
AND status = 'active' AND payment_status = 'paid'

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Licenças Ativas' as metrica,
    COUNT(*)::text as valor
FROM public.company_licenses
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses')
AND status = 'active'

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Assinaturas B2C Ativas' as metrica,
    COUNT(*)::text as valor
FROM public.user_subscriptions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_subscriptions')
AND status = 'active'

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Assinaturas de Academias Ativas' as metrica,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academy_subscriptions')
        THEN 'Verifique manualmente: SELECT COUNT(*) FROM public.academy_subscriptions WHERE status = ''active'';'
        ELSE '0 (tabela não existe - será criada pelo webhook)'
    END as valor

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Assinaturas de Personal Trainers Ativas' as metrica,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personal_subscriptions')
        THEN 'Verifique manualmente: SELECT COUNT(*) FROM public.personal_subscriptions WHERE status = ''active'';'
        ELSE '0 (tabela não existe - será criada pelo webhook)'
    END as valor

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Recargas Ativas' as metrica,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')
        THEN 'Verifique manualmente: SELECT COUNT(*) FROM public.recharges WHERE status = ''active'' AND (expires_at IS NULL OR expires_at > NOW());'
        ELSE '0 (tabela não existe - execute migration_criar_tabela_recharges.sql)'
    END as valor

UNION ALL

SELECT 
    '=== RESUMO GERAL ===' as secao,
    'Total de Cupons Disponíveis' as metrica,
    COUNT(*)::text as valor
FROM public.coupons
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons')
AND is_active = true 
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
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_plans')
AND (cakto_checkout_id IS NULL OR cakto_checkout_id = '')

UNION ALL

SELECT 
    '=== PROBLEMAS DETECTADOS ===' as secao,
    'Academias ativas sem pagamento' as problema,
    COUNT(*)::text as quantidade
FROM public.companies
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
AND status = 'active' AND payment_status != 'paid'

UNION ALL

SELECT 
    '=== PROBLEMAS DETECTADOS ===' as secao,
    'Academias com licenças esgotadas' as problema,
    COUNT(*)::text as quantidade
FROM public.companies c
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_licenses')
AND c.status = 'active'
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
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recharges')
        THEN (SELECT COUNT(*)::text FROM public.recharges WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= NOW())
        ELSE '0 (tabela não existe)'
    END as quantidade

UNION ALL

SELECT 
    '=== PROBLEMAS DETECTADOS ===' as secao,
    'Cupons expirados ainda marcados como ativos' as problema,
    COUNT(*)::text as quantidade
FROM public.coupons
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons')
AND is_active = true 
AND valid_until IS NOT NULL 
AND valid_until < NOW();

-- ============================================================
-- FIM DO DIAGNÓSTICO
-- ============================================================
-- 
-- INTERPRETAÇÃO DOS RESULTADOS:
-- 
-- ✅ = Tudo OK
-- ⚠️ = Atenção necessária ou tabela não existe
-- ❌ = Problema detectado
-- ❓ = Status desconhecido
-- ⏰ = Expirado
-- ⏳ = Ainda não válido
-- 
-- Se alguma tabela não existir, execute as migrações necessárias:
-- - migration_criar_companies_licenses.sql (para companies e company_licenses)
-- - migration_criar_tabela_recharges.sql (para recharges)
-- - migration_criar_sistema_cupons_cakto.sql (para coupons)
-- - migration_criar_tabela_cakto_webhooks.sql (para cakto_webhooks)
-- 
-- ============================================================

