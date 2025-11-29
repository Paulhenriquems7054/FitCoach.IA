-- ============================================
-- SCRIPT PARA VERIFICAR STATUS DO CRON JOB
-- ============================================

-- Verificar se a extensão pg_cron está habilitada
SELECT 
  extname as extensao,
  extversion as versao
FROM pg_extension 
WHERE extname = 'pg_cron';

-- Verificar todos os cron jobs ativos
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobid;

-- Verificar especificamente o cron job de renovação
SELECT 
  jobid,
  schedule,
  -- Mostrar apenas os primeiros 200 caracteres do comando (para não expor a chave completa)
  substring(command, 1, 200) || '...' as command_preview,
  active,
  jobname,
  -- Verificar se ainda contém placeholders
  CASE 
    WHEN command LIKE '%SEU_PROJETO%' OR command LIKE '%SEU_SERVICE_ROLE_KEY%' 
    THEN '⚠️ ATENÇÃO: Ainda contém placeholders! Substitua os valores.'
    WHEN command LIKE '%https://%.supabase.co/functions/v1/check-subscription-renewals%'
    THEN '✅ URL parece estar configurada'
    ELSE '❓ Verifique manualmente'
  END as status_configuracao,
  -- Verificar se o Authorization header está presente
  CASE 
    WHEN command LIKE '%Authorization%' AND command LIKE '%Bearer%'
    THEN '✅ Header de autenticação presente'
    ELSE '⚠️ Header de autenticação não encontrado'
  END as status_autenticacao
FROM cron.job
WHERE jobname = 'check-subscription-renewals';

-- Verificar histórico de execuções (se disponível)
-- Nota: Esta query pode não funcionar dependendo da versão do pg_cron
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'check-subscription-renewals')
ORDER BY start_time DESC
LIMIT 10;

-- ============================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ============================================
-- 
-- 1. Se não retornar nenhum resultado na última query:
--    → O cron job não existe ou foi removido
--    → Execute: supabase/atualizar_cron_com_valores_reais.sql
--
-- 2. Se status_configuracao mostrar "⚠️ Ainda contém placeholders":
--    → Substitua SEU_PROJETO e SUA_SERVICE_ROLE_KEY no script
--    → Execute novamente: supabase/atualizar_cron_com_valores_reais.sql
--
-- 3. Se status_autenticacao mostrar "⚠️ Header de autenticação não encontrado":
--    → O comando está malformado
--    → Verifique a sintaxe do comando
--
-- 4. Se tudo estiver ✅:
--    → O cron job está configurado corretamente
--    → Ele executará diariamente às 00:00 UTC
--    → Verifique os logs da Edge Function após a primeira execução


