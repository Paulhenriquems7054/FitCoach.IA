# Guia de Configuração do Webhook no Painel da Cakto

## ✅ Status Atual

- ✅ Edge Function deployada com sucesso
- ✅ URL do webhook: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`

## 📋 Configuração no Painel da Cakto

### Passo 1: Acessar Configurações de Webhook

1. Faça login no painel da Cakto
2. Vá em **Configurações** ou **Webhooks** (localização pode variar)
3. Procure por **Webhooks** ou **Notificações**

### Passo 2: Adicionar Novo Webhook

Preencha os seguintes campos:

#### URL do Webhook
```
https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook
```

#### Método HTTP
```
POST
```

#### Headers (Cabeçalhos)

Adicione os seguintes headers:

| Chave | Valor |
|-------|-------|
| `Content-Type` | `application/json` |
| `x-webhook-secret` | `[VALOR DO CAKTO_WEBHOOK_SECRET]` |

**Importante**: O valor de `x-webhook-secret` deve ser o mesmo configurado na variável `CAKTO_WEBHOOK_SECRET` no Supabase.

#### Eventos (Events)

Selecione ou adicione os seguintes eventos:

- ✅ `payment.completed` - Pagamento concluído
- ✅ `payment.paid` - Pagamento confirmado
- ✅ `subscription.created` - Assinatura criada
- ✅ `subscription.payment_succeeded` - Pagamento de assinatura bem-sucedido

#### Status
```
Ativo / Habilitado
```

### Passo 3: Salvar Configuração

Salve a configuração do webhook.

## 🔍 Como Verificar o Secret

O secret configurado no Supabase está em:
- Dashboard do Supabase → Edge Functions → Settings → Secrets
- Variável: `CAKTO_WEBHOOK_SECRET`

**Nota**: Se você não souber o valor exato do secret, você pode:
1. Verificar no dashboard do Supabase (mas não mostra o valor completo por segurança)
2. Se necessário, criar um novo secret no Supabase e atualizar no Cakto

## 🧪 Teste Rápido

Após configurar, você pode testar usando curl:

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

**Resposta esperada**: `OK` com status 200

## ⚠️ Notas Importantes

1. **Secret do Webhook**: 
   - Deve ser o mesmo valor em `CAKTO_WEBHOOK_SECRET` no Supabase
   - Se `SKIP_CAKTO_WEBHOOK_AUTH=true`, o webhook aceita qualquer secret (apenas para testes)

2. **URL do Webhook**:
   - Deve ser exatamente: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`
   - Certifique-se de usar HTTPS

3. **Eventos**:
   - Configure todos os eventos listados acima
   - Isso garante que o webhook será chamado em todos os cenários de pagamento

4. **Logs**:
   - Após configurar, monitore os logs no Supabase Dashboard
   - Vá em: Edge Functions → cakto-webhook → Logs

## 📊 Verificar se Está Funcionando

Após fazer um pagamento de teste:

1. **Verificar logs do Supabase**:
   - Dashboard → Edge Functions → cakto-webhook → Logs
   - Procure por entradas recentes

2. **Verificar assinatura criada**:
   ```sql
   SELECT * FROM user_subscriptions 
   WHERE payment_provider = 'cakto' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

3. **Verificar logs de auditoria**:
   ```sql
   SELECT * FROM audit_logs 
   WHERE event_type LIKE '%webhook%' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

## 🆘 Problemas Comuns

### Webhook não está sendo chamado

1. Verifique se a URL está correta
2. Verifique se o webhook está ativo/habilitado no Cakto
3. Verifique os logs do Cakto (se disponível)
4. Teste manualmente com curl

### Erro 401 Unauthorized

1. Verifique se o `x-webhook-secret` no header corresponde ao `CAKTO_WEBHOOK_SECRET`
2. Ou configure `SKIP_CAKTO_WEBHOOK_AUTH=true` temporariamente para testes

### Erro 404 Not Found

1. Verifique se a URL está correta
2. Verifique se a Edge Function foi deployada corretamente
3. Tente acessar a URL no navegador (deve retornar "Method not allowed" se estiver funcionando)

## ✅ Checklist Final

- [ ] Webhook configurado no painel da Cakto
- [ ] URL correta: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`
- [ ] Header `x-webhook-secret` configurado com o valor correto
- [ ] Eventos selecionados: `payment.completed`, `payment.paid`, `subscription.created`, `subscription.payment_succeeded`
- [ ] Webhook está ativo/habilitado
- [ ] Teste manual executado com sucesso
- [ ] Logs do Supabase mostram webhooks recebidos

