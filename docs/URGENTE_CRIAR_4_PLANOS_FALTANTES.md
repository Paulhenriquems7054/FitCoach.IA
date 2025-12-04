# 🚨 URGENTE: Criar 4 Planos Faltantes na Tabela app_plans

**Data:** 2025-01-27  
**Status:** ❌ **CRÍTICO** - Planos não podem ser comprados até serem criados

---

## ❌ PROBLEMA ENCONTRADO

Comparando os planos que **EXISTEM** no Supabase com os planos **REQUERIDOS** na página de vendas:

### ✅ Planos que EXISTEM (7 planos)

1. ✅ `b2b_academia_starter_mini` - `3b2kpwc_671196`
2. ✅ `b2b_academia_starter` - `cemyp2n_668537`
3. ✅ `b2b_academia_growth` - `vi6djzq_668541`
4. ✅ `b2b_academia_pro` - `3dis6ds_668546`
5. ✅ `recarga_turbo` - `ihfy8cz_668443`
6. ✅ `recarga_banco_voz_100` - `hhxugxb_668446`
7. ⚠️ `recarga_passe_livre_30d` - `PREENCHER_SHORT_ID_PASSE_LIVRE` (tem placeholder)

### ❌ Planos que FALTAM COMPLETAMENTE (4 planos)

1. ❌ **`b2c_mensal`** - NÃO EXISTE na tabela
2. ❌ **`b2c_anual_vip`** - NÃO EXISTE na tabela
3. ❌ **`personal_team_5`** - NÃO EXISTE na tabela
4. ❌ **`personal_team_15`** - NÃO EXISTE na tabela

---

## 🎯 AÇÕES NECESSÁRIAS

### 1. ⚠️ Atualizar 1 ID (5 minutos)

**Passe Livre:** Atualizar ID de placeholder para ID real

```sql
UPDATE public.app_plans
SET cakto_checkout_id = 'trszqtv_668453'
WHERE slug = 'recarga_passe_livre_30d';
```

---

### 2. ❌ Criar 2 Planos B2C (IDs já conhecidos)

#### B2C Mensal
- **Slug:** `b2c_mensal`
- **ID Cakto:** `zeygxve_668421` ✅
- **Preço:** R$ 34,90

#### B2C Anual VIP
- **Slug:** `b2c_anual_vip`
- **ID Cakto:** `wvbkepi_668441` ✅
- **Preço:** R$ 297,00

---

### 3. ❌ Criar 2 Planos Personal Trainer (IDs precisam ser obtidos)

#### Personal Team 5
- **Slug:** `personal_team_5`
- **ID Cakto:** ❓ Precisa obter da Cakto
- **Preço:** R$ 99,90

#### Personal Team 15
- **Slug:** `personal_team_15`
- **ID Cakto:** ❓ Precisa obter da Cakto
- **Preço:** R$ 249,90

---

## ⚡ SOLUÇÃO: SQL PRONTO

**Arquivo:** `docs/ATUALIZAR_PLANOS_FALTANTES_COMPLETO.sql`

Este arquivo contém:
- ✅ UPDATE do ID do Passe Livre
- ✅ INSERT dos 2 planos B2C (IDs já preenchidos)
- ✅ INSERT dos 2 planos Personal (substitua os placeholders)

---

## 📍 COMO EXECUTAR

### Passo 1: Obter IDs da Cakto

1. Acesse o Dashboard da Cakto
2. Vá em **Produtos** ou **Checkouts**
3. Encontre:
   - **Team 5** (Personal Trainer) - R$ 99,90
   - **Team 15** (Personal Trainer) - R$ 249,90
4. Copie o **`product.short_id`** de cada um

### Passo 2: Atualizar SQL

1. Abra: `docs/ATUALIZAR_PLANOS_FALTANTES_COMPLETO.sql`
2. Substitua:
   - `PREENCHER_ID_TEAM5` → ID real do Team 5
   - `PREENCHER_ID_TEAM15` → ID real do Team 15

### Passo 3: Executar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Cole o SQL completo
4. Execute
5. Verifique com a query no final

---

## 📊 RESUMO EXECUTIVO

| Ação | Quantidade | Prioridade | Tempo Estimado |
|------|-----------|------------|----------------|
| Atualizar ID Passe Livre | 1 | 🔴 Alta | 2 minutos |
| Criar Planos B2C | 2 | 🔴 **CRÍTICO** | 5 minutos |
| Criar Planos Personal | 2 | 🟡 Alta | 10 minutos |
| **TOTAL** | **5 ações** | | **17 minutos** |

---

## ⚠️ IMPACTO SE NÃO FIZER

### Planos B2C (CRÍTICO)
- ❌ Usuários **não podem comprar** planos mensais ou anuais
- ❌ Webhook da Cakto **não vai encontrar** os planos
- ❌ Sistema **não vai criar** `user_subscriptions`

### Planos Personal Trainer
- ❌ Personal trainers **não podem comprar** planos
- ❌ Webhook da Cakto **não vai encontrar** os planos
- ❌ Sistema **não vai criar** `personal_subscriptions`

---

## ✅ VERIFICAÇÃO FINAL

Após executar o SQL, rode esta query para verificar:

```sql
SELECT 
    plan_group,
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL 
             OR cakto_checkout_id = '' 
             OR cakto_checkout_id LIKE 'PREENCHER%'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
ORDER BY plan_group, slug;
```

**Resultado esperado:**
- 11 planos no total
- Todos com `✅ OK` no status
- Nenhum com `⚠️ PRECISA PREENCHER`

---

## 📁 ARQUIVOS CRIADOS

1. **`docs/ATUALIZAR_PLANOS_FALTANTES_COMPLETO.sql`** ⭐ - Use este!
2. **`docs/RESUMO_ATUALIZAR_PLANOS.md`** - Guia resumido
3. **`docs/PLANOS_EXISTENTES_VS_REQUERIDOS.md`** - Análise detalhada
4. **`docs/CORRIGIR_PLANOS_FALTANTES_COMPLETO.md`** - Documentação completa

---

**🎯 AÇÃO IMEDIATA:** Abra o arquivo SQL e execute após obter os 2 IDs da Cakto!

