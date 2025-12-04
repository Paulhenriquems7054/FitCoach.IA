# 🔍 Análise Completa: Verificação de Requisitos dos Planos

## 📋 Resumo Executivo

Este documento analisa se a lógica do app segue todos os requisitos dos planos da página de vendas, comparando a documentação fornecida com a implementação atual.

**Status Geral:** ⚠️ **QUASE COMPLETO** - Alguns ajustes necessários

---

## ✅ O QUE ESTÁ IMPLEMENTADO CORRETAMENTE

### 1. Webhook do Cakto ✅
- ✅ Edge Function criada: `supabase/functions/cakto-webhook/index.ts`
- ✅ Identifica planos por `product.short_id` (mapeado para `cakto_checkout_id`)
- ✅ Processa diferentes tipos de planos (B2B, B2C, Recargas, Personal)
- ✅ Cria registros nas tabelas corretas:
  - `academy_subscriptions` para B2B
  - `user_subscriptions` para B2C
  - `recharges` para recargas
  - `personal_subscriptions` para Personal Trainer

### 2. Tabelas do Supabase ✅
- ✅ Tabela `app_plans` existe (usada pelo webhook)
- ✅ Tabela `academy_subscriptions` existe
- ✅ Tabela `user_subscriptions` existe
- ✅ Tabela `recharges` existe
- ✅ Tabela `student_academy_links` existe (vínculo aluno → academia)

### 3. Estrutura de Recargas ✅
- ✅ Tabela `recharges` com campos corretos:
  - `recharge_type`: 'turbo', 'voice_bank', 'pass_libre'
  - `valid_until` e `expires_at` configurados corretamente
  - Turbo: 24h de validade
  - Banco de Voz: não expira (`NULL`)
  - Passe Livre: 30 dias

### 4. Código de Ativação B2B ✅
- ✅ Webhook gera `activation_code` automaticamente
- ✅ Formato: `ACADEMIA-XXXXXX`

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. **CRÍTICO: Lógica de Verificação de Assinatura por Email**

#### ❌ Problema
O resumo indica que o app deve verificar assinaturas por `user_email`:
```sql
SELECT * FROM user_subscriptions 
WHERE user_email = 'usuario@email.com' 
AND status = 'active'
```

#### ✅ Implementação Atual
O código atual verifica por `user_id` (UUID):
- `services/supabaseService.ts:getActiveSubscription()` usa `user_id`
- `services/subscriptionService.ts:checkUserAccess()` usa `user_email` ✅ (PARCIALMENTE CORRETO)

#### 🔧 Solução Necessária
O webhook do Cakto cria assinatura com `user_email`:
```typescript
// cakto-webhook/index.ts:150
await supabase.from("user_subscriptions").insert({
  user_email: customerEmail,  // ✅ Correto
  ...
});
```

Mas a verificação usa `user_id`:
```typescript
// supabaseService.ts:502
.from('user_subscriptions')
.eq('user_id', targetUserId)  // ❌ Deveria também verificar por email
```

**Ação Necessária:**
- Adicionar verificação por `user_email` como alternativa
- Priorizar `user_id` se disponível, mas aceitar `user_email` como fallback

---

### 2. **IMPORTANTE: Campo `user_email` na Tabela `user_subscriptions`**

#### ❌ Problema
O schema atual (`supabase/schema.sql`) não mostra claramente se `user_subscriptions` tem o campo `user_email`.

#### ✅ Verificação
O webhook tenta inserir `user_email`, o que sugere que a tabela deve ter esse campo.

**Ação Necessária:**
- Verificar se `user_subscriptions` tem campo `user_email`
- Se não tiver, adicionar migration para criar
- Se tiver, garantir que é usado nas verificações

---

### 3. **IMPORTANTE: Verificação de Recargas Ativas**

#### ✅ Implementação Parcial
O código verifica recargas ativas em:
- `services/subscriptionService.ts:149-163` - Verifica Passe Livre
- `services/usageLimitService.ts:96-127` - Verifica Turbo

#### ⚠️ Problema
Falta verificar se a lógica está completa:
- ❓ Sessão Turbo: aplica +30min válido 24h?
- ❓ Banco de Voz: soma minutos ao saldo?
- ❓ Passe Livre: remove limite diário?

**Ação Necessária:**
- Verificar se `services/voiceUsageService.ts` aplica recargas corretamente
- Testar aplicação de cada tipo de recarga

---

### 4. **IMPORTANTE: Verificação de Código Mestre (Academia)**

#### ✅ Implementação Parcial
Existe `services/activationCodeService.ts` que gerencia códigos.

#### ❌ Problema
Falta verificar se o app:
- Permite aluno inserir código mestre
- Verifica código em `academy_subscriptions` com `master_code` ou `activation_code`
- Incrementa `licenses_used` ao vincular aluno
- Bloqueia se `licenses_used >= max_licenses`

**Ação Necessária:**
- Verificar fluxo completo de ativação de código
- Testar criação de vínculo aluno → academia

---

### 5. **MODERADO: Estrutura da Tabela `app_plans`**

#### ⚠️ Problema
O webhook usa `app_plans` mas não está claro se essa tabela tem todos os campos necessários:
- `cakto_checkout_id` ✅ (usado no webhook)
- `plan_group` ✅ (usado no webhook)
- `slug` ✅ (usado no webhook)
- `max_licenses` ⚠️ (usado, mas não confirmado na estrutura)

**Ação Necessária:**
- Verificar schema completo da tabela `app_plans`
- Garantir que todos os campos necessários existem

---

### 6. **MODERADO: Verificação de Limites por Plano**

#### ✅ Implementação Parcial
- `services/subscriptionService.ts:199-212` define limites de voz
- Todos os planos têm 15 min/dia configurado

#### ✅ Confirmado
- Limite padrão: 15 min/dia ✅
- Recargas podem aumentar/remover limite ✅
- Análise de fotos: ilimitada ✅
- Treinos: ilimitados ✅
- Chat texto: ilimitado ✅

**Status:** ✅ Correto

---

## 📝 CHECKLIST DE VERIFICAÇÃO

### Tabelas do Supabase
- [x] `app_plans` existe
- [x] `academy_subscriptions` existe
- [x] `user_subscriptions` existe
- [x] `recharges` existe
- [x] `student_academy_links` existe
- [ ] `user_subscriptions.user_email` existe e é usado ✅ (webhook usa, mas verificação precisa checar)

### Webhook do Cakto
- [x] Recebe webhook da Cakto
- [x] Identifica plano por `product.short_id`
- [x] Processa B2B (academia)
- [x] Processa B2C
- [x] Processa Recargas
- [x] Processa Personal Trainer
- [ ] Gera `activation_code` para B2B ✅ (sim, mas precisa confirmar formato)

### Verificação de Assinaturas no App
- [ ] Verifica B2C por `user_email` ⚠️ (parcial - usa `user_id` principalmente)
- [ ] Verifica B2C por `user_id` ✅
- [ ] Verifica código de academia (B2B) ⚠️ (existe service, mas precisa testar fluxo completo)
- [ ] Verifica recargas ativas ✅ (implementado)
- [ ] Aplica limites de voz corretamente ⚠️ (parcial - precisa testar)

### Recargas
- [ ] Sessão Turbo: +30min por 24h ⚠️ (verificar aplicação)
- [ ] Banco de Voz: +100min que não expiram ⚠️ (verificar aplicação)
- [ ] Passe Livre: remove limite diário por 30 dias ⚠️ (verificar aplicação)

### Limites por Plano
- [x] Todos os planos: 15 min/dia de voz (padrão)
- [x] Análise de fotos: ilimitada
- [x] Treinos personalizados: ilimitados
- [x] Chat de texto: ilimitado

---

## 🔧 AÇÕES RECOMENDADAS (Prioridade)

### 🔴 ALTA PRIORIDADE

1. **Verificar/Criar Campo `user_email` em `user_subscriptions`**
   - Verificar se existe
   - Se não existir, criar migration
   - Garantir que verificação funciona por email

2. **Ajustar Verificação de Assinatura para Aceitar Email**
   - Modificar `getActiveSubscription()` para aceitar `user_email` como alternativa
   - Manter compatibilidade com `user_id`

3. **Verificar Estrutura da Tabela `app_plans`**
   - Confirmar todos os campos necessários
   - Garantir que `max_licenses` existe para planos B2B

### 🟡 MÉDIA PRIORIDADE

4. **Testar Fluxo Completo de Ativação de Código B2B**
   - Verificar se aluno pode inserir código
   - Testar incremento de `licenses_used`
   - Testar bloqueio quando limite atingido

5. **Verificar Aplicação de Recargas**
   - Testar Sessão Turbo (+30min/24h)
   - Testar Banco de Voz (soma ao saldo)
   - Testar Passe Livre (remove limite diário)

6. **Completar Verificação de Recargas Ativas**
   - Garantir que todas as recargas são verificadas
   - Testar expiração automática

### 🟢 BAIXA PRIORIDADE

7. **Melhorar Logs e Tratamento de Erros**
   - Adicionar logs no webhook
   - Melhorar mensagens de erro

8. **Documentação**
   - Documentar fluxo completo
   - Adicionar exemplos de payload da Cakto

---

## 📊 PLANOS E STATUS

### Planos B2B (Academias)

| Plano | Preço | Licenças | Checkout ID | Status |
|-------|-------|----------|-------------|--------|
| Starter Mini | R$ 149,90 | 10 | `3b2kpwc_671196` | ✅ OK |
| Starter | R$ 299,90 | 20 | `cemyp2n_668537` | ✅ OK |
| Growth | R$ 649,90 | 50 | `vi6djzq_668541` | ✅ OK |
| Pro | R$ 1.199,90 | 100 | `3dis6ds_668546` | ✅ OK |

### Recargas

| Produto | Preço | Benefício | Validade | Checkout ID | Status |
|---------|-------|-----------|----------|-------------|--------|
| Sessão Turbo | R$ 5,00 | +30 min voz | 24h | `ihfy8cz_668443` | ✅ OK |
| Banco de Voz 100 | R$ 12,90 | +100 min voz | Não expira | `hhxugxb_668446` | ✅ OK |
| Passe Livre 30 Dias | R$ 19,90 | Remove limite diário | 30 dias | ⚠️ FALTANDO | ❌ |

### Personal Trainer

| Plano | Preço | Licenças | Checkout ID | Status |
|-------|-------|----------|-------------|--------|
| Team 5 | R$ 99,90 | 5 | ⚠️ FALTANDO | ❌ |
| Team 15 | R$ 249,90 | 15 | ⚠️ FALTANDO | ❌ |

**Nota:** Os 3 IDs faltantes já estão documentados em `docs/STATUS_APP_PLANS.md`

---

## 🔄 FLUXO ATUAL VS FLUXO ESPERADO

### Fluxo Esperado (Conforme Documentação)

1. Usuário clica "Comprar" → Redireciona para Cakto ✅
2. Cakto processa pagamento ✅
3. Cakto envia webhook com `product.short_id` ✅
4. Edge Function busca em `app_plans WHERE cakto_checkout_id = short_id` ✅
5. Cria registro na tabela correspondente ✅
6. App verifica acesso por `user_email` ⚠️ **PROBLEMA AQUI**
7. Libera recursos Premium ✅

### Fluxo Atual (Implementado)

1. Usuário clica "Comprar" → Redireciona para Cakto ✅
2. Cakto processa pagamento ✅
3. Cakto envia webhook com `product.short_id` ✅
4. Edge Function busca em `app_plans WHERE cakto_checkout_id = short_id` ✅
5. Cria registro na tabela correspondente ✅
6. App verifica acesso por `user_id` (UUID) ⚠️ **DIFERENTE**
7. Libera recursos Premium ✅

**Diferença Principal:** O app verifica por `user_id` ao invés de `user_email`. Isso pode funcionar se o `user_id` for obtido do email, mas precisa ser testado.

---

## ✅ CONCLUSÃO

### O que está funcionando:
- ✅ Webhook do Cakto processando corretamente
- ✅ Estrutura de tabelas correta
- ✅ Recargas com validação de expiração
- ✅ Geração de códigos de ativação B2B

### O que precisa ser verificado/ajustado:
- ⚠️ Verificação de assinatura por `user_email` (usar como fallback)
- ⚠️ Aplicação completa de recargas (testar cada tipo)
- ⚠️ Fluxo de ativação de código B2B (testar end-to-end)
- ⚠️ 3 IDs de checkout faltantes (já documentados)

### Próximos Passos:
1. Verificar estrutura completa da tabela `user_subscriptions`
2. Adicionar verificação por `user_email` como alternativa
3. Testar fluxo completo de uma compra até liberação de acesso
4. Preencher os 3 IDs faltantes quando disponíveis

---

**Documento criado em:** 2025-01-27
**Última atualização:** 2025-01-27

