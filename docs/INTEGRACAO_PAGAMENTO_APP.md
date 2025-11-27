# 💳 Integração de Pagamento Direto no App

## ✅ Sim, é possível integrar pagamentos diretamente no app!

A página de venda agora está totalmente integrada ao app, sem precisar redirecionar para links externos.

## 🎯 O que foi implementado

### 1. **Modal de Checkout Integrado**
- Modal que abre diretamente no app
- Seleção de período (Mensal/Anual)
- Resumo do pedido
- Processamento seguro via Stripe

### 2. **Serviço de Pagamento**
- `services/paymentService.ts` - Gerencia pagamentos
- Integração com Stripe Checkout
- Verificação de status de pagamento

### 3. **Funções Edge do Supabase**
- `create-checkout-session` - Cria sessão de checkout
- `stripe-webhook` - Processa eventos do Stripe
- `get-checkout-session` - Verifica status

## 🔧 Como Configurar

### Passo 1: Configurar Stripe

1. **Criar conta no Stripe**
   - Acesse: https://stripe.com
   - Crie uma conta (modo teste disponível)

2. **Obter chaves da API**
   - Dashboard Stripe > Developers > API keys
   - Copie a **Secret Key** (começa com `sk_`)
   - Copie a **Publishable Key** (começa com `pk_`)

### Passo 2: Configurar Variáveis de Ambiente no Supabase

No Supabase Dashboard:

1. Vá em **Project Settings > Edge Functions > Secrets**
2. Adicione as seguintes variáveis:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://seu-app.vercel.app
```

### Passo 3: Deploy das Funções Edge

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Link do projeto
supabase link --project-ref seu-project-ref

# Deploy das funções
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy get-checkout-session
```

### Passo 4: Configurar Webhook no Stripe

1. No Dashboard do Stripe, vá em **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
4. Eventos para ouvir:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie o **Signing secret** e adicione como `STRIPE_WEBHOOK_SECRET` no Supabase

### Passo 5: Atualizar PremiumPage

A página já está atualizada! Agora quando o usuário clicar em "Assinar", abre um modal integrado ao invés de redirecionar.

## 🎨 Como Funciona

### Fluxo de Compra:

1. **Usuário clica em "Assinar Premium"**
   - Modal de checkout abre no app
   - Usuário escolhe período (Mensal/Anual)

2. **Usuário confirma pagamento**
   - App cria sessão de checkout no Stripe
   - Abre checkout do Stripe em popup ou nova aba

3. **Usuário completa pagamento no Stripe**
   - Stripe processa o pagamento
   - Webhook notifica o Supabase

4. **Supabase cria assinatura automaticamente**
   - Cria registro em `user_subscriptions`
   - Atualiza `plan_type` do usuário
   - Cria registro em `payments`

5. **App detecta assinatura ativa**
   - Página `/premium` mostra mensagem de sucesso
   - Usuário pode acessar recursos premium

## 🔄 Alternativa: Pagamento Direto (Sem Redirecionamento)

Se preferir processar pagamento totalmente no app (sem abrir Stripe Checkout), você pode usar **Stripe Elements**:

### Instalar Stripe.js

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Criar componente de pagamento direto

```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_...'); // Sua chave pública
```

## 📝 Checklist de Configuração

- [ ] Conta Stripe criada
- [ ] Chaves da API obtidas
- [ ] Variáveis de ambiente configuradas no Supabase
- [ ] Funções Edge deployadas
- [ ] Webhook configurado no Stripe
- [ ] Teste de pagamento realizado

## 🧪 Testar Pagamento

### Cartões de Teste do Stripe:

- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

**Data**: Qualquer data futura  
**CVC**: Qualquer 3 dígitos  
**CEP**: Qualquer CEP válido

## 🔐 Segurança

- ✅ Chaves secretas apenas no backend (Supabase)
- ✅ Webhook verificado por assinatura
- ✅ Dados de cartão nunca passam pelo seu servidor
- ✅ Stripe é PCI compliant

## 💡 Vantagens da Integração

1. **Melhor UX**: Usuário não sai do app
2. **Mais conversão**: Menos fricção no processo
3. **Controle total**: Você gerencia todo o fluxo
4. **Dados centralizados**: Tudo no Supabase
5. **Segurança**: Stripe cuida da segurança de pagamento

## 🐛 Troubleshooting

### Modal não abre
- Verifique se `CheckoutModal` está importado
- Verifique console do navegador para erros

### Erro ao criar sessão
- Verifique se `STRIPE_SECRET_KEY` está configurada
- Verifique se a função Edge foi deployada
- Verifique logs do Supabase

### Webhook não funciona
- Verifique se URL está correta no Stripe
- Verifique se `STRIPE_WEBHOOK_SECRET` está configurado
- Verifique logs da função Edge

### Assinatura não é criada
- Verifique se webhook está recebendo eventos
- Verifique logs do Supabase
- Verifique se `user_id` está correto nos metadados

## 📚 Documentação Adicional

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

