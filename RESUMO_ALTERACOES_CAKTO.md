# 📋 RESUMO: O que alterar na Cakto para os Novos Planos

## 🎯 RESUMO EXECUTIVO

Com o novo modelo de planos, você precisa:

1. ✅ **Criar 5 novos produtos** na Cakto para planos de academias (FitCoach50-500)
2. ✅ **Criar 3 novos produtos** para recargas FitVoice (20/60/120 min)
3. ✅ **Configurar URLs de retorno** para cada produto
4. ✅ **Atualizar o código** com os novos Checkout IDs

---

## 🏢 1. PLANOS DE ACADEMIAS (B2B)

### **Novos Produtos a Criar na Cakto:**

| Plano | Checkout ID (criar na Cakto) | Limites |
|-------|------------------------------|---------|
| **FitCoach50** | `xxxxxxx_xxxxxx` ⚠️ | 50 alunos, 1.000 texto, 100 imagem, 450 min voz |
| **FitCoach100** | `xxxxxxx_xxxxxx` ⚠️ | 100 alunos, 1.000 texto, 100 imagem, 450 min voz |
| **FitCoach200** | `xxxxxxx_xxxxxx` ⚠️ | 200 alunos, 2.000 texto, 200 imagem, 600 min voz |
| **FitCoach400** | `xxxxxxx_xxxxxx` ⚠️ | 400 alunos, 3.000 texto, 300 imagem, 900 min voz |
| **FitCoach500** | `xxxxxxx_xxxxxx` ⚠️ | 500 alunos, 5.000 texto, 500 imagem, 1.200 min voz |

### **Configuração na Cakto:**

1. **Criar produto** "FitCoach50 - Plano Academia"
   - Preço: Definir (ex: R$ 99,90/mês)
   - Recorrência: **Mensal**
   - URL de retorno: `https://seu-dominio.com/activation?email={email}&checkout_id={checkout_id}`
   - **Anotar Checkout ID** gerado

2. **Repetir** para FitCoach100, FitCoach200, FitCoach400, FitCoach500

---

## 💰 2. RECARGAS FITVOICE (B2C)

### **Novos Produtos a Criar na Cakto:**

| Recarga | Preço | Minutos | Checkout ID (criar na Cakto) |
|---------|-------|---------|------------------------------|
| **FitVoice 20** | R$ 5,00 | 20 min | `xxxxxxx_xxxxxx` ⚠️ |
| **FitVoice 60** | R$ 12,90 | 60 min | `xxxxxxx_xxxxxx` ⚠️ |
| **FitVoice 120** | R$ 19,90 | 120 min | `xxxxxxx_xxxxxx` ⚠️ |

### **Configuração na Cakto:**

1. **Criar produto** "FitVoice 20 - Recarga de Voz"
   - Preço: **R$ 5,00**
   - Recorrência: **Pagamento único** (não é assinatura)
   - URL de retorno: `https://seu-dominio.com/billing?recarga=success&checkout_id={checkout_id}`
   - **Anotar Checkout ID** gerado

2. **Repetir** para FitVoice 60 (R$ 12,90) e FitVoice 120 (R$ 19,90)

---

## 🔧 3. ATUALIZAR CÓDIGO

### **Arquivo: `services/caktoService.ts`**

**Adicionar novos planos:**

```typescript
const CAKTO_CHECKOUT_IDS: Record<string, string> = {
  // Planos B2C (manter)
  'monthly': '3ujuqzz_703304',
  'annual_vip': 'xphpm5f_703310',
  
  // Planos B2B (Academias) - NOVOS ⚠️
  'FitCoach50': 'SEU_CHECKOUT_ID_AQUI',      // ⚠️ SUBSTITUIR
  'FitCoach100': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ SUBSTITUIR
  'FitCoach200': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ SUBSTITUIR
  'FitCoach400': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ SUBSTITUIR
  'FitCoach500': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ SUBSTITUIR
  
  // Planos antigos (manter para migração ou remover)
  'academy_starter_mini': '3b2kpwc_671196',
  'academy_starter': 'cemyp2n_668537',
  'academy_growth': 'vi6djzq_668541',
  'academy_pro': '3dis6ds_668546',
  
  // Recargas FitVoice - NOVOS ⚠️
  'FitVoice20': 'SEU_CHECKOUT_ID_AQUI',      // ⚠️ SUBSTITUIR
  'FitVoice60': 'SEU_CHECKOUT_ID_AQUI',      // ⚠️ SUBSTITUIR
  'FitVoice120': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ SUBSTITUIR
  
  // Recargas antigas (manter para compatibilidade ou remover)
  'recharge_turbo': 'ihfy8cz_668443',
  'recharge_voice_bank': 'hhxugxb_668446',
  'recharge_pass_livre': 'trszqtv_668453',
};
```

### **Arquivo: `services/recargaService.ts`**

**Adicionar mapping de Checkout IDs:**

```typescript
// Adicionar após RECARGAS_DISPONIVEIS
export const RECARGAS_CAKTO_IDS: Record<TipoRecarga, string> = {
  'FitVoice20': 'SEU_CHECKOUT_ID_AQUI',   // ⚠️ SUBSTITUIR
  'FitVoice60': 'SEU_CHECKOUT_ID_AQUI',   // ⚠️ SUBSTITUIR
  'FitVoice120': 'SEU_CHECKOUT_ID_AQUI',  // ⚠️ SUBSTITUIR
};

// Atualizar função criarRecarga para usar o mapping:
export async function criarRecarga(...) {
  // ...
  const checkoutId = RECARGAS_CAKTO_IDS[tipoRecarga];
  const checkoutUrl = `https://pay.cakto.com.br/${checkoutId}`;
  // ...
}
```

---

## 🔗 4. WEBHOOK (verificar configuração)

### **URL do Webhook (já deve estar configurado):**

```
https://seu-projeto.supabase.co/functions/v1/cakto-webhook
```

### **Verificar se está configurado:**

1. Acesse: https://app.cakto.com.br
2. Vá em **Webhooks**
3. Verifique se a URL acima está cadastrada
4. Eventos: `payment.completed`, `payment.paid`, `subscription.created`

**Nota:** O webhook já processa planos antigos. Ele tentará buscar os novos planos pelo `checkout_id` enviado pela Cakto.

---

## ✅ 5. CHECKLIST RÁPIDO

### **Na Cakto:**

- [ ] Criar produto FitCoach50
- [ ] Criar produto FitCoach100
- [ ] Criar produto FitCoach200
- [ ] Criar produto FitCoach400
- [ ] Criar produto FitCoach500
- [ ] Criar produto FitVoice20 (R$ 5,00)
- [ ] Criar produto FitVoice60 (R$ 12,90)
- [ ] Criar produto FitVoice120 (R$ 19,90)
- [ ] Configurar URL de retorno em cada produto
- [ ] Anotar todos os Checkout IDs

### **No Código:**

- [ ] Atualizar `services/caktoService.ts` com novos IDs
- [ ] Atualizar `services/recargaService.ts` com IDs das recargas
- [ ] Testar checkout de academia
- [ ] Testar checkout de recarga

---

## 📝 6. MIGRAÇÃO DOS PLANOS ANTIGOS

**Opção:** Você pode manter os planos antigos (`academy_starter_mini`, etc.) ativos na Cakto e no código para academias existentes, ou migrar tudo para os novos planos.

**Para migrar:**
1. Atualizar todas as academias no banco para usar os novos planos FitCoach
2. Desativar ou remover produtos antigos na Cakto

---

## 🧪 7. TESTAR

1. **Testar checkout de academia:**
   ```typescript
   const url = getCaktoCheckoutUrl('FitCoach50');
   // Deve abrir checkout da Cakto
   ```

2. **Testar recarga:**
   ```typescript
   const { checkoutUrl } = await criarRecarga(userId, 'FitVoice20');
   // Deve redirecionar para checkout da Cakto
   ```

3. **Verificar webhook:**
   - Fazer pagamento de teste
   - Verificar logs do webhook no Supabase
   - Verificar se dados foram atualizados no banco

---

**📄 Documentação completa:** `docs/CONFIGURAR_CAKTO_NOVOS_PLANOS.md`
