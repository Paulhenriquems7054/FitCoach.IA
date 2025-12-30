# Verificação: Planos da Página vs Webhook

## 📊 Análise dos Planos

### Planos na Página de Vendas (PremiumPage.tsx)

A página filtra planos por `plan_category`:

1. **B2C (Individuais - IA):**
   - Filtro: `plan_category === 'b2c_ai'`
   - Exibidos para: Alunos e usuários indicados após trial

2. **B2B (Academias):**
   - Filtro: `plan_category === 'b2b_platform'`
   - Exibidos para: Academias (não alunos)

3. **Personal Trainers:**
   - Filtro: `plan_category === 'personal_platform'`
   - Exibidos para: Academias (não alunos)

4. **Recargas:**
   - Filtro: `plan_category === 'recharge'`
   - Exibidos para: Alunos e usuários indicados após trial

### Planos Processados pelo Webhook (cakto-webhook/index.ts)

O webhook processa planos por `plan_group`:

1. **B2B Academias:**
   - Processa: `plan_group === 'b2b_academia'`
   - Handler: `handleAcademyPlan()`

2. **B2C (Individuais):**
   - Processa: `plan_group === 'b2c'` ou `plan_group === 'b2c_ai'`
   - Handler: `handleB2CPlan()`

3. **Recargas:**
   - Processa: `plan_group === 'recarga'`
   - Handler: `handleRecharge()`

4. **Personal Trainers:**
   - Processa: `plan_group === 'personal'`
   - Handler: `handlePersonalTrainerPlan()` (mas não processa mais)

## ⚠️ INCONSISTÊNCIA IDENTIFICADA

| Tipo | Página (plan_category) | Webhook (plan_group) | Status |
|------|----------------------|---------------------|--------|
| B2C Individual | `b2c_ai` | `b2c` ou `b2c_ai` | ⚠️ Parcial |
| B2B Academia | `b2b_platform` | `b2b_academia` | ❌ Diferente |
| Personal Trainer | `personal_platform` | `personal` | ⚠️ Diferente |
| Recarga | `recharge` | `recarga` | ⚠️ Diferente |

## 🔍 Verificação Necessária

Precisamos verificar no banco de dados:

1. **A tabela `subscription_plans` tem ambas as colunas?**
   - `plan_category` (usado na página)
   - `plan_group` (usado no webhook)

2. **Quais valores existem no banco?**
   ```sql
   SELECT 
     name,
     display_name,
     plan_category,
     plan_group,
     checkout_url_monthly,
     checkout_url_yearly
   FROM subscription_plans
   WHERE is_active = true
   ORDER BY plan_category, plan_group;
   ```

3. **Há mapeamento entre eles?**
   - Se `plan_category` e `plan_group` são diferentes, precisamos mapear
   - Ou padronizar para usar apenas um campo

## ✅ Solução Proposta

### Opção 1: Usar `plan_category` no webhook (Recomendado)

Atualizar o webhook para usar `plan_category` em vez de `plan_group`:

```typescript
// Antes
switch (plan.plan_group) {
  case "b2b_academia": ...
  case "b2c": ...
  case "b2c_ai": ...
  case "recarga": ...
  case "personal": ...
}

// Depois
switch (plan.plan_category) {
  case "b2b_platform": // Mapear para handleAcademyPlan
  case "b2c_ai": // Mapear para handleB2CPlan
  case "recharge": // Mapear para handleRecharge
  case "personal_platform": // Mapear para handlePersonalTrainerPlan (se ainda usado)
}
```

### Opção 2: Criar mapeamento

Criar um mapeamento entre `plan_category` e `plan_group`:

```typescript
const categoryToGroupMap: Record<string, string> = {
  'b2c_ai': 'b2c_ai',
  'b2b_platform': 'b2b_academia',
  'personal_platform': 'personal',
  'recharge': 'recarga',
};
```

## 📋 Checklist de Verificação

- [ ] Verificar se `plan_category` e `plan_group` existem na tabela
- [ ] Verificar valores reais no banco de dados
- [ ] Verificar se há planos sem `plan_category` ou `plan_group`
- [ ] Atualizar webhook para usar `plan_category` ou criar mapeamento
- [ ] Testar processamento de todos os tipos de planos
- [ ] Verificar se recargas estão sendo processadas corretamente

## 🧪 Query SQL para Verificar

```sql
-- Verificar todos os planos ativos e suas categorias
SELECT 
  id,
  name,
  display_name,
  plan_category,
  plan_group,
  checkout_url_monthly,
  checkout_url_yearly,
  is_active,
  is_visible
FROM subscription_plans
WHERE is_active = true
ORDER BY 
  COALESCE(plan_category, plan_group, 'sem_categoria'),
  name;

-- Verificar quantos planos por categoria
SELECT 
  plan_category,
  plan_group,
  COUNT(*) as total
FROM subscription_plans
WHERE is_active = true
GROUP BY plan_category, plan_group
ORDER BY plan_category, plan_group;

-- Verificar planos sem categoria ou grupo
SELECT 
  id,
  name,
  display_name,
  plan_category,
  plan_group
FROM subscription_plans
WHERE is_active = true
  AND (plan_category IS NULL OR plan_group IS NULL);
```

