# Configuração do Webhook da Cakto

Este documento explica como configurar o webhook da Cakto para processar pagamentos automaticamente e ativar assinaturas no FitCoach.IA.

## 📋 Pré-requisitos

1. ✅ Edge Function `cakto-webhook` deployada no Supabase
2. ✅ Função SQL `get_user_id_by_email` criada (executar `migration_criar_funcao_get_user_by_email.sql`)
3. ✅ Tabela `subscription_plans` com os campos `checkout_url_monthly` e `checkout_url_yearly` preenchidos
4. ✅ Conta no Cakto configurada

## 🔧 Passo a Passo

### 1. Executar Migração SQL

Execute no SQL Editor do Supabase:

```sql
-- Arquivo: supabase/migration_criar_funcao_get_user_by_email.sql
```

Esta função permite que o webhook busque usuários pelo email em `auth.users`.

### 2. Configurar Variáveis de Ambiente

No painel do Supabase, vá em **Edge Functions** > **Settings** e adicione:

```env
# URLs e Keys do Supabase (já configuradas automaticamente)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Secret do webhook da Cakto (configurar no Cakto)
CAKTO_WEBHOOK_SECRET=seu-secret-aqui

# Flag para pular autenticação durante testes (opcional)
SKIP_CAKTO_WEBHOOK_AUTH=false
```

### 3. Deploy da Edge Function

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Deploy da função
supabase functions deploy cakto-webhook
```

### 4. Obter URL do Webhook

A URL do webhook será:

```
https://seu-projeto.supabase.co/functions/v1/cakto-webhook
```

Substitua `seu-projeto` pelo seu project reference do Supabase.

### 5. Configurar Webhook no Cakto

1. Acesse o painel do Cakto
2. Vá em **Configurações** > **Webhooks** (ou área equivalente)
3. Adicione novo webhook:
   - **URL**: `https://seu-projeto.supabase.co/functions/v1/cakto-webhook`
   - **Método**: `POST`
   - **Eventos**: 
     - `payment.completed`
     - `payment.paid`
     - `subscription.created`
     - `subscription.payment_succeeded`
   - **Headers**: 
     - `x-webhook-secret: seu-secret-aqui` (mesmo valor de `CAKTO_WEBHOOK_SECRET`)
     - `Content-Type: application/json`

### 6. Verificar Planos no Banco de Dados

Execute no SQL Editor do Supabase para verificar se os planos estão configurados corretamente:

```sql
SELECT 
  id,
  name,
  display_name,
  plan_category,
  plan_group,
  checkout_url_monthly,
  checkout_url_yearly,
  price_monthly,
  price_yearly
FROM subscription_plans
WHERE plan_category = 'b2c_ai' OR plan_group = 'b2c'
ORDER BY price_monthly;
```

Os planos individuais devem ter:
- `checkout_url_monthly`: `https://pay.cakto.com.br/3ujuqzz_703304` (Mensal - R$ 34,90)
- `checkout_url_yearly`: `https://pay.cakto.com.br/xphpm5f_703310` (Anual - R$ 297,00)

## 📝 Formato do Webhook Esperado

O Cakto deve enviar um payload no seguinte formato:

```json
{
  "event": "payment.completed",
  "type": "payment.completed",
  "data": {
    "id": "payment_123",
    "checkout_id": "3ujuqzz_703304",
    "checkoutId": "3ujuqzz_703304",
    "status": "paid",
    "amount": 34.90,
    "currency": "BRL",
    "customer_email": "usuario@email.com",
    "buyer": {
      "email": "usuario@email.com",
      "name": "Nome do Usuário"
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Nota**: O webhook tenta extrair o `checkout_id` de vários campos possíveis:
- `body.data.checkout_id`
- `body.data.checkoutId`
- `body.data.payment_link` (extrai o ID da URL)

## 🔄 Fluxo de Processamento

1. **Cakto envia webhook** → Edge Function recebe o payload
2. **Validação**: Verifica o secret do webhook (se configurado)
3. **Busca do plano**: 
   - Tenta encontrar pelo `cakto_checkout_id`
   - Se não encontrar, busca nas URLs `checkout_url_monthly` e `checkout_url_yearly`
4. **Identificação do usuário**: 
   - Busca usuário pelo email em `users.email`
   - Se não encontrar, tenta buscar em `auth.users` via função RPC
5. **Criação/Atualização da assinatura**:
   - Se já existe assinatura ativa, atualiza
   - Se não existe, cria nova assinatura na tabela `user_subscriptions`
   - Determina se é mensal ou anual baseado no checkout_id usado
6. **Atualização do usuário**: Atualiza `subscription_status` para `'active'` na tabela `users`
7. **Registro de pagamento**: Cria registro na tabela `payments` (se existir)

## 🧪 Testar o Webhook

### Opção 1: Usar curl

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/cakto-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: seu-secret-aqui" \
  -d '{
    "event": "payment.completed",
    "data": {
      "checkout_id": "3ujuqzz_703304",
      "id": "test_payment_123",
      "amount": 34.90,
      "customer_email": "teste@email.com"
    }
  }'
```

### Opção 2: Usar Postman

1. Criar nova requisição POST
2. URL: `https://seu-projeto.supabase.co/functions/v1/cakto-webhook`
3. Headers:
   - `Content-Type: application/json`
   - `x-webhook-secret: seu-secret-aqui`
4. Body (JSON):
```json
{
  "event": "payment.completed",
  "data": {
    "checkout_id": "3ujuqzz_703304",
    "id": "test_payment_123",
    "amount": 34.90,
    "customer_email": "teste@email.com"
  }
}
```

### Opção 3: Teste Real

1. Fazer um pagamento de teste no Cakto usando um dos links de checkout
2. Verificar os logs da Edge Function no Supabase
3. Verificar se a assinatura foi criada:
```sql
SELECT * FROM user_subscriptions 
WHERE cakto_transaction_id = 'id_do_pagamento_teste'
ORDER BY created_at DESC;
```

## 🔍 Troubleshooting

### Webhook não está sendo chamado

1. Verifique se a URL está correta no painel do Cakto
2. Verifique se o secret está configurado corretamente
3. Verifique os logs do Cakto para ver se há erros ao enviar o webhook
4. Verifique os logs da Edge Function no Supabase

### Plano não encontrado

1. Verifique se o `checkout_id` no payload corresponde a um plano no banco
2. Execute a query de verificação de planos (passo 6)
3. Verifique se os campos `checkout_url_monthly` e `checkout_url_yearly` estão preenchidos

### Usuário não encontrado

1. Verifique se o email no payload corresponde a um usuário cadastrado
2. Verifique se a função `get_user_id_by_email` foi criada corretamente
3. Verifique se o usuário existe em `auth.users`:
```sql
SELECT id, email FROM auth.users WHERE email = 'email@teste.com';
```

### Assinatura não está sendo criada

1. Verifique os logs da Edge Function para ver erros específicos
2. Verifique se a tabela `user_subscriptions` existe e tem as colunas corretas
3. Verifique se o `plan_id` está correto:
```sql
SELECT id, name, display_name FROM subscription_plans WHERE id = 'plan_id_usado';
```

## 📊 Monitoramento

### Verificar Webhooks Recebidos

```sql
SELECT * FROM audit_logs 
WHERE event_type LIKE '%webhook%' 
ORDER BY created_at DESC 
LIMIT 50;
```

### Verificar Assinaturas Criadas

```sql
SELECT 
  us.id,
  us.user_id,
  u.email,
  sp.display_name,
  us.status,
  us.billing_cycle,
  us.current_period_end,
  us.cakto_transaction_id,
  us.created_at
FROM user_subscriptions us
JOIN subscription_plans sp ON sp.id = us.plan_id
LEFT JOIN auth.users u ON u.id = us.user_id
WHERE us.payment_provider = 'cakto'
ORDER BY us.created_at DESC
LIMIT 50;
```

## 🔐 Segurança

- ✅ Use sempre HTTPS para webhooks
- ✅ Valide o secret do webhook (`CAKTO_WEBHOOK_SECRET`)
- ✅ Use service role key apenas nas Edge Functions (nunca no frontend)
- ✅ Não exponha secrets no código do frontend
- ✅ Monitore os logs de auditoria regularmente

## 📚 Referências

- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentação Cakto](https://docs.cakto.com.br) (se disponível)

