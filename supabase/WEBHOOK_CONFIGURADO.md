# ✅ Webhook Configurado com Sucesso!

## Configuração Atual

### URL do Webhook
```
https://dbugchiwqwnrnnnsszel.supabase.co/functions/v1/cakto-webhook?source=cakto
```

### Headers Configurados
- `Authorization: Bearer cakto-secret-2024-xyz123`
- `Content-Type: application/json`

### Eventos Configurados
- `payment.completed`
- `payment.paid`

---

## ✅ Checklist Final

- [x] Supabase CLI instalado
- [x] Login realizado
- [x] Projeto linkado
- [x] Schema SQL executado
- [x] Políticas RLS executadas
- [x] Funções deployadas
- [x] Secrets configurados
- [x] Webhook configurado no Cakto

---

## 🧪 Como Testar

### 1. Fazer um Pagamento de Teste

1. Acesse um dos links de pagamento:
   - Basic: https://pay.cakto.com.br/3bewmsy_665747
   - Premium: https://pay.cakto.com.br/8djcjc6
   - Enterprise: https://pay.cakto.com.br/35tdhxu

2. Complete o pagamento de teste

3. O Cakto enviará o webhook automaticamente

### 2. Verificar Logs

No terminal, execute:

```powershell
supabase functions logs cakto-webhook --tail
```

Isso mostrará os logs em tempo real da função.

### 3. Verificar no Dashboard

Acesse: https://supabase.com/dashboard/project/dbugchiwqwnrnnnsszel/functions

Clique em `cakto-webhook` para ver logs e métricas.

### 4. Verificar Assinatura Criada

No SQL Editor do Supabase, execute:

```sql
SELECT 
  us.id,
  u.email,
  sp.display_name as plano,
  us.status,
  us.created_at
FROM user_subscriptions us
JOIN users u ON u.id = us.user_id
JOIN subscription_plans sp ON sp.id = us.plan_id
ORDER BY us.created_at DESC
LIMIT 5;
```

---

## 📧 Configurar Email (Opcional)

Para enviar emails de verdade, configure o Resend:

1. Crie conta em https://resend.com
2. Obtenha a API Key
3. Adicione no Supabase: **Edge Functions** > **Settings** > **Secrets**
   - Name: `RESEND_API_KEY`
   - Value: `re_sua_chave_aqui`

---

## 🔍 Troubleshooting

### Webhook não está sendo chamado

1. Verifique se o webhook está ativo no Cakto
2. Verifique os logs do Cakto para ver se há erros
3. Verifique se a URL está correta

### Erro 401 (Unauthorized)

- Verifique se o `CAKTO_WEBHOOK_SECRET` está correto
- Verifique se o header `Authorization` está configurado corretamente no Cakto

### Assinatura não está sendo criada

1. Verifique os logs da função
2. Verifique se o usuário existe no banco (o email do pagamento deve corresponder a um usuário)
3. Verifique se os IDs dos planos estão corretos

---

## 🎉 Pronto!

O sistema está configurado e pronto para processar pagamentos automaticamente!

