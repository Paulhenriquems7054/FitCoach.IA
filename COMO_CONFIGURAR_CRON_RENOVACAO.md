# 🔧 Como Configurar o Cron Job de Renovação Automática

## 📋 Status Atual

O cron job foi criado com sucesso, mas precisa ser atualizado com:
1. ✅ URL correta do seu projeto Supabase
2. ✅ Token de autenticação (Service Role Key ou token personalizado)

---

## 🚀 Passo a Passo

### 1. Obter a URL do Projeto Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a **Project URL** (exemplo: `https://dbugchiwqwnrnnnsszel.supabase.co`)
5. Extraia apenas a parte do domínio: `dbugchiwqwnrnnnsszel`

### 2. Obter a Service Role Key

1. No mesmo painel (Settings → API)
2. Role até **Project API keys**
3. Copie a **`service_role`** key
   - ⚠️ **ATENÇÃO**: Esta chave tem acesso total ao banco. Mantenha-a segura!
   - ⚠️ **NUNCA** compartilhe ou commite esta chave no Git

### 3. Atualizar o Cron Job

Execute a migration SQL: `supabase/migration_atualizar_cron_renovacao.sql`

**Antes de executar**, substitua:
- `SEU_PROJETO` → parte do domínio do seu projeto (ex: `dbugchiwqwnrnnnsszel`)
- `SEU_SERVICE_ROLE_KEY` → sua Service Role Key

**Exemplo:**
```sql
SELECT cron.schedule(
  'check-subscription-renewals',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/check-subscription-renewals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

### 4. Verificar se Funcionou

Execute:
```sql
SELECT 
  jobid,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'check-subscription-renewals';
```

Você deve ver o cron job com a URL correta.

---

## 🧪 Testar Manualmente

Para testar se a Edge Function está funcionando:

```sql
SELECT net.http_post(
  url := 'https://SEU_PROJETO.supabase.co/functions/v1/check-subscription-renewals',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer SEU_SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
```

**Resultado esperado:**
- Retorna um `request_id` (número)
- Verifique os logs da Edge Function no Supabase Dashboard
- Deve processar assinaturas que expiram hoje

---

## 🔒 Alternativa Mais Segura (Recomendado)

Em vez de usar a Service Role Key diretamente no SQL, você pode:

### Opção 1: Token Personalizado

1. Crie um token seguro (ex: use um gerador de UUID)
2. Configure no Supabase Dashboard:
   - **Settings** → **Edge Functions** → **Secrets**
   - Adicione: `RENEWAL_CHECK_TOKEN` = `seu-token-aqui`
3. Atualize a Edge Function para aceitar este token
4. Use o token no cron job

### Opção 2: Variável de Ambiente

Configure a Service Role Key como variável de ambiente no Supabase e referencie no SQL.

---

## 📊 Verificar Logs

Após o cron job executar (ou teste manual):

1. Acesse **Supabase Dashboard** → **Edge Functions**
2. Selecione `check-subscription-renewals`
3. Veja os logs de execução
4. Verifique se:
   - ✅ Assinaturas foram renovadas
   - ✅ Assinaturas expiradas foram marcadas
   - ❌ Não há erros

---

## ⚠️ Troubleshooting

### Cron Job não executa

1. Verifique se `pg_cron` está habilitado:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```
2. Verifique se o cron job está ativo:
   ```sql
   SELECT active FROM cron.job WHERE jobname = 'check-subscription-renewals';
   ```
3. Verifique os logs do PostgreSQL

### Erro 401 (Unauthorized)

- Verifique se a Service Role Key está correta
- Verifique se o token está sendo enviado corretamente no header

### Erro 404 (Not Found)

- Verifique se a URL está correta
- Verifique se a Edge Function foi deployada:
  ```bash
  supabase functions deploy check-subscription-renewals
  ```

### Edge Function não processa assinaturas

- Verifique se há assinaturas que expiram hoje
- Verifique os logs da Edge Function
- Verifique se a função está retornando erros

---

## 📝 Checklist

- [ ] URL do projeto Supabase obtida
- [ ] Service Role Key obtida
- [ ] Migration SQL executada com valores corretos
- [ ] Cron job verificado e ativo
- [ ] Teste manual executado com sucesso
- [ ] Logs da Edge Function verificados
- [ ] Assinaturas sendo processadas corretamente

---

## 🔗 Links Úteis

- [Documentação pg_cron](https://github.com/citusdata/pg_cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)

---

**Última atualização**: 2025-01-27

