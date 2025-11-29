-- ============================================
-- SCRIPT PARA ATUALIZAR CRON JOB COM VALORES REAIS
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Substitua 'SEU_PROJETO_AQUI' pela parte do domínio do seu projeto Supabase
--    Exemplo: Se sua URL é https://dbugchiwqwnrnnnsszel.supabase.co
--    Use: dbugchiwqwnrnnnsszel
--
-- 2. Substitua 'SUA_SERVICE_ROLE_KEY_AQUI' pela sua Service Role Key
--    Encontre em: Dashboard > Settings > API > service_role key
--
-- 3. Execute este script no SQL Editor do Supabase
--
-- ============================================

-- Remover cron job existente
SELECT cron.unschedule('check-subscription-renewals');

-- Criar cron job com valores reais
-- ⚠️ SUBSTITUA OS VALORES ABAIXO ANTES DE EXECUTAR!
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

-- Verificar se foi atualizado corretamente
SELECT 
  jobid,
  schedule,
  -- Mostrar apenas parte do comando (sem expor a chave completa)
  substring(command, 1, 100) || '...' as command_preview,
  active,
  CASE 
    WHEN command LIKE '%SEU_PROJETO%' OR command LIKE '%SEU_SERVICE_ROLE_KEY%' 
    THEN '⚠️ ATENÇÃO: Ainda contém placeholders!'
    ELSE '✅ Valores configurados corretamente'
  END as status
FROM cron.job
WHERE jobname = 'check-subscription-renewals';

-- ============================================
-- EXEMPLO DE COMO DEVE FICAR (NÃO EXECUTE ESTE):
-- ============================================
/*
SELECT cron.schedule(
  'check-subscription-renewals',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/check-subscription-renewals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidWdjaGl3cXducm5ubnNzemVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.abc123...'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
*/

