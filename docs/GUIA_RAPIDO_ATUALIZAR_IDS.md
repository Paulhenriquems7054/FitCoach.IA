# ⚡ Guia Rápido - Atualizar 2 IDs Faltantes

**Planos:** Personal Team 5 e Personal Team 15

---

## 📍 ONDE FAZER A ALTERAÇÃO

### 🎯 **Tabela no Supabase:** `app_plans`
### 🎯 **Campo:** `cakto_checkout_id`
### 🎯 **Onde:** SQL Editor do Supabase

---

## 🚀 PASSOS RÁPIDOS

### 1️⃣ Obter IDs da Cakto

1. Acesse: https://app.cakto.com.br
2. Vá em **Produtos** ou **Checkouts**
3. Encontre:
   - **Team 5** (R$ 99,90)
   - **Team 15** (R$ 249,90)
4. Copie o **`short_id`** de cada um

**Exemplo de ID:** `abc1234_567890`

---

### 2️⃣ Atualizar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Abra **SQL Editor**
3. **Copie e cole este código:**

```sql
-- Atualizar Personal Team 5
UPDATE public.app_plans
SET cakto_checkout_id = 'ID_REAL_TEAM5_AQUI'  -- ⚠️ SUBSTITUIR
WHERE slug = 'personal_team_5';

-- Atualizar Personal Team 15
UPDATE public.app_plans
SET cakto_checkout_id = 'ID_REAL_TEAM15_AQUI'  -- ⚠️ SUBSTITUIR
WHERE slug = 'personal_team_15';
```

4. **Substitua:**
   - `ID_REAL_TEAM5_AQUI` → ID real do Team 5
   - `ID_REAL_TEAM15_AQUI` → ID real do Team 15

5. **Execute** (Ctrl+Enter ou botão Run)

---

### 3️⃣ Verificar

Execute para confirmar:

```sql
SELECT 
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id LIKE 'PREENCHER%' OR cakto_checkout_id LIKE 'SEU_ID%' OR cakto_checkout_id LIKE 'ID_REAL%'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
WHERE slug IN ('personal_team_5', 'personal_team_15');
```

**Resultado esperado:** Ambos devem mostrar `✅ OK`

---

## 📁 ARQUIVOS PRONTOS

Você também pode usar os arquivos prontos:

1. **`docs/ATUALIZAR_2_IDS_FALTANTES.sql`** - Apenas os 2 IDs
2. **`docs/ATUALIZAR_CHECKOUT_IDS_FALTANTES.sql`** - Versão completa

---

## ⚠️ LEMBRETES

- ✅ Use o **`short_id`** (não o ID completo)
- ✅ Formato: `xxxxxxx_xxxxxx`
- ✅ Não deixe valores placeholder
- ✅ Verifique antes de executar

---

**Precisa de mais detalhes?** Veja: `docs/COMO_ATUALIZAR_2_IDS_FALTANTES.md`

