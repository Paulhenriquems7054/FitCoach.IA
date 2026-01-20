-- ============================================
-- SCRIPT: Verificar Todas as Tabelas do Sistema de Billing
-- ============================================

-- Verificar quais tabelas existem
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'plans'
        ) THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END as status,
    'plans' as tabela,
    'Planos de assinatura' as descricao
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'subscriptions'
        ) THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END,
    'subscriptions',
    'Assinaturas dos usuários'
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'usage_tracking'
        ) THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END,
    'usage_tracking',
    'Rastreamento de uso mensal'
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'spending_logs'
        ) THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END,
    'spending_logs',
    'Log detalhado de gastos'
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'spending_analysis'
        ) THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END,
    'spending_analysis',
    'Análise IA de padrões de gasto'
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'email_templates'
        ) THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END,
    'email_templates',
    'Templates de email reutilizáveis'
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'email_queue'
        ) THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END,
    'email_queue',
    'Fila de envio de emails'
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'invoices'
        ) THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END,
    'invoices',
    'Faturas'
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'usage_alerts'
        ) THEN '✅ EXISTE'
        ELSE '❌ FALTA'
    END,
    'usage_alerts',
    'Alertas de limite de uso'
ORDER BY status, tabela;
