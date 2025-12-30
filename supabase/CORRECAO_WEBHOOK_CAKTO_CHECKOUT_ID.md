# Correção do Webhook Cakto - Erro `cakto_checkout_id does not exist`

## 🔴 Problema Identificado

O webhook estava tentando buscar planos usando uma coluna `cakto_checkout_id` que **não existe** na tabela `subscription_plans`.

**Erro:**
```
column subscription_plans.cakto_checkout_id does not exist
```

## ✅ Solução Implementada

### 1. Removida busca por `cakto_checkout_id`
A tabela `subscription_plans` **não possui** a coluna `cakto_checkout_id`. Ela possui apenas:
- `checkout_url_monthly` - URL do checkout mensal
- `checkout_url_yearly` - URL do checkout anual

### 2. Busca apenas por URLs
O webhook agora busca planos apenas usando `checkout_url_monthly` e `checkout_url_yearly`:

```typescript
// Limpar checkoutId (remover query params e paths)
const cleanCheckoutId = checkoutId.includes('/') 
  ? checkoutId.split('/').pop()?.split('?')[0] 
  : checkoutId.split('?')[0];

// Buscar planos que tenham esse ID nas URLs
let { data: plans, error: plansError } = await supabase
  .from("subscription_plans")
  .select("*")
  .or(`checkout_url_monthly.ilike.%${cleanCheckoutId}%,checkout_url_yearly.ilike.%${cleanCheckoutId}%`);
```

### 3. Tratamento de eventos de teste
Eventos de teste do Cakto usam `checkout_id: 123` ou `checkoutUrl: "https://pay.cakto.com.br/EXAMPLE"`, que não correspondem a planos reais. O webhook agora:

- Detecta eventos de teste (`EXAMPLE` ou `123`)
- Retorna status 200 com mensagem informativa (não erro 404)
- Loga o evento para auditoria

```typescript
if (cleanCheckoutId === "EXAMPLE" || cleanCheckoutId === "123") {
  console.log("Evento de teste detectado (checkout_id: EXAMPLE/123). Em produção, use um checkout_id real.");
  return new Response("Evento de teste - checkout_id não corresponde a plano real", { status: 200 });
}
```

### 4. Correção de referências a `plan.cakto_checkout_id`
Todas as referências a `plan.cakto_checkout_id` foram substituídas por `cleanCheckoutId` (extraído do payload).

### 5. Correção de referências a `plan.slug`
A tabela `subscription_plans` usa `name`, não `slug`. Todas as referências foram corrigidas para usar `plan.name || plan.slug` (fallback para compatibilidade).

## 📋 Mudanças no Código

### Antes:
```typescript
// ❌ Tentava buscar por coluna inexistente
let { data: plan } = await supabase
  .from("subscription_plans")
  .select("*")
  .eq("cakto_checkout_id", checkoutId) // ERRO: coluna não existe
  .maybeSingle();

// ❌ Usava plan.cakto_checkout_id que não existe
cakto_checkout_id: plan.cakto_checkout_id
```

### Depois:
```typescript
// ✅ Busca apenas por URLs
const cleanCheckoutId = checkoutId.includes('/') 
  ? checkoutId.split('/').pop()?.split('?')[0] 
  : checkoutId.split('?')[0];

let { data: plans } = await supabase
  .from("subscription_plans")
  .select("*")
  .or(`checkout_url_monthly.ilike.%${cleanCheckoutId}%,checkout_url_yearly.ilike.%${cleanCheckoutId}%`);

// ✅ Usa cleanCheckoutId extraído do payload
cakto_checkout_id: cleanCheckoutId
```

## 🧪 Como Testar

### 1. Evento de teste do Cakto
O webhook agora aceita eventos de teste sem retornar erro:
- `checkout_id: 123` → Retorna 200 com mensagem informativa
- `checkoutUrl: "https://pay.cakto.com.br/EXAMPLE"` → Retorna 200 com mensagem informativa

### 2. Evento real de pagamento
Para testar com um evento real, use um `checkout_id` que corresponda a um plano no banco:

```bash
curl -X POST https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: SEU_SECRET" \
  -d '{
    "event": "purchase_approved",
    "data": {
      "checkout": 123,
      "checkoutUrl": "https://pay.cakto.com.br/3ujuqzz_703304",
      "id": "test_123",
      "amount": 34.90,
      "customer": {
        "email": "teste@email.com"
      }
    }
  }'
```

### 3. Verificar logs
No Dashboard do Supabase → Edge Functions → cakto-webhook → Logs, procure por:
- ✅ "checkout_id encontrado: [valor]"
- ✅ "Buscando plano com checkout_id limpo: [valor]"
- ✅ "Plano encontrado via checkout_url: [nome]"

## 📝 Notas Importantes

1. **Eventos de teste**: O Cakto envia eventos de teste com `checkout_id: 123` ou `checkoutUrl: "https://pay.cakto.com.br/EXAMPLE"`. Esses não correspondem a planos reais e são tratados como eventos de teste.

2. **Eventos reais**: Em produção, os eventos reais terão `checkout_id` válidos que correspondem aos planos cadastrados (ex: `3ujuqzz_703304`, `xphpm5f_703310`).

3. **Extração do checkout_id**: O webhook agora extrai o `checkout_id` de múltiplas fontes:
   - `data.checkout` (número)
   - `data.checkoutUrl` (URL completa)
   - `data.checkout_id` ou `data.checkoutId` (formato direto)

4. **Limpeza do checkout_id**: O `checkout_id` é limpo antes da busca (remove query params e paths):
   - `"https://pay.cakto.com.br/3ujuqzz_703304?utm_source=test"` → `"3ujuqzz_703304"`
   - `"123"` → `"123"`

## ✅ Status

- ✅ Erro `cakto_checkout_id does not exist` corrigido
- ✅ Busca de planos funcionando via `checkout_url_monthly` e `checkout_url_yearly`
- ✅ Tratamento de eventos de teste implementado
- ✅ Referências a `plan.cakto_checkout_id` corrigidas
- ✅ Referências a `plan.slug` corrigidas para `plan.name || plan.slug`

