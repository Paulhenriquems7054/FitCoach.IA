# 📊 Comparação: Planos Existentes vs Planos Requeridos

**Data:** 2025-01-27  
**Análise:** Comparação entre planos no Supabase vs requisitos da página de vendas

---

## ✅ PLANOS QUE EXISTEM NO SUPABASE (7 planos)

### B2B Academia (4/4) ✅
1. ✅ `b2b_academia_starter_mini` - `3b2kpwc_671196` ✅
2. ✅ `b2b_academia_starter` - `cemyp2n_668537` ✅
3. ✅ `b2b_academia_growth` - `vi6djzq_668541` ✅
4. ✅ `b2b_academia_pro` - `3dis6ds_668546` ✅

### Recargas (3/3) - 1 com placeholder
5. ✅ `recarga_turbo` - `ihfy8cz_668443` ✅
6. ✅ `recarga_banco_voz_100` - `hhxugxb_668446` ✅
7. ⚠️ `recarga_passe_livre_30d` - `PREENCHER_SHORT_ID_PASSE_LIVRE` ⚠️ **PRECISA ATUALIZAR**

---

## ❌ PLANOS QUE FALTAM NA TABELA (4 planos)

### B2C (2/2) - FALTANDO COMPLETAMENTE
1. ❌ `b2c_mensal` - NÃO EXISTE na tabela
2. ❌ `b2c_anual_vip` - NÃO EXISTE na tabela

### Personal Trainer (2/2) - FALTANDO COMPLETAMENTE
3. ❌ `personal_team_5` - NÃO EXISTE na tabela
4. ❌ `personal_team_15` - NÃO EXISTE na tabela

---

## ⚠️ PROBLEMAS ENCONTRADOS

### 1. Passe Livre com Placeholder
- **Status:** ⚠️ ID placeholder ainda presente
- **ID Correto:** `trszqtv_668453` (conforme resumo fornecido)
- **Ação:** Atualizar o ID

### 2. Planos B2C Não Existem
- **Impacto:** ❌ CRÍTICO - Usuários não podem comprar planos B2C
- **Ação:** Criar os 2 planos B2C na tabela

### 3. Planos Personal Trainer Não Existem
- **Impacto:** ⚠️ IMPORTANTE - Personal trainers não podem comprar
- **Ação:** Criar os 2 planos Personal na tabela

---

## 🔧 CORREÇÕES NECESSÁRIAS

### Correção 1: Atualizar ID do Passe Livre

```sql
UPDATE public.app_plans
SET cakto_checkout_id = 'trszqtv_668453'
WHERE slug = 'recarga_passe_livre_30d';
```

---

### Correção 2: Criar Planos B2C Faltantes

```sql
-- B2C Mensal
INSERT INTO public.app_plans (
  slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id, 
  cakto_product_type, minutes_voice_per_day, is_unlimited_voice, is_active
) VALUES (
  'b2c_mensal',
  'Plano Mensal',
  'Para quem quer testar - Cancele quando quiser',
  'b2c',
  'recorrente',
  'mensal',
  34.90,
  35.89,
  'BRL',
  'zeygxve_668421',
  'subscription',
  15,
  false,
  true
);

-- B2C Anual VIP
INSERT INTO public.app_plans (
  slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id,
  cakto_product_type, minutes_voice_per_day, is_unlimited_voice, is_active
) VALUES (
  'b2c_anual_vip',
  'Plano Anual VIP',
  'Recomendado - Economia de R$ 121,80',
  'b2c',
  'recorrente',
  'anual',
  297.00,
  297.99,
  'BRL',
  'wvbkepi_668441',
  'subscription',
  15,
  false,
  true
);
```

---

### Correção 3: Criar Planos Personal Trainer Faltantes

```sql
-- Personal Team 5
INSERT INTO public.app_plans (
  slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id,
  cakto_product_type, max_licenses, minutes_voice_per_day, is_unlimited_voice, is_active
) VALUES (
  'personal_team_5',
  'Team 5',
  'Ideal para quem está começando na consultoria',
  'personal',
  'recorrente',
  'mensal',
  99.90,
  100.89,
  'BRL',
  'PREENCHER_ID_TEAM5',  -- ⚠️ OBTER DA CAKTO
  'subscription',
  5,
  15,
  false,
  true
);

-- Personal Team 15
INSERT INTO public.app_plans (
  slug, name, description, plan_group, billing_type, billing_period,
  price, total_checkout_price, currency, cakto_checkout_id,
  cakto_product_type, max_licenses, minutes_voice_per_day, is_unlimited_voice, is_active
) VALUES (
  'personal_team_15',
  'Team 15',
  'Mais Vantajoso - Maior margem de lucro',
  'personal',
  'recorrente',
  'mensal',
  249.90,
  250.89,
  'BRL',
  'PREENCHER_ID_TEAM15',  -- ⚠️ OBTER DA CAKTO
  'subscription',
  15,
  15,
  false,
  true
);
```

---

## 📋 RESUMO COMPARATIVO

| Grupo | Requerido | Existe | Faltando | Status |
|-------|-----------|--------|----------|--------|
| **B2C** | 2 | 0 | 2 | ❌ **FALTA CRIAR** |
| **B2B Academia** | 4 | 4 | 0 | ✅ **COMPLETO** |
| **Personal Trainer** | 2 | 0 | 2 | ❌ **FALTA CRIAR** |
| **Recargas** | 3 | 3 | 0 | ⚠️ **1 ID PENDENTE** |
| **TOTAL** | **11** | **7** | **4** | ⚠️ **36% FALTANDO** |

---

## 🎯 AÇÕES PRIORITÁRIAS

### 🔴 CRÍTICO (Fazer Agora)

1. **Atualizar ID do Passe Livre**
   - ID correto: `trszqtv_668453`
   - Impacto: Recarga não funciona sem ID

2. **Criar Planos B2C**
   - `b2c_mensal` - ID: `zeygxve_668421` ✅
   - `b2c_anual_vip` - ID: `wvbkepi_668441` ✅
   - Impacto: ❌ CRÍTICO - Usuários não podem comprar

### 🟡 IMPORTANTE (Esta Semana)

3. **Criar Planos Personal Trainer**
   - `personal_team_5` - ID: Precisa obter da Cakto
   - `personal_team_15` - ID: Precisa obter da Cakto
   - Impacto: Personal trainers não podem comprar

---

## 📝 SQL COMPLETO PARA CORRIGIR TUDO

Arquivo criado: `docs/CRIAR_PLANOS_FALTANTES_E_ATUALIZAR.sql`

---

**Última atualização:** 2025-01-27

