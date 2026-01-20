# 🚀 Novo Modelo de Planos FitCoach.AI - Implementação Completa

## 📋 Visão Geral

Este documento resume a implementação completa do novo modelo de planos para o FitCoach.AI:

**MUDANÇA PRINCIPAL:**
- ❌ **Removido:** Trial de 3 dias para alunos
- ✅ **Novo:** Academias pagam planos mensais com IA embutida
- ✅ **Novo:** Cada aluno tem limites mensais controlados (texto, imagem, voz)
- ✅ **Novo:** Voz além do limite → recarga paga (FitVoice)
- ✅ **Novo:** Novos usuários não vinculados → 3 interações grátis (modo demo)

---

## 📦 Arquivos Criados/Modificados

### ✅ **CRIADOS:**

#### SQL Migrations:
1. **`supabase/migrations/003_novo_modelo_planos_academia.sql`** ⭐ **EXECUTAR PRIMEIRO**
   - Adiciona campos de plano e limites na tabela `companies`
   - Adiciona campos de uso mensal na tabela `users`
   - Cria tabela `recargas` para compras FitVoice
   - Cria funções RPC para verificação de limites

#### Serviços Backend:
2. **`services/academiaLimitsService.ts`** - Verificação e consumo de limites
3. **`services/novoAiAccessService.ts`** - Novo serviço de acesso à IA
4. **`services/recargaService.ts`** - Gerenciamento de recargas FitVoice
5. **`API_WEBHOOK_RECARGA.ts`** - Exemplo de webhook para processar pagamentos

#### Componentes Frontend:
6. **`components/RecargaModal.tsx`** - Modal de compra de recargas
7. **`components/LimitesUsageIndicator.tsx`** - Indicador visual de limites

#### Documentação:
8. **`docs/GUIA_MIGRACAO_NOVO_MODELO.md`** - Guia completo
9. **`docs/INSTRUCOES_FINAIS_IMPLEMENTACAO.md`** - Instruções passo a passo
10. **`RESUMO_IMPLEMENTACAO_NOVO_MODELO.md`** - Resumo executivo
11. **`services/atualizarChamadasIa.md`** - Guia de atualização de chamadas IA
12. **`services/exemploAtualizacaoChamadasIa.ts`** - Exemplos de código

### 🔄 **MODIFICADOS:**

1. **`services/inviteService.ts`** - Removido trial, apenas vincula à academia
2. **`pages/LoginPage.tsx`** - Substituído trial por modo demo (parcial)

### ⚠️ **PENDENTES (Atualizar):**

1. **`chatbot/services/geminiService.ts`** - `sendMessageToGemini` (texto)
2. **`chatbot/services/geminiService.ts`** - `processImageWithGemini` (imagem)
3. **`services/assistantService.ts`** - `startAssistantAudioSession` (voz)
4. **`pages/BillingPage.tsx`** - Integrar `LimitesUsageIndicator`
5. **`chatbot/components/ChatbotPopup.tsx`** - Adicionar contador de minutos e modal de recarga
6. **`App.tsx`** - Remover verificação de trial expirado

---

## 🚀 COMEÇAR AGORA

### **PASSO 1: Executar Migration SQL** ⚠️ CRÍTICO

```sql
-- No Supabase SQL Editor
-- Executar: supabase/migrations/003_novo_modelo_planos_academia.sql
```

### **PASSO 2: Configurar Planos das Academias**

```sql
-- Exemplo: Configurar limites para uma academia
UPDATE public.companies
SET 
  plano = 'FitCoach50',
  alunos_max = 50,
  limite_texto = 1000,   -- 1000 mensagens/mês por aluno
  limite_imagem = 100,   -- 100 análises/mês por aluno
  limite_voz = 450       -- 450 min/mês por aluno (15 min/dia * 30)
WHERE id = '<id_da_academia>';
```

### **PASSO 3: Atualizar Serviços de Chamada IA**

Siga os exemplos em:
- `services/exemploAtualizacaoChamadasIa.ts`
- `services/atualizarChamadasIa.md`

**Padrão:**
```typescript
// Substituir
import { assertAiAccessOrThrow } from '../../services/aiAccessService';
await assertAiAccessOrThrow(user, 'chat');

// Por
import { assertNovoAiAccessOrThrow, consumirUsoAposChamada } from '../../services/novoAiAccessService';
await assertNovoAiAccessOrThrow(user, 'chat');
// ... fazer chamada IA ...
await consumirUsoAposChamada(user.id as string, 'chat', 1);
```

### **PASSO 4: Integrar Componentes**

**Adicionar em `pages/BillingPage.tsx`:**
```typescript
import { LimitesUsageIndicator } from '../components/LimitesUsageIndicator';

// Na renderização:
<LimitesUsageIndicator />
```

---

## 📊 Estrutura de Dados

### **Tabela `companies` (Academias):**
- `plano` - Enum: FitCoach50, FitCoach100, FitCoach200, FitCoach400, FitCoach500
- `alunos_max` - Número máximo de alunos
- `limite_texto` - Limite de mensagens/mês por aluno
- `limite_imagem` - Limite de análises/mês por aluno
- `limite_voz` - Limite de minutos/mês por aluno

### **Tabela `users` (Alunos):**
- `academias_id` - Vinculação com companies
- `uso_texto` - Contador de mensagens no mês
- `uso_imagem` - Contador de análises no mês
- `uso_voz_minutos` - Contador de minutos no mês
- `saldo_voz_extra` - Minutos extras comprados
- `periodo_uso_mes` - 'YYYY-MM' para reset mensal
- `modo_demo` - Se está em modo demo (3 interações)
- `interacoes_demo_usadas` - Contador de interações demo

### **Tabela `recargas` (Nova):**
- `aluno_id` - Aluno que comprou
- `tipo_recarga` - FitVoice20, FitVoice60, FitVoice120
- `minutos_comprados` - 20, 60 ou 120
- `valor_pago` - Preço da recarga
- `status` - pending, paid, failed, refunded

---

## 🔒 Fluxo de Verificação

### **Antes de Cada Chamada IA:**

1. **Verificar acesso** com `assertNovoAiAccessOrThrow(user, feature)`
   - Se erro: Retornar mensagem e bloquear chamada

2. **Fazer chamada** à IA (Gemini API)

3. **Se sucesso:** Consumir uso com `consumirUsoAposChamada(userId, feature, quantidade)`

### **Fluxo de Recarga:**

1. Aluno atinge limite de voz
2. Modal de recarga aparece automaticamente
3. Aluno seleciona pacote (20/60/120 min)
4. Redireciona para checkout (Cakto/Stripe)
5. Webhook confirma pagamento
6. `processarRecargaPaga()` adiciona minutos ao saldo extra
7. Aluno pode usar minutos extras imediatamente

---

## ⚠️ BREAKING CHANGES

### **Campos Deprecated (manter por compatibilidade):**
- `trial_active`, `trial_expires_at`
- `trial_voice_total_seconds`, `trial_photo_analysis_count`, `trial_meal_plan_count`
- `ai_subscription_status`

### **Serviços Deprecated:**
- `services/aiAccessService.ts` → Usar `novoAiAccessService.ts`
- `services/trialLimitsService.ts` → Lógica integrada em `academiaLimitsService.ts`

---

## ✅ Checklist de Implementação

- [x] SQL migrations criadas
- [x] Serviços de verificação de limites criados
- [x] Serviço de recargas criado
- [x] Componentes frontend criados
- [x] Documentação criada
- [ ] **Executar migration SQL no Supabase** ⚠️ **PRÓXIMO PASSO**
- [ ] Configurar planos das academias existentes
- [ ] Atualizar `chatbot/services/geminiService.ts` - sendMessageToGemini
- [ ] Atualizar `chatbot/services/geminiService.ts` - processImageWithGemini
- [ ] Atualizar `services/assistantService.ts` - startAssistantAudioSession
- [ ] Atualizar `pages/LoginPage.tsx` - modo demo (já iniciado)
- [ ] Atualizar `App.tsx` - remover verificação de trial
- [ ] Integrar componentes no frontend
- [ ] Configurar webhook de pagamento
- [ ] Testar fluxo completo
- [ ] Remover código antigo (após testes)

---

## 📚 Documentação Completa

- **`docs/GUIA_MIGRACAO_NOVO_MODELO.md`** - Guia completo de migração
- **`docs/INSTRUCOES_FINAIS_IMPLEMENTACAO.md`** - Instruções passo a passo
- **`services/atualizarChamadasIa.md`** - Guia específico para atualizar chamadas IA
- **`services/exemploAtualizacaoChamadasIa.ts`** - Exemplos de código

---

**Status:** ✅ Estrutura completa criada, pronto para implementação
**Próximo Passo:** Executar migration SQL no Supabase
