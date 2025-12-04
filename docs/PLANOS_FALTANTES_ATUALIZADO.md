# ✅ PLANOS FALTANTES - Versão Corrigida

**Data:** 2025-01-27  
**Correção:** Planos Personal Trainer (Team 5 e Team 15) **NÃO EXISTEM** na página de vendas nem na Cakto

---

## 📊 SITUAÇÃO ATUAL

### ✅ Planos que EXISTEM no Supabase (7 planos)

#### B2B Academia (4/4) ✅ COMPLETO
1. ✅ `b2b_academia_starter_mini` - `3b2kpwc_671196`
2. ✅ `b2b_academia_starter` - `cemyp2n_668537`
3. ✅ `b2b_academia_growth` - `vi6djzq_668541`
4. ✅ `b2b_academia_pro` - `3dis6ds_668546`

#### Recargas (3/3) - 1 precisa atualizar ID
5. ✅ `recarga_turbo` - `ihfy8cz_668443`
6. ✅ `recarga_banco_voz_100` - `hhxugxb_668446`
7. ⚠️ `recarga_passe_livre_30d` - `PREENCHER_SHORT_ID_PASSE_LIVRE` ⚠️

---

## ❌ Planos que FALTAM (apenas 2 planos B2C)

1. ❌ **`b2c_mensal`** - NÃO EXISTE na tabela
   - ID Cakto: `zeygxve_668421` ✅
   - Preço: R$ 34,90
   - Período: Mensal

2. ❌ **`b2c_anual_vip`** - NÃO EXISTE na tabela
   - ID Cakto: `wvbkepi_668441` ✅
   - Preço: R$ 297,00
   - Período: Anual

---

## ⚠️ IMPORTANTE: Planos Personal Trainer

**Os planos Personal Trainer (Team 5 e Team 15) NÃO EXISTEM** na página de vendas nem na Cakto. Portanto, **NÃO devem ser criados** na tabela `app_plans`.

Se esses planos forem adicionados no futuro, será necessário:
1. Criá-los na Cakto primeiro
2. Obter os IDs (`product.short_id`)
3. Criar os registros na tabela `app_plans`

---

## 🎯 AÇÕES NECESSÁRIAS (apenas 3 ações)

### 1. ⚠️ Atualizar ID do Passe Livre
```sql
UPDATE public.app_plans
SET cakto_checkout_id = 'trszqtv_668453'
WHERE slug = 'recarga_passe_livre_30d';
```

### 2. ❌ Criar Plano B2C Mensal
- Slug: `b2c_mensal`
- ID Cakto: `zeygxve_668421` ✅
- Preço: R$ 34,90

### 3. ❌ Criar Plano B2C Anual VIP
- Slug: `b2c_anual_vip`
- ID Cakto: `wvbkepi_668441` ✅
- Preço: R$ 297,00

---

## ⚡ SQL PRONTO PARA EXECUTAR

**Arquivo:** `docs/CRIAR_PLANOS_FALTANTES_CORRETO.sql`

Este arquivo contém **APENAS**:
- ✅ UPDATE do ID do Passe Livre
- ✅ INSERT dos 2 planos B2C (IDs já preenchidos)
- ❌ **NÃO inclui** planos Personal Trainer

---

## 📍 COMO EXECUTAR

1. **Acesse:** Supabase Dashboard → SQL Editor
   - URL: https://supabase.com/dashboard

2. **Abra o arquivo:** `docs/CRIAR_PLANOS_FALTANTES_CORRETO.sql`

3. **Cole e execute** todo o conteúdo no SQL Editor

4. **Verifique** com a query de verificação no final do arquivo

**⏱️ Tempo estimado:** 5 minutos

---

## 📊 RESULTADO ESPERADO

Após executar o SQL, você terá **9 planos** no total:

| Grupo | Quantidade | Status |
|-------|-----------|--------|
| **B2C** | 2 | ✅ Completo |
| **B2B Academia** | 4 | ✅ Completo |
| **Recargas** | 3 | ✅ Completo |
| **TOTAL** | **9** | ✅ **Todos com IDs válidos** |

---

## ✅ VERIFICAÇÃO FINAL

Execute esta query para verificar que tudo está correto:

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
- ✅ 9 planos no total
- ✅ Todos com `✅ OK` no status
- ✅ Nenhum com `⚠️ PRECISA PREENCHER`

---

## 🚨 IMPACTO SE NÃO FIZER

### Planos B2C (CRÍTICO)
- ❌ Usuários **não podem comprar** planos mensais ou anuais
- ❌ Webhook da Cakto **não vai encontrar** os planos
- ❌ Sistema **não vai criar** `user_subscriptions`
- ❌ Receita perdida!

### Recarga Passe Livre
- ❌ Recarga **não vai funcionar** (ID placeholder)
- ❌ Webhook não vai processar corretamente

---

## 📁 ARQUIVOS CRIADOS

1. **`docs/CRIAR_PLANOS_FALTANTES_CORRETO.sql`** ⭐ - **USE ESTE!**
2. **`docs/RESUMO_FINAL_PLANOS_FALTANTES.md`** - Resumo executivo
3. **`docs/PLANOS_FALTANTES_ATUALIZADO.md`** - Este documento

---

**🎯 AÇÃO IMEDIATA:** Execute `docs/CRIAR_PLANOS_FALTANTES_CORRETO.sql` no Supabase agora!

