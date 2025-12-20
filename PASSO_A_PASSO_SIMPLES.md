# 🎯 Passo a Passo SIMPLES - O Que Fazer Agora

## ✅ O Que Você JÁ Fez

- ✅ Instalou dependências do backend
- ✅ Instalou dependências do frontend

## 🔄 O Que Fazer Agora (3 Passos)

---

## Passo 1: Executar Migration no Supabase (2 minutos)

O **Supabase** é seu banco de dados. Você só precisa criar as tabelas.

### Como Fazer:

1. **Abra o arquivo:** `supabase/migration_ai_usage_logs.sql`
2. **Copie TODO o conteúdo** (todo o texto)
3. **Acesse:** https://app.supabase.com/project/seu-projeto/sql/new
4. **Cole** o conteúdo no SQL Editor
5. **Clique em "Run"** ou pressione `Ctrl+Enter`

**Pronto!** Isso cria as tabelas `ai_usage_logs` e `ai_monthly_usage` no Supabase.

---

## Passo 2: Deploy do Backend NestJS (15 minutos)

O **Backend NestJS** **NÃO** é no Supabase! Precisa ser deployado em Railway ou Render.

### Opção A: Railway (Mais Fácil) ⭐

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login
# (abre navegador para autenticar)

# 3. Entrar na pasta backend
cd backend

# 4. Criar projeto no Railway
railway init
# (selecione "Empty Project")

# 5. Adicionar variáveis de ambiente
# Substitua pelos seus valores reais:
railway variables set SUPABASE_URL=https://seu-projeto.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
railway variables set GEMINI_API_KEY=sua_chave_gemini_aqui
railway variables set PORT=3000

# 6. Deploy!
railway up
```

**Railway vai gerar uma URL tipo:** `https://backend-production-xxxx.up.railway.app`

**ANOTE ESSA URL!** Você vai usar no próximo passo.

---

### Opção B: Render (Via Dashboard)

1. Acesse: https://render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** `fitcoach-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Environment:** `Node`
5. Em **"Environment Variables"**, adicione:
   - `SUPABASE_URL` = `https://seu-projeto.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `sua_service_role_key`
   - `GEMINI_API_KEY` = `sua_chave_gemini`
   - `PORT` = `3000`
6. Clique em **"Create Web Service"**

**Render vai gerar uma URL.** Anote essa URL!

---

## Passo 3: Configurar Frontend (2 minutos)

No **Vercel** (ou onde seu frontend está deployado):

1. Acesse seu projeto
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - **Key:** `VITE_AI_BACKEND_URL`
   - **Value:** `https://sua-url-do-railway.up.railway.app` (a URL que você anotou!)
4. Selecione os ambientes (Production, Preview)
5. Clique em **Save**

**Pronto!** Agora o frontend vai usar seu backend.

---

## ✅ Verificar Se Funcionou

### Teste 1: Verificar Tabelas no Supabase

No SQL Editor do Supabase, execute:

```sql
SELECT * FROM ai_usage_logs LIMIT 1;
SELECT * FROM ai_monthly_usage LIMIT 1;
```

Se não der erro, as tabelas foram criadas! ✅

### Teste 2: Testar Backend

Abra no navegador ou use curl:

```bash
curl https://sua-url-backend.railway.app/ai/text \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","gymId":null,"feature":"chat","model":"gemini-1.5-flash","prompt":"Olá"}'
```

Se retornar JSON com `text`, está funcionando! ✅

### Teste 3: Testar Frontend

1. Acesse seu app frontend
2. Abra o chatbot
3. Envie uma mensagem
4. Se funcionar, está tudo OK! ✅

---

## 📋 Resumo

| Passo | O Que Fazer | Onde |
|-------|-------------|------|
| 1️⃣ | Executar migration SQL | Supabase Dashboard |
| 2️⃣ | Deploy backend NestJS | Railway ou Render |
| 3️⃣ | Configurar URL do backend | Vercel (Environment Variables) |

---

## ❓ Dúvidas Comuns

### "O backend é no Supabase?"

**NÃO!** 
- **Supabase** = Banco de dados (PostgreSQL)
- **Backend NestJS** = API/WebSocket (deploy separado em Railway/Render)

### "Onde obtenho as chaves?"

- **SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY:**
  - https://app.supabase.com/project/seu-projeto/settings/api
- **GEMINI_API_KEY:**
  - https://aistudio.google.com/apikey

### "Preciso pagar?"

- **Supabase:** Tem plano gratuito ✅
- **Railway:** $5 grátis/mês, depois pago ✅
- **Render:** Plano gratuito disponível ✅

---

## 🆘 Problemas?

Veja `COMANDOS_EXECUTAR.md` para guia completo com troubleshooting.

---

**Tempo total estimado:** ~20 minutos

**Pronto para começar?** Vá ao **Passo 1** acima! 🚀

