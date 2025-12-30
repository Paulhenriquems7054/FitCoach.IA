# ⚠️ ANÁLISE: Código do Webhook no Supabase

## 🔴 PROBLEMA IDENTIFICADO

O código que está no Supabase Edge Functions (`cakto-webhook`) é do projeto **Nutri.ai**, **NÃO** do **FitCoach.IA**!

## 📊 Comparação dos Códigos

### Código no Supabase (Nutri.ai) ❌
- **Tabelas usadas:**
  - `user_profiles` (não existe no FitCoach.IA)
  - `coupons` (estrutura diferente)
  - `payment_history` (não existe no FitCoach.IA)
  - `recharges` (estrutura diferente)
  - Funções RPC: `add_boost_minutes`, `add_reserve_minutes`, `activate_unlimited_subscription`

- **Lógica:**
  - Gera códigos de convite automaticamente
  - Envia emails via Resend
  - Usa `plan_type` em `user_profiles`
  - Mapeia planos por nome do produto (`FREE`, `MONTHLY`, `ANNUAL`, etc.)

- **Estrutura de dados:**
  ```typescript
  type PlanType = 'free' | 'monthly' | 'annual' | 'academy_starter' | ...
  // Usa user_profiles.plan_type
  ```

### Código do FitCoach.IA (Atual) ✅
- **Tabelas usadas:**
  - `subscription_plans` (com `checkout_url_monthly`, `checkout_url_yearly`)
  - `user_subscriptions` (com `plan_id`, `billing_cycle`, etc.)
  - `companies` (para planos B2B)
  - `gyms` (vinculado a companies)
  - `users` (com `subscription_status`)
  - `recharges` (estrutura diferente)
  - `payments`, `invoices`, `audit_logs`

- **Lógica:**
  - Busca planos por `checkout_url_monthly` ou `checkout_url_yearly`
  - Cria assinaturas em `user_subscriptions`
  - Cria empresas em `companies` para planos B2B
  - Gera `master_code` para academias
  - Usa `plan_group` para diferenciar tipos (b2b_academia, b2c, b2c_ai, recarga)

- **Estrutura de dados:**
  ```typescript
  // Usa subscription_plans.plan_group
  // Cria registros em user_subscriptions com plan_id
  ```

## 🔍 Diferenças Principais

| Aspecto | Nutri.ai (Supabase) | FitCoach.IA (Atual) |
|---------|---------------------|---------------------|
| **Tabela de usuários** | `user_profiles` | `users` |
| **Tabela de planos** | Mapeamento hardcoded | `subscription_plans` |
| **Assinaturas** | `user_profiles.plan_type` | `user_subscriptions` |
| **Planos B2B** | Cria `coupons` | Cria `companies` + `gyms` |
| **Código de convite** | Gera automaticamente | Gera `master_code` via RPC |
| **Emails** | Envia via Resend | Não envia emails |
| **Recargas** | Usa RPC functions | Insere diretamente em `recharges` |
| **Busca de planos** | Por nome do produto | Por `checkout_url_monthly/yearly` |

## ⚠️ CONSEQUÊNCIAS

Se o código do Nutri.ai estiver rodando no Supabase do FitCoach.IA:

1. ❌ **Erros ao processar pagamentos:**
   - Tentará acessar `user_profiles` que não existe
   - Tentará criar `coupons` com estrutura diferente
   - Tentará usar RPC functions que não existem

2. ❌ **Dados incorretos:**
   - Assinaturas não serão criadas corretamente
   - Planos B2B não criarão empresas
   - Recargas não funcionarão

3. ❌ **Estrutura incompatível:**
   - Mapeamento de planos diferente
   - Validação de webhook diferente
   - Processamento de eventos diferente

## ✅ SOLUÇÃO

**O código correto do FitCoach.IA já está no repositório:**
- `supabase/functions/cakto-webhook/index.ts`

**Ação necessária:**
1. Fazer deploy do código correto do FitCoach.IA no Supabase
2. Remover o código do Nutri.ai
3. Verificar se as tabelas existem no banco
4. Testar o webhook após o deploy

## 📋 Checklist de Verificação

- [ ] Código no Supabase é do FitCoach.IA (não Nutri.ai)
- [ ] Tabela `subscription_plans` existe e tem `checkout_url_monthly` e `checkout_url_yearly`
- [ ] Tabela `user_subscriptions` existe
- [ ] Tabela `companies` existe
- [ ] Tabela `gyms` existe
- [ ] Tabela `users` existe
- [ ] Tabela `recharges` existe
- [ ] Função RPC `generate_master_code` existe
- [ ] Função RPC `get_user_id_by_email` existe
- [ ] Variáveis de ambiente configuradas:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `CAKTO_WEBHOOK_SECRET` (ou `SKIP_CAKTO_WEBHOOK_AUTH=true`)

## 🚀 Como Fazer Deploy do Código Correto

### Opção 1: Via Supabase CLI
```bash
cd supabase/functions/cakto-webhook
supabase functions deploy cakto-webhook
```

### Opção 2: Via Dashboard do Supabase
1. Acesse o Dashboard do Supabase
2. Vá em **Edge Functions** → **cakto-webhook**
3. Clique em **Edit**
4. Cole o código de `supabase/functions/cakto-webhook/index.ts`
5. Clique em **Deploy**

## 📝 Notas Importantes

- O código do Nutri.ai **NÃO** funcionará no FitCoach.IA
- O código do FitCoach.IA está correto e pronto para uso
- É necessário fazer o deploy do código correto

