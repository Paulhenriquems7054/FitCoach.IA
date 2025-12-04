# 🔧 Como Atualizar os 2 IDs de Checkout Faltantes

**Planos que precisam de IDs:**
1. Personal Team 5
2. Personal Team 15

---

## 📍 ONDE FAZER A ALTERAÇÃO

### Tabela no Supabase: `app_plans`

A alteração deve ser feita **DIRETAMENTE NO SUPABASE** na tabela `app_plans`, no campo `cakto_checkout_id`.

---

## 🔍 PASSO A PASSO COMPLETO

### Passo 1: Obter os IDs da Cakto

1. **Acesse o Dashboard da Cakto:**
   - URL: https://app.cakto.com.br (ou URL da sua conta)
   - Faça login na sua conta

2. **Navegue até Produtos/Checkouts:**
   - No menu lateral, procure por **"Produtos"** ou **"Checkouts"**
   - Ou vá diretamente para a seção de produtos

3. **Localize os 2 produtos:**
   - Procure por: **"Team 5"** (Personal Trainer)
   - Procure por: **"Team 15"** (Personal Trainer)

4. **Copie o `product.short_id`:**
   - Clique no produto
   - Procure pelo campo **`short_id`** ou **"ID do Produto"**
   - Copie o valor (formato: `xxxxxxx_xxxxxx`)
   - Exemplo: `3dgheuc_666289`

**IMPORTANTE:** O `short_id` é diferente do ID completo. Você precisa do **`short_id`** (ou `product.short_id`).

---

### Passo 2: Atualizar no Supabase

#### Opção A: SQL Editor do Supabase (RECOMENDADO)

1. **Acesse o Supabase:**
   - URL: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"New query"**

3. **Execute o SQL abaixo:**

```sql
-- ============================================================================
-- ATUALIZAR 2 IDs DE CHECKOUT FALTANTES
-- Substitua os valores 'SEU_ID_AQUI' pelos IDs reais da Cakto
-- ============================================================================

-- 1. Atualizar Personal Team 5
UPDATE public.app_plans
SET cakto_checkout_id = 'SEU_ID_AQUI_TEAM5'  -- ⚠️ SUBSTITUIR PELO ID REAL
WHERE slug = 'personal_team_5';

-- 2. Atualizar Personal Team 15
UPDATE public.app_plans
SET cakto_checkout_id = 'SEU_ID_AQUI_TEAM15'  -- ⚠️ SUBSTITUIR PELO ID REAL
WHERE slug = 'personal_team_15';

-- ============================================================================
-- VERIFICAÇÃO APÓS ATUALIZAÇÃO
-- ============================================================================

SELECT 
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id IS NULL OR cakto_checkout_id = '' OR cakto_checkout_id LIKE 'PREENCHER%' OR cakto_checkout_id = 'SEU_ID_AQUI_TEAM5' OR cakto_checkout_id = 'SEU_ID_AQUI_TEAM15'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
WHERE slug IN ('personal_team_5', 'personal_team_15')
ORDER BY slug;
```

4. **Substitua os valores:**
   - `SEU_ID_AQUI_TEAM5` → ID real do Team 5 (ex: `3dgheuc_666289`)
   - `SEU_ID_AQUI_TEAM15` → ID real do Team 15 (ex: `3etp85e_666303`)

5. **Execute a query:**
   - Clique em **"Run"** ou pressione `Ctrl+Enter`

6. **Verifique o resultado:**
   - A query de verificação deve mostrar `✅ OK` para ambos

---

#### Opção B: Usar o Arquivo SQL Pronto

1. **Abra o arquivo:**
   - Local: `docs/ATUALIZAR_CHECKOUT_IDS_FALTANTES.sql`

2. **Edite o arquivo:**
   - Substitua `PREENCHER_ID_CHECKOUT_TEAM5` pelo ID real
   - Substitua `PREENCHER_ID_CHECKOUT_TEAM15` pelo ID real
   - **Remova a linha do Passe Livre** (já está preenchido)

3. **Copie e cole no SQL Editor do Supabase**

---

#### Opção C: Atualização Individual

Se preferir atualizar um de cada vez:

```sql
-- Apenas Personal Team 5
UPDATE public.app_plans
SET cakto_checkout_id = 'ID_REAL_DA_CAKTO'
WHERE slug = 'personal_team_5';

-- Apenas Personal Team 15
UPDATE public.app_plans
SET cakto_checkout_id = 'ID_REAL_DA_CAKTO'
WHERE slug = 'personal_team_15';
```

---

### Passo 3: Verificar se Funcionou

Execute esta query para verificar todos os planos:

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

**Resultado Esperado:**
- Todos os planos devem mostrar `✅ OK`
- Nenhum deve mostrar `⚠️ PRECISA PREENCHER`

---

## 📋 EXEMPLO PRÁTICO

### Exemplo com IDs Fictícios:

```sql
-- Atualizar Personal Team 5
UPDATE public.app_plans
SET cakto_checkout_id = 'abc1234_567890'  -- ID real da Cakto
WHERE slug = 'personal_team_5';

-- Atualizar Personal Team 15
UPDATE public.app_plans
SET cakto_checkout_id = 'xyz9876_543210'  -- ID real da Cakto
WHERE slug = 'personal_team_15';
```

---

## ⚠️ IMPORTANTE

### O que você precisa:
- ✅ IDs da Cakto (obtidos no dashboard)
- ✅ Acesso ao Supabase (SQL Editor)
- ✅ Conhecimento básico de SQL (ou seguir este guia)

### O que NÃO fazer:
- ❌ Não use IDs de outros planos
- ❌ Não deixe valores placeholder como `PREENCHER_ID_CHECKOUT_TEAM5`
- ❌ Não altere outros campos além de `cakto_checkout_id`

---

## 🔍 ONDE OS IDs SÃO USADOS

Após atualizar, os IDs serão usados automaticamente em:

1. **Webhook do Cakto:**
   - Quando alguém comprar Team 5 ou Team 15
   - O webhook identifica pelo `cakto_checkout_id`
   - Cria assinatura em `personal_subscriptions`

2. **Página de Vendas:**
   - Links de compra redirecionam para: `https://pay.cakto.com.br/{SHORT_ID}`
   - O `SHORT_ID` vem do campo `cakto_checkout_id`

---

## 📊 STATUS ATUAL

| Plano | Slug | Status | ID Atual |
|-------|------|--------|----------|
| Personal Team 5 | `personal_team_5` | ⚠️ Falta | `PREENCHER_ID_CHECKOUT_TEAM5` |
| Personal Team 15 | `personal_team_15` | ⚠️ Falta | `PREENCHER_ID_CHECKOUT_TEAM15` |

---

## ✅ CHECKLIST

- [ ] Obter ID do Team 5 da Cakto
- [ ] Obter ID do Team 15 da Cakto
- [ ] Abrir SQL Editor do Supabase
- [ ] Executar UPDATE para Team 5
- [ ] Executar UPDATE para Team 15
- [ ] Verificar com query de validação
- [ ] Confirmar que ambos mostram `✅ OK`

---

## 🆘 SE TIVER DÚVIDAS

### Não encontrou o ID na Cakto?
- Verifique se o produto está criado
- Procure em diferentes seções (Produtos, Checkouts, Planos)
- Entre em contato com suporte da Cakto se necessário

### Query não funcionou?
- Verifique se você tem permissão para fazer UPDATE
- Confira se os slugs estão corretos (`personal_team_5` e `personal_team_15`)
- Verifique se não há erro de digitação no ID

### Precisa de ajuda?
- Consulte: `docs/STATUS_APP_PLANS.md`
- Veja exemplos em: `docs/ATUALIZAR_CHECKOUT_IDS_FALTANTES.sql`

---

**Última atualização:** 2025-01-27

