# Guia de Atualização de Chamadas IA para Novo Modelo

## 📋 Objetivo
Atualizar todos os serviços que fazem chamadas à IA Gemini para usar o novo sistema de verificação de limites (academia + modo demo).

## 🔄 Mudanças Necessárias

### 1. Substituir `aiAccessService` por `novoAiAccessService`

**Antes:**
```typescript
import { assertAiAccessOrThrow } from '../../services/aiAccessService';
await assertAiAccessOrThrow(user, 'chat');
```

**Depois:**
```typescript
import { assertNovoAiAccessOrThrow, consumirUsoAposChamada } from '../../services/novoAiAccessService';
await assertNovoAiAccessOrThrow(user, 'chat');
// Após chamada bem-sucedida:
await consumirUsoAposChamada(user.id as string, 'chat', 1);
```

### 2. Arquivos que Precisam de Atualização

#### `chatbot/services/geminiService.ts`
- **Função:** `sendMessageToGemini` (linha ~159)
- **Mudança:** Substituir verificação de acesso e adicionar consumo de uso
- **Feature:** 'chat' → tipo 'texto'

#### `chatbot/services/geminiService.ts`
- **Função:** `processImageWithGemini` (linha ~337)
- **Mudança:** Substituir verificação de acesso e adicionar consumo de uso
- **Feature:** 'vision' → tipo 'imagem'

#### `services/assistantService.ts`
- **Função:** `startAssistantAudioSession` (linha ~779)
- **Mudança:** Substituir verificação de acesso e adicionar consumo de uso de voz
- **Feature:** 'voice' → tipo 'voz'
- **Importante:** Consumir minutos em tempo real durante sessão

#### `services/geminiService.ts`
- **Função:** `generateMealPlan` (verificar se existe)
- **Mudança:** Substituir verificação de acesso e adicionar consumo de uso
- **Feature:** 'plan' → tipo 'texto'

### 3. Exemplo Completo de Atualização

**Antes:**
```typescript
// Verificar acesso
try {
  const { getUser } = await import('../../services/databaseService');
  const { assertAiAccessOrThrow } = await import('../../services/aiAccessService');
  const user = await getUser();
  if (user) {
    await assertAiAccessOrThrow(user, 'chat');
  }
} catch (error: any) {
  if (error?.code === 'AI_ACCESS_DENIED') {
    onError('Seu acesso à IA está bloqueado. Ative um plano para continuar usando.');
    return;
  }
}

// Fazer chamada IA
// ... código de chamada ...
```

**Depois:**
```typescript
// Verificar acesso ANTES da chamada
try {
  const { getUser } = await import('../../services/databaseService');
  const { assertNovoAiAccessOrThrow } = await import('../../services/novoAiAccessService');
  const user = await getUser();
  if (user) {
    await assertNovoAiAccessOrThrow(user, 'chat');
  }
} catch (error: any) {
  if (error?.code === 'AI_ACCESS_DENIED') {
    // Mensagem mais específica baseada no motivo
    const mensagem = error.message || 
      (error.reason === 'limite_excedido' 
        ? 'Você atingiu o limite da sua conta. Adquira recarga FitVoice.' 
        : 'Seu acesso à IA está bloqueado. Vincule-se a uma academia ou adquira recarga FitVoice.');
    onError(mensagem);
    return;
  }
}

// Fazer chamada IA
// ... código de chamada ...

// Consumir uso APÓS chamada bem-sucedida
try {
  const { getUser } = await import('../../services/databaseService');
  const { consumirUsoAposChamada } = await import('../../services/novoAiAccessService');
  const user = await getUser();
  if (user) {
    await consumirUsoAposChamada(user.id as string, 'chat', 1);
  }
} catch (error) {
  logger.warn('Erro ao consumir uso após chamada', 'geminiService', error);
  // Não bloquear usuário se consumo falhar, mas logar erro
}
```

### 4. Tratamento Especial para Voz

Para sessões de voz (`startAssistantAudioSession`), o consumo deve ser feito:
- **Durante a sessão:** A cada minuto completo usado
- **Ao finalizar sessão:** Total de minutos usados

```typescript
// Durante sessão (a cada minuto)
const minutosUsados = Math.floor(totalSeconds / 60);
if (minutosUsados > minutosConsumidos) {
  await consumirUsoAposChamada(userId, 'voice', minutosUsados - minutosConsumidos);
  minutosConsumidos = minutosUsados;
}

// Ao finalizar
const minutosFinais = Math.ceil(totalSeconds / 60);
await consumirUsoAposChamada(userId, 'voice', minutosFinais - minutosConsumidos);
```

### 5. Mensagens de Erro Específicas

Baseado em `error.reason`:
- `limite_excedido`: "Você atingiu o limite da sua conta. Adquira recarga FitVoice."
- `demo_expirado`: "Você atingiu o limite da sua conta. Adquira recarga FitVoice ou vincule-se a uma academia."
- `none`: "Você não está vinculado a uma academia ativa. Adquira recarga FitVoice ou vincule-se a uma academia."

### 6. Atualizar LoginPage.tsx para Ativar Modo Demo

**Localização:** `pages/LoginPage.tsx` (função de signup)

**Antes:** Ativava trial de 3 dias
**Depois:** Ativa modo demo (3 interações) apenas se não estiver vinculado a academia

```typescript
// No signup, após criar usuário
const { deveAtivarModoDemo } = await import('../services/novoAiAccessService');
if (novoUsuario) {
  await deveAtivarModoDemo(novoUsuario);
}
```

### 7. Remover Lógica de Trial de inviteService.ts

**Localização:** `services/inviteService.ts` (função `acceptInvite`)

**Mudança:** Remover código que ativa trial para alunos

**Antes:**
```typescript
if (invitedRole === 'student') {
  updateData.trial_active = true;
  updateData.trial_expires_at = trialExpiresAt;
  // ... mais código de trial
}
```

**Depois:**
```typescript
if (invitedRole === 'student') {
  // Alunos vinculados à academia não recebem trial/demo
  // Apenas vincular à academia
  // Os limites vêm do plano da academia
}
```

## ✅ Checklist de Implementação

- [ ] Atualizar `chatbot/services/geminiService.ts` - sendMessageToGemini
- [ ] Atualizar `chatbot/services/geminiService.ts` - processImageWithGemini
- [ ] Atualizar `services/assistantService.ts` - startAssistantAudioSession
- [ ] Atualizar `services/geminiService.ts` - generateMealPlan (se existir)
- [ ] Atualizar `pages/LoginPage.tsx` - remover trial, adicionar modo demo
- [ ] Atualizar `services/inviteService.ts` - remover trial de alunos
- [ ] Testar fluxo completo de verificação de limites
- [ ] Testar modal de recarga
- [ ] Testar modo demo (3 interações)
