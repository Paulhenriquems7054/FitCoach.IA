# 🔍 Guia de Verificação do Webhook Cakto

## 📋 Checklist de Configuração

### 1. ✅ URL do Webhook no Supabase

A URL do webhook deve estar no formato:
```
https://[PROJECT_REF].supabase.co/functions/v1/cakto-webhook
```

**Para o seu projeto (`fit-coach-ia`):**
```
https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook
```

**Como verificar:**
1. Acesse: https://supabase.com/dashboard/project/dbugchiwqwnrnnnsszel/functions
2. Clique em `cakto-webhook`
3. Copie a URL exibida (deve terminar com `/cakto-webhook`)

---

### 2. ✅ Secret do Webhook

**No Supabase:**
- Variável: `CAKTO_WEBHOOK_SECRET`
- Valor atual: `796bcdf3be46ec76495f280207af7d11ed7e2fbe58f2249b8680fce5b5b5db91`

**Na Cakto:**
- O campo "Chave secreta do webhook" deve ter **exatamente** o mesmo valor
- **Formato esperado:** A Cakto deve enviar no header `Authorization: Bearer {secret}`

**Como verificar na Cakto:**
1. Acesse a configuração do webhook "Pagamento assinatura Fitcoach.ai"
2. Verifique o campo "Chave secreta do webhook"
3. Deve ser: `796bcdf3be46ec76495f280207af7d11ed7e2fbe58f2249b8680fce5b5b5db91`

---

### 3. ✅ Eventos Configurados na Cakto

**Eventos OBRIGATÓRIOS (marcar todos):**
- ✅ `subscription.paid` - Quando uma assinatura é paga
- ✅ `subscription.renewed` - Quando uma assinatura é renovada
- ✅ `payment.paid` - Quando um pagamento é confirmado
- ✅ `recharge.paid` - Quando uma recarga é paga (se aplicável)
- ✅ `payment.failed` - Quando um pagamento falha
- ✅ `subscription.payment_failed` - Quando o pagamento de assinatura falha
- ✅ `subscription.canceled` - Quando uma assinatura é cancelada

**Eventos NÃO SUPORTADOS (NÃO marcar):**
- ❌ `subscription_created` - Não é processado pelo webhook atual

**Como verificar na Cakto:**
1. Acesse a configuração do webhook
2. Na seção "Eventos", verifique quais estão marcados
3. Marque todos os eventos listados acima
4. Salve as alterações

---

### 4. ✅ Teste do Webhook

**Passo 1: Fazer uma nova compra de teste**
1. Acesse a página de checkout da Cakto
2. Faça uma compra de teste (pode usar dados de teste)
3. Complete o pagamento

**Passo 2: Verificar no Supabase**

Execute no SQL Editor do Supabase:

```sql
-- Verificar webhooks recebidos
SELECT 
  id,
  type,
  status,
  error_message,
  created_at,
  payload->>'data'->>'customer_email' as email,
  payload->>'data'->>'checkout_id' as checkout_id
FROM public.cakto_webhooks
ORDER BY created_at DESC
LIMIT 20;
```

**Resultados esperados:**
- ✅ Se aparecer um registro com `type = 'subscription.paid'` e `status = 'received'` → **Webhook funcionando!**
- ✅ Se aparecer um registro com `type = 'authentication_failed'` → **Secret não está batendo**
- ❌ Se não aparecer nenhum registro → **Cakto não está enviando o webhook**

**Passo 3: Verificar assinatura criada**

```sql
-- Verificar se a assinatura foi criada
SELECT 
  us.id,
  us.user_id,
  u.username,
  u.nome,
  us.plan_type,
  us.status,
  us.created_at,
  us.cakto_subscription_id
FROM public.user_subscriptions us
JOIN public.users u ON u.id = us.user_id
ORDER BY us.created_at DESC
LIMIT 10;
```

---

### 5. ✅ Verificar Logs do Edge Function

**No Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard/project/dbugchiwqwnrnnnsszel/functions
2. Clique em `cakto-webhook`
3. Vá na aba "Logs"
4. Procure por:
   - `[INFO] Requisição recebida` - Indica que a requisição chegou
   - `[INFO] Verificando autenticação` - Mostra os headers recebidos
   - `[WARN] Falha na autenticação` - Secret não está batendo
   - `[INFO] Webhook recebido: subscription.paid` - Evento processado com sucesso

---

## 🐛 Solução de Problemas

### Problema 1: Nenhum webhook aparece no banco

**Possíveis causas:**
1. Cakto não está enviando o webhook
2. URL do webhook está incorreta na Cakto
3. Cakto está bloqueando a requisição (firewall, CORS, etc.)

**Solução:**
1. Verifique a URL do webhook na Cakto (deve ser exatamente a URL do Supabase)
2. Verifique se o webhook está "Ativo" na Cakto
3. Faça uma nova compra de teste após corrigir a URL

---

### Problema 2: Webhook aparece com `status = 'failed'` e `type = 'authentication_failed'`

**Causa:** Secret não está batendo entre Cakto e Supabase

**Solução:**
1. No Supabase, copie o valor exato de `CAKTO_WEBHOOK_SECRET`
2. Na Cakto, cole esse valor no campo "Chave secreta do webhook"
3. Salve e faça uma nova compra de teste

**Verificar formato do header:**
- O webhook espera: `Authorization: Bearer {secret}`
- Se a Cakto usar outro formato (ex: `X-Webhook-Token`), será necessário ajustar o código

---

### Problema 3: Webhook chega mas não cria assinatura

**Possíveis causas:**
1. Evento não está sendo processado (tipo não reconhecido)
2. Erro ao buscar/criar usuário
3. Erro ao criar assinatura

**Solução:**
1. Verifique os logs do Edge Function (veja seção 5 acima)
2. Verifique se o `customer_email` no webhook corresponde a um `username` na tabela `users`
3. Execute a query de verificação de webhooks (seção 4) para ver o `error_message`

---

### Problema 4: Erro 401 ao acessar URL diretamente no navegador

**Isso é NORMAL!** ✅

O webhook requer autenticação via header `Authorization`. Quando você acessa pelo navegador, não há esse header, então retorna 401.

**Isso NÃO é um problema** - a Cakto enviará o header correto automaticamente.

---

## 📝 Notas Importantes

1. **Primeira compra após configurar webhook:**
   - Pode levar alguns minutos para o webhook ser processado
   - Verifique os logs e o banco de dados após 2-3 minutos

2. **Webhooks duplicados:**
   - A Cakto pode enviar o mesmo evento múltiplas vezes (retry)
   - O código já trata isso verificando se a assinatura já existe

3. **Teste em staging:**
   - Use dados de teste da Cakto
   - Não use cartões reais em ambiente de desenvolvimento

4. **Monitoramento:**
   - Configure alertas no Supabase para erros no Edge Function
   - Monitore a tabela `cakto_webhooks` regularmente

---

## ✅ Checklist Final

Antes de considerar o webhook configurado:

- [ ] URL do webhook está correta na Cakto
- [ ] Secret está idêntico no Supabase e na Cakto
- [ ] Todos os eventos necessários estão marcados na Cakto
- [ ] Webhook está "Ativo" na Cakto
- [ ] Foi feita uma compra de teste
- [ ] Webhook aparece na tabela `cakto_webhooks` com `status = 'received'`
- [ ] Assinatura foi criada na tabela `user_subscriptions`
- [ ] Logs do Edge Function mostram processamento bem-sucedido

---

## 🔗 Links Úteis

- **Supabase Dashboard:** https://supabase.com/dashboard/project/dbugchiwqwnrnnnsszel
- **Edge Functions:** https://supabase.com/dashboard/project/dbugchiwqwnrnnnsszel/functions
- **SQL Editor:** https://supabase.com/dashboard/project/dbugchiwqwnrnnnsszel/sql/new

