# 🔍 ANÁLISE ARQUITETURAL COMPLETA - FitCoach.IA

**Data:** 2025-01-27  
**Analista:** Arquitetura de Software SaaS  
**Versão do Sistema:** 1.0

---

## 1. VERIFICAÇÃO DA ARQUITETURA MULTI-TENANT

### ✅ **PONTOS POSITIVOS:**

1. **Campos de Multi-tenancy Existem:**
   - `users.gym_id` (TEXT) - ✅ Presente
   - `users.gym_role` (student/admin/trainer/receptionist) - ✅ Presente
   - `users.is_gym_managed` - ✅ Presente
   - `users.matricula` - ✅ Presente

2. **Índices Criados:**
   - `idx_users_gym_id` - ✅
   - `idx_users_gym_role` - ✅

### ❌ **PROBLEMAS CRÍTICOS IDENTIFICADOS:**

#### **1.1 FALTA DE `gym_id` EM TABELAS DE DADOS DO APP**

**PROBLEMA GRAVE:** As tabelas de dados do aplicativo **NÃO possuem `gym_id`**, apenas `user_id`. Isso significa que:

- ❌ `weight_history` - **SEM `gym_id`**
- ❌ `wellness_plans` - **SEM `gym_id`**
- ❌ `completed_workouts` - **SEM `gym_id`**
- ❌ `meal_plans` - **SEM `gym_id`**
- ❌ `meal_analyses` - **SEM `gym_id`**
- ❌ `recipes` - **SEM `gym_id`**
- ❌ `chat_messages` - **SEM `gym_id`**

**IMPACTO:** 
- Admins de academia **NÃO podem consultar dados agregados** de seus alunos diretamente
- Dependência de JOIN com `users` para filtrar por `gym_id`
- **Performance degradada** em consultas de relatórios
- **Risco de vazamento** se RLS não for perfeito

#### **1.2 DIFERENCIAÇÃO DE ROLES**

✅ **FUNCIONA:** O sistema diferencia corretamente:
- `student` - Alunos
- `admin` - Administradores de academia
- `trainer` - Treinadores
- `receptionist` - Recepcionistas

**MAS:** As políticas RLS dependem de subqueries complexas que podem ser lentas.

---

## 2. SUPABASE E SEGURANÇA

### ✅ **RLS HABILITADO:**

Todas as tabelas principais têm RLS ativado:
- ✅ `users`
- ✅ `subscription_plans`
- ✅ `user_subscriptions`
- ✅ `payments`
- ✅ `invoices`
- ✅ `gyms`
- ✅ `weight_history`
- ✅ `wellness_plans`
- ✅ `completed_workouts`
- ✅ `meal_plans`
- ✅ `meal_analyses`
- ✅ `recipes`
- ✅ `chat_messages`
- ✅ `app_settings`
- ✅ `companies`
- ✅ `company_licenses`

### ❌ **FALHAS DE SEGURANÇA IDENTIFICADAS:**

#### **2.1 VAZAMENTO DE DADOS POTENCIAL**

**PROBLEMA:** As políticas RLS para dados do app usam apenas `user_id`:

```sql
-- Política atual (VULNERÁVEL):
CREATE POLICY "Users can manage own weight history"
    ON public.weight_history FOR ALL
    USING (auth.uid() = user_id);
```

**RISCO:** 
- Se um admin de academia quiser ver dados agregados de alunos, precisa fazer JOIN
- **Não há política explícita** que permite admins ver dados de alunos da mesma academia
- Depende de políticas em `users` que podem não ser suficientes

#### **2.2 POLÍTICAS RLS INCOMPLETAS PARA MULTI-TENANCY**

**PROBLEMA:** As tabelas de dados do app (`weight_history`, `wellness_plans`, etc.) **NÃO têm políticas** que permitam:
- Admins ver dados de alunos da sua academia
- Trainers ver dados de alunos que treinam

**SOLUÇÃO NECESSÁRIA:** Adicionar políticas como:

```sql
-- Exemplo para weight_history:
CREATE POLICY "Gym admins can view gym students weight history"
    ON public.weight_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND EXISTS (
                SELECT 1 FROM public.users AS student
                WHERE student.id = weight_history.user_id
                AND student.gym_id = admin.gym_id
            )
        )
    );
```

**IMPACTO:** Consultas lentas devido a subqueries aninhadas.

#### **2.3 SUPABASE COMO BANCO CENTRAL**

✅ **CONFIRMADO:** O Supabase está sendo usado como banco central:
- Tabelas principais no Supabase
- RLS ativado
- Autenticação via `auth.users`

**MAS:** Há **armazenamento local duplicado** (ver seção 4).

---

## 3. VENDA E ATIVAÇÃO

### ✅ **AUTOMAÇÃO EXISTE:**

1. **Webhook Cakto:** ✅ Implementado em `supabase/functions/cakto-webhook/index.ts`
2. **Criação de Assinatura:** ✅ Automatizada
3. **Criação de Company:** ✅ Para planos B2B

### ❌ **PROBLEMAS IDENTIFICADOS:**

#### **3.1 WEBHOOK USA TABELA INEXISTENTE**

**PROBLEMA CRÍTICO:** O webhook estava usando `app_plans` (não existe):
- ✅ **CORRIGIDO:** Agora usa `subscription_plans`
- ⚠️ **PENDENTE:** Verificar se `cakto_checkout_id` está populado nos planos

#### **3.2 CANCELAMENTO NÃO REVOCA ACESSO AUTOMATICAMENTE**

**PROBLEMA:** Não há lógica que:
- Bloqueia acesso quando assinatura expira
- Revoga licenças quando empresa cancela
- Atualiza `subscription_status` automaticamente

**EXISTE:** `check-subscription-renewals` function, mas:
- ⚠️ Não está claro se é executada automaticamente (cron)
- ⚠️ Não bloqueia acesso imediatamente

#### **3.3 STATUS DA ACADEMIA**

✅ **EXISTE:** `companies.status` (active/suspended/cancelled)
✅ **EXISTE:** `companies.payment_status` (pending/paid/failed/refunded)

**MAS:** Não há trigger ou função que:
- Bloqueia acesso de alunos quando `companies.status = 'cancelled'`
- Suspende licenças quando `companies.payment_status = 'failed'`

---

## 4. DADOS LOCAIS NO DISPOSITIVO ⚠️ **CRÍTICO**

### ❌ **PROBLEMA GRAVE: ARMAZENAMENTO DUPLICADO**

O sistema usa **DOIS sistemas de armazenamento simultaneamente:**

1. **IndexedDB Local** (`services/databaseService.ts`)
2. **Supabase** (`services/supabaseService.ts`)

### **4.1 DADOS ARMAZENADOS LOCALMENTE (IndexedDB):**

```typescript
// Estrutura do IndexedDB (NutriIA_DB):
- users: Dados completos do usuário (INCLUINDO SENHAS HASHED)
- wellnessPlans: Planos de bem-estar
- completedWorkouts: Treinos concluídos
- mealPlans: Planos alimentares
- mealAnalyses: Análises de refeições (COM IMAGENS BASE64)
- recipes: Receitas
- chatMessages: Mensagens do chat (POSSIVELMENTE SENSÍVEIS)
- weightHistory: Histórico de peso
- appSettings: Configurações
```

### **4.2 RISCOS IDENTIFICADOS:**

#### **RISCO 1: VAZAMENTO DE DADOS SENSÍVEIS**
- ✅ Senhas hasheadas armazenadas localmente
- ✅ Dados de saúde (peso, histórico)
- ✅ Imagens de refeições (base64)
- ✅ Mensagens de chat (podem conter dados pessoais)

**SE O DISPOSITIVO FOR COMPROMETIDO:**
- Dados podem ser extraídos do IndexedDB
- Senhas hasheadas podem ser quebradas (dependendo do algoritmo)
- Dados de saúde violam LGPD se não criptografados

#### **RISCO 2: CONFLITO DE DADOS**
- Dados podem estar desatualizados no IndexedDB
- Sincronização não é automática
- Risco de perda de dados se IndexedDB for limpo

#### **RISCO 3: PERDA DE DADOS**
- IndexedDB pode ser limpo pelo navegador
- Dados não sincronizados são perdidos
- Não há backup automático

#### **RISCO 4: VIOLAÇÃO LGPD**
- Dados de saúde armazenados localmente sem criptografia
- Sem controle de acesso adequado
- Dados podem ser acessados por outros apps no dispositivo

### **4.3 SINCRONIZAÇÃO**

⚠️ **PROBLEMA:** Não há sincronização automática clara entre IndexedDB e Supabase:
- `services/syncService.ts` existe mas parece ser para status de bloqueio apenas
- Não há sync automático de dados do app

---

## 5. RELATÓRIO FINAL

### **5.1 ELEGIBILIDADE PARA PRODUÇÃO SAAS**

❌ **NÃO ELEGÍVEL** para produção sem correções críticas.

### **5.2 FALHAS TÉCNICAS GRAVES**

1. **CRÍTICA - Falta de `gym_id` em tabelas de dados:**
   - Impacto: Performance, relatórios, isolamento de dados
   - Prioridade: **ALTA**

2. **CRÍTICA - Armazenamento local não criptografado:**
   - Impacto: LGPD, segurança, vazamento de dados
   - Prioridade: **ALTA**

3. **CRÍTICA - RLS incompleto para multi-tenancy:**
   - Impacto: Vazamento de dados entre academias
   - Prioridade: **ALTA**

4. **ALTA - Cancelamento não revoga acesso:**
   - Impacto: Usuários podem continuar usando após cancelar
   - Prioridade: **MÉDIA-ALTA**

5. **MÉDIA - Sincronização IndexedDB ↔ Supabase:**
   - Impacto: Dados desatualizados, perda de dados
   - Prioridade: **MÉDIA**

### **5.3 MELHORIAS NECESSÁRIAS PARA ESCALAR**

1. **Adicionar `gym_id` em todas as tabelas de dados**
2. **Criptografar dados sensíveis no IndexedDB**
3. **Implementar sincronização automática**
4. **Adicionar políticas RLS completas para multi-tenancy**
5. **Implementar revogação automática de acesso**
6. **Adicionar índices compostos (`gym_id`, `user_id`)**
7. **Implementar cache com TTL no frontend**
8. **Adicionar logging de auditoria**
9. **Implementar backup automático**
10. **Adicionar rate limiting por academia**

### **5.4 GRAU DE RISCO ATUAL**

🔴 **ALTO RISCO**

**Motivos:**
- Dados sensíveis não criptografados localmente
- RLS incompleto pode permitir vazamento
- Falta de isolamento adequado entre academias
- Cancelamento não revoga acesso

### **5.5 ARQUITETURA IDEAL SUGERIDA**

```
┌─────────────────────────────────────────────────┐
│           FRONTEND (React/Vite)                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Cache Local (IndexedDB) - APENAS CACHE   │  │
│  │  - Dados criptografados                   │  │
│  │  - TTL curto (5-15 min)                   │  │
│  │  - Sincronização automática                │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↕ HTTPS
┌─────────────────────────────────────────────────┐
│         SUPABASE (Banco Central)                │
│  ┌──────────────────────────────────────────┐  │
│  │  auth.users (Autenticação)              │  │
│  │  public.users (Perfis)                  │  │
│  │  public.companies (Academias)            │  │
│  │  public.* (TODAS com gym_id)            │  │
│  │  RLS Completo + Índices                 │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────────┐
│      EDGE FUNCTIONS (Automação)                 │
│  - cakto-webhook (Ativação)                    │
│  - check-subscription-renewals (Cron)          │
│  - revoke-access (Cancelamento)                │  │
└─────────────────────────────────────────────────┘
```

---

## 6. SOLUÇÕES CODIFICADAS

### **6.1 ADICIONAR `gym_id` EM TABELAS DE DADOS**

```sql
-- Migration: Adicionar gym_id em tabelas de dados do app
-- Data: 2025-01-27

-- 1. Weight History
ALTER TABLE public.weight_history 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.weight_history wh
SET gym_id = u.gym_id
FROM public.users u
WHERE wh.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_weight_history_gym_id 
ON public.weight_history(gym_id) 
WHERE gym_id IS NOT NULL;

-- 2. Wellness Plans
ALTER TABLE public.wellness_plans 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.wellness_plans wp
SET gym_id = u.gym_id
FROM public.users u
WHERE wp.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wellness_plans_gym_id 
ON public.wellness_plans(gym_id) 
WHERE gym_id IS NOT NULL;

-- 3. Completed Workouts
ALTER TABLE public.completed_workouts 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.completed_workouts cw
SET gym_id = u.gym_id
FROM public.users u
WHERE cw.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_completed_workouts_gym_id 
ON public.completed_workouts(gym_id) 
WHERE gym_id IS NOT NULL;

-- 4. Meal Plans
ALTER TABLE public.meal_plans 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.meal_plans mp
SET gym_id = u.gym_id
FROM public.users u
WHERE mp.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meal_plans_gym_id 
ON public.meal_plans(gym_id) 
WHERE gym_id IS NOT NULL;

-- 5. Meal Analyses
ALTER TABLE public.meal_analyses 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.meal_analyses ma
SET gym_id = u.gym_id
FROM public.users u
WHERE ma.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meal_analyses_gym_id 
ON public.meal_analyses(gym_id) 
WHERE gym_id IS NOT NULL;

-- 6. Recipes
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.recipes r
SET gym_id = u.gym_id
FROM public.users u
WHERE r.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_gym_id 
ON public.recipes(gym_id) 
WHERE gym_id IS NOT NULL;

-- 7. Chat Messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS gym_id TEXT;

UPDATE public.chat_messages cm
SET gym_id = u.gym_id
FROM public.users u
WHERE cm.user_id = u.id AND u.gym_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_gym_id 
ON public.chat_messages(gym_id) 
WHERE gym_id IS NOT NULL;
```

### **6.2 POLÍTICAS RLS COMPLETAS PARA MULTI-TENANCY**

```sql
-- Migration: Políticas RLS completas para multi-tenancy
-- Data: 2025-01-27

-- ============================================================================
-- WEIGHT HISTORY - Políticas Multi-tenant
-- ============================================================================

-- Usuários veem apenas seus próprios dados
DROP POLICY IF EXISTS "Users can manage own weight history" ON public.weight_history;
CREATE POLICY "Users can manage own weight history"
    ON public.weight_history FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins podem ver dados de alunos da sua academia
DROP POLICY IF EXISTS "Gym admins can view gym students weight history" ON public.weight_history;
CREATE POLICY "Gym admins can view gym students weight history"
    ON public.weight_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = weight_history.gym_id
            AND weight_history.gym_id IS NOT NULL
        )
    );

-- Trainers podem ver dados de alunos que treinam
DROP POLICY IF EXISTS "Trainers can view students weight history" ON public.weight_history;
CREATE POLICY "Trainers can view students weight history"
    ON public.weight_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS trainer
            WHERE trainer.id = auth.uid()
            AND trainer.gym_role = 'trainer'
            AND trainer.gym_id = weight_history.gym_id
            AND weight_history.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- WELLNESS PLANS - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own wellness plans" ON public.wellness_plans;
CREATE POLICY "Users can manage own wellness plans"
    ON public.wellness_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students wellness plans" ON public.wellness_plans;
CREATE POLICY "Gym admins can view gym students wellness plans"
    ON public.wellness_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = wellness_plans.gym_id
            AND wellness_plans.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- COMPLETED WORKOUTS - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own completed workouts" ON public.completed_workouts;
CREATE POLICY "Users can manage own completed workouts"
    ON public.completed_workouts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students workouts" ON public.completed_workouts;
CREATE POLICY "Gym admins can view gym students workouts"
    ON public.completed_workouts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = completed_workouts.gym_id
            AND completed_workouts.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- MEAL PLANS - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.meal_plans;
CREATE POLICY "Users can manage own meal plans"
    ON public.meal_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students meal plans" ON public.meal_plans;
CREATE POLICY "Gym admins can view gym students meal plans"
    ON public.meal_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = meal_plans.gym_id
            AND meal_plans.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- MEAL ANALYSES - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own meal analyses" ON public.meal_analyses;
CREATE POLICY "Users can manage own meal analyses"
    ON public.meal_analyses FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students meal analyses" ON public.meal_analyses;
CREATE POLICY "Gym admins can view gym students meal analyses"
    ON public.meal_analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = meal_analyses.gym_id
            AND meal_analyses.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- RECIPES - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own recipes" ON public.recipes;
CREATE POLICY "Users can manage own recipes"
    ON public.recipes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students recipes" ON public.recipes;
CREATE POLICY "Gym admins can view gym students recipes"
    ON public.recipes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = recipes.gym_id
            AND recipes.gym_id IS NOT NULL
        )
    );

-- ============================================================================
-- CHAT MESSAGES - Políticas Multi-tenant
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage own chat messages"
    ON public.chat_messages FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gym admins can view gym students chat messages" ON public.chat_messages;
CREATE POLICY "Gym admins can view gym students chat messages"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin
            WHERE admin.id = auth.uid()
            AND admin.gym_role = 'admin'
            AND admin.gym_id = chat_messages.gym_id
            AND chat_messages.gym_id IS NOT NULL
        )
    );
```

### **6.3 MIDDLEWARE DE VALIDAÇÃO DE ASSINATURA**

```typescript
// services/subscriptionValidationMiddleware.ts

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface SubscriptionValidationResult {
  hasAccess: boolean;
  reason?: string;
  subscription?: any;
  company?: any;
}

/**
 * Valida se uma academia tem assinatura ativa
 */
export async function validateGymSubscription(
  gymId: string
): Promise<SubscriptionValidationResult> {
  const supabase = getSupabaseClient();

  try {
    // 1. Buscar company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*, subscription_id')
      .eq('id', gymId)
      .single();

    if (companyError || !company) {
      return {
        hasAccess: false,
        reason: 'Academia não encontrada',
      };
    }

    // 2. Verificar status da company
    if (company.status !== 'active') {
      return {
        hasAccess: false,
        reason: `Academia com status: ${company.status}`,
        company,
      };
    }

    // 3. Verificar pagamento
    if (company.payment_status !== 'paid') {
      return {
        hasAccess: false,
        reason: `Pagamento com status: ${company.payment_status}`,
        company,
      };
    }

    // 4. Verificar assinatura (se existir)
    if (company.subscription_id) {
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', company.subscription_id)
        .single();

      if (subError || !subscription) {
        logger.warn(
          `Assinatura não encontrada para company ${gymId}`,
          'subscriptionValidation'
        );
      } else if (subscription.status !== 'active') {
        return {
          hasAccess: false,
          reason: `Assinatura com status: ${subscription.status}`,
          company,
          subscription,
        };
      }
    }

    // 5. Verificar expiração
    if (company.expires_at && new Date(company.expires_at) < new Date()) {
      return {
        hasAccess: false,
        reason: 'Assinatura expirada',
        company,
      };
    }

    return {
      hasAccess: true,
      company,
    };
  } catch (error) {
    logger.error('Erro ao validar assinatura', 'subscriptionValidation', error);
    return {
      hasAccess: false,
      reason: 'Erro ao validar assinatura',
    };
  }
}

/**
 * Valida se um usuário tem acesso (individual ou via academia)
 */
export async function validateUserAccess(
  userId: string
): Promise<SubscriptionValidationResult> {
  const supabase = getSupabaseClient();

  try {
    // 1. Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('gym_id, subscription_status, expiry_date')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        hasAccess: false,
        reason: 'Usuário não encontrado',
      };
    }

    // 2. Se for aluno de academia, validar academia
    if (user.gym_id) {
      return await validateGymSubscription(user.gym_id);
    }

    // 3. Se for usuário individual, validar assinatura individual
    if (user.subscription_status !== 'active') {
      return {
        hasAccess: false,
        reason: `Status de assinatura: ${user.subscription_status}`,
      };
    }

    if (user.expiry_date && new Date(user.expiry_date) < new Date()) {
      return {
        hasAccess: false,
        reason: 'Assinatura expirada',
      };
    }

    return {
      hasAccess: true,
    };
  } catch (error) {
    logger.error('Erro ao validar acesso', 'subscriptionValidation', error);
    return {
      hasAccess: false,
      reason: 'Erro ao validar acesso',
    };
  }
}

/**
 * Middleware para usar em Edge Functions ou API routes
 */
export async function requireActiveSubscription(
  gymId?: string,
  userId?: string
): Promise<void> {
  let result: SubscriptionValidationResult;

  if (gymId) {
    result = await validateGymSubscription(gymId);
  } else if (userId) {
    result = await validateUserAccess(userId);
  } else {
    throw new Error('gymId ou userId deve ser fornecido');
  }

  if (!result.hasAccess) {
    throw new Error(result.reason || 'Acesso negado: assinatura inativa');
  }
}
```

### **6.4 FUNÇÃO PARA REVOGAR ACESSO AUTOMATICAMENTE**

```sql
-- Migration: Função para revogar acesso quando assinatura expira
-- Data: 2025-01-27

CREATE OR REPLACE FUNCTION revoke_expired_subscriptions()
RETURNS TABLE(
    companies_revoked INTEGER,
    users_revoked INTEGER,
    licenses_revoked INTEGER
) AS $$
DECLARE
    v_companies_revoked INTEGER := 0;
    v_users_revoked INTEGER := 0;
    v_licenses_revoked INTEGER := 0;
BEGIN
    -- 1. Revogar companies expiradas
    UPDATE public.companies
    SET 
        status = 'cancelled',
        cancelled_at = NOW()
    WHERE 
        status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at < NOW();
    
    GET DIAGNOSTICS v_companies_revoked = ROW_COUNT;

    -- 2. Revogar licenças de companies canceladas
    UPDATE public.company_licenses
    SET 
        status = 'expired',
        expires_at = NOW(),
        revoked_at = NOW()
    WHERE 
        status = 'active'
        AND EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = company_licenses.company_id
            AND c.status = 'cancelled'
        );
    
    GET DIAGNOSTICS v_licenses_revoked = ROW_COUNT;

    -- 3. Bloquear acesso de usuários com assinaturas expiradas
    UPDATE public.users
    SET 
        subscription_status = 'expired',
        access_blocked = TRUE,
        blocked_at = NOW(),
        blocked_reason = 'Assinatura expirada'
    WHERE 
        subscription_status = 'active'
        AND expiry_date IS NOT NULL
        AND expiry_date < NOW()
        AND (gym_id IS NULL OR gym_id NOT IN (
            SELECT id FROM public.companies WHERE status = 'active'
        ));
    
    GET DIAGNOSTICS v_users_revoked = ROW_COUNT;

    -- 4. Bloquear alunos de academias canceladas
    UPDATE public.users
    SET 
        access_blocked = TRUE,
        blocked_at = NOW(),
        blocked_reason = 'Academia cancelou assinatura'
    WHERE 
        gym_id IS NOT NULL
        AND access_blocked = FALSE
        AND EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = users.gym_id::uuid
            AND c.status = 'cancelled'
        );
    
    GET DIAGNOSTICS v_users_revoked = v_users_revoked + ROW_COUNT;

    RETURN QUERY SELECT v_companies_revoked, v_users_revoked, v_licenses_revoked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar cron job para executar diariamente (ajustar conforme Supabase)
-- Nota: No Supabase, use pg_cron extension se disponível
-- SELECT cron.schedule('revoke-expired-subscriptions', '0 2 * * *', 'SELECT revoke_expired_subscriptions();');
```

### **6.5 TRIGGER PARA ATUALIZAR `gym_id` AUTOMATICAMENTE**

```sql
-- Migration: Trigger para atualizar gym_id automaticamente
-- Data: 2025-01-27

CREATE OR REPLACE FUNCTION sync_gym_id_from_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Se user_id mudou, atualizar gym_id
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        SELECT gym_id INTO NEW.gym_id
        FROM public.users
        WHERE id = NEW.user_id;
    END IF;
    
    -- Se gym_id não está definido, buscar do user
    IF NEW.gym_id IS NULL THEN
        SELECT gym_id INTO NEW.gym_id
        FROM public.users
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas de dados
CREATE TRIGGER sync_weight_history_gym_id
    BEFORE INSERT OR UPDATE ON public.weight_history
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

CREATE TRIGGER sync_wellness_plans_gym_id
    BEFORE INSERT OR UPDATE ON public.wellness_plans
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

CREATE TRIGGER sync_completed_workouts_gym_id
    BEFORE INSERT OR UPDATE ON public.completed_workouts
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

CREATE TRIGGER sync_meal_plans_gym_id
    BEFORE INSERT OR UPDATE ON public.meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

CREATE TRIGGER sync_meal_analyses_gym_id
    BEFORE INSERT OR UPDATE ON public.meal_analyses
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

CREATE TRIGGER sync_recipes_gym_id
    BEFORE INSERT OR UPDATE ON public.recipes
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();

CREATE TRIGGER sync_chat_messages_gym_id
    BEFORE INSERT OR UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION sync_gym_id_from_user();
```

---

## 7. DOCUMENTAÇÃO DAS CORREÇÕES OBRIGATÓRIAS

### **PRIORIDADE 1 - CRÍTICO (Fazer ANTES de produção):**

1. ✅ Executar migration para adicionar `gym_id` em todas as tabelas
2. ✅ Executar migration para políticas RLS completas
3. ✅ Implementar middleware de validação de assinatura
4. ✅ Criar função de revogação automática
5. ✅ Configurar cron job para revogação diária
6. ⚠️ **Criptografar dados sensíveis no IndexedDB** (ou remover IndexedDB)
7. ⚠️ **Implementar sincronização automática** IndexedDB ↔ Supabase

### **PRIORIDADE 2 - ALTA (Fazer em seguida):**

1. Adicionar triggers para sync automático de `gym_id`
2. Implementar logging de auditoria
3. Adicionar índices compostos para performance
4. Testar políticas RLS com dados reais
5. Implementar rate limiting por academia

### **PRIORIDADE 3 - MÉDIA (Melhorias):**

1. Otimizar queries com `gym_id`
2. Implementar cache com TTL
3. Adicionar métricas e monitoramento
4. Documentar APIs e fluxos

---

## 8. CONCLUSÃO

O sistema tem uma **base sólida** mas precisa de **correções críticas** antes de produção:

- ✅ Estrutura multi-tenant existe
- ✅ RLS está habilitado
- ✅ Webhook de ativação funciona
- ❌ Falta `gym_id` em tabelas de dados
- ❌ RLS incompleto para multi-tenancy
- ❌ Dados sensíveis não criptografados localmente
- ❌ Cancelamento não revoga acesso automaticamente

**RECOMENDAÇÃO:** Implementar todas as correções de **PRIORIDADE 1** antes de lançar em produção.

---

**Documento gerado automaticamente pela análise arquitetural**  
**Última atualização:** 2025-01-27

