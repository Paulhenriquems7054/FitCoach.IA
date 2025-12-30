# Solução: Erro 422 ao Testar Webhook do Cakto

## 🔴 Problema

Ao tentar enviar um evento de teste do Cakto, você recebe:
```
api.cakto.com.br/api/app/events/30489/test/?event=purchase_approved:1  
Failed to load resource: the server responded with a status of 422 ()
```

## 🔍 Causa

O erro 422 (Unprocessable Entity) do Cakto geralmente indica:
1. **Evento não configurado**: O evento `purchase_approved` pode não estar disponível ou configurado
2. **Formato incorreto**: O payload do evento pode estar faltando campos obrigatórios
3. **Webhook não configurado**: O webhook pode não estar ativo ou configurado corretamente

## ✅ Soluções

### Solução 1: Usar Eventos Suportados

O webhook do Supabase aceita os seguintes eventos:

- ✅ `payment.completed` - **Recomendado para testes**
- ✅ `payment.paid` - Pagamento confirmado
- ✅ `subscription.created` - Assinatura criada
- ✅ `subscription.payment_succeeded` - Pagamento de assinatura bem-sucedido
- ✅ `purchase_approved` - **Agora suportado** (após atualização)
- ✅ `purchase.completed` - Compra concluída
- ✅ `checkout.completed` - Checkout concluído

**Recomendação**: Use `payment.completed` para testes, pois é o mais comum e bem suportado.

### Solução 2: Verificar Configuração do Webhook no Cakto

1. **Acesse o painel da Cakto**
2. **Vá em Configurações → Webhooks**
3. **Verifique se o webhook está:**
   - ✅ Ativo/Habilitado
   - ✅ URL correta: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`
   - ✅ Método: `POST`
   - ✅ Headers configurados:
     - `Content-Type: application/json`
     - `x-webhook-secret: [SEU_SECRET]`

### Solução 3: Testar com curl (Bypass do Painel Cakto)

Se o painel do Cakto estiver dando erro, teste diretamente:

```bash
curl -X POST https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: SEU_SECRET_AQUI" \
  -d '{
    "event": "payment.completed",
    "data": {
      "checkout_id": "3ujuqzz_703304",
      "id": "test_123",
      "amount": 34.90,
      "customer_email": "teste@email.com"
    }
  }'
```

### Solução 4: Usar Script PowerShell de Teste

Use o script fornecido:

```powershell
cd D:\FitCoach.IA
.\supabase\testar_webhook.ps1 -Email "seu-email@exemplo.com" -CheckoutId "3ujuqzz_703304"
```

### Solução 5: Verificar Logs do Supabase

1. **Acesse**: Dashboard do Supabase → Edge Functions → cakto-webhook → Logs
2. **Procure por**:
   - Erros de autenticação
   - Payloads recebidos
   - Mensagens de erro

## 📋 Checklist de Verificação

- [ ] Webhook está ativo no painel da Cakto
- [ ] URL do webhook está correta
- [ ] Headers estão configurados (`Content-Type` e `x-webhook-secret`)
- [ ] Evento usado está na lista de suportados
- [ ] Secret do webhook está correto (mesmo do Supabase)
- [ ] Edge Function está deployada no Supabase
- [ ] Variáveis de ambiente estão configuradas no Supabase

## 🔧 Eventos Suportados pelo Webhook

Após a atualização, o webhook aceita:

```typescript
const isPaidEvent =
  eventType === "payment.completed" ||      // ✅ Mais comum
  eventType === "payment.paid" ||
  eventType === "subscription.created" ||
  eventType === "subscription.payment_succeeded" ||
  eventType === "purchase_approved" ||      // ✅ Agora suportado
  eventType === "purchase.completed" ||
  eventType === "checkout.completed";
```

## 🧪 Teste Recomendado

**Use este payload para teste:**

```json
{
  "event": "payment.completed",
  "data": {
    "checkout_id": "3ujuqzz_703304",
    "id": "test_payment_123",
    "amount": 34.90,
    "customer_email": "teste@email.com"
  }
}
```

## ⚠️ Notas Importantes

1. **Erro 422 do Cakto**: Geralmente significa que o evento não está disponível ou o formato está incorreto
2. **Erro 401 do Supabase**: Significa que o secret está incorreto
3. **Erro 404 do Supabase**: Significa que o plano não foi encontrado para o `checkout_id`
4. **Erro 200 com "Evento ignorado"**: Significa que o evento não é de pagamento confirmado

## 📞 Próximos Passos

1. Tente usar `payment.completed` em vez de `purchase_approved`
2. Verifique os logs do Supabase para ver o que está sendo recebido
3. Se ainda não funcionar, verifique a documentação da Cakto sobre eventos disponíveis

