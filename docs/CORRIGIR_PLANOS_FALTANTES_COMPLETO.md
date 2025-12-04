# 🔧 CORRIGIR PLANOS FALTANTES - Guia Completo

**Análise dos Planos Existentes vs Requeridos**

---

## ❌ PROBLEMA ENCONTRADO

Analisando os planos que existem no Supabase, descobri que:

### ✅ Planos que EXISTEM (7 planos)
1. ✅ `b2b_academia_starter_mini` - ID: `3b2kpwc_671196` ✅
2. ✅ `b2b_academia_starter` - ID: `cemyp2n_668537` ✅
3. ✅ `b2b_academia_growth` - ID: `vi6djzq_668541` ✅
4. ✅ `b2b_academia_pro` - ID: `3dis6ds_668546` ✅
5. ✅ `recarga_turbo` - ID: `ihfy8cz_668443` ✅
6. ✅ `recarga_banco_voz_100` - ID: `hhxugxb_668446` ✅
7. ⚠️ `recarga_passe_livre_30d` - ID: `PREENCHER_SHORT_ID_PASSE_LIVRE` ⚠️

### ❌ Planos que FALTAM COMPLETAMENTE (4 planos)

1. ❌ **`b2c_mensal`** - NÃO EXISTE na tabela
2. ❌ **`b2c_anual_vip`** - NÃO EXISTE na tabela
3. ❌ **`personal_team_5`** - NÃO EXISTE na tabela
4. ❌ **`personal_team_15`** - NÃO EXISTE na tabela

---

## 🎯 O QUE PRECISA SER FEITO

### 1. ATUALIZAR ID do Passe Livre ⚠️
- Plano existe, mas ID está como placeholder
- ID correto: `trszqtv_668453`

### 2. CRIAR 2 Planos B2C ❌
- `b2c_mensal` - ID: `zeygxve_668421` ✅
- `b2c_anual_vip` - ID: `wvbkepi_668441` ✅

### 3. CRIAR 2 Planos Personal Trainer ❌
- `personal_team_5` - ID: Precisa obter da Cakto
- `personal_team_15` - ID: Precisa obter da Cakto

---

## 📍 ONDE FAZER AS ALTERAÇÕES

### Local: **Supabase Dashboard → SQL Editor**

**Tabela:** `public.app_plans`

**Operações:**
1. **UPDATE** para atualizar ID do Passe Livre
2. **INSERT** para criar os 4 planos faltantes

---

## 🔧 SQL COMPLETO PARA CORRIGIR TUDO

Arquivo criado: `docs/CRIAR_PLANOS_FALTANTES_E_ATUALIZAR.sql`

Este arquivo contém:
- ✅ UPDATE do ID do Passe Livre
- ✅ INSERT dos 2 planos B2C
- ✅ INSERT dos 2 planos Personal Trainer (IDs precisam ser preenchidos)

---

## 📊 RESUMO

| Ação | Quantidade | Status |
|------|-----------|--------|
| **Atualizar ID** | 1 plano | ⚠️ ID placeholder |
| **Criar Planos B2C** | 2 planos | ❌ Não existem |
| **Criar Planos Personal** | 2 planos | ❌ Não existem |
| **TOTAL** | **5 ações** | ⚠️ **CRÍTICO** |

---

**Veja o arquivo SQL completo:** `docs/CRIAR_PLANOS_FALTANTES_E_ATUALIZAR.sql`

