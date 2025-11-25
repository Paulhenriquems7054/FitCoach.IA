# ✅ Próximos Passos - Supabase CLI Instalado

## 🎉 Status Atual

✅ **Supabase CLI instalado e atualizado** (versão 2.62.5)

---

## 📝 Passo 1: Login no Supabase

Execute no terminal:

```powershell
supabase login
```

Isso abrirá o navegador para autenticação. Após fazer login, volte ao terminal.

---

## 🔗 Passo 2: Linkar ao Projeto

### 2.1. Obter Reference ID do Projeto

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto (ou crie um novo)
3. Vá em **Settings** > **General**
4. Copie o **Reference ID** (ex: `abcdefghijklmnop`)

### 2.2. Linkar Projeto

No terminal, na pasta do projeto:

```powershell
cd D:\FitCoach.IA
supabase link --project-ref SEU-REFERENCE-ID-AQUI
```

Substitua `SEU-REFERENCE-ID-AQUI` pelo Reference ID copiado.

---

## 🗄️ Passo 3: Executar Schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Abra o arquivo `supabase/schema.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **Run** (ou pressione Ctrl+Enter)

**Importante**: Execute primeiro o `schema.sql` e depois o `rls_policies.sql`

---

## 🔒 Passo 4: Executar Políticas RLS

1. No **SQL Editor** do Supabase
2. Abra o arquivo `supabase/rls_policies.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **Run**

---

## 🚀 Passo 5: Deploy das Edge Functions

No terminal, na pasta do projeto:

```powershell
# Deploy da função de webhook
supabase functions deploy cakto-webhook

# Deploy da função de email
supabase functions deploy send-email
```

---

## ⚙️ Passo 6: Configurar Secrets (Variáveis de Ambiente)

### 6.1. Obter IDs dos Planos

No **SQL Editor** do Supabase, execute:

```sql
SELECT id, name, display_name 
FROM subscription_plans 
WHERE name IN ('basic', 'premium', 'enterprise');
```

Anote os 3 IDs retornados.

### 6.2. Adicionar Secrets

1. No painel do Supabase: **Edge Functions** > **Settings** > **Secrets**
2. Clique em **Add new secret** para cada variável:

```
PLAN_BASIC_ID = [ID do plano Basic]
PLAN_PREMIUM_ID = [ID do plano Premium]
PLAN_ENTERPRISE_ID = [ID do plano Enterprise]
APP_URL = https://fitcoach.ia
CAKTO_WEBHOOK_SECRET = [crie um secret aleatório]
RESEND_API_KEY = [sua chave do Resend - opcional por enquanto]
EMAIL_FROM = FitCoach.IA <noreply@fitcoach.ia>
```

---

## 📧 Passo 7: Configurar Email (Opcional por enquanto)

Você pode configurar o Resend depois. Por enquanto, o sistema funcionará sem enviar emails (apenas logará).

Para configurar depois:
1. Crie conta em https://resend.com
2. Obtenha a API Key
3. Adicione em `RESEND_API_KEY` nos Secrets

---

## ✅ Checklist Final

- [ ] Login realizado (`supabase login`)
- [ ] Projeto linkado (`supabase link`)
- [ ] Schema SQL executado
- [ ] Políticas RLS executadas
- [ ] Funções deployadas
- [ ] Secrets configurados
- [ ] IDs dos planos obtidos

---

## 🆘 Precisa de Ajuda?

Consulte os guias completos:
- `supabase/INSTALL_WINDOWS.md` - Instalação detalhada
- `supabase/DEPLOY_STEPS.md` - Guia completo de deploy
- `supabase/WEBHOOK_SETUP.md` - Configuração de webhook

