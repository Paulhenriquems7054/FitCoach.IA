# 📍 ONDE Atualizar os 2 IDs Faltantes - Resumo Direto

---

## ❌ PROBLEMA DESCOBERTO

Analisando os planos que você mostrou que existem no Supabase, descobri que:

### ✅ Planos que EXISTEM (7 planos)
- 4 planos B2B Academia ✅
- 3 recargas (1 com ID placeholder) ⚠️

### ❌ Planos que FALTAM COMPLETAMENTE (4 planos)
- 2 planos B2C ❌
- 2 planos Personal Trainer ❌

---

## 🎯 O QUE PRECISA SER FEITO

### 1. ⚠️ ATUALIZAR 1 ID
- **Passe Livre:** Atualizar de `PREENCHER_SHORT_ID_PASSE_LIVRE` para `trszqtv_668453`

### 2. ❌ CRIAR 2 Planos B2C (IDs já conhecidos)
- `b2c_mensal` - ID: `zeygxve_668421` ✅
- `b2c_anual_vip` - ID: `wvbkepi_668441` ✅

### 3. ❌ CRIAR 2 Planos Personal Trainer (IDs precisam ser obtidos)
- `personal_team_5` - ID: Precisa obter da Cakto
- `personal_team_15` - ID: Precisa obter da Cakto

---

## 📍 ONDE FAZER AS ALTERAÇÕES

### **LOCAL:** Supabase Dashboard → SQL Editor

**URL:** https://supabase.com/dashboard

**Tabela:** `public.app_plans`

---

## ⚡ SQL PRONTO PARA USAR

### Opção 1: Executar Tudo de Uma Vez (Recomendado)

**Arquivo:** `docs/ATUALIZAR_PLANOS_FALTANTES_COMPLETO.sql`

Este arquivo contém:
1. ✅ UPDATE do ID do Passe Livre
2. ✅ INSERT dos 2 planos B2C
3. ✅ INSERT dos 2 planos Personal (substitua os IDs antes)

**Antes de executar:**
- Obter IDs do Team 5 e Team 15 da Cakto
- Substituir `PREENCHER_ID_TEAM5` e `PREENCHER_ID_TEAM15` pelos IDs reais

---

### Opção 2: Executar em Partes

#### Parte 1: Atualizar Passe Livre (pode executar agora)

```sql
UPDATE public.app_plans
SET cakto_checkout_id = 'trszqtv_668453'
WHERE slug = 'recarga_passe_livre_30d';
```

#### Parte 2: Criar Planos B2C (pode executar agora)

Veja o arquivo: `docs/CRIAR_PLANOS_FALTANTES_E_ATUALIZAR.sql` (linhas 24-70)

#### Parte 3: Criar Planos Personal (obter IDs primeiro)

Veja o arquivo: `docs/CRIAR_PLANOS_FALTANTES_E_ATUALIZAR.sql` (linhas 77-125)

---

## 🔍 RESUMO VISUAL

```
┌─────────────────────────────────────────┐
│  PLANOS EXISTENTES (7)                  │
├─────────────────────────────────────────┤
│  ✅ B2B Academia: 4 planos              │
│  ✅ Recargas: 3 planos (1 precisa ID)   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  PLANOS FALTANTES (4)                   │
├─────────────────────────────────────────┤
│  ❌ B2C: 2 planos (CRIAR)               │
│  ❌ Personal: 2 planos (CRIAR)          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  AÇÕES NECESSÁRIAS                      │
├─────────────────────────────────────────┤
│  1. UPDATE: 1 ID (Passe Livre)          │
│  2. INSERT: 2 planos B2C                │
│  3. INSERT: 2 planos Personal           │
└─────────────────────────────────────────┘
```

---

## 📁 ARQUIVOS PRONTOS

1. **`docs/ATUALIZAR_PLANOS_FALTANTES_COMPLETO.sql`** ⭐ - SQL completo (recomendado)
2. **`docs/CRIAR_PLANOS_FALTANTES_E_ATUALIZAR.sql`** - Versão alternativa
3. **`docs/PLANOS_EXISTENTES_VS_REQUERIDOS.md`** - Análise detalhada
4. **`docs/ONDE_ATUALIZAR_2_IDS.md`** - Guia para atualizar IDs

---

## ✅ CHECKLIST

### Fazer Agora (IDs já conhecidos)
- [ ] Atualizar ID do Passe Livre → `trszqtv_668453`
- [ ] Criar plano `b2c_mensal` → ID: `zeygxve_668421`
- [ ] Criar plano `b2c_anual_vip` → ID: `wvbkepi_668441`

### Fazer Depois (obter IDs primeiro)
- [ ] Obter ID do Team 5 da Cakto
- [ ] Obter ID do Team 15 da Cakto
- [ ] Criar plano `personal_team_5` com ID real
- [ ] Criar plano `personal_team_15` com ID real

---

## 🚀 PASSO A PASSO RÁPIDO

1. **Abra:** Supabase Dashboard → SQL Editor
2. **Abra:** `docs/ATUALIZAR_PLANOS_FALTANTES_COMPLETO.sql`
3. **Substitua:** `PREENCHER_ID_TEAM5` e `PREENCHER_ID_TEAM15` pelos IDs reais
4. **Cole e execute** no SQL Editor
5. **Verifique** com a query de verificação no final do arquivo

---

**Última atualização:** 2025-01-27

