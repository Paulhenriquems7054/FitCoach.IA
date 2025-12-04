# 📍 ONDE Encontrar e Atualizar os 2 IDs Faltantes

## 🎯 RESUMO RÁPIDO

**O que precisa:** Atualizar 2 IDs de checkout no Supabase  
**Onde:** Tabela `app_plans`, campo `cakto_checkout_id`  
**Como:** SQL Editor do Supabase

---

## 📊 PLANOS QUE PRECISAM DE ID

| Plano | Slug | ID Atual | Onde Atualizar |
|-------|------|----------|----------------|
| **Personal Team 5** | `personal_team_5` | `PREENCHER_ID_CHECKOUT_TEAM5` | Supabase → `app_plans` |
| **Personal Team 15** | `personal_team_15` | `PREENCHER_ID_CHECKOUT_TEAM15` | Supabase → `app_plans` |

---

## 🔍 ONDE ENCONTRAR OS IDs

### 1. Dashboard da Cakto

**URL:** https://app.cakto.com.br

**Passo a passo:**
1. Faça login
2. Menu lateral → **"Produtos"** ou **"Checkouts"**
3. Procure por:
   - **"Team 5"** (Personal Trainer)
   - **"Team 15"** (Personal Trainer)
4. Clique em cada produto
5. Copie o **`short_id`** ou **`product.short_id`**
   - Formato: `abc1234_567890`
   - ⚠️ **Não confunda com o ID completo!**

---

## 🔧 ONDE FAZER A ALTERAÇÃO

### Supabase Dashboard → SQL Editor

**URL:** https://supabase.com/dashboard

**Localização Exata:**
```
Supabase Dashboard
  └── Seu Projeto
      └── SQL Editor (menu lateral)
          └── New query
              └── Cole o SQL abaixo
```

---

## ⚡ SQL PARA COPIAR E COLAR

### Versão Simplificada (Recomendada)

```sql
-- 1. Atualizar Personal Team 5
UPDATE public.app_plans
SET cakto_checkout_id = 'COLE_O_ID_DO_TEAM5_AQUI'
WHERE slug = 'personal_team_5';

-- 2. Atualizar Personal Team 15
UPDATE public.app_plans
SET cakto_checkout_id = 'COLE_O_ID_DO_TEAM15_AQUI'
WHERE slug = 'personal_team_15';
```

**Substitua:**
- `COLE_O_ID_DO_TEAM5_AQUI` → ID real do Team 5
- `COLE_O_ID_DO_TEAM15_AQUI` → ID real do Team 15

---

## ✅ VERIFICAÇÃO

Depois de executar, rode esta query para verificar:

```sql
SELECT 
    slug,
    name,
    cakto_checkout_id,
    CASE 
        WHEN cakto_checkout_id LIKE 'PREENCHER%' 
             OR cakto_checkout_id LIKE 'COLE_O_ID%'
        THEN '⚠️ PRECISA PREENCHER'
        ELSE '✅ OK'
    END as status
FROM public.app_plans
WHERE slug IN ('personal_team_5', 'personal_team_15');
```

**Resultado esperado:**
```
slug              | name      | cakto_checkout_id | status
------------------|-----------|-------------------|--------
personal_team_5   | Team 5    | abc1234_567890    | ✅ OK
personal_team_15  | Team 15   | xyz9876_543210    | ✅ OK
```

---

## 📁 ARQUIVOS PRONTOS PARA USAR

Você tem 3 opções de arquivos prontos:

1. **`docs/GUIA_RAPIDO_ATUALIZAR_IDS.md`** ⚡ - Guia rápido
2. **`docs/COMO_ATUALIZAR_2_IDS_FALTANTES.md`** 📚 - Guia completo
3. **`docs/ATUALIZAR_2_IDS_FALTANTES.sql`** 📝 - SQL pronto (editar e executar)

---

## 🗺️ MAPA VISUAL

```
┌─────────────────────────────────────────────────────┐
│  PASSO 1: OBTER IDs                                 │
│  Dashboard Cakto → Produtos → Copiar short_id      │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  PASSO 2: ATUALIZAR                                 │
│  Supabase → SQL Editor → Cole SQL → Execute         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  PASSO 3: VERIFICAR                                 │
│  Execute query de verificação → Confirme ✅ OK      │
└─────────────────────────────────────────────────────┘
```

---

## ⚠️ IMPORTANTE

### ✅ Faça:
- Obter IDs do Dashboard da Cakto
- Usar o `short_id` (não o ID completo)
- Atualizar no Supabase via SQL Editor
- Verificar depois

### ❌ Não faça:
- Não atualize no código do app
- Não use IDs de outros planos
- Não deixe valores placeholder
- Não altere outros campos

---

## 🔗 LINKS ÚTEIS

- **Dashboard Cakto:** https://app.cakto.com.br
- **Dashboard Supabase:** https://supabase.com/dashboard
- **Guia Completo:** `docs/COMO_ATUALIZAR_2_IDS_FALTANTES.md`
- **SQL Pronto:** `docs/ATUALIZAR_2_IDS_FALTANTES.sql`

---

## 📞 PRECISA DE AJUDA?

### Problema: Não encontro os IDs na Cakto
- Verifique se os produtos estão criados
- Procure em diferentes seções do dashboard
- Entre em contato com suporte da Cakto

### Problema: Query não funcionou
- Verifique permissões no Supabase
- Confira se os slugs estão corretos
- Veja se há erro de digitação no ID

---

**Última atualização:** 2025-01-27

