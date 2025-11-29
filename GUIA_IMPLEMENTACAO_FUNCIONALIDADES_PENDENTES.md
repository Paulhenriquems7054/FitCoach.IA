# 📋 Guia de Implementação - Funcionalidades Pendentes da Página de Vendas

## 📊 Status Atual: 85% Implementado

### ✅ O Que Já Está Funcionando

1. **Estrutura de Planos**: 100% ✅
   - Todos os 7 planos criados no banco
   - Preços corretos
   - Features e limites configurados

2. **Página de Vendas**: 100% ✅
   - Layout completo e responsivo
   - Badges visuais ("RECOMENDADO", "MAIS VENDIDO", etc.)
   - Seções "Como Funciona"
   - Cálculo de economia

3. **Verificação de Acesso**: 100% ✅
   - Hook `usePremiumAccess` atualizado
   - Verifica planos reais
   - Limites implementados

### ⚠️ O Que Falta Implementar: 15%

---

## 🎯 Funcionalidades Pendentes

### 1. **Sistema de Compra/Checkout** ⚠️ CRÍTICO

#### Status Atual:
- ✅ Modal `CheckoutModal` existe
- ✅ Botões de assinatura existem
- ❌ Integração com Cakto não está completa
- ❌ Fluxo de pagamento não está funcional

#### O Que Implementar:

**1.1. Integração com Cakto para Assinaturas**

Criar ou atualizar `services/caktoService.ts`:

```typescript
interface CaktoCheckoutParams {
  planId: string;
  planName: string;
  price: number;
  priceYearly?: number;
  userId: string;
  userEmail: string;
  installments?: number; // 1 (à vista) ou 12 (parcelado)
}

export async function createCaktoCheckout(params: CaktoCheckoutParams): Promise<{
  checkoutUrl: string;
  paymentId: string;
}> {
  // 1. Criar checkout no Cakto
  // 2. Retornar URL de checkout
  // 3. Salvar paymentId para rastreamento
}
```

**1.2. Atualizar CheckoutModal**

Em `components/CheckoutModal.tsx`:
- Integração com `createCaktoCheckout`
- Redirecionamento para URL do Cakto
- Tratamento de retorno do pagamento
- Loading states
- Opção de parcelamento (12x) para plano anual

**1.3. Webhook do Cakto**

Verificar e atualizar `supabase/functions/cakto-webhook/index.ts`:
- Criar/atualizar assinatura quando pagamento confirmado
- Atualizar `planType` do usuário
- Ativar `subscription_status = 'active'`
- Configurar `expiry_date` conforme plano
- Criar registro em `user_subscriptions`

**Arquivos a Criar/Modificar:**
- `services/caktoService.ts` (criar ou atualizar)
- `components/CheckoutModal.tsx` (atualizar)
- `supabase/functions/cakto-webhook/index.ts` (verificar/atualizar)

---

### 2. **Sistema de Cancelamento de Assinatura** ⚠️ IMPORTANTE

#### Status Atual:
- ✅ Função `cancelSubscription` existe em `supabaseService.ts`
- ❌ Não há UI para cancelar
- ❌ Não há confirmação/feedback visual
- ❌ Não há integração com Cakto para cancelar pagamento

#### O Que Implementar:

**2.1. Componente de Cancelamento**

Criar `components/CancelSubscriptionModal.tsx`:

```typescript
interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  subscriptionName: string;
  expiryDate?: string;
  onSuccess: () => void;
}

// Features:
- Modal de confirmação
- Explicar consequências do cancelamento
- Opção de cancelar imediatamente ou no fim do período
- Feedback visual de sucesso/erro
- Informar data de expiração do acesso
```

**2.2. Integração com Cakto**

Em `services/caktoService.ts`:

```typescript
export async function cancelCaktoSubscription(paymentId: string): Promise<void> {
  // 1. Cancelar assinatura no Cakto
  // 2. Atualizar status no Supabase
  // 3. Manter acesso até fim do período pago
}
```

**2.3. Adicionar Botão de Cancelamento**

Em `pages/PremiumPage.tsx` ou `pages/SettingsPage.tsx`:

Adicionar seção "Gerenciar Assinatura" quando usuário tem assinatura ativa:
- Botão "Cancelar Assinatura"
- Informações sobre renovação
- Data de expiração
- Status da assinatura

**Arquivos a Criar/Modificar:**
- `components/CancelSubscriptionModal.tsx` (novo)
- `services/caktoService.ts` (adicionar função)
- `pages/PremiumPage.tsx` (adicionar seção)
- `pages/SettingsPage.tsx` (adicionar opção)

---

### 3. **Sistema de Recargas** ⚠️ IMPORTANTE

#### Status Atual:
- ✅ Recargas exibidas na página
- ✅ Informações corretas
- ❌ Botões mostram "em breve disponível"
- ❌ Não há compra de recargas
- ❌ Não há aplicação de recargas

#### O Que Implementar:

**3.1. Criar Tabela de Recargas**

Criar `supabase/migration_criar_tabela_recharges.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.recharges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recharge_type TEXT NOT NULL CHECK (recharge_type IN ('turbo', 'voice_bank', 'pass_livre')),
  amount_paid DECIMAL(10,2) NOT NULL,
  voice_minutes_added INTEGER, -- Para turbo e voice_bank (em segundos: 1800 para turbo, 6000 para voice_bank)
  expires_at TIMESTAMP WITH TIME ZONE, -- Para turbo (24h) e pass_livre (30 dias)
  is_active BOOLEAN DEFAULT true,
  cakto_payment_id TEXT, -- ID do pagamento no Cakto
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recharges_user_id ON public.recharges(user_id);
CREATE INDEX idx_recharges_active ON public.recharges(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_recharges_expires ON public.recharges(expires_at) WHERE expires_at IS NOT NULL;

-- RLS Policies
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recharges"
  ON public.recharges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recharges"
  ON public.recharges FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**3.2. Serviço de Recargas**

Criar `services/rechargeService.ts`:

```typescript
export interface Recharge {
  id: string;
  userId: string;
  rechargeType: 'turbo' | 'voice_bank' | 'pass_livre';
  amountPaid: number;
  voiceMinutesAdded?: number; // Em segundos
  expiresAt?: string;
  isActive: boolean;
  caktoPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

const RECHARGE_PRICES = {
  turbo: 5.00,
  voice_bank: 12.90,
  pass_livre: 19.90
};

const RECHARGE_MINUTES = {
  turbo: 1800, // 30 minutos em segundos
  voice_bank: 6000, // 100 minutos em segundos
  pass_livre: null // Não adiciona minutos, remove limite
};

export async function purchaseRecharge(
  rechargeType: 'turbo' | 'voice_bank' | 'pass_livre',
  userId: string,
  userEmail: string
): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> {
  // 1. Criar checkout no Cakto
  // 2. Retornar URL de checkout
  // 3. Após pagamento confirmado (via webhook), criar registro em recharges
}

export async function applyRecharge(userId: string): Promise<void> {
  // 1. Buscar recargas ativas
  // 2. Aplicar minutos ao voice_balance_upsell (para voice_bank)
  // 3. Remover limite de voz (para pass_livre)
  // 4. Marcar recargas expiradas como inativas
}

export async function getUserActiveRecharges(userId: string): Promise<Recharge[]> {
  // Buscar recargas ativas do usuário
}

export async function checkRechargeExpiration(userId: string): Promise<void> {
  // Verificar e desativar recargas expiradas
}
```

**3.3. Lógica de Aplicação de Recargas**

Atualizar `services/usageLimitService.ts`:

```typescript
// Adicionar função para verificar e aplicar recargas:
export async function checkAndApplyRecharges(userId: string): Promise<{
  hasPassLivre: boolean;
  voiceBalanceAdded: number; // Em segundos
}> {
  // 1. Buscar recargas ativas do tipo 'voice_bank'
  // 2. Somar minutos ao voice_balance_upsell
  // 3. Buscar recargas ativas do tipo 'pass_livre'
  // 4. Se ativa, retornar hasPassLivre = true
  // 5. Verificar expiração de recargas 'turbo'
  // 6. Retornar total de minutos adicionados
}

// Atualizar função de verificação de limite de voz:
export async function checkVoiceLimit(userId: string): Promise<{
  canUse: boolean;
  remainingSeconds: number;
  hasPassLivre: boolean;
}> {
  // 1. Verificar recargas ativas
  // 2. Se tem pass_livre ativo → hasPassLivre = true, canUse = true
  // 3. Se não, verificar limite diário + voice_balance_upsell
  // 4. Retornar segundos restantes
}
```

**3.4. Atualizar Webhook do Cakto**

Em `supabase/functions/cakto-webhook/index.ts`:

Adicionar tratamento para recargas:
```typescript
// Quando receber confirmação de pagamento de recarga:
// 1. Identificar tipo de recarga pelo produto_id
// 2. Criar registro em recharges
// 3. Aplicar recarga ao usuário
// 4. Calcular expires_at conforme tipo
```

**3.5. Atualizar Botões de Recarga**

Em `pages/PremiumPage.tsx`:

Substituir:
```typescript
onClick={() => showError('Recarga em breve disponível')}
```

Por:
```typescript
onClick={() => handlePurchaseRecharge('turbo')} // ou 'voice_bank', 'pass_livre'
```

**Arquivos a Criar/Modificar:**
- `supabase/migration_criar_tabela_recharges.sql` (novo)
- `services/rechargeService.ts` (novo)
- `services/usageLimitService.ts` (atualizar)
- `pages/PremiumPage.tsx` (atualizar botões)
- `supabase/functions/cakto-webhook/index.ts` (adicionar tratamento de recargas)

---

### 4. **Renovação Automática** ⚠️ MÉDIO

#### Status Atual:
- ❌ Não há verificação de renovação
- ❌ Não há atualização automática de expiry_date
- ❌ Não há notificação de renovação

#### O Que Implementar:

**4.1. Edge Function para Renovação**

Criar `supabase/functions/check-subscription-renewals/index.ts`:

```typescript
// Executar diariamente via cron:
// 1. Buscar assinaturas que renovam hoje
// 2. Verificar pagamento no Cakto
// 3. Se pago, atualizar expiry_date
// 4. Se não pago, marcar como expired
// 5. Enviar notificação se necessário
```

**4.2. Configurar Cron Job no Supabase**

No Supabase Dashboard > Database > Cron Jobs:

```sql
-- Executar diariamente às 00:00 UTC
SELECT cron.schedule(
  'check-subscription-renewals',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/check-subscription-renewals',
    headers := '{"Authorization": "Bearer SEU_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

**Arquivos a Criar:**
- `supabase/functions/check-subscription-renewals/index.ts` (novo)

---

### 5. **Parcelamento (12x)** ⚠️ BAIXO

#### Status Atual:
- ✅ Informação exibida na página (12x de R$ 34,53)
- ❌ Não há opção de escolher parcelamento
- ❌ Não há integração com Cakto para parcelamento

#### O Que Implementar:

**5.1. Adicionar Opção de Parcelamento**

Em `components/CheckoutModal.tsx`:

```typescript
// Adicionar para plano anual:
- Radio buttons: "À vista (R$ 297,00)" ou "12x de R$ 34,53"
- Passar opção escolhida para createCaktoCheckout
- Atualizar preço exibido conforme escolha
```

**5.2. Atualizar Cakto Service**

Em `services/caktoService.ts`:

```typescript
interface CaktoCheckoutParams {
  // ... existente
  installments?: number; // 1 (à vista) ou 12 (parcelado)
}

// Passar installments para API do Cakto
```

**Arquivos a Modificar:**
- `components/CheckoutModal.tsx` (adicionar opção)
- `services/caktoService.ts` (adicionar parâmetro)

---

### 6. **Informações Importantes Faltantes** ⚠️ BAIXO

#### O Que Adicionar na Página:

**6.1. Informações sobre Cancelamento**

Em `pages/PremiumPage.tsx`, adicionar seção informativa:

```typescript
// Para planos B2C:
- "A cobrança é automática todo mês"
- "O limite de 15 minutos de voz é por dia (reseta à meia-noite)"
- "Para cancelar, é só entrar em contato ou cancelar no app"
- "O acesso continua até o fim do período que você pagou"
```

**6.2. Informações sobre Plano Anual**

```typescript
// Adicionar avisos:
- "É uma compra única, não renova automaticamente"
- "Se cancelar antes do fim do ano, não há reembolso proporcional"
- "Após 12 meses, precisa renovar manualmente"
- "Ainda tem o limite de 15 minutos de voz por dia"
```

**6.3. Informações sobre Planos B2B**

```typescript
// Adicionar avisos:
- "Se tiver mais de X alunos, precisa fazer upgrade"
- "O código é único e não deve ser compartilhado publicamente"
- "Cobrança é mensal e recorrente"
- "Pode cancelar a qualquer momento"
- "Alunos perdem acesso se você cancelar"
```

**6.4. Informações sobre Planos Personal Trainer**

```typescript
// Adicionar avisos:
- "Ideal para quem está começando na consultoria" (Team 5)
- "Mais vantajoso: maior margem de lucro" (Team 15)
- "Clientes não pagam nada extra"
- "Você entrega Nutricionista + Personal Trainer IA junto com seu treino"
```

**Arquivos a Modificar:**
- `pages/PremiumPage.tsx` (adicionar seções informativas)

---

## 📝 Checklist de Implementação

### Prioridade ALTA 🔴

- [ ] **1. Integração com Cakto para compras**
  - [ ] Criar/atualizar `services/caktoService.ts`
  - [ ] Atualizar `CheckoutModal.tsx`
  - [ ] Verificar/atualizar webhook do Cakto
  - [ ] Testar fluxo completo de compra

- [ ] **2. Sistema de Recargas**
  - [ ] Criar tabela `recharges` (migration SQL)
  - [ ] Criar `services/rechargeService.ts`
  - [ ] Atualizar `usageLimitService.ts`
  - [ ] Atualizar webhook do Cakto para recargas
  - [ ] Atualizar botões na `PremiumPage.tsx`
  - [ ] Testar compra e aplicação de recargas

### Prioridade MÉDIA 🟡

- [ ] **3. Cancelamento de Assinatura**
  - [ ] Criar `CancelSubscriptionModal.tsx`
  - [ ] Adicionar função no `caktoService.ts`
  - [ ] Adicionar botão na `PremiumPage.tsx`
  - [ ] Adicionar opção na `SettingsPage.tsx`
  - [ ] Testar cancelamento

- [ ] **4. Renovação Automática**
  - [ ] Criar Edge Function `check-subscription-renewals`
  - [ ] Configurar cron job no Supabase
  - [ ] Testar renovação

### Prioridade BAIXA 🟢

- [ ] **5. Parcelamento**
  - [ ] Adicionar opção no `CheckoutModal`
  - [ ] Atualizar `caktoService.ts`
  - [ ] Testar parcelamento

- [ ] **6. Informações Adicionais**
  - [ ] Adicionar seções informativas na página
  - [ ] Adicionar tooltips/explicações
  - [ ] Melhorar UX com informações claras

---

## 🔧 Detalhamento Técnico

### 1. Estrutura de Dados para Recargas

```sql
-- Tipos de recarga:
-- 'turbo': +30 minutos (1800 segundos), válido 24h
-- 'voice_bank': +100 minutos (6000 segundos), não expira
-- 'pass_livre': remove limite por 30 dias, não adiciona minutos

-- Campos importantes:
-- expires_at: NULL para voice_bank, timestamp para outros
-- voice_minutes_added: NULL para pass_livre, segundos para outros
-- is_active: true se ativa, false se expirada/cancelada
```

### 2. Lógica de Aplicação de Recargas

```typescript
// Fluxo completo:
1. Usuário compra recarga → Cakto processa pagamento
2. Webhook recebe confirmação → Cria registro em recharges
3. Ao usar voz → Verifica recargas ativas:
   - Se tem 'pass_livre' ativo → Remove limite (canUse = true sempre)
   - Se tem 'voice_bank' → Adiciona ao voice_balance_upsell
   - Se tem 'turbo' não expirado → Usa minutos adicionais primeiro
4. Ao resetar diário → Verifica expiração de recargas:
   - Marca 'turbo' expiradas como inativas
   - Marca 'pass_livre' expiradas como inativas
   - Mantém 'voice_bank' ativas (não expiram)
```

### 3. Integração com Cakto

```typescript
// Endpoints necessários no Cakto:
- POST /api/checkout (criar checkout)
  - Parâmetros: product_id, amount, customer_email, installments
  - Retorna: checkout_url, payment_id

- POST /api/subscriptions/cancel (cancelar assinatura)
  - Parâmetros: payment_id
  - Retorna: success, cancelled_at

- POST /api/recharges/purchase (comprar recarga)
  - Parâmetros: product_id, amount, customer_email
  - Retorna: checkout_url, payment_id

- GET /api/payments/{paymentId}/status (verificar status)
  - Retorna: status, paid_at, amount
```

### 4. Mapeamento de Produtos Cakto

```typescript
// Mapear planos para product_id do Cakto:
const CAKTO_PRODUCTS = {
  // Planos B2C
  monthly: 'cakto_product_monthly',
  annual_vip: 'cakto_product_annual_vip',
  
  // Planos B2B
  academy_starter: 'cakto_product_academy_starter',
  academy_growth: 'cakto_product_academy_growth',
  academy_pro: 'cakto_product_academy_pro',
  
  // Planos Personal
  personal_team_5: 'cakto_product_personal_team_5',
  personal_team_15: 'cakto_product_personal_team_15',
  
  // Recargas
  recharge_turbo: 'cakto_product_recharge_turbo',
  recharge_voice_bank: 'cakto_product_recharge_voice_bank',
  recharge_pass_livre: 'cakto_product_recharge_pass_livre'
};
```

---

## 🧪 Testes Necessários

### Testes de Compra
- [ ] Comprar plano mensal
- [ ] Comprar plano anual (à vista)
- [ ] Comprar plano anual (12x)
- [ ] Comprar plano B2B (Starter, Growth, Pro)
- [ ] Comprar plano Personal Trainer (Team 5, Team 15)
- [ ] Verificar ativação automática após pagamento
- [ ] Verificar criação de registro em `user_subscriptions`
- [ ] Verificar atualização de `planType` do usuário

### Testes de Recargas
- [ ] Comprar Sessão Turbo
- [ ] Verificar aplicação de +30 minutos (1800 segundos)
- [ ] Verificar expiração após 24h
- [ ] Comprar Banco de Voz 100
- [ ] Verificar adição ao `voice_balance_upsell` (6000 segundos)
- [ ] Verificar que não expira
- [ ] Comprar Passe Livre 30 Dias
- [ ] Verificar remoção de limite por 30 dias
- [ ] Verificar expiração após 30 dias
- [ ] Testar múltiplas recargas simultâneas
- [ ] Testar uso de recargas ao falar

### Testes de Cancelamento
- [ ] Cancelar assinatura mensal
- [ ] Verificar acesso até fim do período
- [ ] Cancelar assinatura anual
- [ ] Verificar não reembolso proporcional
- [ ] Verificar atualização de status no Cakto
- [ ] Verificar atualização de status no Supabase

### Testes de Renovação
- [ ] Simular renovação mensal
- [ ] Verificar atualização de `expiry_date`
- [ ] Verificar notificação de renovação
- [ ] Testar falha de pagamento na renovação
- [ ] Verificar marcação como `expired` se não pago

### Testes de Limites
- [ ] Verificar limite de 15 minutos de voz (free)
- [ ] Verificar limite removido com pass_livre
- [ ] Verificar uso de voice_balance_upsell
- [ ] Verificar reset diário de limite
- [ ] Verificar expiração de recargas

---

## 📚 Documentação Adicional Necessária

### 1. Guia de Integração Cakto

Criar `docs/GUIA_INTEGRACAO_CAKTO.md`:
- Como configurar produtos no Cakto
- Como configurar webhooks
- Como testar pagamentos
- Mapeamento de product_ids
- Configuração de parcelamento

### 2. Guia de Testes

Criar `docs/GUIA_TESTES_PAGAMENTO.md`:
- Como testar compras em ambiente de desenvolvimento
- Como testar recargas
- Como testar cancelamento
- Como simular webhooks
- Dados de teste

### 3. Guia de Troubleshooting

Criar `docs/TROUBLESHOOTING_PAGAMENTOS.md`:
- Problemas comuns e soluções
- Como verificar status de pagamento
- Como verificar recargas aplicadas
- Como verificar assinaturas ativas
- Como debugar webhooks

---

## 🎯 Priorização Sugerida

### Fase 1 (Crítico - 1-2 semanas) 🔴

**Objetivo**: Permitir compras de planos e recargas

1. **Integração com Cakto para compras**
   - Criar/atualizar `caktoService.ts`
   - Atualizar `CheckoutModal.tsx`
   - Verificar/atualizar webhook
   - Testar fluxo completo

2. **Sistema de recargas básico**
   - Criar tabela `recharges`
   - Criar `rechargeService.ts`
   - Atualizar webhook para recargas
   - Atualizar botões na página
   - Testar compra

**Resultado Esperado**: Usuários podem comprar planos e recargas

---

### Fase 2 (Importante - 2-3 semanas) 🟡

**Objetivo**: Completar funcionalidades de gerenciamento

3. **Aplicação completa de recargas**
   - Atualizar `usageLimitService.ts`
   - Implementar lógica de aplicação
   - Testar uso de recargas

4. **Cancelamento de assinatura**
   - Criar `CancelSubscriptionModal.tsx`
   - Adicionar função no `caktoService.ts`
   - Adicionar UI
   - Testar cancelamento

**Resultado Esperado**: Sistema completo de recargas e cancelamento

---

### Fase 3 (Melhorias - 1 semana) 🟢

**Objetivo**: Melhorias e refinamentos

5. **Renovação automática**
   - Criar Edge Function
   - Configurar cron job
   - Testar renovação

6. **Parcelamento**
   - Adicionar opção no checkout
   - Testar parcelamento

7. **Informações adicionais**
   - Adicionar seções informativas
   - Melhorar UX

**Resultado Esperado**: Sistema completo e polido

---

## 🔍 Exemplos de Código

### Exemplo 1: Criar Checkout no Cakto

```typescript
// services/caktoService.ts

export async function createCaktoCheckout(params: CaktoCheckoutParams): Promise<{
  checkoutUrl: string;
  paymentId: string;
}> {
  const supabase = getSupabaseClient();
  
  // Mapear plano para product_id do Cakto
  const productId = CAKTO_PRODUCTS[params.planName];
  if (!productId) {
    throw new Error(`Produto Cakto não encontrado para plano: ${params.planName}`);
  }
  
  // Chamar API do Cakto
  const response = await fetch('https://api.cakto.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CAKTO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: productId,
      amount: params.priceYearly || params.price,
      customer_email: params.userEmail,
      installments: params.installments || 1,
      metadata: {
        user_id: params.userId,
        plan_id: params.planId,
        plan_name: params.planName
      }
    })
  });
  
  if (!response.ok) {
    throw new Error('Erro ao criar checkout no Cakto');
  }
  
  const data = await response.json();
  return {
    checkoutUrl: data.checkout_url,
    paymentId: data.payment_id
  };
}
```

### Exemplo 2: Aplicar Recarga

```typescript
// services/usageLimitService.ts

export async function applyRecharge(userId: string): Promise<{
  hasPassLivre: boolean;
  voiceBalanceAdded: number;
}> {
  const supabase = getSupabaseClient();
  
  // Buscar recargas ativas
  const { data: recharges, error } = await supabase
    .from('recharges')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .or('expires_at.is.null');
  
  if (error) {
    logger.error('Erro ao buscar recargas', 'usageLimitService', error);
    return { hasPassLivre: false, voiceBalanceAdded: 0 };
  }
  
  let hasPassLivre = false;
  let voiceBalanceAdded = 0;
  
  for (const recharge of recharges || []) {
    // Verificar expiração
    if (recharge.expires_at && new Date(recharge.expires_at) < new Date()) {
      // Marcar como inativa
      await supabase
        .from('recharges')
        .update({ is_active: false })
        .eq('id', recharge.id);
      continue;
    }
    
    if (recharge.recharge_type === 'pass_livre') {
      hasPassLivre = true;
    } else if (recharge.voice_minutes_added) {
      voiceBalanceAdded += recharge.voice_minutes_added;
    }
  }
  
  // Atualizar voice_balance_upsell do usuário
  if (voiceBalanceAdded > 0) {
    const { data: user } = await supabase
      .from('users')
      .select('voice_balance_upsell')
      .eq('id', userId)
      .single();
    
    const currentBalance = user?.voice_balance_upsell || 0;
    
    await supabase
      .from('users')
      .update({ 
        voice_balance_upsell: currentBalance + voiceBalanceAdded 
      })
      .eq('id', userId);
  }
  
  return { hasPassLivre, voiceBalanceAdded };
}
```

### Exemplo 3: Verificar Limite de Voz com Recargas

```typescript
// services/usageLimitService.ts

export async function checkVoiceLimit(userId: string): Promise<{
  canUse: boolean;
  remainingSeconds: number;
  hasPassLivre: boolean;
}> {
  // Verificar recargas
  const { hasPassLivre, voiceBalanceAdded } = await applyRecharge(userId);
  
  if (hasPassLivre) {
    return {
      canUse: true,
      remainingSeconds: Infinity,
      hasPassLivre: true
    };
  }
  
  // Buscar dados do usuário
  const { data: user } = await supabase
    .from('users')
    .select('voice_daily_limit_seconds, voice_used_today_seconds, voice_balance_upsell, last_usage_date')
    .eq('id', userId)
    .single();
  
  if (!user) {
    return { canUse: false, remainingSeconds: 0, hasPassLivre: false };
  }
  
  // Verificar reset diário
  const lastUsage = user.last_usage_date ? new Date(user.last_usage_date) : null;
  const today = new Date();
  const isNewDay = !lastUsage || 
    lastUsage.getDate() !== today.getDate() ||
    lastUsage.getMonth() !== today.getMonth() ||
    lastUsage.getFullYear() !== today.getFullYear();
  
  const dailyLimit = user.voice_daily_limit_seconds || 900; // 15 minutos
  const usedToday = isNewDay ? 0 : (user.voice_used_today_seconds || 0);
  const balance = user.voice_balance_upsell || 0;
  
  const remainingDaily = Math.max(0, dailyLimit - usedToday);
  const totalRemaining = remainingDaily + balance;
  
  return {
    canUse: totalRemaining > 0,
    remainingSeconds: totalRemaining,
    hasPassLivre: false
  };
}
```

---

## 📊 Métricas de Sucesso

### KPIs para Acompanhar

1. **Taxa de Conversão**
   - % de visitantes que compram um plano
   - % de usuários free que fazem upgrade

2. **Taxa de Cancelamento**
   - % de assinaturas canceladas
   - Motivos de cancelamento

3. **Uso de Recargas**
   - Quantidade de recargas vendidas
   - Tipo de recarga mais vendida
   - Taxa de recompra

4. **Satisfação**
   - Feedback dos usuários
   - Problemas reportados

---

## 🚨 Pontos de Atenção

### Segurança
- ✅ Validar pagamentos no webhook (não confiar apenas no frontend)
- ✅ Verificar assinatura de webhook do Cakto
- ✅ Não expor chaves de API no frontend
- ✅ Validar dados antes de criar assinaturas

### Performance
- ✅ Cachear verificação de assinatura ativa
- ✅ Otimizar queries de recargas
- ✅ Usar índices no banco de dados

### UX
- ✅ Feedback claro durante compra
- ✅ Mensagens de erro amigáveis
- ✅ Confirmação de ações importantes
- ✅ Informações claras sobre limites e recargas

---

## 📞 Suporte

### Em caso de problemas:

1. **Verificar logs**
   - Supabase Dashboard > Logs
   - Console do navegador
   - Logs do webhook

2. **Verificar dados**
   - Status de pagamento no Cakto
   - Assinaturas no Supabase
   - Recargas ativas

3. **Testar manualmente**
   - Criar checkout
   - Simular webhook
   - Verificar aplicação de recargas

---

**Data de Criação**: 2025-01-27  
**Última Atualização**: 2025-01-27  
**Status**: Documento completo e pronto para implementação

