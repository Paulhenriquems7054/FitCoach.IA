# 📱 Guia Completo: Como o App Deve Reconhecer Planos e Códigos de Ativação

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados no Supabase](#estrutura-de-dados-no-supabase)
3. [Como o App Reconhece os Planos](#como-o-app-reconhece-os-planos)
4. [Sistema de Códigos de Ativação (Academias)](#sistema-de-códigos-de-ativação-academias)
5. [Lógica de Verificação de Acesso](#lógica-de-verificação-de-acesso)
6. [Fluxos por Tipo de Plano](#fluxos-por-tipo-de-plano)
7. [Implementação Prática](#implementação-prática)
8. [Exemplos de Código](#exemplos-de-código)

---

## 🎯 Visão Geral

O app FitCoach.IA funciona como um **sistema de acesso baseado em planos e códigos de ativação**. Quando um cliente compra na página de vendas, a Cakto envia um webhook para o Supabase, que processa e cria/atualiza a assinatura. O app então verifica esse status para liberar ou bloquear recursos.

### Fluxo Principal

```
Cliente compra na página de vendas → Cakto
Cakto envia webhook → Supabase Edge Function (cakto-webhook)
Edge Function identifica o plano via app_plans (usando product.short_id)
Edge Function cria/atualiza registro na tabela correspondente:
  - B2C → user_subscriptions
  - B2B Academia → academy_subscriptions
  - Personal → personal_subscriptions
  - Recarga → recharges
App verifica status da assinatura → Libera/bloqueia recursos
```

---

## 📊 Estrutura de Dados no Supabase

### 1. Tabela `app_plans` (Central de Planos) ⭐

**Esta tabela contém TODOS os planos da página de vendas e serve como MAPEAMENTO entre o `product.short_id` da Cakto e o plano do app.**

```sql
CREATE TABLE app_plans (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,              -- ex: 'b2c_mensal', 'b2b_academia_starter'
  name TEXT NOT NULL,                      -- Nome exibido
  plan_group TEXT NOT NULL,                -- 'b2c', 'recarga', 'b2b_academia', 'personal'
  billing_type TEXT NOT NULL,              -- 'recorrente' | 'one_time'
  billing_period TEXT,                     -- 'mensal', 'anual', 'nenhum'
  price NUMERIC(10,2) NOT NULL,
  total_checkout_price NUMERIC(10,2),
  cakto_checkout_id TEXT,                  -- ⚠️ IMPORTANTE: product.short_id da Cakto
  max_licenses INTEGER,                    -- Para planos B2B/Personal
  minutes_voice_per_day INTEGER,           -- Minutos de voz/dia
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**⚠️ IMPORTANTE:** O campo `cakto_checkout_id` deve conter o **`product.short_id`** que vem no webhook da Cakto (ex.: `"zeygxve_668421"`), não o ID numérico do checkout.

### 2. Tabela `academy_subscriptions` (Planos B2B)

Armazena assinaturas de academias que compraram planos B2B:

```sql
CREATE TABLE academy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_email TEXT NOT NULL,              -- Email da academia (comprador)
  plan_slug TEXT NOT NULL,                 -- Referência a app_plans.slug
  plan_group TEXT NOT NULL,                -- 'b2b_academia'
  cakto_checkout_id TEXT,                  -- product.short_id usado
  cakto_transaction_id TEXT,               -- ID da transação Cakto
  amount_paid NUMERIC(10,2),
  max_licenses INTEGER NOT NULL,            -- Quantas licenças o plano inclui
  licenses_used INTEGER DEFAULT 0,          -- Quantas licenças já foram usadas
  activation_code TEXT UNIQUE NOT NULL,     -- ⚠️ CÓDIGO GERADO (ex: "ACADEMIA-X")
  status TEXT DEFAULT 'active',             -- 'active', 'canceled', 'expired'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Tabela `user_subscriptions` (Planos B2C)

Armazena assinaturas de usuários individuais (B2C):

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,                -- Email do usuário
  plan_slug TEXT NOT NULL,                 -- Referência a app_plans.slug
  plan_group TEXT NOT NULL,                -- 'b2c'
  cakto_checkout_id TEXT,
  cakto_transaction_id TEXT,
  amount_paid NUMERIC(10,2),
  status TEXT DEFAULT 'active',             -- 'active', 'canceled', 'expired'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. Tabela `recharges` (Recargas One-Time)

Armazena recargas compradas (Sessão Turbo, Banco de Voz, Passe Livre):

```sql
CREATE TABLE recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  recharge_slug TEXT NOT NULL,              -- Referência a app_plans.slug
  plan_group TEXT NOT NULL,                -- 'recarga'
  cakto_checkout_id TEXT,
  cakto_transaction_id TEXT,
  amount_paid NUMERIC(10,2),
  status TEXT DEFAULT 'active',             -- 'active', 'applied', 'expired'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**⚠️ NOTA:** A tabela `recharges` usa `recharge_slug` (referência a `app_plans.slug`) e `user_email` (não `user_id`).

### 5. Tabela `student_academy_links` (Vínculo Aluno ↔ Academia) ⭐

**Vincula alunos que ativaram código da academia:**

```sql
CREATE TABLE student_academy_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL,            -- ID do usuário (aluno)
  academy_subscription_id UUID NOT NULL,   -- Referência a academy_subscriptions
  activation_code TEXT NOT NULL,            -- Código usado para ativar
  status TEXT DEFAULT 'active',             -- 'active', 'blocked', 'expired'
  activated_at TIMESTAMPTZ DEFAULT now(),
  blocked_at TIMESTAMPTZ,
  FOREIGN KEY (academy_subscription_id) REFERENCES academy_subscriptions(id)
);
```

### 7. Tabela `users`

Armazena o perfil do usuário e seu plano atual:

```typescript
{
  id: UUID,                    // Referencia auth.users(id)
  nome: string,
  email: string,              // Para busca e vinculação
  username: string,
  plan_type: string,          // 'free' | 'monthly' | 'annual_vip' | 'academy_*' | 'personal_*'
  subscription_status: string, // 'active' | 'inactive' | 'expired'
  expiry_date: timestamp,      // Data de expiração
  gym_id: string,             // ID da academia (se B2B)
  gym_role: string,           // 'student' | 'admin' | 'trainer' | 'receptionist'
  voice_daily_limit_seconds: number,
  voice_used_today_seconds: number,
  voice_balance_upsell: number,
  // ... outros campos
}
```

### 2. Tabela `user_subscriptions`

Armazena assinaturas B2C (mensal/anual):

```typescript
{
  id: UUID,
  user_id: UUID,              // Referencia users(id)
  plan_id: UUID,             // Referencia subscription_plans(id)
  status: string,             // 'active' | 'canceled' | 'expired'
  billing_cycle: string,      // 'monthly' | 'yearly'
  current_period_start: timestamp,
  current_period_end: timestamp,
  payment_provider: string,   // 'cakto' | 'activation_code'
}
```

### 6. Tabela `recharges`

Armazena recargas pontuais (Turbo, Banco de Voz, Passe Livre):

```typescript
{
  id: UUID,
  user_id: UUID,
  recharge_type: string,     // 'turbo' | 'voice_bank' | 'pass_libre'
  quantity: number,          // 30 minutos, 100 minutos, 30 dias
  status: string,            // 'active' | 'used' | 'expired'
  expires_at: timestamp,     // Para turbo e pass_libre
  payment_status: string,    // 'paid' | 'pending'
}
```

---

## 🔍 Como o App Reconhece os Planos

### 1. Fluxo de Webhook (Cakto → Supabase)

Quando uma compra é feita na página de vendas:

1. **Cakto envia webhook** para `https://...functions.supabase.co/cakto-webhook`

2. **Edge Function recebe** o payload JSON com:
   ```json
   {
     "event": "payment.completed",
     "data": {
       "id": "transaction-id",
       "status": "paid",
       "amount": 34.90,
       "product": {
         "short_id": "zeygxve_668421"  // ⚠️ Esta é a chave!
       },
       "customer": {
         "email": "cliente@example.com"
       }
     }
   }
   ```

3. **Edge Function busca** na tabela `app_plans`:
   ```sql
   SELECT * FROM app_plans 
   WHERE cakto_checkout_id = 'zeygxve_668421';
   ```

4. **Edge Function identifica** o `plan_group`:
   - `b2c` → cria registro em `user_subscriptions`
   - `b2b_academia` → cria registro em `academy_subscriptions` + **gera código de ativação**
   - `recarga` → cria registro em `recharges`
   - `personal` → cria registro em `personal_subscriptions` + **gera código de ativação**

### 2. Como o App Verifica o Acesso

O app deve fazer uma verificação em **duas etapas**:

#### Etapa 1: Verificar se usuário tem assinatura direta (B2C)

```typescript
// Buscar assinatura B2C ativa
const { data: b2cSubscription } = await supabase
  .from('user_subscriptions')
  .select('*, app_plans(*)')
  .eq('user_email', userEmail)
  .eq('status', 'active')
  .single();

if (b2cSubscription) {
  // Usuário tem acesso Premium via B2C
  return { hasAccess: true, source: 'b2c', plan: b2cSubscription };
}
```

#### Etapa 2: Verificar se usuário está vinculado a uma academia (B2B)

```typescript
// Buscar vínculo com academia
const { data: academyLink } = await supabase
  .from('student_academy_links')
  .select(`
    *,
    academy_subscriptions (
      *,
      app_plans (*)
    )
  `)
  .eq('student_user_id', userId)
  .eq('status', 'active')
  .single();

if (academyLink && academyLink.academy_subscriptions.status === 'active') {
  // Usuário tem acesso Premium via academia
  return { hasAccess: true, source: 'academy', plan: academyLink.academy_subscriptions };
}
```

### 3. Hook `usePremiumAccess`

O hook principal para verificar acesso premium:

```typescript
import { usePremiumAccess } from '../hooks/usePremiumAccess';

const { isPremium, isLoading, requirePremium } = usePremiumAccess();
```

**Lógica de Verificação:**

1. **Verifica `planType` do usuário:**
   ```typescript
   const premiumPlans = [
     'monthly',
     'annual_vip',
     'academy_starter_mini',
     'academy_starter',
     'academy_growth',
     'academy_pro',
     'personal_team_5',
     'personal_team_15'
   ];
   ```

2. **Verifica assinatura ativa no Supabase:**
   ```typescript
   const subscription = await getActiveSubscription(userId);
   const hasActiveSubscription = !!subscription;
   ```

3. **Verifica status da assinatura:**
   ```typescript
   const isPremium = isPremiumPlan(user?.planType) || 
                     (user?.subscriptionStatus === 'active' && hasActiveSubscription) ||
                     user?.subscription === 'premium';
   ```

### 2. Serviço `subscriptionService`

Verifica status completo da assinatura:

```typescript
import { checkSubscriptionStatus } from '../services/subscriptionService';

const status = await checkSubscriptionStatus(userId);
// Retorna:
// {
//   isActive: boolean,
//   planType: string | null,
//   features: { ... },
//   expiresAt: Date | null,
//   canUpgrade: boolean
// }
```

**Features verificadas:**
- `photoAnalysis`: Análise de fotos
- `workoutAnalysis`: Análise de treinos
- `customWorkouts`: Treinos personalizados
- `textChat`: Chat de texto
- `voiceChat`: Chat de voz
- `voiceMinutesDaily`: Minutos disponíveis hoje
- `voiceMinutesTotal`: Total acumulado (Banco de Voz)
- `voiceUnlimitedUntil`: Se tem Passe Livre ativo

---

## 🎫 Sistema de Códigos de Ativação (Academias)

### 1. Geração do Código na Edge Function

Quando uma academia compra um plano B2B, a Edge Function deve:

1. **Criar registro** em `academy_subscriptions`
2. **Gerar código único** (ex.: `"ACADEMIA-X"`, `"FITCOACH-ABC123"`)
3. **Salvar código** no campo `activation_code` da `academy_subscriptions`

```typescript
// Exemplo de geração de código na Edge Function
async function handleAcademyPlan(args: {
  plan: any;
  transactionId: string;
  amountPaid: number;
  customerEmail: string;
  body: any;
}) {
  const { plan, transactionId, amountPaid, customerEmail } = args;
  
  // Gerar código único
  const activationCode = generateActivationCode(); // ex: "ACADEMIA-XYZ123"
  
  const { data, error } = await supabase
    .from('academy_subscriptions')
    .insert({
      academy_email: customerEmail,
      plan_slug: plan.slug,
      plan_group: plan.plan_group,
      cakto_checkout_id: plan.cakto_checkout_id,
      cakto_transaction_id: transactionId,
      amount_paid: amountPaid,
      max_licenses: plan.max_licenses,
      activation_code: activationCode, // ⚠️ Código gerado
      licenses_used: 0, // Iniciar com 0
      status: 'active',
    })
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao criar assinatura de academia:', error);
    return;
  }
  
  // Enviar email com código (implementar depois)
  console.log(`Código gerado para ${customerEmail}: ${activationCode}`);
}

function generateActivationCode(): string {
  const prefix = 'ACADEMIA';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`; // ex: "ACADEMIA-XYZ123"
}
```

### 2. Fluxo de Ativação no App

Quando um aluno quer usar o app com código da academia:

1. **Aluno abre o app** → Tela de login/cadastro
2. **Aluno cria conta ou faz login**
3. **App mostra opção:** "Tenho código de academia"
4. **Aluno digita código** (ex: `"ACADEMIA-XYZ123"`)
5. **App valida código:**
   - Busca `academy_subscriptions` WHERE `activation_code = 'ACADEMIA-XYZ123'`
   - Verifica se `status = 'active'`
   - Verifica se `licenses_used < max_licenses`
6. **Se válido:**
   - Cria registro em `student_academy_links`
   - Incrementa `licenses_used` na `academy_subscriptions`
   - Aluno ganha acesso Premium
7. **Se inválido:**
   - Mostra erro: "Código inválido, expirado ou esgotado"

### 3. Código de Validação no App

```typescript
// services/activationCodeService.ts
import { getSupabaseClient } from './supabaseService';

export async function validateAndActivateCode(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string; subscription?: any }> {
  const supabase = getSupabaseClient();
  
  // 1. Buscar academia pelo código
  const { data: academy, error: academyError } = await supabase
    .from('academy_subscriptions')
    .select('*, app_plans(*)')
    .eq('activation_code', code.toUpperCase())
    .eq('status', 'active')
    .single();

  if (academyError || !academy) {
    return { success: false, error: 'Código inválido ou expirado' };
  }

  // 2. Verificar se ainda há licenças disponíveis
  if (academy.licenses_used >= academy.max_licenses) {
    return { success: false, error: 'Código esgotado. Todas as licenças foram usadas.' };
  }

  // 3. Verificar se usuário já está vinculado a alguma academia
  const { data: existingLink } = await supabase
    .from('student_academy_links')
    .select('*')
    .eq('student_user_id', userId)
    .eq('status', 'active')
    .single();

  if (existingLink) {
    return { success: false, error: 'Você já está vinculado a uma academia.' };
  }

  // 4. Criar vínculo
  const { error: linkError } = await supabase
    .from('student_academy_links')
    .insert({
      student_user_id: userId,
      academy_subscription_id: academy.id,
      activation_code: code.toUpperCase(),
      status: 'active',
    });

  if (linkError) {
    return { success: false, error: 'Erro ao ativar código. Tente novamente.' };
  }

  // 5. Incrementar contador de licenças usadas
  await supabase
    .from('academy_subscriptions')
    .update({ licenses_used: academy.licenses_used + 1 })
    .eq('id', academy.id);

  return { success: true, subscription: academy };
}
```

### 4. Tela de Ativação no App

```typescript
// screens/ActivationScreen.tsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { validateAndActivateCode } from '../services/activationCodeService';

export function ActivationScreen() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleActivate() {
    if (!code.trim() || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await validateAndActivateCode(user.id, code);
      
      if (result.success) {
        setSuccess(true);
        // Redirecionar para home após 2 segundos
        setTimeout(() => {
          window.location.href = '/home';
        }, 2000);
      } else {
        setError(result.error || 'Erro ao ativar código');
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="activation-screen">
      <h1>Ativar Código Premium</h1>
      <p>Digite o código fornecido pela sua academia</p>
      
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Ex: ACADEMIA-XYZ123"
        maxLength={20}
      />
      
      {error && <div className="error">{error}</div>}
      {success && (
        <div className="success">
          Código ativado com sucesso! Redirecionando...
        </div>
      )}
      
      <button 
        onClick={handleActivate}
        disabled={loading || !code.trim()}
      >
        {loading ? 'Ativando...' : 'Ativar Código'}
      </button>
    </div>
  );
}
```

1. **Academia compra plano** → Cakto envia webhook
2. **Webhook cria registro** em `academy_subscriptions` e `companies`
3. **Sistema gera `master_code`** único para a academia
4. **Aluno digita código** no app
5. **App valida código** e vincula aluno à academia


---

## 🔐 Lógica de Verificação de Acesso

### 1. Função Principal de Verificação

```typescript
// services/subscriptionService.ts
export interface AccessStatus {
  hasAccess: boolean;
  source: 'b2c' | 'academy' | 'personal' | null;
  plan: any | null;
  features: {
    photoAnalysis: boolean;
    workoutAnalysis: boolean;
    customWorkouts: boolean;
    textChat: boolean;
    voiceChat: boolean;
    voiceMinutesDaily: number;
  };
}

export async function checkUserAccess(
  userId: string,
  userEmail: string
): Promise<AccessStatus> {
  const supabase = getSupabaseClient();
  
  // 1. Verificar assinatura B2C direta
  const { data: b2cSubscription } = await supabase
    .from('user_subscriptions')
    .select('*, app_plans(*)')
    .eq('user_email', userEmail)
    .eq('status', 'active')
    .single();

  if (b2cSubscription) {
    return {
      hasAccess: true,
      source: 'b2c',
      plan: b2cSubscription,
      features: getFeaturesForPlan(b2cSubscription.app_plans),
    };
  }

  // 2. Verificar vínculo com academia
  const { data: academyLink } = await supabase
    .from('student_academy_links')
    .select(`
      *,
      academy_subscriptions (
        *,
        app_plans (*)
      )
    `)
    .eq('student_user_id', userId)
    .eq('status', 'active')
    .single();

  if (academyLink) {
    const academy = academyLink.academy_subscriptions;
    
    // Verificar se a assinatura da academia ainda está ativa
    if (academy && academy.status === 'active') {
      return {
        hasAccess: true,
        source: 'academy',
        plan: academy,
        features: getFeaturesForPlan(academy.app_plans),
      };
    } else {
      // Academia cancelou ou expirou
      return {
        hasAccess: false,
        source: null,
        plan: null,
        features: getFreeTierFeatures(),
      };
    }
  }

  // 3. Sem acesso Premium
  return {
    hasAccess: false,
    source: null,
    plan: null,
    features: getFreeTierFeatures(),
  };
}

function getFeaturesForPlan(plan: any) {
  return {
    photoAnalysis: true,
    workoutAnalysis: true,
    customWorkouts: true,
    textChat: true,
    voiceChat: true,
    voiceMinutesDaily: plan.minutes_voice_per_day || 15,
  };
}

function getFreeTierFeatures() {
  return {
    photoAnalysis: false,
    workoutAnalysis: false,
    customWorkouts: false,
    textChat: false,
    voiceChat: false,
    voiceMinutesDaily: 0,
  };
}
```

### 2. Hook React para Usar no App

```typescript
// hooks/useAccess.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { checkUserAccess, AccessStatus } from '../services/subscriptionService';

export function useAccess() {
  const { user } = useAuth();
  const [access, setAccess] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccess(null);
      setLoading(false);
      return;
    }
    loadAccess();
  }, [user]);

  async function loadAccess() {
    if (!user) return;
    setLoading(true);
    try {
      const status = await checkUserAccess(user.id, user.email);
      setAccess(status);
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
    } finally {
      setLoading(false);
    }
  }

  return {
    access,
    loading,
    isPremium: access?.hasAccess || false,
    refresh: loadAccess,
  };
}
```

### Hierarquia de Verificação

O app verifica acesso na seguinte ordem:

1. **Plano Individual (B2C)**
   - Verifica `user_subscriptions` com `status = 'active'`
   - Verifica `user_email` corresponde ao email do usuário
   - Verifica `plan_slug` em `app_plans`

2. **Plano via Academia (B2B)**
   - Verifica `student_academy_links` vinculado ao usuário
   - Verifica se `academy_subscriptions.status = 'active'`
   - Verifica se `student_academy_links.status = 'active'`
   - Verifica se não expirou (baseado na assinatura da academia)

3. **Plano via Personal Trainer**
   - Verifica `activation_codes` vinculado ao usuário
   - Verifica se `personal_subscriptions.status = 'active'`
   - Verifica limites do plano (5 ou 15 clientes)

4. **Recargas Ativas**
   - Verifica `recharges` com `status = 'active'`
   - Para `turbo`: adiciona minutos de boost (válido por 24h)
   - Para `voice_bank`: adiciona ao saldo total (não expira)
   - Para `pass_libre`: remove limite diário (válido por 30 dias)

### Exemplo de Verificação Completa

```typescript
async function checkUserAccess(userId: string, userEmail: string) {
  const supabase = getSupabaseClient();
  
  // 1. Verificar plano individual (B2C)
  const { data: b2cSubscription } = await supabase
    .from('user_subscriptions')
    .select('*, app_plans(*)')
    .eq('user_email', userEmail)
    .eq('status', 'active')
    .single();
  
  if (b2cSubscription) {
    return { access: 'b2c', plan: b2cSubscription.app_plans.slug };
  }
  
  // 2. Verificar plano via academia (B2B)
  const { data: academyLink } = await supabase
    .from('student_academy_links')
    .select(`
      *,
      academy_subscriptions!inner (
        plan_slug,
        status,
        app_plans (*)
      )
    `)
    .eq('student_user_id', userId)
    .eq('status', 'active')
    .eq('academy_subscriptions.status', 'active')
    .single();
  
  if (academyLink) {
    return { access: 'b2b', plan: academyLink.academy_subscriptions.plan_slug };
  }
  
  // 3. Verificar plano via personal trainer
  const { data: activation } = await supabase
    .from('activation_codes')
    .select(`
      *,
      personal_subscriptions!inner (
        status,
        plan_slug
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  if (activation) {
    return { access: 'personal', plan: activation.personal_subscriptions.plan_slug };
  }
  
  // 4. Sem acesso premium
  return { access: 'free', plan: null };
}
```

---

## 📋 Fluxos por Tipo de Plano

### 1. Plano B2C (Mensal/Anual)

```
Compra → Cakto → Webhook → Edge Function
  ↓
Edge Function identifica plan_group = 'b2c'
  ↓
Cria registro em user_subscriptions
  ↓
App verifica: user_subscriptions WHERE user_email = ...
  ↓
Se status = 'active' → Acesso Premium liberado
```

**Detalhamento:**

1. **Cliente compra** na página de vendas (plano mensal ou anual VIP)
2. **Cakto processa** pagamento e envia webhook
3. **Edge Function** identifica `plan_group = 'b2c'` em `app_plans`
4. **Edge Function cria** registro em `user_subscriptions`:
   ```typescript
   {
     user_email: 'cliente@example.com',
     plan_slug: 'b2c_mensal' ou 'b2c_anual_vip',
     plan_group: 'b2c',
     status: 'active',
     cakto_transaction_id: '...',
     amount_paid: 34.90
   }
   ```
5. **App verifica** acesso:
   ```typescript
   const { data: b2cSubscription } = await supabase
     .from('user_subscriptions')
     .select('*, app_plans(*)')
     .eq('user_email', userEmail)
     .eq('status', 'active')
     .single();
   
   if (b2cSubscription) {
     // Acesso Premium liberado
   }
   ```

### 2. Plano B2B Academia

```
Compra → Cakto → Webhook → Edge Function
  ↓
Edge Function identifica plan_group = 'b2b_academia'
  ↓
Cria registro em academy_subscriptions
  ↓
Gera código de ativação (ex: "ACADEMIA-XYZ123")
  ↓
Envia email para academia com código
  ↓
Academia distribui código para alunos
  ↓
Aluno ativa código no app
  ↓
App cria registro em student_academy_links
  ↓
Aluno ganha acesso Premium enquanto academia está ativa
```

**Detalhamento:**

1. **Academia compra** plano (Starter Mini, Starter, Growth ou Pro)
2. **Cakto processa** pagamento e envia webhook
3. **Edge Function** identifica `plan_group = 'b2b_academia'` em `app_plans`
4. **Edge Function cria** registro em `academy_subscriptions`:
   ```typescript
   {
     academy_email: 'academia@example.com',
     plan_slug: 'b2b_academia_starter',
     plan_group: 'b2b_academia',
     max_licenses: 20, // Depende do plano
     licenses_used: 0,
     activation_code: 'ACADEMIA-XYZ123', // Gerado automaticamente
     status: 'active'
   }
   ```
5. **Sistema envia email** para academia com o código de ativação
6. **Academia distribui** código para alunos (WhatsApp, email, etc.)
7. **Aluno ativa código** no app usando `validateAndActivateCode()`
8. **App cria vínculo** em `student_academy_links`
9. **App verifica** acesso:
   ```typescript
   const { data: academyLink } = await supabase
     .from('student_academy_links')
     .select(`
       *,
       academy_subscriptions!inner (
         *,
         app_plans (*)
       )
     `)
     .eq('student_user_id', userId)
     .eq('status', 'active')
     .eq('academy_subscriptions.status', 'active')
     .single();
   
   if (academyLink) {
     // Acesso Premium via academia
   }
   ```

### 3. Recarga (One-Time)

```
Compra → Cakto → Webhook → Edge Function
  ↓
Edge Function identifica plan_group = 'recarga'
  ↓
Cria registro em recharges
  ↓
App verifica recargas ativas do usuário
  ↓
Aplica benefício (minutos, passe livre, etc.)
```

**Detalhamento:**

1. **Cliente compra** recarga na página de vendas:
   - Sessão Turbo (R$ 5,00) → +30 minutos válidos por 24h
   - Banco de Voz 100 (R$ 12,90) → +100 minutos que não expiram
   - Passe Livre 30 Dias (R$ 19,90) → Ilimitado por 30 dias

2. **Cakto processa** pagamento e envia webhook
3. **Edge Function** identifica `plan_group = 'recarga'` em `app_plans`
4. **Edge Function cria** registro em `recharges`:
   ```typescript
   {
     user_email: 'cliente@example.com',
     recharge_slug: 'recarga_turbo',
     recharge_type: 'turbo', // Mapeado do slug
     plan_group: 'recarga',
     quantity: 30, // Minutos ou dias
     status: 'active',
     expires_at: '2025-12-04T18:35:27Z', // Para turbo e pass_libre
     payment_status: 'paid'
   }
   ```
5. **App verifica** recargas ativas ao calcular limites:
   ```typescript
   // Para Turbo (adiciona minutos de boost)
   const { data: turboRecharges } = await supabase
     .from('recharges')
     .select('quantity')
     .eq('user_email', userEmail)
     .eq('recharge_slug', 'recarga_turbo')
     .eq('status', 'active')
     .gt('expires_at', new Date().toISOString());
   
   // Para Passe Livre (remove limite diário)
   const { data: passLibre } = await supabase
     .from('recharges')
     .select('expires_at')
     .eq('user_email', userEmail)
     .eq('recharge_slug', 'recarga_passe_livre_30d')
     .eq('status', 'active')
     .gt('expires_at', new Date().toISOString())
     .single();
   
   if (passLibre) {
     // Acesso ilimitado até expires_at
   }
   ```

### 4. Personal Trainer (Opcional)

```
Compra → Cakto → Webhook → Edge Function
  ↓
Edge Function identifica plan_group = 'personal'
  ↓
Cria registro em personal_subscriptions
  ↓
Gera código de ativação (ex: "PERSONAL-ABC123")
  ↓
Envia email para personal com código
  ↓
Personal distribui código para clientes
  ↓
Cliente ativa código no app
  ↓
App cria vínculo em activation_codes
  ↓
Cliente ganha acesso Premium enquanto personal está ativo
```

**Nota:** Este fluxo é similar ao B2B Academia, mas usa `personal_subscriptions` e `activation_codes`.

---

## 💻 Implementação Prática

### 1. Componente de Proteção Premium

```typescript
import { PremiumGate } from '../components/ui/PremiumGate';

function MyPremiumFeature() {
  return (
    <PremiumGate showUpgradeButton={true}>
      <div>
        {/* Conteúdo premium aqui */}
      </div>
    </PremiumGate>
  );
}
```

### 2. Hook de Verificação

```typescript
import { usePremiumAccess } from '../hooks/usePremiumAccess';

function MyComponent() {
  const { isPremium, requirePremium } = usePremiumAccess();
  
  const handlePremiumAction = () => {
    const check = requirePremium('análise de fotos');
    if (!check.allowed) {
      // Redirecionar para página premium
      window.location.hash = check.redirectTo;
      return;
    }
    
    // Executar ação premium
  };
  
  return (
    <button 
      onClick={handlePremiumAction}
      disabled={!isPremium}
    >
      Análise Premium
    </button>
  );
}
```

### 3. Verificação de Limites de Voz

```typescript
import { checkSubscriptionStatus } from '../services/subscriptionService';

async function checkVoiceAccess(userId: string) {
  const status = await checkSubscriptionStatus(userId);
  
  if (status.features.voiceUnlimitedUntil) {
    // Passe Livre ativo - acesso ilimitado
    return { allowed: true, minutes: Infinity };
  }
  
  if (status.features.voiceMinutesDaily > 0) {
    // Tem minutos disponíveis
    return { 
      allowed: true, 
      minutes: status.features.voiceMinutesDaily 
    };
  }
  
  // Sem acesso
  return { allowed: false, minutes: 0 };
}
```

---

## 📝 Exemplos de Código

### Exemplo 1: Verificar Acesso ao Carregar App

```typescript
// No UserContext ou App.tsx
useEffect(() => {
  const verifyAccess = async () => {
    if (!user?.id || !user?.email) return;
    
    const supabase = getSupabaseClient();
    
    // 1. Verificar assinatura B2C
    const { data: b2cSubscription } = await supabase
      .from('user_subscriptions')
      .select('*, app_plans(*)')
      .eq('user_email', user.email)
      .eq('status', 'active')
      .single();
    
    if (b2cSubscription) {
      setUser(prev => ({
        ...prev,
        planType: b2cSubscription.app_plans.slug,
        subscriptionStatus: 'active'
      }));
      return;
    }
    
    // 2. Verificar plano via academia
    const { data: academyLink } = await supabase
      .from('student_academy_links')
      .select(`
        *,
        academy_subscriptions!inner (
          plan_slug,
          status,
          app_plans (*)
        )
      `)
      .eq('student_user_id', user.id)
      .eq('status', 'active')
      .eq('academy_subscriptions.status', 'active')
      .single();
    
    if (academyLink) {
      setUser(prev => ({
        ...prev,
        planType: academyLink.academy_subscriptions.plan_slug,
        subscriptionStatus: 'active',
        gymId: academyLink.academy_subscription_id,
        gymRole: 'student'
      }));
    }
  };
  
  verifyAccess();
}, [user?.id, user?.email]);
```

### Exemplo 2: Ativar Código de Academia

```typescript
// No componente InviteCodeEntry
const handleSubmitCode = async (code: string) => {
  try {
    setIsLoading(true);
    
    const result = await activateAcademyCode(user.id, code);
    
    if (result.success) {
      // Recarregar dados do usuário do Supabase
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        setUser(updatedUser);
      }
      
      // Mostrar sucesso
      toast.success('Código ativado com sucesso!');
      
      // Redirecionar
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Código inválido');
    }
  } catch (error) {
    toast.error('Erro ao ativar código');
  } finally {
    setIsLoading(false);
  }
};
```

### Exemplo 3: Verificação de Acesso em Tela de Análise de Foto

```typescript
// screens/PhotoAnalysisScreen.tsx
import { useAccess } from '../hooks/useAccess';
import { ProtectedFeature } from '../components/ProtectedFeature';

export function PhotoAnalysisScreen() {
  const { access, isPremium } = useAccess();

  return (
    <div>
      <h1>Análise de Foto</h1>
      
      <ProtectedFeature
        feature="photoAnalysis"
        fallback={
          <div>
            <p>Você precisa de assinatura Premium para analisar fotos</p>
            <button onClick={() => window.open('/#pricing', '_blank')}>
              Ver Planos
            </button>
          </div>
        }
      >
        <CameraComponent />
        <AnalysisResults />
      </ProtectedFeature>
    </div>
  );
}
```

### Exemplo 4: Verificação de Acesso em Chat de Voz

```typescript
// screens/VoiceChatScreen.tsx
import { useAccess } from '../hooks/useAccess';

export function VoiceChatScreen() {
  const { access, isPremium } = useAccess();

  if (!isPremium) {
    return (
      <div>
        <p>Chat de voz requer assinatura Premium</p>
        <button onClick={() => window.open('/#pricing', '_blank')}>
          Ver Planos
        </button>
      </div>
    );
  }

  const remainingMinutes = access?.features.voiceMinutesDaily || 0;

  if (remainingMinutes <= 0) {
    return (
      <div>
        <p>Você usou todos os minutos de voz hoje</p>
        <button onClick={() => window.open('/#recharge', '_blank')}>
          Recarregar Minutos
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>Minutos restantes hoje: {remainingMinutes}</p>
      <VoiceChatComponent />
    </div>
  );
}
```

---

## ✅ Checklist de Implementação

### Backend (Supabase)

- [x] Tabela `app_plans` criada e preenchida
- [ ] Tabela `academy_subscriptions` criada
- [ ] Tabela `user_subscriptions` criada
- [ ] Tabela `recharges` criada
- [ ] Tabela `student_academy_links` criada
- [ ] Edge Function `cakto-webhook` configurada
- [ ] Edge Function gera códigos de ativação para academias
- [ ] Campo `licenses_used` adicionado em `academy_subscriptions`

### Frontend (App)

- [ ] Hook `useAccess` implementado
- [ ] Componente `ProtectedFeature` implementado
- [ ] Tela de ativação de código implementada
- [ ] Verificação de acesso em todas as telas premium
- [ ] Tela de status de assinatura implementada
- [ ] Deep links para página de vendas configurados

### Migrações SQL Necessárias

```sql
-- 1. Adicionar campo licenses_used na tabela academy_subscriptions
ALTER TABLE academy_subscriptions
ADD COLUMN IF NOT EXISTS licenses_used INTEGER DEFAULT 0;

-- 2. Criar tabela student_academy_links
CREATE TABLE IF NOT EXISTS student_academy_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL,
  academy_subscription_id UUID NOT NULL,
  activation_code TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  activated_at TIMESTAMPTZ DEFAULT now(),
  blocked_at TIMESTAMPTZ,
  FOREIGN KEY (academy_subscription_id) REFERENCES academy_subscriptions(id)
);

CREATE INDEX IF NOT EXISTS idx_student_academy_links_user 
  ON student_academy_links(student_user_id);

CREATE INDEX IF NOT EXISTS idx_student_academy_links_academy 
  ON student_academy_links(academy_subscription_id);
```

---

## 🔍 Troubleshooting

### Problema: Usuário não reconhece plano após pagamento

**Solução:**
1. Verificar se webhook foi processado: `SELECT * FROM cakto_webhooks ORDER BY created_at DESC LIMIT 10;`
2. Verificar se assinatura foi criada: `SELECT * FROM user_subscriptions WHERE user_id = '...';`
3. Verificar se `users.plan_type` foi atualizado
4. Verificar logs da Edge Function

### Problema: Código de academia não funciona

**Solução:**
1. Verificar se código existe: `SELECT * FROM companies WHERE master_code = '...';`
2. Verificar se academia está ativa: `SELECT * FROM academy_subscriptions WHERE status = 'active';`
3. Verificar se há licenças disponíveis: `licenses_used < max_licenses`
4. Verificar se usuário já está vinculado a outra academia

### Problema: Recarga não aparece

**Solução:**
1. Verificar se recarga foi criada: `SELECT * FROM recharges WHERE user_id = '...';`
2. Verificar `status = 'active'`
3. Verificar `expires_at > NOW()` (para turbo e pass_libre)
4. Verificar se webhook foi processado

---

---

## 📋 Resumo das Correções Importantes

### ⚠️ Campos Críticos

1. **`app_plans.cakto_checkout_id`**: Deve conter o `product.short_id` da Cakto (ex: `"zeygxve_668421"`), **não** o ID numérico do checkout.

2. **`recharges.recharge_slug`**: Usa `recharge_slug` (referência a `app_plans.slug`), **não** `recharge_type`.

3. **`recharges.user_email`**: Usa `user_email` (string), **não** `user_id` (UUID).

4. **`academy_subscriptions.activation_code`**: Código único gerado automaticamente pela Edge Function (ex: `"ACADEMIA-XYZ123"`).

5. **`academy_subscriptions.licenses_used`**: Contador que incrementa a cada aluno que ativa o código.

### 🔄 Fluxo Completo

1. **Compra** → Cakto envia webhook com `product.short_id`
2. **Edge Function** → Busca em `app_plans` pelo `cakto_checkout_id`
3. **Edge Function** → Cria registro na tabela correspondente:
   - B2C → `user_subscriptions`
   - B2B → `academy_subscriptions` + gera `activation_code`
   - Recarga → `recharges`
   - Personal → `personal_subscriptions` + gera código
4. **App** → Verifica acesso em duas etapas:
   - Etapa 1: `user_subscriptions` (B2C)
   - Etapa 2: `student_academy_links` → `academy_subscriptions` (B2B)

---

**Última atualização:** Dezembro 2025  
**Versão:** 2.0.0

