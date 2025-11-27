# 🔄 Atualizar Webhook Cakto Existente

## ✅ Você já tem a função criada!

Você já tem a função `cakto-webhook` no Supabase. Agora precisamos **atualizar** com o código corrigido.

## 📋 Passo a Passo

### 1. Acessar a Função

1. No Dashboard do Supabase, vá em **Edge Functions**
2. Clique na função **`cakto-webhook`**
3. Clique em **"Edit"** ou no ícone de edição

### 2. Substituir o Código

1. **Selecione TODO o código atual** (Ctrl+A)
2. **Delete** (Delete ou Backspace)
3. Abra o arquivo: `supabase/functions/cakto-webhook/index.ts`
4. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
5. **Cole no editor** do Dashboard (Ctrl+V)

### 3. Verificar Variáveis de Ambiente

Vá em **Project Settings > Edge Functions > Secrets** e verifique se tem:

```
SUPABASE_URL=https://dbugchiwqwnrnnnsszel.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[sua service role key]
APP_URL=https://fit-coach-ia.vercel.app
CAKTO_WEBHOOK_SECRET=[seu secret do Cakto]
PLAN_BASIC_ID=[ID do plano basic]
PLAN_PREMIUM_ID=[ID do plano premium]
PLAN_ENTERPRISE_ID=[ID do plano enterprise]
```

**Como encontrar:**
- **SUPABASE_URL**: Já está correto acima
- **SUPABASE_SERVICE_ROLE_KEY**: Settings > API > service_role key (secret)
- **APP_URL**: URL do seu app (Vercel, etc.)
- **CAKTO_WEBHOOK_SECRET**: O mesmo que você configurou no Cakto
- **PLAN IDs**: Execute no SQL Editor:
  ```sql
  SELECT id, name FROM subscription_plans 
  WHERE name IN ('basic', 'premium', 'enterprise');
  ```

### 4. Fazer Deploy

1. Clique em **"Deploy"** ou **"Save"**
2. Aguarde o deploy completar (pode levar alguns segundos)
3. Você verá uma mensagem de sucesso

### 5. Verificar Logs

1. Na página da função, vá em **"Logs"**
2. Você verá os logs em tempo real
3. Teste fazendo um pagamento de teste no Cakto

## 🔍 O que Mudou no Código

### ✅ Correções Implementadas:

1. **Cria conta no Supabase Auth** automaticamente
2. **Gera senha temporária** segura
3. **Envia email com credenciais** (username + senha)
4. **Dois links no email**: acesso rápido e login manual
5. **Melhor tratamento de erros**

### 📧 Email Agora Inclui:

- 🔑 **Username** e **Senha temporária**
- 🚀 **Botão de acesso rápido** (login automático)
- 🔑 **Botão de login manual**
- 📝 **Instruções claras**

## 🧪 Testar Após Deploy

1. Faça um pagamento de teste no Cakto
2. Verifique se recebeu o email
3. Teste ambos os links:
   - Link de acesso rápido
   - Login manual com credenciais

## 📝 Checklist

- [ ] Abrir função `cakto-webhook` no Dashboard
- [ ] Substituir código pelo novo
- [ ] Verificar variáveis de ambiente
- [ ] Fazer deploy
- [ ] Verificar logs
- [ ] Testar com pagamento

## 🐛 Troubleshooting

### Erro ao fazer deploy
- Verifique se copiou o código completo
- Verifique se não há erros de sintaxe
- Verifique os logs de erro

### Variáveis não encontradas
- Adicione as que faltam em Settings > Edge Functions > Secrets
- Verifique se os nomes estão corretos (case-sensitive)

### Email não chega
- Verifique logs da função `send-email`
- Verifique se `send-email` está funcionando
- Verifique logs do `cakto-webhook` para ver se tentou enviar

## 💡 Dica

Após o deploy, os **próximos pagamentos** já usarão o novo código e enviarão credenciais automaticamente!

Para o pagamento de ontem que não funcionou, você pode:
1. Verificar se o usuário foi criado no Supabase Auth
2. Criar manualmente se necessário
3. Ou pedir para o usuário usar "Esqueci a senha"


