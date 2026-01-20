# 🚀 Guia de Migração para Novo Modelo de Planos

## 📋 Resumo Executivo

Este guia documenta a migração completa do sistema FitCoach.AI para o novo modelo de planos:
- **Academias pagam planos mensais** com IA embutida (texto, imagem, voz)
- **Cada aluno tem limites mensais** controlados pela academia
- **Voz além do limite** → recarga paga (FitVoice)
- **Remoção de trial** → substituído por modo demo (3 interações grátis)

---

## 🗄️ 1. MIGRAÇÕES SQL

### Executar no Supabase SQL Editor

**Arquivo:** `supabase/migrations/003_novo_modelo_planos_academia.sql`

Esta migration:
- ✅ Adiciona campos de plano e limites na tabela `companies` (academias)
- ✅ Adiciona campos de uso mensal na tabela `users` (alunos)
- ✅ Cria tabela `recargas` para compras de minutos FitVoice
- ✅ Cria funções RPC para verificação de limites e processamento de recargas
- ✅ Adiciona suporte a modo demo (3 interações)

**⚠️ IMPORTANTE:** Execute esta migration ANTES de atualizar o código frontend/backend.

---

## 🔧 2. SERVIÇOS CRIADOS

### 2.1. `services/academiaLimitsService.ts`

**Funções principais:**
- `verificarLimiteAntesUso()` - Verifica se pode usar antes de fazer chamada IA
- `consumirUso()` - Atualiza contadores após uso
- `obterUsoAluno()` - Retorna uso atual do aluno
- `obterLimitesAcademia()` - Retorna limites configurados pela academia
- `ativarModoDemo()` - Ativa modo demo para novos usuários

### 2.2. `services/novoAiAccessService.ts`

**Substitui:** `services/aiAccessService.ts` (mantido por compatibilidade)

**Funções principais:**
- `getNovoAiAccessStatus()` - Verifica acesso à IA para funcionalidade específica
- `assertNovoAiAccessOrThrow()` - Garante acesso (lança erro se não tiver)
- `deveAtivarModoDemo()` - Verifica se deve ativar modo demo
- `obterInfoUsoAluno()` - Retorna informações de uso para exibição
- `consumirUsoAposChamada()` - Consome uso após chamada bem-sucedida

### 2.3. `services/recargaService.ts`

**Funções principais:**
- `criarRecarga()` - Cria recarga pendente
- `processarRecargaPaga()` - Processa recarga após pagamento (webhook)
- `listarRecargasAluno()` - Lista recargas do aluno
- `obterSaldoVozExtra()` - Retorna saldo extra de minutos

---

## 🎨 3. COMPONENTES FRONTEND

### 3.1. `components/RecargaModal.tsx`

Modal para compra de recargas FitVoice:
- Exibe 3 opções: FitVoice 20, 60, 120
- Integração com checkout (Cakto/Stripe) - TODO
- Abre automaticamente quando minutos zeram

### 3.2. `components/LimitesUsageIndicator.tsx`

Indicador visual de limites:
- Mostra uso atual de texto, imagem e voz
- Barras de progresso coloridas (verde/amarelo/vermelho)
- Links para recarga quando próximo do limite
- Suporte a modo demo

---

## 🔄 4. ATUALIZAÇÕES NECESSÁRIAS NO CÓDIGO

### 4.1. Substituir Verificação de Acesso nas Chamadas IA

**Arquivo:** `chatbot/services/geminiService.ts`

**Função:** `sendMessageToGemini`
```typescript
// ANTES
import { assertAiAccessOrThrow } from '../../services/aiAccessService';
await assertAiAccessOrThrow(user, 'chat');

// DEPOIS
import { assertNovoAiAccessOrThrow, consumirUsoAposChamada } from '../../services/novoAiAccessService';
await assertNovoAiAccessOrThrow(user, 'chat');
// ... fazer chamada IA ...
await consumirUsoAposChamada(user.id as string, 'chat', 1);
```

**Função:** `processImageWithGemini`
```typescript
// ANTES
import { assertAiAccessOrThrow } from '../../services/aiAccessService';
await assertAiAccessOrThrow(user, 'vision');

// DEPOIS
import { assertNovoAiAccessOrThrow, consumirUsoAposChamada } from '../../services/novoAiAccessService';
await assertNovoAiAccessOrThrow(user, 'vision');
// ... fazer chamada IA ...
await consumirUsoAposChamada(user.id as string, 'vision', 1);
```

### 4.2. Atualizar Serviço de Voz

**Arquivo:** `services/assistantService.ts`

**Função:** `startAssistantAudioSession`

**Mudança:** Consumir minutos em tempo real durante sessão e ao finalizar

```typescript
import { assertNovoAiAccessOrThrow, consumirUsoAposChamada } from '../services/novoAiAccessService';

// Antes de iniciar sessão
await assertNovoAiAccessOrThrow(user, 'voice');

// Durante sessão (a cada minuto completo)
let minutosConsumidos = 0;
const intervalId = setInterval(async () => {
  const minutosUsados = Math.floor(totalSeconds / 60);
  if (minutosUsados > minutosConsumidos) {
    await consumirUsoAposChamada(userId, 'voice', minutosUsados - minutosConsumidos);
    minutosConsumidos = minutosUsados;
  }
}, 60000); // Verificar a cada minuto

// Ao finalizar sessão
clearInterval(intervalId);
const minutosFinais = Math.ceil(totalSeconds / 60);
await consumirUsoAposChamada(userId, 'voice', minutosFinais - minutosConsumidos);
```

### 4.3. Remover Lógica de Trial

**Arquivo:** `services/inviteService.ts`

**Função:** `acceptInvite`

**Mudança:** Remover código que ativa trial para alunos

```typescript
// REMOVER este bloco:
if (invitedRole === 'student') {
  const trialExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  updateData.trial_active = true;
  updateData.trial_expires_at = trialExpiresAt;
  updateData.ai_subscription_status = 'trial';
  // ... mais código de trial
}

// MANTER apenas vinculação à academia
if (invitedRole === 'student') {
  // Alunos vinculados à academia têm limites do plano da academia
  // Não recebem trial/demo
}
```

### 4.4. Atualizar LoginPage.tsx

**Arquivo:** `pages/LoginPage.tsx`

**Função:** Signup de novos usuários

**Mudança:** Substituir ativação de trial por modo demo

```typescript
// ANTES
if (novoUsuario && !inviteCode) {
  // Ativar trial de 3 dias
  const trialExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  updateData.trial_active = true;
  updateData.trial_expires_at = trialExpiresAt;
  // ...
}

// DEPOIS
if (novoUsuario && !inviteCode) {
  // Verificar se deve ativar modo demo (apenas se não vinculado)
  const { deveAtivarModoDemo } = await import('../services/novoAiAccessService');
  await deveAtivarModoDemo(novoUsuario);
}
```

### 4.5. Atualizar App.tsx

**Arquivo:** `App.tsx`

**Mudança:** Remover verificação de trial expirado, adicionar verificação de modo demo

```typescript
// REMOVER este bloco (linha ~344-377):
// const checkTrialStatus = async () => {
//   const { updateTrialStatus } = await import('./services/trialAccessService');
//   // ... código de trial
// };

// ADICIONAR verificação de modo demo (opcional, pode fazer inline nas chamadas IA)
```

### 4.6. Atualizar BillingPage.tsx

**Arquivo:** `pages/BillingPage.tsx`

**Mudança:** Integrar `LimitesUsageIndicator` e `RecargaModal`

```typescript
import { LimitesUsageIndicator } from '../components/LimitesUsageIndicator';

// Na renderização, substituir/adiionar:
<LimitesUsageIndicator />
```

---

## 📊 5. ESTRUTURA DE DADOS

### Tabela `companies` (Academias)
```sql
plano TEXT -- 'FitCoach50', 'FitCoach100', 'FitCoach200', 'FitCoach400', 'FitCoach500'
alunos_max INTEGER -- Número máximo de alunos
limite_texto INTEGER -- Limite de mensagens de texto por mês por aluno
limite_imagem INTEGER -- Limite de análises de imagem por mês por aluno
limite_voz INTEGER -- Limite de minutos de voz por mês por aluno
```

### Tabela `users` (Alunos)
```sql
academias_id UUID -- Vinculação com companies
uso_texto INTEGER -- Contador de mensagens de texto no mês
uso_imagem INTEGER -- Contador de análises de imagem no mês
uso_voz_minutos INTEGER -- Contador de minutos de voz no mês
saldo_voz_extra INTEGER -- Saldo de minutos extras comprados
periodo_uso_mes TEXT -- 'YYYY-MM' para reset mensal
modo_demo BOOLEAN -- Se está em modo demo (3 interações)
interacoes_demo_usadas INTEGER -- Contador de interações demo
```

### Tabela `recargas`
```sql
aluno_id UUID -- ID do aluno que comprou
tipo_recarga TEXT -- 'FitVoice20', 'FitVoice60', 'FitVoice120'
minutos_comprados INTEGER -- 20, 60 ou 120
valor_pago DECIMAL(10,2) -- Valor pago
status TEXT -- 'pending', 'paid', 'failed', 'refunded'
cakto_checkout_id TEXT -- ID do checkout (integração pagamento)
cakto_transaction_id TEXT -- ID da transação (após pagamento)
```

---

## 🔒 6. FLUXO DE VERIFICAÇÃO

### Antes de Cada Chamada IA:

1. **Verificar acesso** usando `assertNovoAiAccessOrThrow(user, feature)`
   - Se erro: Retornar mensagem específica e bloquear chamada

2. **Fazer chamada** à IA (Gemini API)

3. **Se sucesso:** Consumir uso com `consumirUsoAposChamada(userId, feature, quantidade)`

### Fluxo de Recarga:

1. Aluno atinge limite de voz
2. Modal de recarga aparece automaticamente
3. Aluno seleciona pacote (20/60/120 min)
4. Redireciona para checkout (Cakto/Stripe)
5. Webhook confirma pagamento
6. Função `processarRecargaPaga()` adiciona minutos ao saldo extra
7. Aluno pode usar minutos extras imediatamente

---

## 🧪 7. TESTES

### Cenários a Testar:

1. ✅ Aluno vinculado a academia ativa - pode usar até limites
2. ✅ Aluno atinge limite de texto - bloqueado com mensagem
3. ✅ Aluno atinge limite de imagem - bloqueado com mensagem
4. ✅ Aluno atinge limite de voz - modal de recarga aparece
5. ✅ Aluno compra recarga - minutos adicionados ao saldo
6. ✅ Aluno usa saldo extra - consome primeiro do limite mensal, depois do extra
7. ✅ Novo usuário não vinculado - recebe modo demo (3 interações)
8. ✅ Modo demo esgotado - bloqueado com mensagem
9. ✅ Reset mensal - contadores resetam no início do mês
10. ✅ Academia inativa - alunos bloqueados

---

## ⚠️ 8. BREAKING CHANGES

### Campos Removidos (Deprecated):
- `trial_active` - Usar `modo_demo`
- `trial_expires_at` - Não mais necessário
- `trial_voice_total_seconds` - Usar `uso_voz_minutos` + `saldo_voz_extra`
- `trial_photo_analysis_count` - Usar `uso_imagem`
- `trial_meal_plan_count` - Usar `uso_texto`
- `ai_subscription_status` - Usar verificação direta de limites

### Serviços Deprecated:
- `services/aiAccessService.ts` - Usar `services/novoAiAccessService.ts`
- `services/trialLimitsService.ts` - Lógica integrada em `academiaLimitsService.ts`
- `services/trialAccessService.ts` - Substituído por modo demo

---

## 📝 9. PRÓXIMOS PASSOS

1. **Executar migration SQL** no Supabase
2. **Atualizar serviços de chamada IA** conforme guia
3. **Integrar componentes** no frontend
4. **Configurar webhook** de pagamento para recargas
5. **Testar fluxo completo** de uso e recarga
6. **Remover código antigo** de trial (após testes)

---

## 🆘 10. SUPORTE

Se encontrar problemas:
1. Verificar logs do Supabase (funções RPC)
2. Verificar logs do frontend (console do navegador)
3. Consultar documentação das funções SQL criadas
4. Verificar se migration foi executada corretamente
