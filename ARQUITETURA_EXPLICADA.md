# 🏗️ Arquitetura do Sistema - Explicação Clara

## 📊 Visão Geral

```
┌─────────────────┐
│   FRONTEND      │  (Vercel)
│   (React/Vite)  │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         │
┌────────▼─────────────────────────┐
│   BACKEND NESTJS                 │  ⚠️ PRECISA SER DEPLOYADO
│   (Railway/Render/Fly.io)        │  (NÃO é no Supabase!)
│   - API REST (/ai/text, etc)     │
│   - WebSocket (/ai/live)         │
└────────┬─────────────────────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
┌────────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│   SUPABASE      │ │   GEMINI    │ │  OUTROS        │
│   (Banco Dados) │ │   API       │ │  SERVIÇOS      │
│   PostgreSQL    │ │             │ │                │
└─────────────────┘ └─────────────┘ └────────────────┘
```

---

## 🔑 Pontos Importantes

### ✅ O Que JÁ Está no Supabase

1. **Banco de Dados PostgreSQL**
   - Tabelas: `users`, `gyms`, `ai_usage_logs`, etc.
   - Já está configurado e funcionando

2. **O Que Você Precisa Fazer no Supabase:**
   - ✅ Executar a migration para criar as tabelas de logging
   - ✅ Nada mais!

### ⚠️ O Que NÃO É no Supabase

O **Backend NestJS** (API/WebSocket) **NÃO** roda no Supabase!

O Supabase é **APENAS** banco de dados. O backend NestJS precisa ser deployado em:
- **Railway** (recomendado - mais fácil)
- **Render**
- **Fly.io**
- **Ou qualquer serviço que rode Node.js**

---

## 📝 O Que Fazer Agora

### Passo 1: Executar Migration no Supabase ✅

O Supabase é seu **banco de dados**. Você precisa criar as tabelas de logging:

1. Acesse: https://app.supabase.com/project/seu-projeto/sql/new
2. Abra o arquivo: `supabase/migration_ai_usage_logs.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **"Run"**

**Isso cria:**
- Tabela `ai_usage_logs`
- Tabela `ai_monthly_usage`

### Passo 2: Deploy do Backend NestJS ⚠️

O backend NestJS (`backend/`) **NÃO** é deployado no Supabase. Você precisa deployar em:

#### Opção A: Railway (Mais Fácil)

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Entrar na pasta backend
cd backend

# 4. Inicializar projeto no Railway
railway init

# 5. Adicionar variáveis de ambiente
railway variables set SUPABASE_URL=https://seu-projeto.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
railway variables set GEMINI_API_KEY=sua_chave_gemini
railway variables set PORT=3000

# 6. Deploy
railway up
```

Railway gerará uma URL tipo: `https://backend-xxxx.up.railway.app`

#### Opção B: Render (Via Dashboard)

1. Acesse: https://render.com
2. New → Web Service
3. Conecte repositório GitHub
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
5. Adicione variáveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `PORT=3000`

---

## 🎯 Resumo Simples

| Componente | Onde Está | O Que Você Precisa Fazer |
|------------|-----------|--------------------------|
| **Supabase** | ✅ Já está configurado | Executar migration SQL |
| **Backend NestJS** | ❌ Precisa deployar | Deploy em Railway/Render |
| **Frontend** | ⚠️ Precisa configurar URL | Adicionar `VITE_AI_BACKEND_URL` |

---

## 🔄 Fluxo Completo

1. **Supabase (Banco):**
   - Executa migration SQL
   - ✅ Pronto!

2. **Backend NestJS (API):**
   - Deploy em Railway/Render
   - Configura variáveis (Supabase URL, Gemini API Key)
   - ✅ Pronto!

3. **Frontend:**
   - Configura `VITE_AI_BACKEND_URL` = URL do backend deployado
   - ✅ Pronto!

---

## ❓ Perguntas Frequentes

### "O backend é no Supabase?"

**NÃO!** O Supabase é **apenas** o banco de dados. O backend NestJS precisa ser deployado separadamente.

### "Posso usar Supabase Edge Functions?"

**NÃO recomendado** para este caso porque:
- Edge Functions têm timeout limitado
- WebSocket precisa de conexão persistente
- NestJS é mais adequado para APIs complexas

### "Onde deployar o backend?"

**Recomendado:** Railway (mais fácil) ou Render (grátis).

---

## 📚 Próximos Passos

1. ✅ **Executar migration no Supabase** (banco de dados)
2. ⚠️ **Deploy do backend NestJS** em Railway/Render
3. ⚠️ **Configurar frontend** com URL do backend

Veja `COMANDOS_EXECUTAR.md` para comandos passo a passo!

