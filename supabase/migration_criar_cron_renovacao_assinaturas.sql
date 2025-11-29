-- Migration: Criar Cron Job para Renovação Automática de Assinaturas
-- 
-- Este cron job executa diariamente às 00:00 UTC para verificar e processar
-- renovações de assinaturas que expiram no dia atual.
--
-- IMPORTANTE: Ajuste a URL e o token conforme seu ambiente

-- Verificar se a extensão pg_cron está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover cron job existente se houver (para atualização)
SELECT cron.unschedule('check-subscription-renewals') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'check-subscription-renewals'
);

-- Criar cron job para executar diariamente às 00:00 UTC
-- Ajuste a URL para o seu projeto Supabase
-- Ajuste o token para um valor seguro (use uma variável de ambiente ou chave secreta)
SELECT cron.schedule(
  'check-subscription-renewals',           -- Nome do job
  '0 0 * * *',                             -- Executar diariamente às 00:00 UTC (cron expression)
  $$
  SELECT
    net.http_post(
      url := 'https://SEU_PROJETO.supabase.co/functions/v1/check-subscription-renewals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- NOTA: Para usar um token personalizado, você pode:
-- 1. Criar uma variável de ambiente no Supabase Dashboard
-- 2. Usar a Service Role Key diretamente (menos seguro, mas funcional)
-- 3. Criar uma função SQL que retorna o token de forma segura
--
-- Exemplo com token personalizado:
-- 'Authorization', 'Bearer SEU_TOKEN_AQUI'
--
-- Exemplo usando Service Role Key (ajustar conforme necessário):
-- 'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)

-- Verificar se o cron job foi criado
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'check-subscription-renewals';

-- Para testar manualmente (executar a função):
-- SELECT net.http_post(
--   url := 'https://SEU_PROJETO.supabase.co/functions/v1/check-subscription-renewals',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer SEU_TOKEN_AQUI'
--   ),
--   body := '{}'::jsonb
-- );

-- Para remover o cron job (se necessário):
-- SELECT cron.unschedule('check-subscription-renewals');

