# Como Testar o Webhook da Cakto

## 🚀 Métodos de Teste

### Método 1: Script PowerShell (Recomendado)

#### Teste Básico (com checkout_id de teste)
```powershell
.\supabase\testar_webhook_cakto.ps1
```

Este script envia um evento de teste com `checkout_id: 123` (evento de teste do Cakto).

#### Teste com Checkout ID Real
```powershell
# Teste com plano mensal (R$ 34,90)
.\supabase\testar_webhook_cakto_real.ps1 -CheckoutId "3ujuqzz_703304" -Email "seu-email@teste.com"

# Teste com plano anual (R$ 297,00)
.\supabase\testar_webhook_cakto_real.ps1 -CheckoutId "xphpm5f_703310" -Email "seu-email@teste.com"

# Teste com evento diferente
.\supabase\testar_webhook_cakto_real.ps1 -CheckoutId "3ujuqzz_703304" -Email "teste@email.com" -EventType "payment.completed"
```

### Método 2: curl (Terminal/CMD)

#### Teste Básico
```bash
curl -X POST https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"purchase_approved\",\"data\":{\"checkout\":123,\"checkoutUrl\":\"https://pay.cakto.com.br/EXAMPLE\",\"id\":\"test_123\",\"amount\":34.90,\"customer\":{\"email\":\"teste@email.com\"}}}"
```

#### Teste com Checkout ID Real
```bash
curl -X POST https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"purchase_approved\",\"data\":{\"checkout\":\"3ujuqzz_703304\",\"checkoutUrl\":\"https://pay.cakto.com.br/3ujuqzz_703304\",\"id\":\"test_123\",\"amount\":34.90,\"customer\":{\"email\":\"teste@email.com\"}}}"
```

### Método 3: Postman ou Insomnia

1. **Método**: `POST`
2. **URL**: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`
3. **Headers**:
   - `Content-Type: application/json`
   - `x-webhook-secret: seu-secret` (opcional, se `SKIP_CAKTO_WEBHOOK_AUTH=false`)
4. **Body** (JSON):
```json
{
  "secret": "cdb5fa7e-4e82-4260-91e7-b13c4b09d1b1",
  "event": "purchase_approved",
  "data": {
    "id": "test_123",
    "refId": "TEST1234",
    "customer": {
      "name": "Teste Usuario",
      "email": "teste@email.com",
      "phone": "34999999999",
      "docNumber": "12345678909",
      "docType": "cpf"
    },
    "checkout": "3ujuqzz_703304",
    "checkoutUrl": "https://pay.cakto.com.br/3ujuqzz_703304",
    "status": "paid",
    "amount": 34.90,
    "paymentMethod": "credit_card",
    "paidAt": "2025-12-30T14:00:00.000Z",
    "createdAt": "2025-12-30T14:00:00.000Z"
  }
}
```

## 🔍 Verificar Resultados

### 1. Verificar Logs do Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá em **Edge Functions** → **cakto-webhook** → **Logs**
3. Procure por:
   - ✅ "Payload Cakto recebido"
   - ✅ "checkout_id encontrado"
   - ✅ "Plano encontrado via checkout_url"
   - ✅ "Assinatura B2C criada" ou "Assinatura B2C atualizada"

### 2. Verificar Assinatura Criada

Execute no SQL Editor do Supabase:

```sql
-- Verificar assinaturas recentes
SELECT 
  us.id,
  us.user_id,
  u.email,
  sp.display_name,
  sp.name,
  us.status,
  us.billing_cycle,
  us.current_period_start,
  us.current_period_end,
  us.cakto_transaction_id,
  us.cakto_checkout_id,
  us.created_at
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
LEFT JOIN users u ON u.id = us.user_id
WHERE us.payment_provider = 'cakto'
ORDER BY us.created_at DESC
LIMIT 10;
```

### 3. Verificar Status do Usuário

```sql
-- Verificar se o status foi atualizado
SELECT 
  id,
  email,
  subscription_status,
  updated_at
FROM users
WHERE email = 'teste@email.com';
```

### 4. Verificar Logs de Auditoria

```sql
-- Verificar eventos registrados
SELECT 
  event_type,
  metadata,
  created_at
FROM audit_logs
WHERE event_type LIKE '%webhook%' 
   OR event_type LIKE '%b2c%'
   OR event_type LIKE '%academy%'
ORDER BY created_at DESC
LIMIT 20;
```

## ⚠️ Troubleshooting

### Erro: "Plano não encontrado"

1. Verifique se o `checkout_id` está correto:
```sql
SELECT 
  id,
  name,
  display_name,
  checkout_url_monthly,
  checkout_url_yearly
FROM subscription_plans
WHERE plan_category = 'b2c_ai' 
   OR plan_group = 'b2c';
```

2. Verifique se os IDs correspondem:
   - Mensal: deve conter `3ujuqzz_703304`
   - Anual: deve conter `xphpm5f_703310`

### Erro: "Usuário não encontrado"

1. Verifique se o usuário existe:
```sql
SELECT id, email FROM users WHERE email = 'teste@email.com';
```

2. Se o usuário não existir, crie um primeiro:
```sql
-- Criar usuário de teste (ajuste conforme necessário)
INSERT INTO users (email, subscription_status)
VALUES ('teste@email.com', 'trial')
ON CONFLICT (email) DO NOTHING;
```

### Erro: "Unauthorized"

1. Verifique se `SKIP_CAKTO_WEBHOOK_AUTH=true` está configurado no Supabase
2. Ou adicione o header `x-webhook-secret` com o valor correto

### Webhook retorna 200 mas não cria assinatura

1. Verifique os logs do Supabase para ver se há erros
2. Verifique se o evento é do tipo correto (`purchase_approved`, `payment.completed`, etc.)
3. Verifique se o `checkout_id` corresponde a um plano cadastrado

## 📊 Checklist de Validação

Após executar o teste, verifique:

- [ ] Webhook retornou status 200
- [ ] Logs mostram "Payload Cakto recebido"
- [ ] Logs mostram "Plano encontrado"
- [ ] Assinatura criada na tabela `user_subscriptions`
- [ ] Status do usuário atualizado para `'active'`
- [ ] Logs de auditoria registrando eventos
- [ ] Pagamento registrado na tabela `payments` (se existir)

## 🎯 Próximos Passos

1. ✅ Teste básico executado
2. ✅ Teste com checkout_id real executado
3. ✅ Verificar logs e resultados
4. ✅ Configurar webhook para produção no Cakto
5. ✅ Monitorar logs regularmente

## 📝 Notas Importantes

- **Eventos de teste**: O Cakto envia eventos de teste com `checkout_id: 123` ou `checkoutUrl: "https://pay.cakto.com.br/EXAMPLE"`. Esses são tratados como eventos de teste e retornam 200 com mensagem informativa.

- **Eventos reais**: Em produção, os eventos terão `checkout_id` válidos que correspondem aos planos cadastrados.

- **Autenticação**: Se `SKIP_CAKTO_WEBHOOK_AUTH=true`, não é necessário enviar o header `x-webhook-secret`.

