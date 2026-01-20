# 🔧 Configurar Cakto para Novos Planos

## 📋 Resumo das Mudanças

Com a implementação do novo modelo de planos, você precisa configurar na Cakto:

1. **Planos de Academias (B2B)**: FitCoach50, FitCoach100, FitCoach200, FitCoach400, FitCoach500
2. **Recargas FitVoice (B2C)**: FitVoice20, FitVoice60, FitVoice120

---

## 🎯 1. PLANOS DE ACADEMIAS (B2B)

### **O que mudou:**

**Planos ANTIGOS (remover ou manter para migração):**
- `academy_starter_mini` → **Substituir por FitCoach50**
- `academy_starter` → **Substituir por FitCoach100**  
- `academy_growth` → **Substituir por FitCoach200**
- `academy_pro` → **Substituir por FitCoach400**
- **Novo**: `FitCoach500` (500 alunos)

**Planos NOVOS na Cakto:**

| Plano | Alunos Máx | Limite Texto | Limite Imagem | Limite Voz (min/mês) | Preço Sugerido |
|-------|------------|--------------|---------------|---------------------|----------------|
| **FitCoach50** | 50 | 1.000 | 100 | 450 | R$ XXX,XX |
| **FitCoach100** | 100 | 1.000 | 100 | 450 | R$ XXX,XX |
| **FitCoach200** | 200 | 2.000 | 200 | 600 | R$ XXX,XX |
| **FitCoach400** | 400 | 3.000 | 300 | 900 | R$ XXX,XX |
| **FitCoach500** | 500 | 5.000 | 500 | 1.200 | R$ XXX,XX |

### **Ação na Cakto:**

1. **Criar novos produtos para cada plano FitCoach:**
   - FitCoach50
   - FitCoach100
   - FitCoach200
   - FitCoach400
   - FitCoach500

2. **Configurar cada produto:**
   - **Nome do produto**: "FitCoach [XX] - Plano Academia"
   - **Preço**: Definir preço mensal
   - **Recorrência**: Mensal (assinatura recorrente)
   - **Descrição**: 
     ```
     Plano FitCoach para academias com até [XX] alunos.
     Inclui:
     - [X] alunos simultâneos
     - [X] mensagens de texto/mês por aluno
     - [X] análises de imagem/mês por aluno
     - [X] minutos de voz/mês por aluno
     ```

3. **URL de Retorno (importante!):**
   ```
   https://seu-dominio.com/activation?email={email}&checkout_id={checkout_id}
   ```
   - Substitua `{email}` e `{checkout_id}` pelos parâmetros da Cakto
   - A Cakto pode usar `{customer_email}` ao invés de `{email}`

4. **Obter Checkout IDs:**
   - Após criar cada produto, anote o **Checkout ID** de cada um
   - Formato: `xxxxxxx_xxxxxx` (ex: `3b2kpwc_671196`)
   - URL completa: `https://pay.cakto.com.br/[CHECKOUT_ID]`

---

## 💰 2. RECARGAS FITVOICE (B2C)

### **Novos Produtos para Criar:**

| Tipo | Nome | Minutos | Preço | Descrição |
|------|------|---------|-------|-----------|
| **FitVoice20** | FitVoice 20 | 20 min | R$ 5,00 | 20 minutos extras de voz |
| **FitVoice60** | FitVoice 60 | 60 min | R$ 12,90 | 60 minutos extras de voz |
| **FitVoice120** | FitVoice 120 | 120 min | R$ 19,90 | 120 minutos extras de voz |

### **Ação na Cakto:**

1. **Criar 3 produtos de recarga (pagamento único, não recorrente):**
   - **FitVoice 20** - R$ 5,00
   - **FitVoice 60** - R$ 12,90
   - **FitVoice 120** - R$ 19,90

2. **Configurar cada recarga:**
   - **Nome**: "FitVoice [XX] - Recarga de Voz"
   - **Preço**: Conforme tabela acima
   - **Recorrência**: **Pagamento único** (não é assinatura)
   - **Descrição**: 
     ```
     Recarga de [XX] minutos extras de voz para uso além do limite mensal.
     Os minutos são adicionados ao seu saldo e podem ser usados a qualquer momento.
     ```

3. **URL de Retorno:**
   ```
   https://seu-dominio.com/billing?recarga=success&checkout_id={checkout_id}
   ```

4. **Obter Checkout IDs:**
   - Anote o **Checkout ID** de cada recarga
   - Formato: `xxxxxxx_xxxxxx`
   - URL completa: `https://pay.cakto.com.br/[CHECKOUT_ID]`

---

## 🔄 3. ATUALIZAR MAPPING NO CÓDIGO

Após criar os produtos na Cakto, você precisa atualizar os mappings no código:

### **Planos de Academias:**

**Arquivo:** `services/caktoService.ts`

```typescript
const CAKTO_CHECKOUT_IDS: Record<string, string> = {
  // Planos B2B (Academias) - NOVOS
  'FitCoach50': 'SEU_CHECKOUT_ID_AQUI',      // ⚠️ SUBSTITUIR
  'FitCoach100': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ SUBSTITUIR
  'FitCoach200': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ SUBSTITUIR
  'FitCoach400': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ SUBSTITUIR
  'FitCoach500': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ SUBSTITUIR
  
  // Planos antigos (manter para compatibilidade ou remover)
  // 'academy_starter_mini': '3b2kpwc_671196',
  // 'academy_starter': 'cemyp2n_668537',
  // 'academy_growth': 'vi6djzq_668541',
  // 'academy_pro': '3dis6ds_668546',
};
```

### **Recargas FitVoice:**

**Arquivo:** `services/recargaService.ts`

Adicionar após criar os produtos na Cakto:

```typescript
export const RECARGAS_CAKTO_IDS: Record<TipoRecarga, string> = {
  'FitVoice20': 'SEU_CHECKOUT_ID_AQUI',      // ⚠️ SUBSTITUIR
  'FitVoice60': 'SEU_CHECKOUT_ID_AQUI',      // ⚠️ SUBSTITUIR
  'FitVoice120': 'SEU_CHECKOUT_ID_AQUI',     // ⚠️ SUBSTITUIR
};
```

---

## 🔗 4. CONFIGURAR WEBHOOK

### **URL do Webhook:**

```
https://seu-projeto.supabase.co/functions/v1/cakto-webhook
```

### **Eventos a Configurar:**

1. ✅ `payment.completed` - Pagamento confirmado
2. ✅ `payment.paid` - Pagamento realizado
3. ✅ `subscription.created` - Assinatura criada
4. ✅ `subscription.payment_succeeded` - Pagamento de assinatura bem-sucedido

### **Headers (opcional):**

Se você configurou autenticação no webhook:

```
x-webhook-secret: seu-secret-aqui
```

**Nota:** Se você configurou `SKIP_CAKTO_WEBHOOK_AUTH=true` no Supabase, não precisa do header.

---

## 📝 5. MIGRAÇÃO DOS PLANOS ANTIGOS

### **Opção 1: Manter Planos Antigos (Recomendado temporariamente)**

Mantenha os planos antigos ativos para academias existentes:

```typescript
// Manter mapeamento antigo para compatibilidade
'academy_starter_mini': '3b2kpwc_671196',  // → Pode mapear para FitCoach50
'academy_starter': 'cemyp2n_668537',       // → Pode mapear para FitCoach100
'academy_growth': 'vi6djzq_668541',        // → Pode mapear para FitCoach200
'academy_pro': '3dis6ds_668546',           // → Pode mapear para FitCoach400
```

### **Opção 2: Migrar Planos Antigos**

1. Atualizar todas as academias existentes no banco para os novos planos:
   ```sql
   -- Exemplo: Migrar academy_starter_mini → FitCoach50
   UPDATE companies
   SET plano = 'FitCoach50'
   WHERE plan_type = 'academy_starter_mini';
   ```

2. Desativar produtos antigos na Cakto (ou redirecionar para novos)

---

## ✅ 6. CHECKLIST DE CONFIGURAÇÃO

### **Na Cakto:**

- [ ] Criar produto **FitCoach50** (50 alunos)
- [ ] Criar produto **FitCoach100** (100 alunos)
- [ ] Criar produto **FitCoach200** (200 alunos)
- [ ] Criar produto **FitCoach400** (400 alunos)
- [ ] Criar produto **FitCoach500** (500 alunos)
- [ ] Criar produto **FitVoice20** (R$ 5,00)
- [ ] Criar produto **FitVoice60** (R$ 12,90)
- [ ] Criar produto **FitVoice120** (R$ 19,90)
- [ ] Configurar URL de retorno para cada produto
- [ ] Configurar webhook (`cakto-webhook`)
- [ ] Anotar todos os Checkout IDs

### **No Código:**

- [ ] Atualizar `services/caktoService.ts` com novos Checkout IDs
- [ ] Atualizar `services/recargaService.ts` com IDs das recargas
- [ ] Testar webhook com produtos novos
- [ ] Verificar se webhook processa corretamente os novos planos

### **No Banco de Dados:**

- [ ] Verificar se as academias existentes têm planos configurados
- [ ] Migrar planos antigos para novos (se necessário)
- [ ] Testar criação de recarga no banco

---

## 🧪 7. TESTAR INTEGRAÇÃO

### **Testar Checkout de Academia:**

1. Criar checkout para FitCoach50:
   ```typescript
   const url = getCaktoCheckoutUrl('FitCoach50');
   // Deve retornar: https://pay.cakto.com.br/[CHECKOUT_ID]
   ```

2. Fazer pagamento de teste na Cakto
3. Verificar se webhook processa corretamente
4. Verificar se academia é atualizada no banco

### **Testar Recarga FitVoice:**

1. Criar recarga:
   ```typescript
   const { checkoutUrl } = await criarRecarga(userId, 'FitVoice20');
   // Deve redirecionar para checkout da Cakto
   ```

2. Fazer pagamento de teste
3. Verificar se webhook processa a recarga
4. Verificar se minutos são adicionados ao `saldo_voz_extra`

---

## 📞 8. SUPORTE

Se tiver dúvidas sobre:
- **Criar produtos na Cakto**: Consulte a documentação da Cakto
- **Configurar webhook**: Veja `docs/CONFIGURAR_URL_RETORNO_CAKTO.md`
- **Mapeamento de planos**: Veja `supabase/functions/cakto-webhook/index.ts`

---

**Data:** 2026-01-18  
**Versão:** 1.0
