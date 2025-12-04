# 📱 Guia Completo: App - Planos e Códigos de Ativação

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados no Supabase](#estrutura-de-dados-no-supabase)
3. [Como o App Reconhece os Planos](#como-o-app-reconhece-os-planos)
4. [Sistema de Códigos de Ativação (Academias)](#sistema-de-códigos-de-ativação-academias)
5. [Lógica de Verificação de Acesso](#lógica-de-verificação-de-acesso)
6. [Fluxos por Tipo de Plano](#fluxos-por-tipo-de-plano)
7. [Implementação Prática](#implementação-prática)
8. [Exemplos de Código](#exemplos-de-código)
9. [Checklist de Implementação](#checklist-de-implementação)

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

## 🗄️ Estrutura de Dados no Supabase

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

---

## 🎫 Sistema de Códigos de Ativação (Academias)

### 1. Geração do Código na Edge Function

Quando uma academia compra um plano B2B, a Edge Function deve:

1. **Criar registro** em `academy_subscriptions`
2. **Gerar código único** (ex.: `"ACADEMIA-X"`, `"FITCOACH-ABC123"`)
3. **Salvar código** no campo `activation_code` da `academy_subscriptions`

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
import { useUser } from '../context/UserContext';
import { checkUserAccess, AccessStatus } from '../services/subscriptionService';

export function useAccess() {
  const { user } = useUser();
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

---

## 💻 Implementação Prática

### 1. Atualizar Edge Function para Gerar Códigos

No arquivo `supabase/functions/cakto-webhook/index.ts`, atualize a função `handleAcademyPlan`:

```typescript
async function handleAcademyPlan(args: {
  plan: any;
  transactionId: string;
  amountPaid: number;
  customerEmail: string;
  body: any;
}) {
  const { plan, transactionId, amountPaid, customerEmail } = args;
  
  // Gerar código único
  const activationCode = `ACADEMIA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
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
```

### 2. Adicionar Campo `licenses_used` na Tabela

Execute no SQL Editor do Supabase:

```sql
ALTER TABLE academy_subscriptions
ADD COLUMN IF NOT EXISTS licenses_used INTEGER DEFAULT 0;
```

### 3. Criar Tabela `student_academy_links`

Execute no SQL Editor do Supabase:

```sql
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

## 📝 Exemplos de Código

### 1. Verificação de Acesso em Tela de Análise de Foto

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

### 2. Verificação de Acesso em Chat de Voz

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

### 3. Tela de Ativação de Código

```typescript
// screens/ActivationScreen.tsx
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { validateAndActivateCode } from '../services/activationCodeService';

export function ActivationScreen() {
  const { user } = useUser();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleActivate() {
    if (!code.trim() || !user?.id) return;
    
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

- [x] Hook `useAccess` implementado
- [ ] Componente `ProtectedFeature` implementado
- [ ] Tela de ativação de código implementada
- [ ] Verificação de acesso em todas as telas premium
- [ ] Tela de status de assinatura implementada
- [ ] Deep links para página de vendas configurados

---

## 🔍 Troubleshooting

### Problema: Usuário não reconhece plano após pagamento

**Solução:**
1. Verificar se webhook foi processado: `SELECT * FROM cakto_webhooks ORDER BY created_at DESC LIMIT 10;`
2. Verificar se assinatura foi criada: `SELECT * FROM user_subscriptions WHERE user_email = '...';`
3. Verificar se `app_plans.cakto_checkout_id` corresponde ao `product.short_id` do webhook
4. Verificar logs da Edge Function

### Problema: Código de academia não funciona

**Solução:**
1. Verificar se código existe: `SELECT * FROM academy_subscriptions WHERE activation_code = '...';`
2. Verificar se academia está ativa: `SELECT * FROM academy_subscriptions WHERE status = 'active';`
3. Verificar se há licenças disponíveis: `licenses_used < max_licenses`
4. Verificar se usuário já está vinculado a outra academia

### Problema: Recarga não aparece

**Solução:**
1. Verificar se recarga foi criada: `SELECT * FROM recharges WHERE user_email = '...';`
2. Verificar `status = 'active'`
3. Verificar `expires_at > NOW()` (para turbo e pass_libre)
4. Verificar se webhook foi processado

---

## 📚 Arquivos Relacionados

- `supabase/functions/cakto-webhook/index.ts` - Edge Function
- `services/subscriptionService.ts` - Serviço de verificação de acesso
- `services/activationCodeService.ts` - Serviço de ativação de códigos
- `hooks/useAccess.ts` - Hook React para verificar acesso
- `docs/FLUXOS_VISUAIS_PLANOS.md` - Fluxos visuais detalhados

---

**Última Atualização:** Dezembro 2025  
**Versão:** 2.0.0

