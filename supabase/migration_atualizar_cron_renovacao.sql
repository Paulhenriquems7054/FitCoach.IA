-- Migration: Atualizar Cron Job de Renovação com URL e Token Corretos
-- 
-- INSTRUÇÕES ANTES DE EXECUTAR:
-- 1. Substitua 'SEU_PROJETO' pela URL do seu projeto Supabase (ex: dbugchiwqwnrnnnsszel)
-- 2. Substitua 'SEU_SERVICE_ROLE_KEY' pela sua Service Role Key do Supabase
--    (encontre em: Dashboard > Settings > API > service_role key)
-- 3. OU configure uma variável de ambiente no Supabase Dashboard
--
-- IMPORTANTE: A Service Role Key tem acesso total ao banco. Mantenha-a segura!

-- Remover cron job existente
SELECT cron.unschedule('check-subscription-renewals');

-- Opção 1: Usar Service Role Key diretamente (substitua SEU_SERVICE_ROLE_KEY)
-- ⚠️ ATENÇÃO: Esta opção expõe a chave no código. Use apenas se necessário.
SELECT cron.schedule(
  'check-subscription-renewals',
  '0 0 * * *',  -- Diariamente às 00:00 UTC
  $$
  SELECT
    net.http_post(
      url := 'https://SEU_PROJETO.supabase.co/functions/v1/check-subscription-renewals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer SEU_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Opção 2: Usar token personalizado (recomendado)
-- 1. Crie uma variável de ambiente no Supabase Dashboard:
--    Settings > Edge Functions > Secrets > Add Secret
--    Nome: RENEWAL_CHECK_TOKEN
--    Valor: (um token seguro que você criou)
--
-- 2. Descomente e ajuste o código abaixo:
/*
SELECT cron.schedule(
  'check-subscription-renewals',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://SEU_PROJETO.supabase.co/functions/v1/check-subscription-renewals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.renewal_check_token', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
*/

-- Verificar se o cron job foi atualizado
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

-- ============================================
-- COMO OBTER A URL DO SEU PROJETO:
-- ============================================
-- 1. Acesse: https://app.supabase.com/project/seu-projeto/settings/api
-- 2. Copie a "Project URL" (ex: https://dbugchiwqwnrnnnsszel.supabase.co)
-- 3. Use apenas a parte do domínio: dbugchiwqwnrnnnsszel
-- 4. A URL completa será: https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/check-subscription-renewals
--
-- COMO OBTER A SERVICE ROLE KEY:
-- ============================================
-- 1. Acesse: https://app.supabase.com/project/seu-projeto/settings/api
-- 2. Role até "Project API keys"
-- 3. Copie a "service_role" key (⚠️ NUNCA compartilhe esta chave!)
-- 4. Substitua 'SEU_SERVICE_ROLE_KEY' no código acima
--
-- TESTE MANUAL:
-- ============================================
-- Para testar a função manualmente, execute:
/*
SELECT net.http_post(
  url := 'https://SEU_PROJETO.supabase.co/functions/v1/check-subscription-renewals',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer SEU_SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
*/
--
-- Se retornar um request_id, a chamada foi feita com sucesso.
-- Verifique os logs da Edge Function no Supabase Dashboard para ver o resultado.

