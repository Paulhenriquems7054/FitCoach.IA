# 🪟 Instalação do Supabase CLI no Windows - Guia Passo a Passo

## ⚠️ Importante
O Supabase CLI **NÃO** pode ser instalado via `npm install -g`. Use um dos métodos abaixo.

---

## 📦 Método 1: Scoop (Recomendado para Windows)

### Passo 1: Instalar Scoop (se não tiver)

Abra o PowerShell **como Administrador** e execute:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Passo 2: Instalar Supabase CLI

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Passo 3: Verificar Instalação

```powershell
supabase --version
```

---

## 📦 Método 2: Chocolatey

### Passo 1: Instalar Chocolatey (se não tiver)

Abra o PowerShell **como Administrador** e execute:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### Passo 2: Instalar Supabase CLI

```powershell
choco install supabase
```

### Passo 3: Verificar Instalação

```powershell
supabase --version
```

---

## 📦 Método 3: Download Manual (Alternativa)

### Passo 1: Baixar Binário

1. Acesse: https://github.com/supabase/cli/releases
2. Baixe o arquivo `supabase_windows_amd64.zip` (versão mais recente)
3. Extraia o arquivo `supabase.exe`

### Passo 2: Adicionar ao PATH

1. Copie `supabase.exe` para uma pasta (ex: `C:\Program Files\Supabase\`)
2. Adicione a pasta ao PATH do Windows:
   - Pressione `Win + R`
   - Digite `sysdm.cpl` e pressione Enter
   - Vá em **Avançado** > **Variáveis de Ambiente**
   - Em **Variáveis do sistema**, encontre `Path` e clique em **Editar**
   - Clique em **Novo** e adicione: `C:\Program Files\Supabase\`
   - Clique em **OK** em todas as janelas

### Passo 3: Verificar Instalação

Abra um novo PowerShell e execute:

```powershell
supabase --version
```

---

## 🔐 Passo 4: Login no Supabase

Após instalar o CLI, faça login:

```powershell
supabase login
```

Isso abrirá o navegador para autenticação. Após fazer login, volte ao terminal.

---

## 🔗 Passo 5: Linkar ao Projeto

1. No painel do Supabase, vá em **Settings** > **General**
2. Copie o **Reference ID** do projeto
3. No terminal, execute:

```powershell
supabase link --project-ref seu-project-ref-aqui
```

Substitua `seu-project-ref-aqui` pelo Reference ID do seu projeto.

---

## 🚀 Passo 6: Deploy das Edge Functions

### 6.1. Verificar Estrutura

Certifique-se de que as funções estão em:
```
supabase/
  functions/
    cakto-webhook/
      index.ts
    send-email/
      index.ts
```

### 6.2. Deploy da Função de Webhook

```powershell
supabase functions deploy cakto-webhook
```

### 6.3. Deploy da Função de Email

```powershell
supabase functions deploy send-email
```

---

## ⚙️ Passo 7: Configurar Variáveis de Ambiente

### 7.1. No Painel do Supabase

1. Vá em **Edge Functions** > **Settings**
2. Clique em **Secrets**
3. Adicione as seguintes variáveis:

```
SUPABASE_PLAN_BASIC_ID=uuid-do-plano-basic
SUPABASE_PLAN_PREMIUM_ID=uuid-do-plano-premium
SUPABASE_PLAN_ENTERPRISE_ID=uuid-do-plano-enterprise
APP_URL=https://fitcoach.ia
CAKTO_WEBHOOK_SECRET=seu-secret-aqui
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=FitCoach.IA <noreply@fitcoach.ia>
```

### 7.2. Obter IDs dos Planos

Execute no **SQL Editor** do Supabase:

```sql
SELECT id, name, display_name 
FROM subscription_plans 
WHERE name IN ('basic', 'premium', 'enterprise');
```

Use os IDs retornados nas variáveis acima.

---

## 🧪 Passo 8: Testar as Funções

### 8.1. Testar Função de Email

```powershell
supabase functions invoke send-email --body '{"to":"teste@email.com","subject":"Teste","html":"<h1>Teste</h1>"}'
```

### 8.2. Ver Logs

```powershell
supabase functions logs cakto-webhook
supabase functions logs send-email
```

---

## 🔧 Passo 9: Configurar Webhook no Cakto

1. Acesse o painel do Cakto
2. Vá em **Configurações** > **Webhooks**
3. Adicione novo webhook:
   - **URL**: `https://seu-projeto.supabase.co/functions/v1/cakto-webhook`
   - **Eventos**: `payment.completed`, `payment.paid`
   - **Método**: `POST`
   - **Headers**: 
     ```
     Authorization: Bearer seu-secret-aqui
     Content-Type: application/json
     ```

---

## ✅ Verificação Final

1. ✅ Supabase CLI instalado (`supabase --version`)
2. ✅ Login realizado (`supabase login`)
3. ✅ Projeto linkado (`supabase link`)
4. ✅ Funções deployadas (`supabase functions list`)
5. ✅ Variáveis configuradas (no painel)
6. ✅ Webhook configurado (no Cakto)

---

## 🆘 Solução de Problemas

### Erro: "command not found"
- Verifique se o Supabase CLI está no PATH
- Reinicie o terminal após instalar

### Erro: "Authentication failed"
- Execute `supabase logout` e depois `supabase login` novamente

### Erro: "Project not found"
- Verifique se o Reference ID está correto
- Verifique se você tem acesso ao projeto

### Erro no Deploy
- Verifique se está na pasta correta do projeto
- Verifique se as funções existem em `supabase/functions/`

---

## 📚 Recursos Adicionais

- [Documentação do Supabase CLI](https://supabase.com/docs/guides/cli)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Scoop Package Manager](https://scoop.sh/)

