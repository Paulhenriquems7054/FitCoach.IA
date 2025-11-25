# Configuração de Webhook do Cakto

Este guia explica como configurar o webhook do Cakto para processar pagamentos automaticamente.

## 📋 Pré-requisitos

1. Conta no Cakto configurada
2. Supabase Edge Functions deployadas
3. Serviço de email configurado (Resend ou SendGrid)

## 🔧 Passo a Passo

### 1. Deploy das Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Deploy das funções
supabase functions deploy cakto-webhook
supabase functions deploy send-email
```

### 2. Configurar Variáveis de Ambiente

No painel do Supabase, vá em **Edge Functions** > **Settings** e adicione:

```env
# URLs e Keys do Supabase (já configuradas automaticamente)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# IDs dos Planos (obter do banco de dados)
# IMPORTANTE: Não use prefixo SUPABASE_ nos nomes das variáveis
PLAN_BASIC_ID=uuid-do-plano-basic
PLAN_PREMIUM_ID=uuid-do-plano-premium
PLAN_ENTERPRISE_ID=uuid-do-plano-enterprise

# URL da aplicação
APP_URL=https://fitcoach.ia

# Secret do webhook do Cakto (configurar no Cakto)
CAKTO_WEBHOOK_SECRET=seu-secret-aqui

# Serviço de Email (escolha um)
# Opção 1: Resend (recomendado)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=FitCoach.IA <noreply@fitcoach.ia>

# Opção 2: SendGrid
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
# EMAIL_FROM=noreply@fitcoach.ia
```

### 3. Obter IDs dos Planos

Execute no SQL Editor do Supabase:

```sql
SELECT id, name, display_name 
FROM subscription_plans 
WHERE name IN ('basic', 'premium', 'enterprise');
```

Use os IDs retornados nas variáveis de ambiente.

### 4. Configurar Webhook no Cakto

1. Acesse o painel do Cakto
2. Vá em **Configurações** > **Webhooks**
3. Adicione novo webhook:
   - **URL**: `https://seu-projeto.supabase.co/functions/v1/cakto-webhook`
   - **Eventos**: `payment.completed`, `payment.paid`
   - **Método**: `POST`
   - **Headers**: 
     - `Authorization: Bearer seu-secret-aqui`
     - `Content-Type: application/json`
4. Salve o webhook

### 5. Configurar Metadados nos Links de Pagamento

No Cakto, configure os metadados de cada link de pagamento:

**Link Basic** (`https://pay.cakto.com.br/3bewmsy_665747`):
```json
{
  "plan_name": "basic"
}
```

**Link Premium** (`https://pay.cakto.com.br/8djcjc6`):
```json
{
  "plan_name": "premium"
}
```

**Link Enterprise** (`https://pay.cakto.com.br/35tdhxu`):
```json
{
  "plan_name": "enterprise"
}
```

### 6. Testar o Webhook

1. Faça um pagamento de teste no Cakto
2. Verifique os logs da Edge Function no Supabase
3. Verifique se a assinatura foi criada no banco
4. Verifique se o email foi enviado

## 📧 Configuração de Email

### Opção 1: Resend (Recomendado)

1. Crie conta em [resend.com](https://resend.com)
2. Obtenha a API Key
3. Configure o domínio (opcional, mas recomendado)
4. Adicione `RESEND_API_KEY` nas variáveis de ambiente

### Opção 2: SendGrid

1. Crie conta em [sendgrid.com](https://sendgrid.com)
2. Obtenha a API Key
3. Configure o domínio
4. Adicione `SENDGRID_API_KEY` nas variáveis de ambiente

## 🔍 Troubleshooting

### Webhook não está sendo chamado

1. Verifique se a URL está correta
2. Verifique se o secret está configurado corretamente
3. Verifique os logs do Cakto para ver se há erros

### Email não está sendo enviado

1. Verifique se o serviço de email está configurado
2. Verifique os logs da função `send-email`
3. Verifique se o domínio está verificado (Resend/SendGrid)

### Assinatura não está sendo criada

1. Verifique se o usuário existe no banco
2. Verifique se os IDs dos planos estão corretos
3. Verifique os logs da função `cakto-webhook`

## 📝 Formato do Webhook

O Cakto deve enviar um payload no seguinte formato:

```json
{
  "event": "payment.completed",
  "data": {
    "id": "payment_123",
    "status": "paid",
    "amount": 29.90,
    "currency": "BRL",
    "customer": {
      "email": "usuario@email.com",
      "name": "Nome do Usuário"
    },
    "metadata": {
      "plan_name": "basic"
    },
    "payment_link": "https://pay.cakto.com.br/3bewmsy_665747",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## 🔐 Segurança

- Use sempre HTTPS para webhooks
- Valide o secret do webhook
- Use service role key apenas nas Edge Functions
- Não exponha secrets no código do frontend

