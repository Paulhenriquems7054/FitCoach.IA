# Análise do Payload do Cakto

## 📋 Estrutura do Payload Recebido

Baseado no log do webhook, o Cakto envia o seguinte formato:

```json
{
  "secret": "cdb5fa7e-4e82-4260-91e7-b13c4b09d1b1",
  "event": "purchase_approved",
  "data": {
    "id": "c088fd29-886b-45b6-8bd8-30c01faaffd1",
    "refId": "CYZL4VX",
    "checkout": 123,  // ⚠️ Número, não ID de checkout
    "checkoutUrl": "https://pay.cakto.com.br/EXAMPLE?utm_source=test&...",
    "customer": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "34999999999",
      "docNumber": "12345678909",
      "docType": "cpf"
    },
    "product": {
      "id": "ff3fdf61-e88f-43b5-982a-32d50f112414",
      "short_id": "AckhQ75",  // ✅ Pode ser usado como fallback
      "name": "Produto Teste"
    },
    "offer": {
      "id": "B8BcHrY",  // ✅ Pode ser usado como fallback
      "name": "Special Offer",
      "price": 10
    },
    "amount": 90,
    "baseAmount": 100,
    "status": "paid",
    "subscription": {
      "id": "21303ebd-b49b-489e-bc87-6a27da620a22",
      "status": "active"
    }
  }
}
```

## 🔍 Problema Identificado

O webhook estava procurando por:
- `body.data.checkout_id` ❌ (não existe)
- `body.data.checkoutId` ❌ (não existe)

Mas o Cakto envia:
- `body.data.checkout` ✅ (número: 123)
- `body.data.checkoutUrl` ✅ (URL completa)

## ✅ Solução Implementada

O webhook agora:

1. **Tenta múltiplas fontes para checkout_id:**
   ```typescript
   checkoutId = 
     body?.data?.checkout_id ||      // Formato direto
     body?.data?.checkoutId ||       // Formato camelCase
     body?.data?.checkout?.toString() ||  // Número do checkout
     "";
   ```

2. **Extrai da checkoutUrl se necessário:**
   ```typescript
   if (!checkoutId && body?.data?.checkoutUrl) {
     const urlMatch = body.data.checkoutUrl.match(/pay\.cakto\.com\.br\/([^/?]+)/);
     if (urlMatch && urlMatch[1]) {
       checkoutId = urlMatch[1].split('?')[0];
     }
   }
   ```

3. **Usa fallbacks:**
   ```typescript
   if (!checkoutId) {
     checkoutId = body?.data?.product?.short_id || 
                  body?.data?.offer?.id || 
                  "";
   }
   ```

4. **Extrai email de múltiplas fontes:**
   ```typescript
   customerEmail = 
     body?.data?.customer_email || 
     body?.data?.customer?.email || 
     body?.data?.buyer?.email || 
     "";
   ```

## 📊 Campos Mapeados

| Campo Webhook | Fonte no Payload Cakto |
|--------------|------------------------|
| `checkoutId` | `data.checkout` (número) ou extraído de `data.checkoutUrl` |
| `transactionId` | `data.id` |
| `amountPaid` | `data.amount` ou `data.baseAmount` |
| `customerEmail` | `data.customer.email` ou `data.customer_email` |

## 🧪 Teste com Payload Real

Agora o webhook deve processar corretamente eventos de teste do Cakto que usam o formato real da API.

## ⚠️ Nota sobre Eventos de Teste

Eventos de teste do Cakto podem usar IDs fictícios (como `EXAMPLE` na URL). Para testes reais, use:
- Um `checkout_id` real de um produto cadastrado
- Ou configure o webhook para aceitar IDs de teste

