# ✅ Checkout IDs Atualizados

## 📋 IDs Configurados

### Recargas FitVoice ✅

| Produto | Preço | Checkout ID | Status |
|---------|-------|-------------|--------|
| FitVoice 20 | R$ 5,00 | `ihfy8cz_668443` | ✅ Configurado |
| FitVoice 60 | R$ 12,90 | `hhxugxb_668446` | ✅ Configurado |
| FitVoice 120 | R$ 19,90 | `3smg99n_693764` | ✅ Configurado |

### Planos FitCoach ✅

| Plano | Preço | Checkout ID | Status |
|-------|-------|-------------|--------|
| FitCoach 50 | R$ 299,90 | `cemyp2n_668537` | ✅ Configurado |
| FitCoach 100 | R$ 549,90 | `vi6djzq_668541` | ✅ Configurado |
| FitCoach 200 | R$ 999,90 | `3b2kpwc_671196` | ✅ Configurado |
| FitCoach 400 | R$ 1.799,90 | `3dis6ds_668546` | ✅ Configurado |
| FitCoach 500 | ? | ⚠️ Não mencionado | ⚠️ Aguardando |

### Plano Anual VIP ✅

| Produto | Preço | Checkout ID | Status |
|---------|-------|-------------|--------|
| Plano Anual (VIP) | R$ 2.199,90 | `xphpm5f_703310` | ✅ Já estava configurado |

---

## ✅ O que foi feito:

1. ✅ Atualizado `services/caktoService.ts` com todos os Checkout IDs fornecidos
2. ✅ IDs de FitVoice configurados (20, 60, 120 minutos)
3. ✅ IDs de FitCoach configurados (50, 100, 200, 400 alunos)
4. ✅ Plano Anual VIP já estava correto

---

## 📝 Próximos Passos:

1. **Verificar se os preços estão corretos nas páginas:**
   - A página `PremiumPage.tsx` carrega planos dinamicamente do banco de dados
   - Os preços devem estar atualizados na tabela `subscription_plans` do Supabase

2. **Testar checkout:**
   - Verificar se os botões de compra redirecionam corretamente
   - Testar um checkout de recarga FitVoice
   - Testar um checkout de plano FitCoach

3. **FitCoach 500:**
   - Se existir, fornecer o Checkout ID para atualizar

---

## 🔗 URLs de Checkout Geradas:

O sistema agora gera automaticamente as URLs usando os IDs configurados:

- FitVoice 20: `https://pay.cakto.com.br/ihfy8cz_668443`
- FitVoice 60: `https://pay.cakto.com.br/hhxugxb_668446`
- FitVoice 120: `https://pay.cakto.com.br/3smg99n_693764`
- FitCoach 50: `https://pay.cakto.com.br/cemyp2n_668537`
- FitCoach 100: `https://pay.cakto.com.br/vi6djzq_668541`
- FitCoach 200: `https://pay.cakto.com.br/3b2kpwc_671196`
- FitCoach 400: `https://pay.cakto.com.br/3dis6ds_668546`
- Plano Anual VIP: `https://pay.cakto.com.br/xphpm5f_703310`

---

**Status:** ✅ **CHECKOUT IDs CONFIGURADOS**  
**Data:** 2026-01-18
