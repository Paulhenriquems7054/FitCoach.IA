# 🔧 Atualizar Cron Job com Valores Reais

## ⚠️ Status Atual

O cron job foi criado, mas ainda contém placeholders:
- `SEU_PROJETO` → precisa ser substituído
- `SEU_SERVICE_ROLE_KEY` → precisa ser substituído

---

## 🚀 Solução Rápida

### Passo 1: Obter a URL do Projeto

1. Acesse: https://app.supabase.com/project/seu-projeto/settings/api
2. Copie a **Project URL** (exemplo: `https://dbugchiwqwnrnnnsszel.supabase.co`)
3. **Extraia apenas a parte do domínio**: `dbugchiwqwnrnnnsszel`

### Passo 2: Obter a Service Role Key

1. No mesmo painel (Settings → API)
2. Role até **Project API keys**
3. Copie a **`service_role`** key
   - ⚠️ Esta chave tem acesso total. Mantenha segura!

### Passo 3: Executar o Script

1. Abra o arquivo: `supabase/atualizar_cron_com_valores_reais.sql`
2. **Substitua**:
   - `SEU_PROJETO_AQUI` → parte do domínio (ex: `dbugchiwqwnrnnnsszel`)
   - `SUA_SERVICE_ROLE_KEY_AQUI` → sua Service Role Key completa
3. Execute no **SQL Editor** do Supabase Dashboard

---

## 📝 Exemplo Prático

**Antes (com placeholders):**
```sql
url := 'https://SEU_PROJETO.supabase.co/functions/v1/check-subscription-renewals',
Authorization', 'Bearer SEU_SERVICE_ROLE_KEY'
```

**Depois (com valores reais):**
```sql
url := 'https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/check-subscription-renewals',
Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidWdjaGl3cXducm5ubnNzemVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODc2ODAwMCwiZXhwIjoyMDE0MzQ0MDAwfQ.abc123...'
```

---

## ✅ Verificar se Funcionou

Após executar o script, execute esta query:

```sql
SELECT 
  jobid,
  schedule,
  active,
  CASE 
    WHEN command LIKE '%SEU_PROJETO%' OR command LIKE '%SEU_SERVICE_ROLE_KEY%' 
    THEN '⚠️ Ainda contém placeholders!'
    ELSE '✅ Configurado corretamente'
  END as status
FROM cron.job
WHERE jobname = 'check-subscription-renewals';
```

**Resultado esperado:**
- `status` deve mostrar: `✅ Configurado corretamente`
- `active` deve ser: `true`

---

## 🧪 Testar Manualmente

Para testar se está funcionando:

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

---

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- A Service Role Key tem acesso total ao banco
- **NUNCA** compartilhe ou commite esta chave
- **NUNCA** exponha em logs públicos
- Use apenas no backend/SQL do Supabase

---

## 📊 Próximos Passos

Após configurar:
1. ✅ Cron job executará diariamente às 00:00 UTC
2. ✅ Verificará assinaturas que expiram no dia
3. ✅ Renovará automaticamente se pagas
4. ✅ Marcará como expired se não pagas

---

**Precisa de ajuda?** Consulte `COMO_CONFIGURAR_CRON_RENOVACAO.md` para mais detalhes.

