# 📋 Guia de Configuração para Produção

Este guia contém instruções detalhadas para configurar e testar o sistema FitCoach.IA em produção.

---

## 1. 🧪 Testar o Webhook do Cakto em Staging

### 1.1. Preparação do Ambiente

#### No Supabase:
1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Edge Functions** → **cakto-webhook**
4. Certifique-se de que a função está deployada

#### Verificar URL do Webhook:
```
https://[SEU_PROJETO].supabase.co/functions/v1/cakto-webhook
```

### 1.2. Configurar Webhook no Cakto

1. Acesse o [Dashboard do Cakto](https://app.cakto.com.br)
2. Vá em **Configurações** → **Webhooks**
3. Clique em **Adicionar Webhook**
4. Configure:
   - **URL**: `https://[SEU_PROJETO].supabase.co/functions/v1/cakto-webhook`
   - **Eventos**:
     - ✅ `subscription.paid`
     - ✅ `subscription.renewed`
     - ✅ `subscription.canceled`
     - ✅ `payment.paid`
     - ✅ `payment.failed`
     - ✅ `recharge.paid`
   - **Método**: `POST`
   - **Headers**: 
     ```
     Authorization: Bearer [CAKTO_WEBHOOK_SECRET]
     Content-Type: application/json
     ```

### 1.3. Testar Webhook Manualmente

#### Usando cURL:
```bash
curl -X POST https://[SEU_PROJETO].supabase.co/functions/v1/cakto-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [CAKTO_WEBHOOK_SECRET]" \
  -d '{
    "type": "subscription.paid",
    "data": {
      "id": "test-subscription-123",
      "status": "paid",
      "subscription_id": "sub_test_123",
      "user_id": "test-user-id",
      "amount": 29.90,
      "currency": "BRL",
      "paid_at": "2025-01-27T10:00:00Z"
    }
  }'
```

#### Usando Postman/Insomnia:
1. Crie uma requisição POST
2. URL: `https://[SEU_PROJETO].supabase.co/functions/v1/cakto-webhook`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer [CAKTO_WEBHOOK_SECRET]`
4. Body (JSON):
```json
{
  "type": "subscription.paid",
  "data": {
    "id": "test-subscription-123",
    "status": "paid",
    "subscription_id": "sub_test_123",
    "user_id": "[USER_ID_DO_SUPABASE]",
    "amount": 29.90,
    "currency": "BRL",
    "paid_at": "2025-01-27T10:00:00Z"
  }
}
```

### 1.4. Verificar Resposta

**Resposta esperada (sucesso):**
```json
{
  "success": true,
  "processed": true
}
```

**Resposta esperada (erro):**
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

### 1.5. Verificar Logs no Supabase

1. Acesse **Edge Functions** → **cakto-webhook** → **Logs**
2. Procure por:
   - `[INFO] Webhook recebido: subscription.paid`
   - `[INFO] Assinatura [ID] atualizada para ativa`
   - `[INFO] Chave de API configurada para usuário [ID]`

### 1.6. Verificar no Banco de Dados

Execute no SQL Editor do Supabase:
```sql
-- Verificar assinatura atualizada
SELECT 
  id,
  user_id,
  status,
  current_period_start,
  current_period_end,
  updated_at
FROM user_subscriptions
WHERE provider_payment_id = 'sub_test_123'
ORDER BY updated_at DESC
LIMIT 1;

-- Verificar chave de API criada (se for admin de academia)
SELECT 
  g.id,
  g.name,
  g.gemini_api_enabled,
  g.gemini_api_key,
  g.gemini_api_last_used
FROM gyms g
INNER JOIN users u ON u.gym_id = g.id
WHERE u.id = '[USER_ID_DO_SUPABASE]'
  AND u.gym_role = 'admin';
```

### 1.7. Testar Todos os Eventos

Crie testes para cada tipo de evento:

#### Teste 1: Assinatura Paga
```json
{
  "type": "subscription.paid",
  "data": {
    "id": "test-1",
    "subscription_id": "sub_paid_123",
    "status": "paid",
    "paid_at": "2025-01-27T10:00:00Z"
  }
}
```

#### Teste 2: Assinatura Cancelada
```json
{
  "type": "subscription.canceled",
  "data": {
    "id": "test-2",
    "subscription_id": "sub_canceled_123",
    "status": "canceled"
  }
}
```

#### Teste 3: Pagamento Falhou
```json
{
  "type": "payment.failed",
  "data": {
    "id": "test-3",
    "subscription_id": "sub_failed_123",
    "status": "failed"
  }
}
```

#### Teste 4: Recarga Paga
```json
{
  "type": "recharge.paid",
  "data": {
    "id": "test-4",
    "transaction_id": "recharge_123",
    "status": "paid",
    "paid_at": "2025-01-27T10:00:00Z"
  }
}
```

---

## 2. ⚙️ Configurar Variáveis de Ambiente

### 2.1. Variáveis Necessárias

#### No Supabase (Edge Functions):
1. Acesse **Settings** → **Edge Functions** → **Secrets**
2. Adicione as seguintes variáveis:

| Variável | Descrição | Obrigatória | Exemplo |
|----------|-----------|-------------|---------|
| `CAKTO_WEBHOOK_SECRET` | Secret para validar webhooks do Cakto | ✅ Sim | `sk_live_abc123...` |
| `SUPABASE_URL` | URL do projeto Supabase | ✅ Sim | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key do Supabase | ✅ Sim | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

#### No Frontend (Vercel/Netlify):
1. Acesse as configurações do seu projeto
2. Vá em **Environment Variables**
3. Adicione:

| Variável | Descrição | Obrigatória | Exemplo |
|----------|-----------|-------------|---------|
| `VITE_CAKTO_API_KEY` | API Key do Cakto (opcional) | ❌ Não | `sk_live_xyz789...` |
| `VITE_CAKTO_API_URL` | URL base da API do Cakto (opcional) | ❌ Não | `https://api.cakto.com.br/v1` |
| `VITE_GEMINI_API_KEY` | Chave global do Gemini (fallback) | ✅ Sim | `AIzaSy...` |
| `VITE_SUPABASE_URL` | URL do Supabase | ✅ Sim | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon Key do Supabase | ✅ Sim | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### 2.2. Como Obter as Chaves

#### CAKTO_WEBHOOK_SECRET:
1. Acesse o [Dashboard do Cakto](https://app.cakto.com.br)
2. Vá em **Configurações** → **API Keys**
3. Crie uma nova chave para webhooks
4. Copie o secret gerado

#### CAKTO_API_KEY (Opcional):
1. No Dashboard do Cakto
2. Vá em **Configurações** → **API Keys**
3. Crie uma chave para API
4. Use apenas se quiser cancelar assinaturas via API (não obrigatório)

#### SUPABASE_SERVICE_ROLE_KEY:
1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Vá em **Settings** → **API**
3. Copie a **service_role** key (⚠️ NUNCA exponha no frontend!)

### 2.3. Configurar no Supabase CLI (Local)

Se estiver desenvolvendo localmente:

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref [SEU_PROJECT_REF]

# Adicionar secrets
supabase secrets set CAKTO_WEBHOOK_SECRET=sk_live_abc123...
supabase secrets set SUPABASE_URL=https://xxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.4. Verificar Variáveis Configuradas

#### No Supabase Dashboard:
1. **Settings** → **Edge Functions** → **Secrets**
2. Verifique se todas as variáveis estão listadas

#### Via CLI:
```bash
supabase secrets list
```

#### Testar no Código (Edge Function):
```typescript
// Em supabase/functions/cakto-webhook/index.ts
const webhookSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET');
console.log('Webhook secret configurado:', webhookSecret ? '✅ Sim' : '❌ Não');
```

---

## 3. ⏰ Configurar Cron Job para Renovação Automática

### 3.1. Opção 1: Supabase Edge Function + pg_cron (Recomendado)

#### Criar Edge Function:
Crie `supabase/functions/check-subscription-renewals/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkAndRenewSubscriptions } from '../../../services/renewalService.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação (opcional - pode usar secret)
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Executar renovação
    await checkAndRenewSubscriptions();

    return new Response(
      JSON.stringify({ success: true, message: 'Renovação verificada' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao verificar renovações:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

#### Configurar pg_cron no Supabase:

1. Acesse o **SQL Editor** no Supabase
2. Execute:

```sql
-- Habilitar extensão pg_cron (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar função para chamar Edge Function
CREATE OR REPLACE FUNCTION public.call_renewal_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response text;
BEGIN
  -- Chamar Edge Function via HTTP
  SELECT content INTO response
  FROM http_post(
    url := 'https://[SEU_PROJETO].supabase.co/functions/v1/check-subscription-renewals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  
  -- Log do resultado
  RAISE NOTICE 'Renovação verificada: %', response;
END;
$$;

-- Agendar execução diária às 02:00 (horário UTC)
SELECT cron.schedule(
  'check-subscription-renewals-daily',
  '0 2 * * *', -- Todo dia às 02:00 UTC
  $$SELECT public.call_renewal_check();$$
);

-- Verificar jobs agendados
SELECT * FROM cron.job;
```

### 3.2. Opção 2: Vercel Cron Jobs

Se estiver usando Vercel:

1. Crie `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/renew-subscriptions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

2. Crie `api/cron/renew-subscriptions.ts`:
```typescript
import { checkAndRenewSubscriptions } from '../../services/renewalService';

export default async function handler(req: any, res: any) {
  // Verificar secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await checkAndRenewSubscriptions();
    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao verificar renovações:', error);
    return res.status(500).json({ success: false, error: errorMessage });
  }
}
```

3. Configure variável de ambiente:
```
CRON_SECRET=seu_secret_aqui
```

### 3.3. Opção 3: Serviço Externo (Cron-job.org, EasyCron, etc.)

1. Crie uma conta em um serviço de cron
2. Configure:
   - **URL**: `https://[SEU_PROJETO].supabase.co/functions/v1/check-subscription-renewals`
   - **Método**: `POST`
   - **Headers**: 
     ```
     Authorization: Bearer [CRON_SECRET]
     Content-Type: application/json
     ```
   - **Frequência**: Diário às 02:00 UTC
   - **Body**: `{}`

### 3.4. Testar Cron Job Manualmente

```bash
curl -X POST https://[SEU_PROJETO].supabase.co/functions/v1/check-subscription-renewals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [CRON_SECRET]" \
  -d '{}'
```

### 3.5. Verificar Execução

#### No Supabase (pg_cron):
```sql
-- Ver histórico de execuções
SELECT * FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'check-subscription-renewals-daily'
)
ORDER BY start_time DESC
LIMIT 10;
```

#### Verificar Logs:
1. Acesse **Edge Functions** → **check-subscription-renewals** → **Logs**
2. Procure por execuções diárias

---

## 4. 📊 Monitorar Logs Após Deploy

### 4.1. Logs do Supabase

#### Edge Functions:
1. Acesse **Edge Functions** → **[nome-da-função]** → **Logs**
2. Filtros úteis:
   - Por nível: `INFO`, `WARN`, `ERROR`
   - Por data/hora
   - Por função específica

#### Database Logs:
1. Acesse **Logs** → **Postgres Logs**
2. Procure por:
   - Erros de SQL
   - Queries lentas
   - Deadlocks

### 4.2. Logs do Frontend

#### Vercel:
1. Acesse **Deployments** → **[deployment]** → **Functions**
2. Veja logs em tempo real

#### Browser Console:
- Abra DevTools (F12)
- Vá em **Console**
- Filtre por `[ERROR]` ou `[WARN]`

### 4.3. Monitoramento de Erros

#### Configurar Sentry (Recomendado):

1. Instalar:
```bash
npm install @sentry/react @sentry/tracing
```

2. Configurar em `index.tsx`:
```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: "https://[SEU_DSN]@[PROJECT_ID].ingest.sentry.io/[PROJECT_ID]",
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE,
});
```

3. Capturar erros:
```typescript
try {
  // código
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### 4.4. Métricas Importantes

#### Monitorar:
- ✅ Taxa de sucesso de webhooks (deve ser > 99%)
- ✅ Tempo de resposta do webhook (< 2s)
- ✅ Taxa de renovação automática (deve ser > 95%)
- ✅ Erros de pagamento
- ✅ Assinaturas expiradas não renovadas

#### Queries Úteis:

```sql
-- Assinaturas que precisam atenção
SELECT 
  id,
  user_id,
  status,
  current_period_end,
  CASE 
    WHEN current_period_end < NOW() THEN 'Expirada'
    WHEN current_period_end < NOW() + INTERVAL '7 days' THEN 'Expirando em breve'
    ELSE 'OK'
  END as status_renovacao
FROM user_subscriptions
WHERE status IN ('active', 'trialing')
  AND current_period_end < NOW() + INTERVAL '7 days'
ORDER BY current_period_end ASC;

-- Webhooks processados nas últimas 24h
SELECT 
  DATE_TRUNC('hour', created_at) as hora,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as sucesso
FROM user_subscriptions
WHERE updated_at > NOW() - INTERVAL '24 hours'
GROUP BY hora
ORDER BY hora DESC;

-- Assinaturas canceladas recentemente
SELECT 
  id,
  user_id,
  canceled_at,
  canceled_reason
FROM user_subscriptions
WHERE status = 'canceled'
  AND canceled_at > NOW() - INTERVAL '7 days'
ORDER BY canceled_at DESC;
```

### 4.5. Alertas Recomendados

Configure alertas para:

1. **Webhook falhando** (> 5% de falhas em 1h)
2. **Renovação falhando** (> 10% de falhas em 1 dia)
3. **Assinaturas expiradas** (> 5 assinaturas expiradas não renovadas)
4. **Erros críticos** (qualquer erro 500)

#### Exemplo de Alerta (Supabase):
```sql
-- Criar função de alerta
CREATE OR REPLACE FUNCTION check_webhook_health()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  failure_rate numeric;
BEGIN
  SELECT 
    (COUNT(*) FILTER (WHERE status = 'past_due'))::numeric / 
    NULLIF(COUNT(*), 0) * 100
  INTO failure_rate
  FROM user_subscriptions
  WHERE updated_at > NOW() - INTERVAL '1 hour';
  
  IF failure_rate > 5 THEN
    -- Enviar alerta (email, Slack, etc.)
    RAISE WARNING 'Taxa de falha de webhook alta: %%%', failure_rate;
  END IF;
END;
$$;
```

---

## 5. ✅ Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] Webhook do Cakto configurado e testado
- [ ] Variáveis de ambiente configuradas (Supabase + Frontend)
- [ ] Cron job configurado e testado
- [ ] Logs configurados e monitoramento ativo
- [ ] Testes de integração passando
- [ ] Backup do banco de dados configurado
- [ ] Documentação atualizada
- [ ] Equipe treinada nos procedimentos

---

## 6. 🆘 Troubleshooting

### Webhook não está sendo chamado:
1. Verificar URL no Cakto
2. Verificar `CAKTO_WEBHOOK_SECRET`
3. Verificar logs do Cakto
4. Testar manualmente com cURL

### Renovação não está funcionando:
1. Verificar se cron job está agendado
2. Verificar logs da Edge Function
3. Verificar se `checkCaktoPaymentStatus()` está funcionando
4. Verificar permissões no banco de dados

### Erros de autenticação:
1. Verificar `SUPABASE_SERVICE_ROLE_KEY`
2. Verificar `CAKTO_WEBHOOK_SECRET`
3. Verificar headers nas requisições

### Chave de API não está sendo criada:
1. Verificar se usuário é admin de academia
2. Verificar logs do webhook
3. Verificar função `autoSetupGymApiKey()`

---

**Última atualização**: 2025-01-27
**Versão**: 1.0.0

