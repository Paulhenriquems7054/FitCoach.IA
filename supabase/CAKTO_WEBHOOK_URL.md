# URL do Webhook para Cakto

## URL Principal (Recomendada)

```
https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook
```

## Configuração no Cakto

1. **URL**: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`
2. **Método**: `POST`
3. **Headers**: 
   - `x-webhook-secret: seu-secret-aqui` (mesmo valor configurado em `CAKTO_WEBHOOK_SECRET`)
   - `Content-Type: application/json`
4. **Eventos**: 
   - `payment.completed`
   - `payment.paid`
   - `subscription.created`
   - `subscription.payment_succeeded`

## Funcionalidades Suportadas

O webhook processa automaticamente:

- ✅ **Planos Individuais (B2C)**: Mensal (R$ 34,90) e Anual (R$ 297,00)
- ✅ **Planos para Academias (B2B)**: Starter Mini, Pack Starter, Pack Growth, Pack Pro
- ✅ **Recargas**: Turbo, Banco de Voz, Passe Livre
- ✅ **Ativação automática de assinaturas** na tabela `user_subscriptions`
- ✅ **Atualização do status do usuário** para `active`
- ✅ **Registro de pagamentos** na tabela `payments`

## Verificar se a URL está acessível

Você pode testar a URL manualmente usando curl ou Postman:

```bash
curl -X POST https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: seu-secret-aqui" \
  -d '{"event": "payment.completed", "data": {"checkout_id": "3ujuqzz_703304", "id": "test_123", "amount": 34.90, "customer_email": "teste@email.com"}}'
```

## Documentação Completa

Para mais detalhes sobre configuração, troubleshooting e monitoramento, consulte:
- `CONFIGURACAO_WEBHOOK_CAKTO.md`

