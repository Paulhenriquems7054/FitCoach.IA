# ✅ Checklist de Implementação - Lógica de Planos e Assinaturas

**Data de Atualização:** 2025-01-27  
**Status Geral:** 🟢 **Implementação em Progresso** (85% completo)

---

## Backend (Supabase)

### Tabelas do Banco de Dados

- [x] Criar tabela `user_subscriptions` com todos os campos necessários
  - ✅ Campos: `user_id`, `plan_id`, `status`, `billing_cycle`, `current_period_start`, `current_period_end`
  - ✅ Suporte a cancelamento: `cancel_at_period_end`, `canceled_at`
  - ✅ Integração Cakto: `payment_provider`, `payment_method_id`

- [x] Criar tabela `subscription_plans` para planos disponíveis
  - ✅ Campos: `name`, `display_name`, `price_monthly`, `price_yearly`, `limits`, `features`
  - ✅ Categorias: B2C, B2B, Personal

- [x] Criar tabela `recharges` para recargas one-time
  - ✅ Campos: `recharge_type`, `quantity`, `valid_until`, `expires_at`, `status`
  - ✅ Tipos: `turbo`, `voice_bank`, `pass_libre`
  - ✅ Integração Cakto: `cakto_transaction_id`, `cakto_checkout_id`

- [x] Criar tabela `activation_codes` para códigos B2B/Personais
  - ✅ Campos: `code`, `type`, `company_id`, `personal_trainer_id`, `plan_type`
  - ✅ Controle de licenças: `licenses_total`, `licenses_used`
  - ✅ Validade: `expires_at`, `is_active`

- [x] Campos de controle de voz na tabela `users`
  - ✅ `voice_daily_limit_seconds` - Limite diário (padrão: 900 = 15 min)
  - ✅ `voice_used_today_seconds` - Minutos usados hoje
  - ✅ `voice_balance_upsell` - Saldo de minutos comprados
  - ✅ `last_usage_date` - Para reset diário

- [ ] Criar tabela `user_voice_usage` separada (opcional - atualmente usando campos em `users`)
  - ⚠️ **Nota:** O app usa campos na tabela `users` ao invés de tabela separada

- [x] Configurar RLS (Row Level Security) nas tabelas
  - ✅ Políticas básicas implementadas

- [x] Criar índices para performance
  - ✅ Índices em `user_id`, `status`, `recharge_type`, `code`, etc.

### Webhooks e Edge Functions

- [ ] Configurar webhooks da Cakto para atualizar assinaturas
  - ⚠️ **Pendente:** Configuração no painel da Cakto (URL: `https://[project].supabase.co/functions/v1/cakto-webhook`)

- [x] Implementar Edge Function para processar webhooks
  - ✅ Função `cakto-webhook` criada em `supabase/functions/cakto-webhook/index.ts`
  - ✅ Suporta eventos: `subscription.paid`, `subscription.canceled`, `payment.paid`, `payment.failed`
  - ✅ Processa recargas automaticamente
  - ⚠️ **Pendente:** Deploy no Supabase e configuração de variáveis de ambiente

- [x] Criar tabela `cakto_webhooks` para log de webhooks
  - ✅ Tabela criada com campos necessários

---

## Frontend (App)

### Serviços e Lógica

- [x] Implementar `services/subscriptionService.ts`
  - ✅ `checkSubscriptionStatus()` - Verificação completa com cálculo de recursos
  - ✅ `getFreeTierFeatures()` - Features do plano gratuito
  - ✅ `getDailyResetTime()` - Reset diário de limites

- [x] Implementar `services/rechargeService.ts`
  - ✅ `applyRecharge()` - Aplica recarga ao usuário
  - ✅ `getCurrentVoiceBank()` - Obtém saldo atual do banco de voz
  - ✅ `processPendingRecharges()` - Processa recargas pendentes
  - ✅ Lógica para todos os tipos: `turbo`, `bank_100`, `unlimited_30`

- [x] Implementar `services/voiceUsageService.ts`
  - ✅ `useVoiceMinutes()` - Registra uso de minutos
  - ✅ Reset diário automático
  - ✅ Verificação de Passe Livre
  - ✅ Priorização: limite diário → banco de voz

- [x] Implementar `services/activationCodeService.ts`
  - ✅ `validateActivationCode()` - Valida código de ativação
  - ✅ `activateUserWithCode()` - Ativa usuário com código

- [x] Implementar `services/renewalService.ts`
  - ✅ `checkAndRenewSubscriptions()` - Renovação automática
  - ✅ `calculateNextBillingDate()` - Cálculo de próxima cobrança

- [x] Implementar `services/cancellationService.ts`
  - ✅ `cancelSubscription()` - Cancela assinatura
  - ✅ Integração com Cakto (placeholder)
  - ✅ Cálculo de reembolso proporcional (placeholder)

- [x] Implementar `utils/featureValidation.ts`
  - ✅ `validateFeatureAccess()` - Valida acesso a features
  - ✅ `getAccessMessage()` - Mensagens de acesso por status

- [x] Implementar `utils/quotas.ts`
  - ✅ `getQuotaLimits()` - Limites de quota por plano
  - ✅ Interface `QuotaLimits`

### Hooks e Componentes

- [x] Implementar hook `useSubscription`
  - ✅ Cache de 5 minutos
  - ✅ Refresh automático a cada 5 minutos
  - ✅ Função `canAccess()` para verificar acesso a features
  - ✅ Função `getRemainingMinutes()` - Retorna minutos restantes
  - ✅ Função `refresh()` - Força atualização
  - ✅ Estados: `status`, `loading`, `error`, `isPremium`, `planType`

- [x] Criar componente `ProtectedFeature`
  - ✅ Proteção de features premium
  - ✅ Fallback customizado
  - ✅ Prompt de upgrade configurável

- [x] Criar tela `ActivationScreen`
  - ✅ Entrada de código de ativação
  - ✅ Validação e ativação
  - ✅ Feedback de sucesso/erro

- [x] Criar tela `SubscriptionStatusScreen`
  - ✅ Exibição de status da assinatura
  - ✅ Informações de minutos de voz
  - ✅ Passe Livre ativo
  - ✅ Botões de ação

### Integrações

- [x] Implementar verificação de assinatura em telas premium
  - ✅ `AnalyzerPage` - Protegida com `ProtectedFeature`
  - ✅ `AnalysisPage` - Protegida com `ProtectedFeature` (workoutAnalysis)
  - ✅ `GeneratorPage` - Protegida com `ProtectedFeature` (customWorkouts)
  - ✅ `ChatbotPopup` - Chat de voz protegido com verificação de acesso

- [x] Implementar contador de minutos de voz em tempo real
  - ✅ Componente `VoiceMinutesCounter` criado
  - ✅ Integrado no `ChatbotPopup`
  - ✅ Atualização a cada 10 segundos durante uso
  - ✅ Alerta quando minutos estão baixos

- [ ] Adicionar notificações quando limite estiver próximo
  - ⚠️ **Pendente:** Sistema de notificações (toast já implementado)

- [x] Implementar fluxo de upgrade/downgrade
  - ✅ Serviço `upgradeDowngradeService.ts` criado
  - ✅ Página `ChangePlanPage.tsx` criada
  - ✅ Lógica de upgrade (mantém plano até fim do período)
  - ✅ Lógica de downgrade (mudança imediata)

- [x] Adicionar deep links para página de vendas
  - ✅ Hash routing: `#/premium`, `#/activation`, `#/subscription-status`, `#/change-plan`

---

## Testes

### Testes Funcionais

- [x] Estrutura de testes criada
  - ✅ Arquivo `tests/subscription.test.ts` criado
  - ✅ Testes para: `checkSubscriptionStatus`, `useVoiceMinutes`, `applyRecharge`, `validateActivationCode`, `ProtectedFeature`
  - ⚠️ **Pendente:** Implementar mocks e executar testes

- [ ] Testar verificação de assinatura ativa
  - ⚠️ **Pendente:** Implementar testes com mocks

- [ ] Testar bloqueio de acesso quando expirada
  - ⚠️ **Pendente:** Implementar testes com mocks

- [ ] Testar aplicação de recargas
  - ⚠️ **Pendente:** Implementar testes com mocks

- [ ] Testar ativação de códigos B2B/Personais
  - ⚠️ **Pendente:** Implementar testes com mocks

- [ ] Testar renovação automática
  - ⚠️ **Pendente:** Testes automatizados (requer cron job)

- [ ] Testar cancelamento
  - ⚠️ **Pendente:** Implementar testes com mocks

- [ ] Testar limites de quotas
  - ⚠️ **Pendente:** Implementar testes com mocks

- [ ] Testar reset diário de minutos
  - ⚠️ **Pendente:** Implementar testes com mocks

---

## Documentação

- [x] Documentação de lógica de planos (markdown)
- [x] Exemplos de código TypeScript/React
- [x] Checklist de implementação
- [ ] Documentação de API (webhooks)
- [ ] Guia de testes

---

## Próximos Passos Prioritários

1. ✅ **Integrar `ProtectedFeature` em todas as telas premium** - CONCLUÍDO
   - ✅ AnalysisPage
   - ✅ GeneratorPage
   - ✅ ChatbotPopup (chat de voz)

2. ✅ **Implementar contador de minutos em tempo real** - CONCLUÍDO
   - ✅ Componente `VoiceMinutesCounter` criado
   - ✅ Integrado no ChatbotPopup
   - ✅ Atualização automática durante uso

3. ⚠️ **Configurar webhooks da Cakto** - PARCIALMENTE CONCLUÍDO
   - ✅ Edge Function criada
   - ⚠️ **Pendente:** Deploy no Supabase e configuração no painel da Cakto

4. ⚠️ **Criar testes automatizados** - ESTRUTURA CRIADA
   - ✅ Estrutura de testes criada
   - ⚠️ **Pendente:** Implementar mocks e executar testes

5. ✅ **Implementar fluxo de upgrade/downgrade** - CONCLUÍDO
   - ✅ Serviço `upgradeDowngradeService.ts` criado
   - ✅ Página `ChangePlanPage.tsx` criada
   - ✅ Lógica de upgrade/downgrade implementada

---

## Referências

- **Página de Vendas:** `pages/PremiumPage.tsx`
- **Documentação Supabase:** Ver migrations em `supabase/`
- **IDs de Produtos Cakto:** Ver seção Tipos de Planos e Assinaturas
- **Exemplos de Uso:** `EXEMPLO_USO_PROTECTED_FEATURE.md`

---

**Última Atualização:** 2025-01-27  
**Versão:** 1.0.0

