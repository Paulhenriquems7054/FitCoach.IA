# ✅ Status: Tabela app_plans

## 📊 Resumo

**Status Geral:** ✅ **Quase Completo** (9/11 planos com checkout_id válido)

### ✅ Planos com Checkout ID OK (8)

#### B2C (2/2) ✅
- ✅ `b2c_mensal` - `zeygxve_668421`
- ✅ `b2c_anual_vip` - `wvbkepi_668441`

#### B2B Academia (4/4) ✅
- ✅ `b2b_academia_starter_mini` - `3b2kpwc_671196`
- ✅ `b2b_academia_starter` - `cemyp2n_668537`
- ✅ `b2b_academia_growth` - `vi6djzq_668541`
- ✅ `b2b_academia_pro` - `3dis6ds_668546`

#### Recargas (3/3) ✅
- ✅ `recarga_turbo` - `ihfy8cz_668443`
- ✅ `recarga_banco_voz_100` - `hhxugxb_668446`
- ✅ `recarga_passe_livre_30d` - `trszqtv_668453`

#### Personal Trainer (0/2) ⚠️
- ⚠️ `personal_team_5` - **PRECISA PREENCHER**
- ⚠️ `personal_team_15` - **PRECISA PREENCHER**

**Nota:** Conforme resumo fornecido, o ID do Passe Livre é `trszqtv_668453`

---

## ⚠️ Planos que Precisam de Checkout ID (2)

### 1. Personal Team 5
- **Slug:** `personal_team_5`
- **Nome:** Team 5
- **Preço:** R$ 99,90
- **Status Atual:** `PREENCHER_SHORT_ID_TEAM5` ⚠️
- **Ação:** Obter `product.short_id` da Cakto e atualizar

### 2. Personal Team 15
- **Slug:** `personal_team_15`
- **Nome:** Team 15
- **Preço:** R$ 249,90
- **Status Atual:** `PREENCHER_SHORT_ID_TEAM15` ⚠️
- **Ação:** Obter `product.short_id` da Cakto e atualizar

### ~~3. Recarga Passe Livre 30 Dias~~ ✅ COMPLETO
- **Slug:** `recarga_passe_livre_30d`
- **Nome:** Passe Livre 30 Dias
- **Preço:** R$ 19,90
- **Status Atual:** `trszqtv_668453` ✅
- **Ação:** ✅ ID já preenchido conforme resumo fornecido

---

## 🔧 Como Preencher os IDs Faltantes

### Passo 1: Obter os IDs da Cakto

1. Acesse o Dashboard da Cakto
2. Vá em **Produtos** ou **Checkouts**
3. Encontre os 2 produtos:
   - Team 5 (Personal Trainer)
   - Team 15 (Personal Trainer)
4. Copie o **`product.short_id`** de cada um

### Passo 2: Atualizar no Supabase

**Opção A: Atualizar individualmente**
```sql
-- Personal Team 5
UPDATE public.app_plans
SET cakto_checkout_id = 'ID_REAL_DA_CAKTO'
WHERE slug = 'personal_team_5';

-- Personal Team 15
UPDATE public.app_plans
SET cakto_checkout_id = 'ID_REAL_DA_CAKTO'
WHERE slug = 'personal_team_15';

-- Passe Livre 30 Dias
UPDATE public.app_plans
SET cakto_checkout_id = 'ID_REAL_DA_CAKTO'
WHERE slug = 'recarga_passe_livre_30d';
```

**Opção B: Usar a query pronta (RECOMENDADO)**
1. Abra: `docs/ATUALIZAR_3_CHECKOUT_IDS_FALTANTES.sql`
2. Substitua:
   - `PREENCHER_SHORT_ID_TEAM5` → ID real do Team 5
   - `PREENCHER_SHORT_ID_TEAM15` → ID real do Team 15
   - `PREENCHER_SHORT_ID_PASSE_LIVRE` → ID real do Passe Livre
3. Execute no SQL Editor do Supabase

---

## ✅ Verificação Final

Após preencher os IDs, execute:

**Query rápida (apenas faltantes):**
```sql
-- Execute: docs/VERIFICAR_CHECKOUT_IDS_FALTANTES.sql
```

**Ou verificação completa:**
```sql
SELECT 
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL OR cakto_checkout_id = '' OR cakto_checkout_id LIKE 'PREENCHER%'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
ORDER BY plan_group, slug;
```

**Resultado esperado:** Todos devem mostrar `✅ OK` e nenhum plano deve aparecer na lista de faltantes.

---

## 📋 Próximos Passos

1. ✅ **Tabela app_plans verificada** - Quase completa
2. ⏳ **Preencher 3 checkout_ids faltantes** - Obter IDs da Cakto
3. ⏳ **Deploy da Edge Function** - Fazer deploy da `cakto-webhook` atualizada
4. ⏳ **Aguardar primeira compra** - Para criar `academy_subscriptions`

---

**Status:** ✅ Sistema quase pronto! Apenas 2 IDs faltando (Team 5 e Team 15).


