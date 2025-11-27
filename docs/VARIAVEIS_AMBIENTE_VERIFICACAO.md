# ✅ Verificação de Variáveis de Ambiente

## 📋 Variáveis Configuradas

Você já tem todas as variáveis necessárias! ✅

### Variáveis Obrigatórias (Todas Presentes):

- ✅ `SUPABASE_URL` - URL do projeto
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço
- ✅ `PLAN_BASIC_ID` - ID do plano Basic
- ✅ `PLAN_PREMIUM_ID` - ID do plano Premium  
- ✅ `PLAN_ENTERPRISE_ID` - ID do plano Enterprise
- ✅ `APP_URL` - URL do app
- ✅ `CAKTO_WEBHOOK_SECRET` - Secret do webhook Cakto
- ✅ `RESEND_API_KEY` - Chave da API Resend (para emails)
- ✅ `EMAIL_FROM` - Email remetente

## ⚠️ Verificações Importantes

### 1. SUPABASE_URL

O valor deve ser a **URL completa**, não um hash:
- ✅ Correto: `https://dbugchiwqwnrnnnsszel.supabase.co`
- ❌ Errado: `1d30260ccbda0efdb14b69ded69753487695a92b35c955dde14b7de2784d2980`

**Como verificar:**
1. Vá em **Project Settings > API**
2. Copie a **Project URL**
3. Verifique se `SUPABASE_URL` tem esse valor

### 2. EMAIL_FROM (Duplicado)

Você tem `EMAIL_FROM` configurado duas vezes. Isso não é um problema, mas pode causar confusão. O código usará o último valor.

**Recomendação:** Remova uma das duplicatas e mantenha apenas uma.

### 3. APP_URL

Verifique se o valor é a URL completa do seu app:
- Exemplo: `https://fit-coach-ia.vercel.app`
- Ou: `https://seu-dominio.com`

## 🚀 Próximos Passos

Agora que as variáveis estão configuradas:

1. ✅ **Atualizar código da função** `cakto-webhook`
2. ✅ **Fazer deploy**
3. ✅ **Testar com pagamento**

## 📝 Checklist Final

- [x] Variáveis de ambiente configuradas
- [ ] Verificar se SUPABASE_URL está correto (URL completa)
- [ ] Atualizar código da função cakto-webhook
- [ ] Fazer deploy
- [ ] Testar pagamento

## 🔍 Como Verificar Valores Reais

No Dashboard do Supabase:
1. Vá em **Project Settings > Edge Functions > Secrets**
2. Clique no ícone de "olho" ao lado de cada variável para ver o valor
3. Verifique se `SUPABASE_URL` é a URL completa

## 💡 Dica

Se `SUPABASE_URL` estiver como hash, atualize para:
```
https://dbugchiwqwnrnnnsszel.supabase.co
```

Isso é importante para o código funcionar corretamente!


