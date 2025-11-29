# ⚡ Configurar Cron Job Agora - Passo a Passo

## 📊 Status Atual

✅ Cron job existe e está ativo  
❌ Ainda contém placeholder `SEU_PROJETO`  
⚠️ Precisa substituir pelos valores reais

---

## 🚀 Solução Rápida (5 minutos)

### Passo 1: Obter a URL do Projeto

1. Acesse: https://app.supabase.com/project/seu-projeto/settings/api
2. Copie a **Project URL** (exemplo: `https://dbugchiwqwnrnnnsszel.supabase.co`)
3. **Extraia apenas a parte do domínio**: `dbugchiwqwnrnnnsszel`
   - ⚠️ **NÃO** inclua `https://` ou `.supabase.co`
   - ⚠️ **APENAS** a parte do domínio

### Passo 2: Obter a Service Role Key

1. No mesmo painel (Settings → API)
2. Role até **Project API keys**
3. Copie a **`service_role`** key completa
   - ⚠️ É uma string longa que começa com `eyJ...`
   - ⚠️ **NUNCA** compartilhe esta chave!

### Passo 3: Executar o Script

1. Abra o arquivo: `supabase/FINALIZAR_CONFIGURACAO_CRON.sql`
2. **Localize estas duas linhas:**
   ```sql
   url := 'https://SEU_PROJETO_AQUI.supabase.co/functions/v1/check-subscription-renewals',
   Authorization', 'Bearer SUA_SERVICE_ROLE_KEY_AQUI'
   ```

3. **Substitua:**
   - `SEU_PROJETO_AQUI` → parte do domínio (ex: `dbugchiwqwnrnnnsszel`)
   - `SUA_SERVICE_ROLE_KEY_AQUI` → sua Service Role Key completa

4. **Exemplo de como deve ficar:**
   ```sql
   url := 'https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/check-subscription-renewals',
   Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidWdjaGl3cXducm5ubnNzemVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.abc123...'
   ```

5. **Execute o script completo** no SQL Editor do Supabase

### Passo 4: Verificar

Após executar, a query de verificação no final do script mostrará:

**✅ Se estiver correto:**
- `status_url`: `✅ URL configurada corretamente`
- `status_auth`: `✅ Autenticação configurada`

**❌ Se ainda tiver problemas:**
- `status_url`: `❌ AINDA CONTÉM PLACEHOLDERS`
- `status_auth`: `❌ Autenticação não configurada corretamente`

---

## 📝 Checklist

Antes de executar, confirme:

- [ ] Tenho a parte do domínio do projeto (ex: `dbugchiwqwnrnnnsszel`)
- [ ] Tenho a Service Role Key completa
- [ ] Substituí `SEU_PROJETO_AQUI` no script
- [ ] Substituí `SUA_SERVICE_ROLE_KEY_AQUI` no script
- [ ] Vou executar no SQL Editor do Supabase

---

## 🧪 Teste Manual (Opcional)

Após configurar, teste manualmente:

```sql
-- Substitua os valores também aqui
SELECT net.http_post(
  url := 'https://SEU_PROJETO.supabase.co/functions/v1/check-subscription-renewals',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
```

**Resultado esperado:**
- Retorna um `request_id` (número)
- Verifique os logs da Edge Function no Dashboard
- Deve processar assinaturas que expiram hoje

---

## ⚠️ Erros Comuns

### Erro: "relation cron.job does not exist"
- A extensão `pg_cron` não está habilitada
- Execute: `CREATE EXTENSION IF NOT EXISTS pg_cron;`

### Erro: "permission denied"
- Você precisa de permissões de administrador
- Use a Service Role Key ou contas com privilégios adequados

### Erro 401 na Edge Function
- Service Role Key incorreta
- Verifique se copiou a chave completa (é longa!)

### Erro 404 na Edge Function
- URL incorreta
- Verifique se a Edge Function foi deployada:
  ```bash
  supabase functions deploy check-subscription-renewals
  ```

---

## ✅ Após Configurar

O cron job irá:
1. ✅ Executar diariamente às 00:00 UTC
2. ✅ Verificar assinaturas que expiram no dia
3. ✅ Renovar automaticamente se pagas
4. ✅ Marcar como expired se não pagas

**Próximo passo:** Aguardar a primeira execução ou testar manualmente!

---

**Precisa de ajuda?** Verifique os logs no Supabase Dashboard → Edge Functions → check-subscription-renewals → Logs


