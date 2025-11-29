-- ============================================
-- SCRIPT FINAL PARA CONFIGURAR O CRON JOB
-- ============================================
-- 
-- ⚠️ ANTES DE EXECUTAR:
-- 1. Substitua 'SEU_PROJETO_AQUI' pela parte do domínio do seu projeto
--    Exemplo: Se sua URL é https://dbugchiwqwnrnnnsszel.supabase.co
--    Use apenas: dbugchiwqwnrnnnsszel
--
-- 2. Substitua 'SUA_SERVICE_ROLE_KEY_AQUI' pela sua Service Role Key completa
--    Encontre em: Dashboard > Settings > API > service_role key
--
-- 3. Execute este script no SQL Editor do Supabase
--
-- ============================================

-- Remover o cron job atual (jobid 4)
SELECT cron.unschedule('check-subscription-renewals');

-- Criar novo cron job com valores reais
-- ⚠️ SUBSTITUA OS VALORES ABAIXO!
SELECT cron.schedule(
  'check-subscription-renewals',
  '0 0 * * *',  -- Diariamente às 00:00 UTC
  $$
  SELECT
    net.http_post(
      url := 'https://SEU_PROJETO_AQUI.supabase.co/functions/v1/check-subscription-renewals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY_AQUI'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================
-- VERIFICAÇÃO IMEDIATA
-- ============================================
-- Execute esta query para verificar se foi atualizado corretamente:

SELECT 
  jobid,
  schedule,
  active,
  jobname,
  -- Verificar se ainda contém placeholders
  CASE 
    WHEN command LIKE '%SEU_PROJETO%' OR command LIKE '%SEU_SERVICE_ROLE_KEY%' 
    THEN '❌ AINDA CONTÉM PLACEHOLDERS - Substitua os valores e execute novamente!'
    WHEN command LIKE '%https://%.supabase.co/functions/v1/check-subscription-renewals%'
    THEN '✅ URL configurada corretamente'
    ELSE '⚠️ Verifique manualmente'
  END as status_url,
  CASE 
    WHEN command LIKE '%Authorization%' AND command LIKE '%Bearer%' 
         AND command NOT LIKE '%SEU_SERVICE_ROLE_KEY%'
    THEN '✅ Autenticação configurada'
    ELSE '❌ Autenticação não configurada corretamente'
  END as status_auth
FROM cron.job
WHERE jobname = 'check-subscription-renewals';

-- ============================================
-- EXEMPLO DE COMO DEVE FICAR (NÃO EXECUTE):
-- ============================================
/*
-- Exemplo com valores reais (substitua pelos seus):
SELECT cron.schedule(
  'check-subscription-renewals',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/check-subscription-renewals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidWdjaGl3cXducm5ubnNzemVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.abc123def456...'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
*/

-- ============================================
-- TESTE MANUAL (OPCIONAL)
-- ============================================
-- Após configurar, você pode testar manualmente executando:
/*
SELECT net.http_post(
  url := 'https://SEU_PROJETO.supabase.co/functions/v1/check-subscription-renewals',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
*/
-- 
-- Se retornar um request_id, a chamada foi feita com sucesso.
-- Verifique os logs da Edge Function no Dashboard para ver o resultado.


