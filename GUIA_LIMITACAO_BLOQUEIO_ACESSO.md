# 🔒 Guia: Como Limitar e Bloquear Acesso de Teste (Free Tier)

## 📋 Como Funciona o Bloqueio Atual

### **Sistema de Bloqueio em Camadas**

O sistema atual usa **3 camadas de bloqueio** para limitar acesso free tier:

#### **Camada 1: Validação de Features** (`utils/featureValidation.ts`)

```typescript
// Verifica se usuário tem acesso à feature
validateFeatureAccess(feature, subscriptionStatus)
  → Retorna: { allowed: boolean, reason?: string }
```

**Como funciona:**
- Se `subscriptionStatus.isActive === false` → **BLOQUEADO**
- Se feature não está no plano → **BLOQUEADO**
- Se feature é `voiceChat` e não tem minutos → **BLOQUEADO**

#### **Camada 2: Componente ProtectedFeature** (`components/ProtectedFeature.tsx`)

```typescript
// Bloqueia renderização de conteúdo premium
<ProtectedFeature feature="photoAnalysis">
  {/* Conteúdo só aparece se tiver acesso */}
</ProtectedFeature>
```

**Como funciona:**
- Verifica `canAccess(feature)` do hook `useSubscription`
- Se não tem acesso → Mostra prompt de upgrade
- Se tem acesso → Renderiza conteúdo

#### **Camada 3: Quotas e Limites** (`utils/quotas.ts` + `services/usageLimitsService.ts`)

```typescript
// Limita quantidade de uso diário/mensal
getQuotaLimits(planType)
  → Retorna limites: { photoAnalysisPerDay: 3, ... }
```

**Como funciona:**
- Free tier: 3 análises/dia, 10 mensagens/dia, 0 minutos voz
- Premium: Ilimitado (exceto voz: 15 min/dia)
- Sistema verifica uso antes de permitir ação

---

## 🎯 Como Bloquear Acesso Free Tier Completamente

### **Opção 1: Bloquear Todas as Features Premium (Atual)**

#### Implementação Atual:

```typescript
// services/subscriptionService.ts
function getFreeTierFeatures(): SubscriptionStatus['features'] {
  return {
    photoAnalysis: false,      // ❌ BLOQUEADO
    workoutAnalysis: false,    // ❌ BLOQUEADO
    customWorkouts: false,     // ❌ BLOQUEADO
    textChat: false,           // ❌ BLOQUEADO
    voiceChat: false,          // ❌ BLOQUEADO
    voiceMinutesDaily: 0,
    voiceMinutesTotal: 0,
  };
}
```

**Resultado:**
- ✅ Todas as features premium estão bloqueadas
- ✅ `ProtectedFeature` não renderiza conteúdo
- ✅ `validateFeatureAccess` retorna `allowed: false`

**Problema Atual:**
- ⚠️ Mas `getQuotaLimits()` ainda permite 3 análises/dia
- ⚠️ Há inconsistência entre bloqueio de features e quotas

---

### **Opção 2: Bloquear Totalmente (Recomendado para Teste)**

#### Modificar `getFreeTierFeatures()` para Bloqueio Total:

```typescript
// services/subscriptionService.ts
function getFreeTierFeatures(): SubscriptionStatus['features'] {
  return {
    photoAnalysis: false,      // ❌ Totalmente bloqueado
    workoutAnalysis: false,    // ❌ Totalmente bloqueado
    customWorkouts: false,     // ❌ Totalmente bloqueado
    textChat: false,           // ❌ Totalmente bloqueado
    voiceChat: false,          // ❌ Totalmente bloqueado
    voiceMinutesDaily: 0,
    voiceMinutesTotal: 0,
  };
}
```

#### Modificar `getQuotaLimits()` para Bloqueio Total:

```typescript
// utils/quotas.ts
export function getQuotaLimits(planType: string | null): QuotaLimits {
  // ... planos premium ...
  
  // Free tier - BLOQUEIO TOTAL
  return limits[planType || ''] || {
    photoAnalysisPerDay: 0,        // ❌ 0 = Bloqueado
    workoutAnalysisPerDay: 0,      // ❌ 0 = Bloqueado
    customWorkoutsPerMonth: 0,     // ❌ 0 = Bloqueado
    textMessagesPerDay: 0,         // ❌ 0 = Bloqueado
    voiceMinutesPerDay: 0,         // ❌ 0 = Bloqueado
  };
}
```

**Resultado:**
- ✅ Todas as features bloqueadas
- ✅ Quotas zeradas
- ✅ Acesso completamente restrito
- ✅ Usuário só vê prompts de upgrade

---

### **Opção 3: Bloqueio Parcial (Permitir Preview Limitado)**

#### Permitir apenas visualização, sem funcionalidade:

```typescript
// services/subscriptionService.ts
function getFreeTierFeatures(): SubscriptionStatus['features'] {
  return {
    photoAnalysis: false,      // ❌ Não pode usar
    workoutAnalysis: false,    // ❌ Não pode usar
    customWorkouts: false,     // ❌ Não pode usar
    textChat: true,            // ✅ Pode ver, mas limitado
    voiceChat: false,          // ❌ Não pode usar
    voiceMinutesDaily: 0,
    voiceMinutesTotal: 0,
  };
}
```

```typescript
// utils/quotas.ts
return limits[planType || ''] || {
  photoAnalysisPerDay: 0,        // ❌ Bloqueado
  workoutAnalysisPerDay: 0,      // ❌ Bloqueado
  customWorkoutsPerMonth: 0,     // ❌ Bloqueado
  textMessagesPerDay: 3,        // ✅ Apenas 3 mensagens (preview)
  voiceMinutesPerDay: 0,         // ❌ Bloqueado
};
```

**Resultado:**
- ✅ Features premium bloqueadas
- ✅ Preview limitado de algumas funcionalidades
- ✅ Usuário vê valor, mas precisa assinar para usar

---

## 🔧 Implementação Prática

### **Passo 1: Bloquear Features Premium**

#### Modificar `services/subscriptionService.ts`:

```typescript
function getFreeTierFeatures(): SubscriptionStatus['features'] {
  return {
    photoAnalysis: false,      // Bloqueado para free tier
    workoutAnalysis: false,     // Bloqueado para free tier
    customWorkouts: false,      // Bloqueado para free tier
    textChat: false,            // Bloqueado para free tier (ou true para preview)
    voiceChat: false,           // Bloqueado para free tier
    voiceMinutesDaily: 0,
    voiceMinutesTotal: 0,
  };
}
```

### **Passo 2: Bloquear Quotas**

#### Modificar `utils/quotas.ts`:

```typescript
export function getQuotaLimits(planType: string | null): QuotaLimits {
  // ... planos premium com Infinity ...
  
  // Free tier - BLOQUEIO TOTAL
  return limits[planType || ''] || {
    photoAnalysisPerDay: 0,        // 0 = Bloqueado
    workoutAnalysisPerDay: 0,       // 0 = Bloqueado
    customWorkoutsPerMonth: 0,      // 0 = Bloqueado
    textMessagesPerDay: 0,          // 0 = Bloqueado (ou 3 para preview)
    voiceMinutesPerDay: 0,          // 0 = Bloqueado
  };
}
```

### **Passo 3: Verificar Uso Antes de Permitir**

#### Modificar serviços que usam features:

```typescript
// services/geminiService.ts (exemplo)
export async function analyzeMealPhoto(...) {
  // 1. Verificar se tem acesso à feature
  const status = await checkSubscriptionStatus(userId);
  if (!status.features.photoAnalysis) {
    throw new Error('Análise de fotos requer assinatura Premium');
  }
  
  // 2. Verificar quota
  const limits = getQuotaLimits(status.planType);
  const used = getPhotosAnalyzedToday(user);
  if (used >= limits.photoAnalysisPerDay) {
    throw new Error('Limite diário de análises atingido');
  }
  
  // 3. Permitir uso
  // ... processar análise ...
}
```

---

## 🎨 Interface de Bloqueio

### **Componente ProtectedFeature (Atual)**

```typescript
<ProtectedFeature feature="photoAnalysis">
  {/* Conteúdo premium */}
</ProtectedFeature>
```

**Quando bloqueado, mostra:**
```
┌─────────────────────────────────┐
│  Esta funcionalidade requer     │
│  assinatura Premium              │
│                                 │
│  [Ver Planos]                   │
└─────────────────────────────────┘
```

### **Melhorar Mensagem de Bloqueio**

#### Adicionar informações sobre limites:

```typescript
// components/ProtectedFeature.tsx
export function ProtectedFeature({ feature, children, ... }) {
  const { canAccess, status, planType } = useSubscription();
  const limits = getQuotaLimits(planType);
  
  if (!canAccess(feature)) {
    return (
      <div className="premium-locked">
        <div className="upgrade-prompt">
          <p>Esta funcionalidade requer assinatura Premium</p>
          
          {/* Mostrar limites do free tier */}
          {planType === null && (
            <div className="free-tier-limits">
              <p className="text-sm text-slate-600">
                Plano Gratuito permite:
              </p>
              <ul className="text-xs text-slate-500">
                <li>0 análises de fotos por dia</li>
                <li>0 análises de treino por dia</li>
                <li>0 treinos personalizados por mês</li>
                <li>0 mensagens de texto por dia</li>
              </ul>
            </div>
          )}
          
          <Button onClick={() => { window.location.hash = '#/premium'; }}>
            Ver Planos Premium
          </Button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
```

---

## 📊 Comparação de Estratégias de Bloqueio

| Estratégia | Features | Quotas | Resultado | Ideal Para |
|------------|----------|--------|-----------|-----------|
| **Bloqueio Total** | Todas `false` | Todas `0` | Acesso zero | Teste restrito |
| **Preview Limitado** | Maioria `false` | Algumas `> 0` | Preview funcional | Demonstração |
| **Atual (Inconsistente)** | Todas `false` | Algumas `> 0` | Bloqueio parcial | ⚠️ Precisa ajuste |

---

## 🔒 Implementação Recomendada

### **Para Bloqueio Total de Teste:**

#### 1. Modificar `getFreeTierFeatures()`:

```typescript
// services/subscriptionService.ts
function getFreeTierFeatures(): SubscriptionStatus['features'] {
  return {
    photoAnalysis: false,
    workoutAnalysis: false,
    customWorkouts: false,
    textChat: false,           // Bloqueado totalmente
    voiceChat: false,
    voiceMinutesDaily: 0,
    voiceMinutesTotal: 0,
  };
}
```

#### 2. Modificar `getQuotaLimits()`:

```typescript
// utils/quotas.ts
return limits[planType || ''] || {
  photoAnalysisPerDay: 0,        // Bloqueado
  workoutAnalysisPerDay: 0,      // Bloqueado
  customWorkoutsPerMonth: 0,      // Bloqueado
  textMessagesPerDay: 0,          // Bloqueado
  voiceMinutesPerDay: 0,          // Bloqueado
};
```

#### 3. Garantir Verificação em Todos os Serviços:

```typescript
// Padrão a seguir em todos os serviços
async function useFeature(userId: string) {
  // 1. Verificar assinatura
  const status = await checkSubscriptionStatus(userId);
  
  // 2. Verificar acesso à feature
  const validation = validateFeatureAccess('featureName', status);
  if (!validation.allowed) {
    throw new Error(validation.reason || 'Acesso negado');
  }
  
  // 3. Verificar quota
  const limits = getQuotaLimits(status.planType);
  const used = getUsageToday(userId);
  if (used >= limits.featurePerDay) {
    throw new Error('Limite diário atingido');
  }
  
  // 4. Permitir uso
  // ... processar ...
}
```

---

## 🎯 Exemplo Prático: Bloquear Análise de Fotos

### **Implementação Completa:**

```typescript
// services/geminiService.ts
export async function analyzeMealPhoto(
  base64: string,
  mimeType: string
): Promise<MealAnalysisResponse> {
  const { user } = useUser();
  
  // 1. Verificar assinatura
  const status = await checkSubscriptionStatus(user.id);
  
  // 2. Verificar acesso à feature
  if (!status.features.photoAnalysis) {
    throw new Error(
      'Análise de fotos requer assinatura Premium. ' +
      'Assine um plano para desbloquear esta funcionalidade.'
    );
  }
  
  // 3. Verificar quota
  const limits = getQuotaLimits(status.planType);
  const photosToday = getPhotosAnalyzedToday(user);
  
  if (photosToday >= limits.photoAnalysisPerDay) {
    throw new Error(
      `Limite diário de ${limits.photoAnalysisPerDay} análises atingido. ` +
      'Renove amanhã ou assine Premium para análises ilimitadas.'
    );
  }
  
  // 4. Processar análise
  const result = await processPhotoAnalysis(base64, mimeType);
  
  // 5. Incrementar contador
  incrementPhotoAnalysisCount(user);
  
  return result;
}
```

---

## 📝 Checklist de Bloqueio

### **Verificações Necessárias:**

- [ ] `getFreeTierFeatures()` retorna todas features como `false`
- [ ] `getQuotaLimits()` retorna quotas como `0` para free tier
- [ ] `ProtectedFeature` bloqueia renderização
- [ ] `validateFeatureAccess()` retorna `allowed: false`
- [ ] Serviços verificam acesso antes de processar
- [ ] Serviços verificam quota antes de processar
- [ ] Mensagens de erro são claras
- [ ] Botões de upgrade aparecem quando bloqueado

---

## 🚀 Aplicar Bloqueio Total Agora

Vou implementar o bloqueio total para você. Quer que eu:

1. ✅ Modifique `getFreeTierFeatures()` para bloqueio total?
2. ✅ Modifique `getQuotaLimits()` para quotas zeradas?
3. ✅ Adicione verificações extras nos serviços?

**Última Atualização:** 2025-01-27  
**Versão:** 1.0.0

