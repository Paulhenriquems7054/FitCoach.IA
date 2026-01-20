# 📋 Guia de Implementação: Planos Manual (Sem IA)

## ✅ O que foi implementado

### 1. **Migration SQL** ✅
- Arquivo: `supabase/migrations/004_adicionar_planos_manuais_sem_ia.sql`
- Cria planos B2B Manual (FitCoachManual50, 100, 200, 300, 400, 500, 600)
- Cria plano B2C Manual (manual_monthly)
- Todos com `plan_category = 'b2b_manual'` ou `'b2c_manual'`

### 2. **Atualização do caktoService.ts** ✅
- Adicionados placeholders para checkout IDs dos planos manuais
- ⚠️ **AÇÃO NECESSÁRIA:** Substituir `'SEU_CHECKOUT_ID_AQUI'` pelos IDs reais da Cakto

### 3. **Atualização do Webhook** ✅
- Adicionados casos `'b2b_manual'` e `'b2c_manual'` no switch
- Criadas funções `handleAcademyManualPlan()` e `handleB2CManualPlan()`
- Planos manuais criam empresas com **limites ZERO** (`limite_texto = 0, limite_imagem = 0, limite_voz = 0`)

### 4. **Atualização da PremiumPage.tsx** ✅
- Adicionados filtros `b2bManualPlans` e `b2cManualPlans`
- Adicionadas novas abas "Planos Manual (Sem IA)" e "Plano Manual (Sem IA)"
- Adicionadas seções de renderização com avisos sobre ausência de IA

---

## 🚀 Próximos Passos

### **PASSO 1: Executar Migration SQL**

Execute no Supabase SQL Editor:
```sql
-- Arquivo: supabase/migrations/004_adicionar_planos_manuais_sem_ia.sql
```

### **PASSO 2: Criar Produtos na Cakto**

1. Acesse o painel da Cakto
2. Crie produtos para cada plano manual:
   - **FitCoach Manual 50** → R$ 59,90/mês (sem IA)
   - **FitCoach Manual 100** → R$ 129,90/mês (sem IA)
   - **FitCoach Manual 200** → R$ 229,90/mês (sem IA)
   - **FitCoach Manual 300** → R$ 329,90/mês (sem IA)
   - **FitCoach Manual 400** → R$ 429,90/mês (sem IA)
   - **FitCoach Manual 500** → R$ 529,90/mês (sem IA)
   - **FitCoach Manual 600** → R$ 629,90/mês (sem IA)
3. Configure:
   - Tipo: **Assinatura mensal**
   - URL de retorno: `https://[seu-projeto].supabase.co/functions/v1/cakto-webhook`
   - Webhook: mesmo endpoint
4. Copie os **Checkout IDs** gerados

### **PASSO 3: Atualizar Checkout IDs no Código**

Atualize `services/caktoService.ts`:

```typescript
const CAKTO_CHECKOUT_IDS: Record<string, string> = {
  // ... planos existentes ...
  
  // Planos B2B Manual (sem IA) - ✅ SUBSTITUIR pelos IDs reais
  'FitCoachManual50': 'SEU_CHECKOUT_ID_AQUI',   // R$ 59,90
  'FitCoachManual100': 'SEU_CHECKOUT_ID_AQUI',  // R$ 129,90
  'FitCoachManual200': 'SEU_CHECKOUT_ID_AQUI',  // R$ 229,90
  'FitCoachManual300': 'SEU_CHECKOUT_ID_AQUI',  // R$ 329,90
  'FitCoachManual400': 'SEU_CHECKOUT_ID_AQUI',  // R$ 429,90
  'FitCoachManual500': 'SEU_CHECKOUT_ID_AQUI',  // R$ 529,90
  'FitCoachManual600': 'SEU_CHECKOUT_ID_AQUI',  // R$ 629,90
  
  // Planos B2C Manual (sem IA) - ✅ SUBSTITUIR pelo ID real
  'manual_monthly': 'SEU_CHECKOUT_ID_AQUI',
};
```

### **PASSO 4: Atualizar URLs de Checkout no Banco**

Após criar os produtos na Cakto, atualize as URLs:

```sql
-- Atualizar URLs de checkout dos planos manuais
UPDATE public.subscription_plans
SET 
  checkout_url_monthly = 'https://pay.cakto.com.br/SEU_CHECKOUT_ID',
  checkout_price_monthly = 59.90
WHERE name = 'FitCoachManual50';

-- Repetir para cada plano manual
UPDATE public.subscription_plans
SET 
  checkout_url_monthly = 'https://pay.cakto.com.br/SEU_CHECKOUT_ID',
  checkout_price_monthly = 129.90
WHERE name = 'FitCoachManual100';

UPDATE public.subscription_plans
SET 
  checkout_url_monthly = 'https://pay.cakto.com.br/SEU_CHECKOUT_ID',
  checkout_price_monthly = 229.90
WHERE name = 'FitCoachManual200';

UPDATE public.subscription_plans
SET 
  checkout_url_monthly = 'https://pay.cakto.com.br/SEU_CHECKOUT_ID',
  checkout_price_monthly = 329.90
WHERE name = 'FitCoachManual300';

UPDATE public.subscription_plans
SET 
  checkout_url_monthly = 'https://pay.cakto.com.br/SEU_CHECKOUT_ID',
  checkout_price_monthly = 429.90
WHERE name = 'FitCoachManual400';

UPDATE public.subscription_plans
SET 
  checkout_url_monthly = 'https://pay.cakto.com.br/SEU_CHECKOUT_ID',
  checkout_price_monthly = 529.90
WHERE name = 'FitCoachManual500';

UPDATE public.subscription_plans
SET 
  checkout_url_monthly = 'https://pay.cakto.com.br/SEU_CHECKOUT_ID',
  checkout_price_monthly = 629.90
WHERE name = 'FitCoachManual600';
```

---

## 🔍 Como Funciona

### **Planos B2B Manual (Academias sem IA)**

1. Cliente escolhe plano manual na página de vendas
2. Redireciona para checkout Cakto
3. Após pagamento, webhook processa:
   - Cria empresa na tabela `companies`
   - Define `limite_texto = 0, limite_imagem = 0, limite_voz = 0`
   - Gera `master_code` e código de convite
   - Envia email de ativação
4. Alunos vinculados à academia **NÃO terão acesso à IA** (limites = 0)
5. Sistema bloqueia automaticamente qualquer tentativa de usar IA

### **Planos B2C Manual (Individuais sem IA)**

1. Cliente escolhe plano manual individual
2. Redireciona para checkout Cakto
3. Após pagamento, webhook processa:
   - Cria assinatura na tabela `user_subscriptions`
   - Plano não inclui acesso à IA
4. Usuário **NÃO terá acesso à IA**
5. Sistema bloqueia automaticamente qualquer tentativa de usar IA

---

## ⚠️ Importante

### **Bloqueio Automático de IA**

O sistema já bloqueia automaticamente quando:
- `limite_texto = 0` → Bloqueia chat de texto
- `limite_imagem = 0` → Bloqueia análise de imagens
- `limite_voz = 0` → Bloqueia conversas de voz

**Não é necessário alterar `novoAiAccessService.ts`** - o bloqueio já funciona!

### **Frontend (Opcional)**

Você pode esconder/desabilitar botões de IA no frontend para planos manuais, mas o bloqueio já ocorre no backend.

---

## 📊 Estrutura dos Planos

### **Planos B2B Manual**

| Plano | Alunos | Preço | Limites IA |
|-------|--------|-------|------------|
| FitCoach Manual 50  | 50  | R$ 59,90 | 0 (sem IA) |
| FitCoach Manual 100 | 100 | R$ 129,90 | 0 (sem IA) |
| FitCoach Manual 200 | 200 | R$ 229,90 | 0 (sem IA) |
| FitCoach Manual 300 | 300 | R$ 329,90 | 0 (sem IA) |
| FitCoach Manual 400 | 400 | R$ 429,90 | 0 (sem IA) |
| FitCoach Manual 500 | 500 | R$ 529,90 | 0 (sem IA) |
| FitCoach Manual 600 | 600 | R$ 629,90 | 0 (sem IA) |

### **Planos B2C Manual**

| Plano | Preço | Limites IA |
|-------|-------|------------|
| Plano Manual Mensal | Definir preço (ex.: R$ 19,90) | 0 (sem IA) |

---

## ✅ Checklist Final

- [x] Migration SQL criada
- [x] `caktoService.ts` atualizado (com placeholders)
- [x] Webhook atualizado para processar planos manuais
- [x] `PremiumPage.tsx` atualizado para exibir planos manuais
- [ ] **Executar migration SQL no Supabase**
- [ ] **Criar produtos na Cakto**
- [ ] **Atualizar checkout IDs no código**
- [ ] **Atualizar URLs de checkout no banco**
- [ ] **Testar fluxo completo**

---

**Data:** 2026-01-18  
**Status:** ✅ **CÓDIGO IMPLEMENTADO** - Aguardando configuração da Cakto
