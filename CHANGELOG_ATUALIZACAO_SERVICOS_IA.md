# 📝 CHANGELOG: Atualização dos Serviços de Chamada IA

## ✅ Atualização Completa - 2026-01-18

### **Arquivos Modificados:**

#### 1. **`chatbot/services/geminiService.ts`**

**Função: `sendMessageToGemini` (linha ~159)**
- ✅ Substituído `assertAiAccessOrThrow` por `assertNovoAiAccessOrThrow`
- ✅ Adicionado `consumirUsoAposChamada` após chamada bem-sucedida
- ✅ Mensagens de erro específicas baseadas em `error.reason`

**Função: `processImageWithGemini` (linha ~337)**
- ✅ Adicionada verificação de acesso ANTES de processar imagem
- ✅ Substituído verificação antiga por novo modelo
- ✅ Adicionado `consumirUsoAposChamada` após análise bem-sucedida
- ✅ Mensagens de erro específicas

**Função: `startLiveAudioSession` (linha ~564)**
- ✅ Substituídas duas verificações de acesso antigas (linhas ~533 e ~554)
- ✅ Implementado consumo de minutos em tempo real durante sessão
- ✅ Consumo a cada minuto completo usado
- ✅ Verificação contínua de limites durante sessão
- ✅ Consumo final ao encerrar sessão
- ✅ Corrigido uso de variáveis `totalSecondsElapsed` e `minutosConsumidos` no escopo correto

#### 2. **`services/assistantService.ts`**

**Função: `analyzeImageWithAssistant` (linha ~460)**
- ✅ Substituído `assertAiAccessOrThrow` por `assertNovoAiAccessOrThrow`
- ✅ Removida verificação de trial (`canUsePhotoAnalysis`)
- ✅ Adicionado `consumirUsoAposChamada` após análise bem-sucedida
- ✅ Mensagens de erro específicas

#### 3. **`services/geminiService.ts`**

**Função: `generateMealPlan` (linha ~143)**
- ✅ Substituído `assertAiAccessOrThrow` por `assertNovoAiAccessOrThrow`
- ✅ Removida verificação de trial (`canUseMealPlan`, `recordTrialMealPlan`)
- ✅ Adicionado `consumirUsoAposChamada` após geração bem-sucedida
- ✅ Mensagens de erro específicas

---

## 🔄 Mudanças Técnicas

### **Imports Atualizados:**
```typescript
// ANTES
import { assertAiAccessOrThrow } from '../../services/aiAccessService';

// DEPOIS
import { assertNovoAiAccessOrThrow, consumirUsoAposChamada } from '../../services/novoAiAccessService';
```

### **Verificação de Acesso:**
```typescript
// ANTES
await assertAiAccessOrThrow(user, 'chat');

// DEPOIS
await assertNovoAiAccessOrThrow(user, 'chat');
```

### **Consumo de Uso:**
```typescript
// NOVO (após chamada bem-sucedida)
await consumirUsoAposChamada(user.id as string, 'chat', 1);
```

### **Mensagens de Erro:**
```typescript
// NOVO (específicas baseadas no motivo)
const mensagem = error.message || 
  (error.reason === 'limite_excedido' 
    ? 'Você atingiu o limite da sua conta. Adquira recarga FitVoice.' 
    : error.reason === 'demo_expirado'
    ? 'Você atingiu o limite da sua conta. Adquira recarga FitVoice ou vincule-se a uma academia.'
    : 'Seu acesso à IA está bloqueado. Vincule-se a uma academia ou adquira recarga FitVoice.');
```

### **Tratamento Especial para Voz:**
```typescript
// Consumo em tempo real (a cada minuto completo)
const minutosAtuais = Math.floor(totalSecondsElapsed / 60);
if (minutosAtuais > minutosConsumidos) {
  await consumirUsoAposChamada(userId, 'voice', minutosAtuais - minutosConsumidos);
  minutosConsumidos = minutosAtuais;
}

// Consumo final ao encerrar
const minutosFinais = Math.ceil(totalSeconds / 60);
const minutosPendentes = minutosFinais - minutosConsumidos;
if (minutosPendentes > 0) {
  await consumirUsoAposChamada(userId, 'voice', minutosPendentes);
}
```

---

## ✅ Status Final

- [x] Todos os serviços de chamada IA atualizados
- [x] Verificação de limites implementada
- [x] Consumo de uso implementado
- [x] Mensagens de erro específicas implementadas
- [x] Tratamento especial para voz implementado
- [x] Compatibilidade mantida (código antigo não removido)

---

## 🧪 Próximos Passos

1. Testar fluxo completo de uso
2. Verificar consumo de uso no banco
3. Testar limites (texto, imagem, voz)
4. Testar modo demo (3 interações)
5. Integrar componentes frontend (`LimitesUsageIndicator`)

---

**Data:** 2026-01-18
**Status:** ✅ Atualização completa
