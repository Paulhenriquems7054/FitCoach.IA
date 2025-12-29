# Status da Configuração do Webhook da Cakto

## ✅ Configuração Completa

### 1. Função SQL
- ✅ **Função `get_user_id_by_email` criada** - Permite buscar usuário por email em `auth.users`
- ✅ **Migração executada com sucesso**

### 2. Edge Function
- ✅ **Código atualizado** - Webhook processa planos individuais (B2C)
- ✅ **Deploy necessário**: Execute `supabase functions deploy cakto-webhook` se ainda não fez

### 3. Variáveis de Ambiente
Todas as variáveis necessárias estão configuradas no Supabase:

| Variável | Status | Descrição |
|----------|--------|-----------|
| `SUPABASE_URL` | ✅ Configurado | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configurado | Chave de serviço para acessar o banco |
| `CAKTO_WEBHOOK_SECRET` | ✅ Configurado | Secret para validar webhooks da Cakto |
| `SKIP_CAKTO_WEBHOOK_AUTH` | ✅ Configurado | Flag para pular autenticação (usar apenas em testes) |
| `RESEND_API_KEY` | ✅ Configurado | Chave da API Resend para emails |
| `EMAIL_FROM` | ✅ Configurado | Email remetente |

### 4. Webhook no Cakto
- ✅ **URL Configurada**: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`
- ⚠️ **Verificar**: Headers e eventos configurados no painel da Cakto

## 📋 Checklist de Verificação

### No Painel da Cakto, verifique se está configurado:

- [ ] **URL do Webhook**: `https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook`
- [ ] **Método**: `POST`
- [ ] **Header**: `x-webhook-secret` com o mesmo valor de `CAKTO_WEBHOOK_SECRET`
- [ ] **Content-Type**: `application/json`
- [ ] **Eventos configurados**:
  - `payment.completed`
  - `payment.paid`
  - `subscription.created`
  - `subscription.payment_succeeded`

### No Supabase:

- [x] Função SQL `get_user_id_by_email` criada
- [ ] Edge Function `cakto-webhook` deployada (verificar)
- [x] Variáveis de ambiente configuradas

### Planos no Banco de Dados:

Execute esta query para verificar se os planos estão configurados:

```sql
SELECT 
  id,
  name,
  display_name,
  plan_category,
  plan_group,
  checkout_url_monthly,
  checkout_url_yearly,
  price_monthly,
  price_yearly
FROM subscription_plans
WHERE plan_category = 'b2c_ai' OR plan_group = 'b2c'
ORDER BY price_monthly;
```

**Deve retornar**:
- Plano Mensal com `checkout_url_monthly` contendo `3ujuqzz_703304`
- Plano Anual com `checkout_url_yearly` contendo `xphpm5f_703310`

## 🧪 Próximo Passo: Testar

Consulte `TESTAR_WEBHOOK_CAKTO.md` para:
1. Como fazer teste manual com curl
2. Como verificar resultados
3. Troubleshooting de problemas comuns

## 🔍 Verificar Deploy da Edge Function

Para verificar se a Edge Function está com a versão mais recente:

```bash
# Verificar versão atual
supabase functions list

# Fazer deploy se necessário
supabase functions deploy cakto-webhook
```

## 📊 Monitoramento

Após configurar, monitore os logs:

1. **Logs da Edge Function**: Supabase Dashboard > Edge Functions > cakto-webhook > Logs
2. **Logs de Auditoria**: Execute a query em `TESTAR_WEBHOOK_CAKTO.md`
3. **Assinaturas Criadas**: Verifique a tabela `user_subscriptions`

## ⚠️ Notas Importantes

1. **SKIP_CAKTO_WEBHOOK_AUTH**: 
   - Se estiver como `true`, a autenticação do webhook será ignorada (útil para testes)
   - Para produção, configure como `false` e garanta que o `CAKTO_WEBHOOK_SECRET` corresponda ao header enviado pela Cakto

2. **Secret do Webhook**:
   - O valor de `CAKTO_WEBHOOK_SECRET` no Supabase deve ser o mesmo configurado no header `x-webhook-secret` no painel da Cakto
   - Isso garante que apenas a Cakto possa chamar o webhook

3. **Email do Usuário**:
   - O webhook precisa do email do cliente no payload
   - O email deve corresponder a um usuário existente em `auth.users`

## ✅ Status Final

Tudo está configurado e pronto para processar pagamentos! 

**Última verificação necessária**: Fazer deploy da Edge Function atualizada (se ainda não foi feito).

