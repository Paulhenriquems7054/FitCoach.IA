# 🎁 Como Funciona o Trial no FitCoach.IA

## 📋 Visão Geral

O sistema de trial oferece **3 dias grátis** de acesso às funcionalidades de IA para:
- ✅ **Alunos** (que acessam via código de convite da academia)
- ✅ **Usuários indicados** (que se cadastram sem código de academia)

## 🎯 Quem Recebe Trial?

### ✅ Recebem Trial (3 dias grátis)

1. **Alunos (Students)**
   - Acessam o app usando código de convite da academia
   - Recebem trial automaticamente ao aceitar o convite
   - **Arquivo:** `services/inviteService.ts` → `acceptInvite()`

2. **Usuários Indicados (Referred Users)**
   - Se cadastram sem código de academia
   - Recebem trial automaticamente no cadastro
   - **Arquivo:** `pages/LoginPage.tsx` → lógica de signup

### ❌ NÃO Recebem Trial

1. **Personal Trainers**
   - Acessam via código de convite, mas como `role: 'personal'`
   - Não recebem trial de IA

2. **Academias (Owners)**
   - Donos de academia não recebem trial
   - Pagam diretamente pelos planos B2B

## ⏱️ Duração do Trial

- **Duração:** 3 dias (72 horas)
- **Início:** Automaticamente ao aceitar convite ou se cadastrar
- **Fim:** `trial_expires_at` = data atual + 3 dias

## 🎁 Limites do Trial

Durante os 3 dias, o usuário tem acesso limitado:

### 1. Consultoria de Voz (Gemini Live)
- **Limite diário:** 5 minutos por dia
- **Limite total:** 15 minutos (5 min × 3 dias)
- **Controle:** `trial_voice_total_seconds` na tabela `users`
- **Reset diário:** Limite de 5 min/dia reseta à meia-noite

### 2. Análise de Fotos
- **Limite total:** 1 análise durante todo o trial
- **Controle:** `trial_photo_analysis_count` na tabela `users`
- **Após usar:** Bloqueado até assinar plano

### 3. Geração de Plano Alimentar
- **Limite total:** 1 plano durante todo o trial
- **Controle:** `trial_meal_plan_count` na tabela `users`
- **Após usar:** Bloqueado até assinar plano

### 4. Chat de Texto
- **Limite:** Ilimitado durante o trial
- **Após trial:** Bloqueado até assinar plano

## 🔄 Fluxo Completo do Trial

### 1. Ativação do Trial

**Para Alunos (via código de convite):**
```typescript
// services/inviteService.ts
if (invitedRole === 'student') {
  const trialExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  
  updateData.trial_active = true;
  updateData.trial_expires_at = trialExpiresAt;
  updateData.ai_subscription_status = 'trial';
  updateData.voice_daily_limit_seconds = 300; // 5 minutos
}
```

**Para Usuários Indicados (cadastro normal):**
```typescript
// pages/LoginPage.tsx
// Lógica similar - ativa trial de 3 dias
```

### 2. Durante o Trial

**Verificação de Acesso:**
```typescript
// services/aiAccessService.ts
const isTrialActive = user.trialActive === true && 
  user.trialExpiresAt && 
  new Date(user.trialExpiresAt) > new Date();
```

**Limites Aplicados:**
- `services/trialLimitsService.ts` → `getTrialLimitsStatus()`
- `services/usageLimitService.ts` → `consumeVoiceSeconds()`
- `services/assistantService.ts` → verifica `canUsePhotoAnalysis()`
- `services/geminiService.ts` → verifica `canUseMealPlan()`

### 3. Após Trial Expirar

**Bloqueio Total:**
- ❌ Chat de texto bloqueado
- ❌ Análise de fotos bloqueada
- ❌ Geração de plano alimentar bloqueada
- ❌ Consultoria de voz bloqueada

**Mensagem exibida:**
```
"Seu Período de Teste Expirou ⏰
Para continuar usando as funcionalidades de IA, assine um plano individual abaixo."
```

## 📊 Campos no Banco de Dados

### Tabela `users`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `trial_active` | boolean | Se o trial está ativo |
| `trial_expires_at` | timestamp | Data/hora de expiração do trial |
| `trial_voice_total_seconds` | integer | Total de segundos de voz usados no trial |
| `trial_photo_analysis_count` | integer | Quantas análises de foto foram feitas |
| `trial_meal_plan_count` | integer | Quantos planos alimentares foram gerados |
| `ai_subscription_status` | text | Status: 'trial', 'active', 'expired', 'none' |
| `ai_trial_start_at` | timestamp | Data de início do trial |
| `ai_trial_end_at` | timestamp | Data de fim do trial |

## 🔍 Verificação de Trial

### Função Principal
```typescript
// services/trialLimitsService.ts
function isInTrial(user: User): boolean {
  return user.trialActive === true && 
         user.trialExpiresAt && 
         new Date(user.trialExpiresAt) > new Date();
}
```

### Status Completo
```typescript
// services/trialLimitsService.ts
export async function getTrialLimitsStatus(user: User): Promise<TrialLimitsStatus> {
  // Retorna:
  // - Limites de voz (diário e total)
  // - Status de análise de foto
  // - Status de plano alimentar
}
```

## 📝 Exemplos de Uso

### Verificar se está em trial
```typescript
import { getTrialLimitsStatus } from './services/trialLimitsService';

const limits = await getTrialLimitsStatus(user);
if (limits.voice.canUse) {
  // Pode usar voz
}
```

### Registrar uso de voz
```typescript
import { recordTrialVoiceUsage } from './services/trialLimitsService';

await recordTrialVoiceUsage(userId, secondsUsed);
```

### Verificar se pode analisar foto
```typescript
import { canUsePhotoAnalysis } from './services/trialLimitsService';

const check = await canUsePhotoAnalysis(user);
if (!check.allowed) {
  // Mostrar mensagem: check.message
}
```

## 🎯 Estratégia de Negócio

### Modelo B2B2C
- **Academia paga:** Apenas pela plataforma (B2B)
- **Aluno paga:** Diretamente pela IA (B2C individual)
- **Trial:** 3 dias grátis para aluno experimentar IA

### Após Trial
- Aluno precisa assinar plano individual:
  - `ai_monthly`: R$ 34,90/mês
  - `ai_annual_vip`: R$ 297,00/ano
- Ou comprar recargas:
  - Sessão Turbo
  - Banco de Voz 100
  - Passe Livre 30 Dias

## 🧪 Como Testar

### 1. Criar Aluno com Trial
```sql
-- Ativar trial manualmente (para testes)
UPDATE users
SET 
  trial_active = true,
  trial_expires_at = NOW() + INTERVAL '3 days',
  ai_subscription_status = 'trial',
  voice_daily_limit_seconds = 300,
  trial_voice_total_seconds = 0,
  trial_photo_analysis_count = 0,
  trial_meal_plan_count = 0
WHERE id = 'user-id-aqui';
```

### 2. Verificar Status do Trial
```sql
SELECT 
  id,
  nome,
  email,
  trial_active,
  trial_expires_at,
  trial_voice_total_seconds,
  trial_photo_analysis_count,
  trial_meal_plan_count,
  ai_subscription_status
FROM users
WHERE id = 'user-id-aqui';
```

### 3. Simular Expiração do Trial
```sql
-- Expirar trial (para testes)
UPDATE users
SET 
  trial_expires_at = NOW() - INTERVAL '1 day'
WHERE id = 'user-id-aqui';
```

## 📊 Resumo dos Limites

| Funcionalidade | Limite no Trial | Após Trial |
|----------------|-----------------|------------|
| **Voz** | 5 min/dia (15 min total) | ❌ Bloqueado |
| **Análise de Foto** | 1 vez | ❌ Bloqueado |
| **Plano Alimentar** | 1 vez | ❌ Bloqueado |
| **Chat de Texto** | ✅ Ilimitado | ❌ Bloqueado |

## ✅ Checklist de Implementação

- [x] Trial ativado automaticamente para alunos
- [x] Trial ativado automaticamente para usuários indicados
- [x] Limites de voz (5 min/dia, 15 min total)
- [x] Limite de análise de foto (1 vez)
- [x] Limite de plano alimentar (1 vez)
- [x] Verificação de expiração
- [x] Bloqueio após expiração
- [x] Mensagens informativas na UI
- [x] Registro de uso no banco
- [x] Integração com serviços de IA

## 🎯 Próximos Passos (Opcional)

1. **Notificações:**
   - Lembrete 1 dia antes do trial expirar
   - Email com ofertas especiais

2. **Dashboard:**
   - Mostrar dias restantes do trial
   - Mostrar uso dos limites

3. **Analytics:**
   - Taxa de conversão (trial → assinatura)
   - Uso médio durante trial

