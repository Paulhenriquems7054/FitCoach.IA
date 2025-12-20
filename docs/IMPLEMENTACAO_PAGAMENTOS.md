# 💳 Guia de Implementação - Sistema de Pagamentos

Este documento descreve como configurar e usar o sistema de pagamentos integrado com Cakto.

## 📋 O que foi implementado

### ✅ Serviços Criados

1. **`services/paymentService.ts`**
   - Integração com Cakto
   - Processamento de pagamentos de assinaturas
   - Processamento de pagamentos de recargas
   - Ativação automática após pagamento

2. **`services/b2bCodeService.ts`**
   - Geração de códigos únicos B2B
   - Validação de códigos
   - Ativação de códigos
   - Gerenciamento de licenças

3. **`services/subscriptionRenewalService.ts`**
   - Verificação de assinaturas para renovação
   - Renovação automática
   - Expiração de assinaturas antigas

4. **`components/RechargeModal.tsx`**
   - Interface para compra de recargas
   - Integração com Cakto

### ✅ Backend (NestJS)

1. **`backend/src/payment/payment.controller.ts`**
   - Endpoint de webhook da Cakto: `POST /payment/webhook/cakto`
   - Endpoint de renovação: `POST /payment/renew-subscriptions`
   - Endpoint de teste: `POST /payment/webhook/cakto/test`

2. **`backend/src/payment/payment.service.ts`**
   - Processamento de webhooks
   - Ativação de assinaturas
   - Ativação de recargas
   - Geração de códigos B2B

## 🗄️ Schema do Banco de Dados

Execute o script SQL em `docs/SUPABASE_SCHEMA_PAGAMENTOS.sql` no Supabase:

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo do arquivo `SUPABASE_SCHEMA_PAGAMENTOS.sql`
4. Execute o script

### Tabelas criadas:

- `payments` - Registro de todos os pagamentos
- `recharges` - Recargas de minutos compradas
- `b2b_codes` - Códigos de ativação B2B
- `b2b_code_activations` - Histórico de ativações

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Supabase (já deve existir)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key

# Backend (para webhooks)
VITE_AI_BACKEND_URL=http://localhost:3001
```

No backend (`backend/.env`):

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
PORT=3001
```

### 2. Configurar Webhook na Cakto

1. Acesse o painel da Cakto
2. Vá em Configurações → Webhooks
3. Adicione webhook:
   - **URL**: `https://seu-backend.com/payment/webhook/cakto`
   - **Eventos**: `payment.completed`, `payment.failed`, `payment.refunded`
   - **Método**: POST

### 3. Configurar IDs de Checkout da Cakto

No arquivo `services/paymentService.ts`, atualize os IDs de checkout:

```typescript
export const RECHARGE_CONFIGS: Record<RechargeType, RechargeConfig> = {
  turbo: {
    // ...
    caktoCheckoutId: 'SEU_ID_AQUI', // Obter da Cakto
  },
  reserve: {
    // ...
    caktoCheckoutId: 'SEU_ID_AQUI',
  },
  pass_libre: {
    // ...
    caktoCheckoutId: 'SEU_ID_AQUI',
  },
};
```

## 🚀 Como Funciona

### Fluxo de Assinatura

1. Usuário clica em "Assinar" na página Premium
2. `CheckoutModal` chama `initiateSubscriptionCheckout()`
3. Usuário é redirecionado para Cakto
4. Após pagamento, Cakto envia webhook para backend
5. Backend processa e ativa assinatura automaticamente
6. Se for plano B2B, gera código de ativação

### Fluxo de Recarga

1. Usuário clica em "Comprar Mais Tempo" durante chamada
2. `RechargeModal` abre com opções de recarga
3. Usuário escolhe recarga e é redirecionado para Cakto
4. Após pagamento, Cakto envia webhook
5. Backend ativa recarga automaticamente
6. Minutos são adicionados à conta do usuário

### Fluxo B2B

1. Empresa compra plano B2B (academy_starter, etc.)
2. Após pagamento confirmado, sistema gera código único
3. Código é enviado para empresa (email/notificação)
4. Alunos usam código no app para ativar acesso
5. Sistema controla limite de ativações

## 🔄 Renovação Automática

Configure um cron job para chamar diariamente:

```bash
# Exemplo com curl
curl -X POST https://seu-backend.com/payment/renew-subscriptions
```

Ou configure no seu provedor de hospedagem (Vercel Cron, Railway Cron, etc.)

## 🧪 Testando

### Testar Webhook Localmente

1. Use ngrok ou similar para expor seu backend local:
   ```bash
   ngrok http 3001
   ```

2. Configure webhook na Cakto apontando para URL do ngrok

3. Faça um pagamento de teste

4. Verifique logs do backend

### Testar Endpoint de Teste

```bash
curl -X POST http://localhost:3001/payment/webhook/cakto/test \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "test_123",
    "status": "paid",
    "metadata": {
      "user_id": "user-uuid",
      "plan_name": "monthly"
    }
  }'
```

## 📝 Próximos Passos

1. **Configurar IDs reais da Cakto** nos arquivos de configuração
2. **Configurar webhook** na Cakto apontando para seu backend
3. **Executar script SQL** no Supabase
4. **Testar fluxo completo** de pagamento
5. **Configurar cron job** para renovação automática
6. **Implementar notificações** quando código B2B for gerado

## ⚠️ Importante

- **Segurança**: Implemente validação de assinatura do webhook da Cakto
- **Testes**: Teste todos os fluxos antes de produção
- **Monitoramento**: Configure logs e alertas para falhas de pagamento
- **Backup**: Mantenha backup das tabelas de pagamento

