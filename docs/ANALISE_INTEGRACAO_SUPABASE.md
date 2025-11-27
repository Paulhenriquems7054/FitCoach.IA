# 📊 Análise: Integração da Página de Vendas com Supabase

## ✅ O QUE ESTÁ FUNCIONANDO

### 1. **Estrutura de Tabelas no Supabase**
✅ **Tabela `subscription_plans`** existe e está correta
- Campos: `id`, `name`, `display_name`, `description`, `price_monthly`, `price_yearly`, `limits`, `features`, `is_active`, `is_visible`
- Estrutura compatível com a documentação

✅ **Tabela `user_subscriptions`** existe e está correta
- Campos: `id`, `user_id`, `plan_id`, `status`, `billing_cycle`, `current_period_start`, `current_period_end`
- Estrutura compatível com a documentação

✅ **Tabela `payments`** existe
- Armazena histórico de pagamentos
- Vinculada a `user_subscriptions`

### 2. **Integração Frontend → Supabase**
✅ **PremiumPage.tsx** está conectada ao Supabase
- Busca planos via `getSubscriptionPlans()` da tabela `subscription_plans`
- Verifica assinatura ativa via `getActiveSubscription()`
- Filtra apenas planos `is_active = true` e `is_visible = true`

✅ **CheckoutModal** implementado
- Modal para seleção de ciclo de faturamento (mensal/anual)
- Integração com Stripe (não Cakto diretamente)

### 3. **Webhook Cakto**
✅ **Edge Function `cakto-webhook`** existe
- Recebe webhooks do Cakto
- Processa pagamentos confirmados
- Cria usuários no Supabase Auth
- Cria assinaturas na tabela `user_subscriptions`
- Envia emails de acesso

---

## ❌ O QUE ESTÁ FALTANDO OU DIFERENTE

### 1. **Planos na Tabela `subscription_plans`**

**❌ PROBLEMA:** A documentação especifica planos específicos que NÃO estão cadastrados:

**Documentação espera:**
- **Plano Mensal** (R$ 34,90/mês) - Link: `zeygxve_668421`
- **Plano Anual VIP** (R$ 297,00/ano) - Link: `wvbkepi_668441`

**App atual mostra:**
- Planos genéricos: `basic`, `premium`, `enterprise`
- Preços e features hardcoded no código (não vêm do banco)

**AÇÃO NECESSÁRIA:**
```sql
-- Inserir planos conforme documentação
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, is_active, is_visible, features, limits)
VALUES 
  ('monthly', 'Plano Mensal', 'Para quem quer testar', 34.90, NULL, true, true, 
   '["Análise de Fotos Ilimitada", "Treinos Personalizados Ilimitados", "Chat de Texto Ilimitado", "15 min/dia de Consultoria de Voz"]'::jsonb,
   '{"voice_daily_limit_seconds": 900}'::jsonb),
   
  ('annual_vip', 'Plano Anual VIP', 'Recomendado - Economia de R$ 200,00', 34.53, 297.00, true, true,
   '["Análise de Fotos Ilimitada", "Treinos Personalizados Ilimitados", "Chat de Texto Ilimitado", "15 min/dia de Consultoria de Voz", "Acesso Imediato", "Garantia de Satisfação"]'::jsonb,
   '{"voice_daily_limit_seconds": 900}'::jsonb);
```

### 2. **Recargas/Upgrades**

**❌ PROBLEMA:** A documentação especifica 3 tipos de recarga que NÃO existem:

**Documentação espera:**
- **Sessão Turbo** (R$ 5,00 - +30 minutos, válido 24h) - Link: `ihfy8cz_668443`
- **Banco de Voz 100** (R$ 12,90 - +100 minutos, não expira) - Link: `hhxugxb_668446`
- **Passe Livre 30 Dias** (R$ 19,90 - remove limite diário por 30 dias) - Link: `trszqtv_668453`

**App atual:**
- ❌ Não existe página de recargas
- ❌ Não existe tabela `recharges` no Supabase
- ❌ Não existe lógica para aplicar recargas

**AÇÃO NECESSÁRIA:**
1. Criar tabela `recharges` conforme documentação (linhas 440-479)
2. Criar página `RechargePage.tsx` ou adicionar seção na `PremiumPage.tsx`
3. Atualizar webhook para processar recargas
4. Implementar lógica de aplicação de recargas (somar minutos, remover limite diário)

### 3. **Planos B2B (Academias)**

**❌ PROBLEMA:** A documentação especifica planos B2B que NÃO existem:

**Documentação espera:**
- **Pack Starter** (R$ 299,90/mês - 20 licenças) - Link: `cemyp2n_668537`
- **Pack Growth** (R$ 649,90/mês - 50 licenças) - Link: `vi6djzq_668541`
- **Pack Pro** (R$ 1.199,90/mês - 100 licenças) - Link: `3dis6ds_668546`

**App atual:**
- ❌ Não existe tabela `companies` no Supabase
- ❌ Não existe tabela `company_licenses` no Supabase
- ❌ Não existe página B2B
- ❌ Não existe sistema de códigos mestres

**AÇÃO NECESSÁRIA:**
1. Criar tabelas `companies` e `company_licenses` conforme documentação
2. Criar página B2B ou adicionar seção na `PremiumPage.tsx`
3. Implementar geração de códigos mestres
4. Atualizar webhook para processar pagamentos B2B

### 4. **Planos Personal Trainers**

**❌ PROBLEMA:** A documentação especifica planos para personais que NÃO existem:

**Documentação espera:**
- **Team 5** (R$ 99,90/mês - 5 licenças) - Link: `3dgheuc_666289`
- **Team 15** (R$ 249,90/mês - 15 licenças) - Link: `3etp85e_666303`

**App atual:**
- ❌ Não existe tabela `personal_trainers` no Supabase
- ❌ Não existe tabela `personal_licenses` no Supabase
- ❌ Não existe página para personais

**AÇÃO NECESSÁRIA:**
1. Criar tabelas `personal_trainers` e `personal_licenses` conforme documentação
2. Criar página para personais ou adicionar seção na `PremiumPage.tsx`
3. Implementar geração de códigos de equipe
4. Atualizar webhook para processar pagamentos de personais

### 5. **Mapeamento de Links Cakto no Webhook**

**❌ PROBLEMA:** O webhook atual não mapeia corretamente os links da documentação:

**Webhook atual mapeia:**
```typescript
const PAYMENT_LINK_TO_PLAN: Record<string, string> = {
  'https://pay.cakto.com.br/3bewmsy_665747': 'basic',
  'https://pay.cakto.com.br/8djcjc6': 'premium',
  'https://pay.cakto.com.br/35tdhxu': 'enterprise',
};
```

**Documentação espera:**
```typescript
const PAYMENT_LINK_TO_PLAN: Record<string, { type: string, plan?: string }> = {
  'zeygxve_668421': { type: 'subscription', plan: 'monthly' },
  'wvbkepi_668441': { type: 'subscription', plan: 'annual' },
  'cemyp2n_668537': { type: 'company', plan: 'starter' },
  'vi6djzq_668541': { type: 'company', plan: 'growth' },
  '3dis6ds_668546': { type: 'company', plan: 'pro' },
  '3dgheuc_666289': { type: 'personal', plan: 'team_5' },
  '3etp85e_666303': { type: 'personal', plan: 'team_15' },
  'ihfy8cz_668443': { type: 'recharge', plan: 'turbo' },
  'hhxugxb_668446': { type: 'recharge', plan: 'voice_bank' },
  'trszqtv_668453': { type: 'recharge', plan: 'pass_libre' },
};
```

**AÇÃO NECESSÁRIA:**
Atualizar o webhook `cakto-webhook/index.ts` para mapear corretamente todos os produtos conforme documentação.

### 6. **Tabela de Log de Webhooks**

**❌ PROBLEMA:** A documentação especifica tabela `cakto_webhooks` para auditoria:

**Documentação espera:**
- Tabela `cakto_webhooks` com campos: `event_type`, `cakto_transaction_id`, `checkout_id`, `payload`, `processed`, etc.

**App atual:**
- ❌ Não existe tabela `cakto_webhooks` no Supabase

**AÇÃO NECESSÁRIA:**
Criar tabela `cakto_webhooks` conforme documentação (linhas 485-513) para auditoria e debug.

### 7. **Tabela de Uso de Voz**

**❌ PROBLEMA:** A documentação especifica tabela `user_voice_usage`:

**Documentação espera:**
- Tabela `user_voice_usage` para rastrear uso diário de minutos de voz

**App atual:**
- ✅ Existe controle de voz na tabela `users` (campos `voice_daily_limit_seconds`, `voice_used_today_seconds`, `voice_balance_upsell`)
- ❌ Não existe tabela separada `user_voice_usage` conforme documentação

**OBSERVAÇÃO:** O app atual usa campos na tabela `users`, o que funciona, mas a documentação sugere tabela separada para histórico.

---

## 📋 RESUMO: STATUS DA INTEGRAÇÃO

| Componente | Status | Observação |
|------------|--------|------------|
| **Tabela `subscription_plans`** | ✅ Existe | Mas planos não estão cadastrados conforme doc |
| **Tabela `user_subscriptions`** | ✅ Existe | Estrutura correta |
| **Tabela `payments`** | ✅ Existe | Funcional |
| **Tabela `recharges`** | ❌ Não existe | Precisa criar |
| **Tabela `companies`** | ❌ Não existe | Precisa criar |
| **Tabela `company_licenses`** | ❌ Não existe | Precisa criar |
| **Tabela `personal_trainers`** | ❌ Não existe | Precisa criar |
| **Tabela `personal_licenses`** | ❌ Não existe | Precisa criar |
| **Tabela `cakto_webhooks`** | ❌ Não existe | Precisa criar |
| **Tabela `user_voice_usage`** | ⚠️ Parcial | Existe controle mas não tabela separada |
| **PremiumPage.tsx** | ✅ Conectada | Busca planos do Supabase |
| **Webhook Cakto** | ✅ Existe | Mas mapeamento de links incorreto |
| **Página de Recargas** | ❌ Não existe | Precisa criar |
| **Página B2B** | ❌ Não existe | Precisa criar |
| **Página Personais** | ❌ Não existe | Precisa criar |

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Prioridade ALTA (Funcionalidade Básica B2C)
1. ✅ **Inserir planos Mensal e Anual VIP** na tabela `subscription_plans`
2. ✅ **Atualizar mapeamento de links** no webhook `cakto-webhook`
3. ✅ **Criar tabela `cakto_webhooks`** para auditoria

### Prioridade MÉDIA (Recargas)
4. ✅ **Criar tabela `recharges`** no Supabase
5. ✅ **Criar página/seção de Recargas** na `PremiumPage.tsx`
6. ✅ **Atualizar webhook** para processar recargas
7. ✅ **Implementar lógica de aplicação** de recargas (somar minutos, remover limite)

### Prioridade BAIXA (B2B e Personais)
8. ✅ **Criar tabelas B2B** (`companies`, `company_licenses`)
9. ✅ **Criar tabelas Personais** (`personal_trainers`, `personal_licenses`)
10. ✅ **Criar páginas B2B e Personais** ou adicionar seções na `PremiumPage.tsx`
11. ✅ **Implementar sistema de códigos** (mestres e equipe)
12. ✅ **Atualizar webhook** para processar B2B e Personais

---

## 📝 CONCLUSÃO

**A página de vendas ESTÁ conectada ao Supabase**, mas:

1. ✅ **Estrutura básica está correta** (tabelas principais existem)
2. ❌ **Planos específicos não estão cadastrados** (precisa inserir na tabela)
3. ❌ **Recargas não estão implementadas** (faltam tabela e página)
4. ❌ **B2B e Personais não estão implementados** (faltam tabelas e páginas)
5. ⚠️ **Webhook precisa atualizar mapeamento** de links Cakto

**Recomendação:** Começar pela **Prioridade ALTA** para ter a funcionalidade básica B2C funcionando 100% conforme documentação.

