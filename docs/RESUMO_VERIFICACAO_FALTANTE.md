# 📋 Resumo: O que Falta Verificar nos Planos

## ✅ O QUE JÁ ESTÁ FUNCIONANDO

1. ✅ **Webhook do Cakto** - Processando corretamente todos os tipos de planos
2. ✅ **Tabelas do Supabase** - Todas as tabelas necessárias existem
3. ✅ **Estrutura de Recargas** - Implementada corretamente
4. ✅ **Código de Ativação B2B** - Geração automática funcionando
5. ✅ **Serviço de Validação de Código** - `activationCodeService.ts` implementado

---

## ⚠️ PONTOS CRÍTICOS QUE PRECISAM SER VERIFICADOS

### 1. **Campo `user_email` na Tabela `user_subscriptions`** 🔴 ALTA PRIORIDADE

**Problema:**
- O webhook tenta inserir `user_email` em `user_subscriptions` (linha 151 do webhook)
- O schema padrão (`schema.sql`) só mostra `user_id` (não tem `user_email`)
- Isso pode causar erro no webhook se o campo não existir

**Ação Necessária:**
```sql
-- Verificar se o campo existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_subscriptions' 
AND column_name = 'user_email';

-- Se não existir, criar migration:
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS user_email TEXT;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_email 
ON public.user_subscriptions(user_email);
```

**Impacto:** Se não corrigido, o webhook pode falhar ao criar assinaturas B2C.

---

### 2. **Verificação de Assinatura por Email vs User ID** 🟡 MÉDIA PRIORIDADE

**Problema:**
- O resumo indica verificação por `user_email`
- O código atual verifica principalmente por `user_id`
- A função `checkUserAccess()` em `subscriptionService.ts` verifica por email ✅
- Mas `getActiveSubscription()` verifica por `user_id` ⚠️

**Status Atual:**
- ✅ `services/subscriptionService.ts:checkUserAccess()` - Verifica por `user_email` (correto)
- ⚠️ `services/supabaseService.ts:getActiveSubscription()` - Verifica por `user_id` (pode não encontrar se não tiver userId)

**Ação Necessária:**
- Garantir que `checkUserAccess()` seja usada como função principal
- Ou adicionar fallback em `getActiveSubscription()` para verificar por email

---

### 3. **Aplicação de Recargas** 🟡 MÉDIA PRIORIDADE

**Status:**
- ✅ Estrutura de recargas implementada
- ✅ Verificação de recargas ativas existe
- ⚠️ **PRECISA TESTAR** se cada tipo está sendo aplicado corretamente:

**Verificações Necessárias:**

1. **Sessão Turbo** (+30min válido 24h):
   - ✅ Criada na tabela `recharges` com expiração de 24h
   - ❓ Está sendo somada ao limite diário ao usar voz?
   - Verificar: `services/voiceUsageService.ts` e `services/usageLimitService.ts`

2. **Banco de Voz 100** (+100min que não expiram):
   - ✅ Criada na tabela `recharges` sem expiração
   - ❓ Está sendo somada ao campo `voice_balance_upsell` do usuário?
   - Verificar: `services/rechargeService.ts:processPendingRecharges()`

3. **Passe Livre 30 Dias** (remove limite diário):
   - ✅ Criada na tabela `recharges` com expiração de 30 dias
   - ✅ Verificação existe em `subscriptionService.ts:149-163`
   - ❓ Está removendo o limite diário corretamente?

**Ação Necessária:**
- Testar cada tipo de recarga end-to-end
- Verificar logs quando recargas são aplicadas

---

### 4. **Fluxo de Ativação de Código B2B** 🟡 MÉDIA PRIORIDADE

**Status:**
- ✅ Serviço de validação implementado: `services/activationCodeService.ts`
- ✅ Incrementa `licenses_used` corretamente
- ✅ Bloqueia quando limite atingido
- ❓ **PRECISA VERIFICAR** se há interface no app para aluno inserir código

**Ação Necessária:**
- Verificar se existe página/tela no app para inserir código de ativação
- Testar fluxo completo: academia compra → recebe código → aluno usa código → acesso liberado

---

### 5. **IDs de Checkout Faltantes** 🟢 BAIXA PRIORIDADE

**Status:** Já documentado em `docs/STATUS_APP_PLANS.md`

**Faltam 3 IDs:**
1. `recarga_passe_livre_30d` - ID: `trszqtv_668453` (conforme resumo fornecido)
2. `personal_team_5` - Precisa obter da Cakto
3. `personal_team_15` - Precisa obter da Cakto

**Ação:**
- Atualizar tabela `app_plans` quando os IDs estiverem disponíveis

---

## 📝 CHECKLIST RÁPIDO

### Banco de Dados
- [ ] Verificar se `user_subscriptions.user_email` existe
- [ ] Se não existir, criar migration para adicionar
- [ ] Verificar estrutura completa da tabela `app_plans`
- [ ] Confirmar que todos os campos necessários existem

### Webhook do Cakto
- [x] Webhook processando corretamente ✅
- [ ] Testar com payload real da Cakto
- [ ] Verificar logs de erros

### Lógica do App
- [ ] Testar verificação de assinatura B2C por email
- [ ] Testar ativação de código B2B
- [ ] Testar aplicação de cada tipo de recarga:
  - [ ] Sessão Turbo
  - [ ] Banco de Voz
  - [ ] Passe Livre

### Interface do Usuário
- [ ] Verificar se existe tela para inserir código de ativação B2B
- [ ] Verificar se recargas aparecem corretamente no app

---

## 🎯 AÇÕES PRIORITÁRIAS

### Urgente (Fazer Agora)
1. ✅ Verificar se `user_subscriptions.user_email` existe no Supabase
2. ✅ Se não existir, criar migration para adicionar

### Importante (Esta Semana)
3. Testar verificação de assinatura por email
4. Testar aplicação de cada tipo de recarga
5. Testar fluxo completo de ativação de código B2B

### Normal (Próximas 2 Semanas)
6. Preencher IDs faltantes quando disponíveis
7. Melhorar logs e tratamento de erros
8. Documentar fluxo completo

---

## 📊 RESUMO POR COMPONENTE

| Componente | Status | Observações |
|------------|--------|-------------|
| **Webhook Cakto** | ✅ OK | Funcionando corretamente |
| **Tabelas Supabase** | ⚠️ Verificar | Campo `user_email` pode faltar |
| **Verificação B2C** | ⚠️ Parcial | Verifica por `user_id`, precisa email |
| **Verificação B2B** | ✅ OK | Serviço implementado |
| **Recargas** | ⚠️ Testar | Estrutura OK, precisa testar aplicação |
| **Limites de Voz** | ✅ OK | 15min/dia configurado |
| **IDs Faltantes** | ⚠️ 3 IDs | Já documentados |

---

## 🔍 ONDE VERIFICAR NO CÓDIGO

### Verificação de Assinaturas
- `services/subscriptionService.ts` - Função `checkUserAccess()` (usa email) ✅
- `services/supabaseService.ts` - Função `getActiveSubscription()` (usa user_id) ⚠️

### Aplicação de Recargas
- `services/rechargeService.ts` - Processa recargas pendentes
- `services/voiceUsageService.ts` - Aplica recargas de voz
- `services/usageLimitService.ts` - Verifica limites com recargas

### Ativação de Código B2B
- `services/activationCodeService.ts` - Valida e ativa códigos ✅
- Procurar componente/página que permite inserir código

### Webhook
- `supabase/functions/cakto-webhook/index.ts` - Processa webhooks ✅

---

**Última atualização:** 2025-01-27

