# 🔍 Diagnóstico do Cron Job

## 📊 Resultado Recebido

Você recebeu: `{"schedule": 4}`

Isso indica que a query retornou apenas o campo `schedule` com valor `4`, o que é incomum para um cron expression.

---

## 🧪 Verificação Completa

Execute o script: `supabase/verificar_cron_job.sql`

Este script verifica:
1. ✅ Se a extensão `pg_cron` está habilitada
2. ✅ Todos os cron jobs ativos
3. ✅ Status específico do cron job de renovação
4. ✅ Histórico de execuções (se disponível)

---

## 🔍 Possíveis Causas

### 1. Query Incompleta
Se você executou apenas parte de uma query, pode ter retornado apenas um campo.

**Solução**: Execute a query completa em `supabase/verificar_cron_job.sql`

### 2. Cron Job Não Existe
Se o cron job não foi criado corretamente, pode retornar resultados vazios ou parciais.

**Solução**: 
1. Verifique se o cron job existe:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'check-subscription-renewals';
   ```
2. Se não existir, execute: `supabase/atualizar_cron_com_valores_reais.sql`

### 3. Erro na Execução
Pode ter ocorrido um erro durante a criação do cron job.

**Solução**: Verifique os logs do PostgreSQL no Supabase Dashboard

---

## ✅ Verificação Passo a Passo

### Passo 1: Verificar Extensão
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```
**Esperado**: Deve retornar uma linha com `pg_cron`

### Passo 2: Listar Todos os Cron Jobs
```sql
SELECT jobid, schedule, active, jobname FROM cron.job;
```
**Esperado**: Deve listar todos os cron jobs, incluindo `check-subscription-renewals`

### Passo 3: Verificar Cron Job Específico
```sql
SELECT 
  jobid,
  schedule,
  active,
  substring(command, 1, 100) as command_preview
FROM cron.job
WHERE jobname = 'check-subscription-renewals';
```
**Esperado**: 
- `schedule` deve ser: `0 0 * * *`
- `active` deve ser: `true`
- `command_preview` deve mostrar a URL (sem placeholders)

---

## 🔧 Solução Rápida

Se o cron job não existe ou está incorreto:

1. **Execute o script de atualização:**
   ```sql
   -- Abra: supabase/atualizar_cron_com_valores_reais.sql
   -- Substitua os valores
   -- Execute no SQL Editor
   ```

2. **Verifique novamente:**
   ```sql
   SELECT 
     jobid,
     schedule,
     active,
     CASE 
       WHEN command LIKE '%SEU_PROJETO%' 
       THEN '⚠️ Precisa atualizar'
       ELSE '✅ OK'
     END as status
   FROM cron.job
   WHERE jobname = 'check-subscription-renewals';
   ```

---

## 📝 Exemplo de Resultado Esperado

Quando tudo estiver correto, você deve ver algo como:

```json
{
  "jobid": 2,
  "schedule": "0 0 * * *",
  "active": true,
  "command_preview": "SELECT net.http_post(url := 'https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/check-subscription-renewals'..."
}
```

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique se `pg_cron` está disponível no seu plano:**
   - Alguns planos do Supabase não incluem `pg_cron`
   - Considere usar alternativas (GitHub Actions, Vercel Cron, etc.)

2. **Verifique os logs:**
   - Supabase Dashboard → Database → Logs
   - Procure por erros relacionados a `cron` ou `pg_cron`

3. **Teste manualmente a Edge Function:**
   ```sql
   SELECT net.http_post(
     url := 'https://SEU_PROJETO.supabase.co/functions/v1/check-subscription-renewals',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY'
     ),
     body := '{}'::jsonb
   );
   ```

---

**Execute o script de verificação completo para obter mais informações!**


