# 🚀 Guia de Deploy - Passo a Passo Simplificado

## 📋 Checklist Pré-Deploy

- [ ] Supabase CLI instalado
- [ ] Login realizado no Supabase
- [ ] Projeto criado no Supabase
- [ ] Schema SQL executado
- [ ] Políticas RLS executadas
- [ ] IDs dos planos obtidos

---

## 1️⃣ Instalar Supabase CLI (Windows)

### Opção A: Via Scoop (Mais Fácil)

```powershell
# 1. Instalar Scoop (se não tiver)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# 2. Adicionar bucket do Supabase
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# 3. Instalar Supabase CLI
scoop install supabase

# 4. Verificar
supabase --version
```

### Opção B: Via Chocolatey

```powershell
# 1. Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Instalar Supabase CLI
choco install supabase

# 3. Verificar
supabase --version
```

---

## 2️⃣ Login no Supabase

```powershell
supabase login
```

Isso abrirá o navegador. Faça login e volte ao terminal.

---

## 3️⃣ Linkar Projeto

1. No painel do Supabase: **Settings** > **General**
2. Copie o **Reference ID** (ex: `abcdefghijklmnop`)
3. No terminal:

```powershell
cd D:\FitCoach.IA
supabase link --project-ref seu-reference-id-aqui
```

---

## 4️⃣ Obter IDs dos Planos

1. No painel do Supabase, vá em **SQL Editor**
2. Execute:

```sql
SELECT id, name, display_name 
FROM subscription_plans 
WHERE name IN ('basic', 'premium', 'enterprise');
```

3. Anote os 3 IDs retornados (você precisará deles)

---

## 5️⃣ Configurar Secrets (Variáveis de Ambiente)

1. No painel do Supabase: **Edge Functions** > **Settings** > **Secrets**
2. Adicione cada variável clicando em **Add new secret**:

```
PLAN_BASIC_ID = [ID do plano Basic]
PLAN_PREMIUM_ID = [ID do plano Premium]
PLAN_ENTERPRISE_ID = [ID do plano Enterprise]
APP_URL = https://fitcoach.ia
CAKTO_WEBHOOK_SECRET = [crie um secret aleatório, ex: minha-chave-secreta-123]
RESEND_API_KEY = [sua chave do Resend]
EMAIL_FROM = FitCoach.IA <noreply@fitcoach.ia>
```

**Nota**: Se não tiver Resend ainda, pode deixar vazio e configurar depois.

---

## 6️⃣ Deploy das Funções

No terminal, na pasta do projeto:

```powershell
# Deploy da função de webhook
supabase functions deploy cakto-webhook

# Deploy da função de email
supabase functions deploy send-email
```

---

## 7️⃣ Obter URL do Webhook

Após o deploy, você verá a URL da função. Anote:

```
https://seu-projeto.supabase.co/functions/v1/cakto-webhook
```

---

## 8️⃣ Configurar Webhook no Cakto

1. Acesse o painel do Cakto
2. Vá em **Configurações** > **Webhooks**
3. Clique em **Adicionar Webhook**
4. Preencha:
   - **URL**: `https://seu-projeto.supabase.co/functions/v1/cakto-webhook`
   - **Eventos**: Selecione `payment.completed` e `payment.paid`
   - **Método**: `POST`
   - **Headers**:
     - Chave: `Authorization`
     - Valor: `Bearer [mesmo secret que você colocou em CAKTO_WEBHOOK_SECRET]`
5. Salve

---

## 9️⃣ Configurar Email (Resend)

### 9.1. Criar Conta no Resend

1. Acesse: https://resend.com
2. Crie uma conta gratuita
3. Vá em **API Keys** > **Create API Key**
4. Copie a chave (começa com `re_`)

### 9.2. Adicionar no Supabase

1. No painel do Supabase: **Edge Functions** > **Settings** > **Secrets**
2. Adicione/atualize:
   ```
   RESEND_API_KEY = re_sua_chave_aqui
   ```

### 9.3. Verificar Domínio (Opcional mas Recomendado)

1. No Resend, vá em **Domains**
2. Adicione seu domínio (ex: `fitcoach.ia`)
3. Siga as instruções para verificar o domínio
4. Atualize `EMAIL_FROM` para usar seu domínio

---

## 🔟 Testar o Fluxo

### 10.1. Teste Manual do Webhook

Você pode testar manualmente usando curl ou Postman:

```powershell
curl -X POST https://seu-projeto.supabase.co/functions/v1/cakto-webhook `
  -H "Authorization: Bearer seu-secret" `
  -H "Content-Type: application/json" `
  -d '{
    "event": "payment.completed",
    "data": {
      "id": "test_123",
      "status": "paid",
      "amount": 29.90,
      "currency": "BRL",
      "customer": {
        "email": "teste@email.com",
        "name": "Teste"
      },
      "metadata": {
        "plan_name": "basic"
      }
    }
  }'
```

### 10.2. Verificar Logs

```powershell
# Ver logs do webhook
supabase functions logs cakto-webhook --tail

# Ver logs do email
supabase functions logs send-email --tail
```

### 10.3. Teste Real

1. Faça um pagamento de teste no Cakto
2. Verifique os logs
3. Verifique se a assinatura foi criada no banco
4. Verifique se o email foi enviado

---

## ✅ Checklist Final

- [ ] Supabase CLI instalado e funcionando
- [ ] Login realizado
- [ ] Projeto linkado
- [ ] Secrets configurados
- [ ] Funções deployadas
- [ ] Webhook configurado no Cakto
- [ ] Email configurado (Resend)
- [ ] Teste realizado com sucesso

---

## 🆘 Problemas Comuns

### "supabase: command not found"
- Reinicie o terminal após instalar
- Verifique se está no PATH

### "Authentication failed"
```powershell
supabase logout
supabase login
```

### "Project not found"
- Verifique o Reference ID
- Verifique se tem acesso ao projeto

### Email não enviado
- Verifique se `RESEND_API_KEY` está configurado
- Verifique os logs: `supabase functions logs send-email`

### Webhook não funciona
- Verifique se a URL está correta
- Verifique se o secret está correto
- Verifique os logs: `supabase functions logs cakto-webhook`

---

## 📞 Próximos Passos

Após tudo configurado:

1. ✅ Teste com pagamento real
2. ✅ Monitore os logs
3. ✅ Verifique emails sendo enviados
4. ✅ Ajuste templates de email se necessário

