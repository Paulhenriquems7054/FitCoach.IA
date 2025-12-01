# 📊 Relatório de Verificação - Lógica de Planos e Assinaturas

**Data:** 2025-01-27  
**Status:** ⚠️ **Implementação Parcial**

---

## ✅ O QUE ESTÁ IMPLEMENTADO

### 1. **Estrutura de Banco de Dados (Supabase)**

#### ✅ Tabelas Existentes:
- **`subscription_plans`** - Planos de assinatura (B2C, B2B, Personal)
  - ✅ Todos os planos cadastrados conforme documentação
  - ✅ Campos: `name`, `display_name`, `price_monthly`, `price_yearly`, `limits`, `features`, `plan_category`
  
- **`user_subscriptions`** - Assinaturas dos usuários
  - ✅ Campos: `user_id`, `plan_id`, `status`, `billing_cycle`, `current_period_start`, `current_period_end`
  - ✅ Suporte a cancelamento (`cancel_at_period_end`, `canceled_at`)
  
- **`recharges`** - Recargas e upgrades
  - ✅ Tabela criada com campos: `recharge_type`, `quantity`, `valid_until`, `expires_at`, `status`
  - ✅ Tipos: `turbo`, `voice_bank`, `pass_libre`
  - ✅ Integração com Cakto (`cakto_transaction_id`, `cakto_checkout_id`)

- **`users`** - Campos de controle de plano
  - ✅ `plan_type` - Tipo de plano atual
  - ✅ `subscription_status` - Status da assinatura
  - ✅ `expiry_date` - Data de expiração
  - ✅ `voice_daily_limit_seconds` - Limite diário de voz (padrão: 900 = 15 min)
  - ✅ `voice_used_today_seconds` - Minutos usados hoje
  - ✅ `voice_balance_upsell` - Saldo de minutos comprados
  - ✅ `last_usage_date` - Para reset diário

### 2. **Serviços e Hooks**

#### ✅ `services/supabaseService.ts`
- ✅ `getActiveSubscription()` - Busca assinatura ativa
- ✅ `getSubscriptionPlans()` - Lista planos disponíveis
- ✅ `createSubscription()` - Cria nova assinatura
- ✅ `cancelSubscription()` - Cancela assinatura
- ✅ `checkFeatureAccess()` - Verifica acesso a feature
- ✅ `checkUsageLimit()` - Verifica limites de uso

#### ✅ `hooks/usePremiumAccess.ts`
- ✅ Verifica se usuário é Premium
- ✅ Função `requirePremium()` para verificar acesso
- ✅ Funções auxiliares: `canGenerateReport()`, `canAnalyzePhoto()`
- ⚠️ **LIMITAÇÃO:** Não tem cache, não tem refresh automático, não verifica minutos de voz

#### ✅ `components/ui/PremiumGate.tsx`
- ✅ Componente para proteger features premium
- ✅ Mostra mensagem e botão de upgrade quando bloqueado
- ⚠️ **DIFERENÇA:** Não é exatamente o `ProtectedFeature` do documento, mas funcionalidade similar

### 3. **Páginas e Componentes**

#### ✅ `pages/PremiumPage.tsx`
- ✅ Exibe planos disponíveis
- ✅ Integração com checkout (Cakto)
- ✅ Modal de cancelamento de assinatura

---

## ❌ O QUE FALTA IMPLEMENTAR

### 1. **Sistema de Verificação de Assinaturas Completo**

#### ❌ `services/subscriptionService.ts` (NÃO EXISTE)
Falta criar o serviço completo conforme documentação:
- ❌ `checkSubscriptionStatus()` - Verificação completa com cache
- ❌ `getPlanLimits()` - Limites por tipo de plano
- ❌ `getFreeTierFeatures()` - Features do plano gratuito
- ❌ `getDailyResetTime()` - Reset diário de limites

**Status Atual:** Existe apenas `getActiveSubscription()` em `supabaseService.ts`, mas não tem toda a lógica de verificação de recursos disponíveis.

### 2. **Hook `useSubscription` Completo**

#### ❌ `hooks/useSubscription.ts` (NÃO EXISTE)
Falta criar o hook completo conforme documentação:
- ❌ Cache de 5 minutos
- ❌ Refresh automático
- ❌ Função `canAccessFeature()` para cada feature específica
- ❌ Função `hasVoiceMinutesAvailable()` - Verifica minutos de voz
- ❌ Função `getRemainingVoiceMinutes()` - Retorna minutos restantes
- ❌ Função `refresh()` - Força atualização

**Status Atual:** Existe `usePremiumAccess`, mas é mais simples e não tem todas as funcionalidades.

### 3. **Sistema de Recargas**

#### ❌ `services/rechargeService.ts` (NÃO EXISTE)
Falta criar o serviço de recargas:
- ❌ `applyRecharge()` - Aplica recarga ao usuário
- ❌ `getCurrentVoiceBank()` - Obtém saldo atual do banco de voz
- ❌ Lógica para cada tipo de recarga:
  - ❌ `turbo` - Adiciona 30 min, expira em 24h
  - ❌ `bank_100` - Adiciona 100 min, não expira
  - ❌ `unlimited_30` - Remove limite diário por 30 dias

**Status Atual:** Tabela `recharges` existe, mas não há serviço para aplicar as recargas.

### 4. **Sistema de Controle de Minutos de Voz**

#### ❌ `services/voiceUsageService.ts` (NÃO EXISTE)
Falta criar o serviço de controle de uso de voz:
- ❌ `useVoiceMinutes()` - Registra uso de minutos
- ❌ Reset diário automático
- ❌ Verificação de Passe Livre (`unlimited_until`)
- ❌ Uso prioritário do limite diário (15 min)
- ❌ Uso do banco de voz quando limite diário esgota
- ❌ Retorno de minutos restantes

**Status Atual:** Campos existem no banco, mas não há lógica de uso.

### 5. **Sistema de Códigos de Ativação (B2B e Personais)**

#### ❌ Tabela `activation_codes` (NÃO EXISTE)
Falta criar a tabela e serviços:
- ❌ Tabela `activation_codes` com campos:
  - `code` - Código de ativação
  - `type` - 'b2b' ou 'personal'
  - `company_id` / `personal_trainer_id`
  - `plan_type` - Tipo de plano vinculado
  - `licenses_total` - Total de licenças
  - `licenses_used` - Licenças usadas
  - `expires_at` - Data de expiração
  - `is_active` - Se está ativo

#### ❌ `services/activationCodeService.ts` (NÃO EXISTE)
Falta criar o serviço:
- ❌ `validateActivationCode()` - Valida código
- ❌ `activateUserWithCode()` - Ativa usuário com código
- ❌ Verificação de licenças disponíveis
- ❌ Incremento de licenças usadas

#### ❌ `pages/ActivationScreen.tsx` (NÃO EXISTE)
Falta criar a tela de ativação:
- ❌ Input para código
- ❌ Validação e ativação
- ❌ Mensagens de erro/sucesso

**Status Atual:** Nenhuma implementação encontrada.

### 6. **Sistema de Renovação Automática**

#### ⚠️ `supabase/functions/check-subscription-renewals/index.ts` (EXISTE PARCIALMENTE)
- ✅ Edge Function existe
- ❌ Lógica completa de renovação não verificada
- ❌ Integração com Cakto para verificar pagamentos
- ❌ Atualização de `next_billing_date`
- ❌ Envio de emails de confirmação/falha

**Status Atual:** Função existe, mas precisa verificar se está completa.

### 7. **Componente `ProtectedFeature`**

#### ⚠️ `components/ui/PremiumGate.tsx` (EXISTE, MAS DIFERENTE)
- ✅ Funcionalidade similar existe
- ❌ Não tem suporte a `fallback` customizado
- ❌ Não tem verificação específica por feature (photoAnalysis, voiceChat, etc)
- ❌ Não integra com `useSubscription` completo

**Status Atual:** Existe `PremiumGate`, mas não é exatamente o `ProtectedFeature` do documento.

### 8. **Validações e Regras de Negócio**

#### ❌ `utils/featureValidation.ts` (NÃO EXISTE)
Falta criar:
- ❌ `validateFeatureAccess()` - Valida acesso a feature específica
- ❌ Mensagens de erro específicas por feature
- ❌ Verificação de minutos de voz disponíveis

#### ❌ `utils/quotas.ts` (NÃO EXISTE)
Falta criar:
- ❌ `getQuotaLimits()` - Retorna limites por tipo de plano
- ❌ Interface `QuotaLimits` com todos os limites

### 9. **Tela de Status de Assinatura**

#### ❌ `pages/SubscriptionStatusScreen.tsx` (NÃO EXISTE)
Falta criar tela completa:
- ❌ Exibir plano atual
- ❌ Status de minutos de voz (diário + banco)
- ❌ Passe Livre ativo (se houver)
- ❌ Botão para recarregar
- ❌ Botão para atualizar status

**Status Atual:** Não existe tela dedicada.

### 10. **Integração com Cakto**

#### ⚠️ Parcialmente Implementado
- ✅ Tabela `cakto_webhooks` existe
- ✅ Edge Function `cakto-webhook` existe
- ❌ Verificação completa de webhooks não verificada
- ❌ Sincronização de status de pagamento
- ❌ Atualização automática de assinaturas via webhook

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend (Supabase)

- [x] Tabela `subscription_plans` criada
- [x] Tabela `user_subscriptions` criada
- [x] Tabela `recharges` criada
- [ ] Tabela `activation_codes` criada
- [ ] Tabela `user_voice_usage` criada (ou campos na tabela `users`)
- [x] Campos de voz na tabela `users` (parcial)
- [ ] Função SQL `check_subscription_status` (se necessário)
- [ ] Função SQL `apply_recharge` (se necessário)
- [ ] Função SQL `use_voice_minutes` (se necessário)
- [x] Edge Function `check-subscription-renewals` (existe, precisa verificar)
- [x] Edge Function `cakto-webhook` (existe, precisa verificar)
- [ ] RLS configurado para todas as tabelas
- [ ] Índices para performance

### Frontend (App)

- [x] Hook `usePremiumAccess` básico
- [ ] Hook `useSubscription` completo (conforme documento)
- [x] Componente `PremiumGate` (similar a `ProtectedFeature`)
- [ ] Componente `ProtectedFeature` completo (conforme documento)
- [ ] Serviço `subscriptionService.ts` completo
- [ ] Serviço `rechargeService.ts`
- [ ] Serviço `voiceUsageService.ts`
- [ ] Serviço `activationCodeService.ts`
- [ ] Tela `ActivationScreen.tsx`
- [ ] Tela `SubscriptionStatusScreen.tsx`
- [ ] Integração de verificação em todas as telas premium
- [ ] Contador de minutos de voz em tempo real
- [ ] Notificações quando limite próximo
- [ ] Deep links para página de vendas

### Testes

- [ ] Testar verificação de assinatura ativa
- [ ] Testar bloqueio quando expirada
- [ ] Testar aplicação de recargas
- [ ] Testar ativação de códigos B2B/Personais
- [ ] Testar renovação automática
- [ ] Testar cancelamento
- [ ] Testar limites de quotas
- [ ] Testar reset diário de minutos

---

## 🎯 PRIORIDADES DE IMPLEMENTAÇÃO

### 🔴 ALTA PRIORIDADE (Crítico para funcionamento)

1. **Sistema de Verificação de Assinaturas Completo**
   - Criar `services/subscriptionService.ts` com `checkSubscriptionStatus()`
   - Criar hook `useSubscription` completo
   - Implementar cache e refresh automático

2. **Sistema de Controle de Minutos de Voz**
   - Criar `services/voiceUsageService.ts`
   - Implementar reset diário
   - Implementar uso de banco de voz
   - Verificar Passe Livre

3. **Sistema de Recargas**
   - Criar `services/rechargeService.ts`
   - Implementar aplicação de recargas
   - Integrar com webhook da Cakto

### 🟡 MÉDIA PRIORIDADE (Importante para B2B/Personais)

4. **Sistema de Códigos de Ativação**
   - Criar tabela `activation_codes`
   - Criar `services/activationCodeService.ts`
   - Criar tela `ActivationScreen.tsx`

5. **Componente `ProtectedFeature` Completo**
   - Melhorar `PremiumGate` ou criar novo componente
   - Integrar com `useSubscription` completo

### 🟢 BAIXA PRIORIDADE (Melhorias)

6. **Validações e Regras de Negócio**
   - Criar `utils/featureValidation.ts`
   - Criar `utils/quotas.ts`

7. **Tela de Status de Assinatura**
   - Criar `SubscriptionStatusScreen.tsx`

8. **Renovação Automática**
   - Verificar e completar Edge Function
   - Testar integração com Cakto

---

## 📝 OBSERVAÇÕES

1. **Estrutura Base Existe:** A estrutura básica está implementada (tabelas, campos, hooks básicos), mas falta a lógica completa conforme o documento.

2. **Diferenças de Implementação:** 
   - O app usa `PremiumGate` ao invés de `ProtectedFeature`
   - O hook `usePremiumAccess` é mais simples que o `useSubscription` do documento
   - Não há sistema de códigos de ativação

3. **Campos de Voz:** Os campos existem na tabela `users`, mas não há serviço para controlar o uso.

4. **Recargas:** A tabela existe, mas não há serviço para aplicar as recargas quando compradas.

5. **Códigos de Ativação:** Sistema completamente ausente - necessário para planos B2B e Personais.

---

## 🔗 ARQUIVOS RELEVANTES

### Implementados:
- `services/supabaseService.ts` - Serviços básicos de assinatura
- `hooks/usePremiumAccess.ts` - Hook básico de verificação
- `components/ui/PremiumGate.tsx` - Componente de proteção
- `pages/PremiumPage.tsx` - Página de planos
- `supabase/migration_planos_vendas_completa.sql` - Migração de planos
- `supabase/migration_criar_tabela_recharges.sql` - Migração de recargas

### Faltando:
- `services/subscriptionService.ts`
- `services/rechargeService.ts`
- `services/voiceUsageService.ts`
- `services/activationCodeService.ts`
- `hooks/useSubscription.ts`
- `pages/ActivationScreen.tsx`
- `pages/SubscriptionStatusScreen.tsx`
- `utils/featureValidation.ts`
- `utils/quotas.ts`
- `components/ProtectedFeature.tsx` (ou melhorar `PremiumGate`)

---

**Conclusão:** O app tem aproximadamente **40-50% da lógica de planos implementada**. A estrutura base está pronta, mas falta a implementação completa dos serviços, hooks e componentes conforme a documentação fornecida.

