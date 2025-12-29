# Como Testar o Webhook da Cakto

## ✅ Status Atual

- ✅ Função SQL `get_user_id_by_email` criada
- ✅ Webhook configurado no Cakto: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`
- ✅ Edge Function atualizada e pronta

## 🧪 Opção 1: Teste Manual com curl

Execute no terminal:

```bash
curl -X POST https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: seu-secret-aqui" \
  -d '{
    "event": "payment.completed",
    "data": {
      "checkout_id": "3ujuqzz_703304",
      "id": "test_payment_123",
      "amount": 34.90,
      "customer_email": "teste@email.com"
    }
  }'
```

**Nota**: Substitua `seu-secret-aqui` pelo valor configurado em `CAKTO_WEBHOOK_SECRET` no Supabase, ou remova o header se `SKIP_CAKTO_WEBHOOK_AUTH=true`.

## 🧪 Opção 2: Teste com Pagamento Real

1. Acesse o link de checkout mensal: `https://pay.cakto.com.br/3ujuqzz_703304`
2. Complete o pagamento de teste (se o Cakto permitir)
3. O webhook será chamado automaticamente pelo Cakto

## 🔍 Verificar Resultados

### 1. Verificar Logs da Edge Function

No painel do Supabase:
1. Vá em **Edge Functions** > **cakto-webhook** > **Logs**
2. Procure por entradas recentes
3. Verifique se há erros ou mensagens de sucesso

### 2. Verificar Assinatura Criada

Execute no SQL Editor do Supabase:

```sql
-- Verificar assinaturas recentes criadas via webhook
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
LEFT JOIN auth.users u ON u.id = us.user_id
WHERE us.payment_provider = 'cakto'
ORDER BY us.created_at DESC
LIMIT 10;
```

### 3. Verificar Status do Usuário

```sql
-- Verificar se o status do usuário foi atualizado
SELECT 
  id,
  email,
  subscription_status,
  updated_at
FROM users
WHERE email = 'email-do-teste@email.com';
```

### 4. Verificar Logs de Auditoria

```sql
-- Verificar eventos registrados
SELECT 
  event_type,
  metadata,
  created_at
FROM audit_logs
WHERE event_type LIKE '%webhook%' OR event_type LIKE '%b2c%'
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
WHERE plan_category = 'b2c_ai' OR plan_group = 'b2c';
```

2. Verifique se os IDs correspondem:
   - Mensal: deve conter `3ujuqzz_703304`
   - Anual: deve conter `xphpm5f_703310`

### Erro: "Usuário não encontrado"

1. Verifique se o usuário existe:
```sql
SELECT id, email FROM auth.users WHERE email = 'email-do-teste@email.com';
```

2. Verifique se a função RPC foi criada:
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_user_id_by_email';
```

3. Teste a função manualmente:
```sql
SELECT * FROM get_user_id_by_email('email-do-teste@email.com');
```

### Erro: "Unauthorized"

1. Verifique se o `x-webhook-secret` no header corresponde ao `CAKTO_WEBHOOK_SECRET`
2. Ou configure `SKIP_CAKTO_WEBHOOK_AUTH=true` temporariamente para testes

### Webhook não está sendo chamado

1. Verifique a configuração no painel da Cakto
2. Verifique se a URL está correta: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`
3. Verifique se os eventos estão configurados corretamente
4. Verifique os logs do Cakto (se disponível)

## 📊 Monitoramento Contínuo

Para monitorar webhooks recebidos em produção:

```sql
-- Últimos webhooks processados
SELECT 
  event_type,
  metadata->>'checkoutId' as checkout_id,
  metadata->>'transactionId' as transaction_id,
  metadata->>'status' as status,
  created_at
FROM audit_logs
WHERE event_type IN ('webhook_received', 'webhook_processed', 'b2c_plan_activated', 'webhook_error')
ORDER BY created_at DESC
LIMIT 50;
```

## ✅ Checklist de Validação

- [ ] Função `get_user_id_by_email` criada e funcionando
- [ ] Webhook configurado no Cakto com URL correta
- [ ] Variáveis de ambiente configuradas no Supabase
- [ ] Teste manual executado com sucesso
- [ ] Assinatura criada na tabela `user_subscriptions`
- [ ] Status do usuário atualizado para `'active'`
- [ ] Logs de auditoria registrando eventos corretamente
- [ ] Pagamento registrado na tabela `payments` (se existir)

## 🎯 Próximos Passos Após Teste Bem-Sucedido

1. Configurar webhook para produção no Cakto
2. Monitorar logs regularmente
3. Configurar alertas para erros (opcional)
4. Documentar processo de resolução de problemas

