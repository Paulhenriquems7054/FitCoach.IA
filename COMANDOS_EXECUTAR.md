# 🚀 COMANDOS PARA EXECUTAR - Resumo Completo

Este é o **ÚNICO arquivo** que você precisa seguir para finalizar tudo.

---

## ⚡ Comandos Rápidos (Copiar e Colar)

### 1️⃣ Instalar Dependências

```bash
# Backend
cd backend
npm install

# Voltar para raiz e instalar frontend
cd ..
npm install
```

### 2️⃣ Executar Migration no Supabase

**Opção A - Via Dashboard (Mais Fácil):**

1. Acesse: https://app.supabase.com/project/seu-projeto/sql/new
2. Abra o arquivo: `supabase/migration_ai_usage_logs.sql`
3. **Copie TODO o conteúdo** do arquivo
4. Cole no SQL Editor do Supabase
5. Clique em **"Run"** ou pressione `Ctrl+Enter`

**Opção B - Via Supabase CLI:**

```bash
# Se você tem Supabase CLI instalado
supabase link --project-ref seu-project-ref
supabase db push
```

### 3️⃣ Configurar Backend

Crie o arquivo `backend/.env`:

```bash
cd backend
cat > .env << EOF
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
GEMINI_API_KEY=sua_chave_gemini
PORT=3000
EOF
```

**Onde obter:**
- **SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY:** https://app.supabase.com/project/seu-projeto/settings/api
- **GEMINI_API_KEY:** https://aistudio.google.com/apikey

### 4️⃣ Testar Backend Localmente (Opcional)

```bash
cd backend
npm run start:dev
```

Deve iniciar em `http://localhost:3000`. Pare com `Ctrl+C`.

### 5️⃣ Deploy Backend (Escolha uma opção)

#### Opção A: Railway (Recomendado - Mais Fácil)

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# No diretório backend
cd backend
railway init

# Adicionar serviço e variáveis (método recomendado - tudo de uma vez)
railway add --service backend \
  --variables "SUPABASE_URL=https://seu-projeto.supabase.co" \
  --variables "SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key" \
  --variables "GEMINI_API_KEY=sua_chave_gemini" \
  --variables "PORT=3000"

# OU, se já tiver um serviço criado, adicionar variáveis separadamente:
# railway variables --set "SUPABASE_URL=https://seu-projeto.supabase.co"
# railway variables --set "SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key"
# railway variables --set "GEMINI_API_KEY=sua_chave_gemini"
# railway variables --set "PORT=3000"

# Deploy
railway up
```

Railway gerará uma URL. **Anote essa URL!** Exemplo: `https://backend-production-xxxx.up.railway.app`

#### Opção B: Render

1. Acesse: https://render.com
2. New → Web Service
3. Conecte repositório GitHub
4. Configure:
   - **Name:** fitcoach-backend
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
5. Adicione variáveis de ambiente (Environment Variables):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `PORT=3000`
6. Clique em **Create Web Service**

### 6️⃣ Configurar Frontend

No **Vercel** (ou sua plataforma de deploy):

1. Acesse seu projeto
2. Settings → Environment Variables
3. Adicione:
   ```
   VITE_AI_BACKEND_URL=https://sua-url-do-backend.railway.app
   ```
   (Use a URL que você anotou no passo 5)

### 7️⃣ Deploy Frontend

```bash
# Na raiz do projeto
vercel --prod
```

Ou via GitHub (automático se configurado).

---

## ✅ Verificar Se Tudo Funcionou

### Teste 1: Verificar Migration no Supabase

Acesse: https://app.supabase.com/project/seu-projeto/editor

Verifique se as tabelas foram criadas:
- ✅ `ai_usage_logs`
- ✅ `ai_monthly_usage`

### Teste 2: Testar Backend

```bash
curl -X POST https://sua-url-backend/ai/text \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "gymId": null,
    "feature": "chat",
    "model": "gemini-1.5-flash",
    "prompt": "Olá"
  }'
```

Deve retornar JSON com `text`, `tokensIn`, `tokensOut`, `costUsd`.

### Teste 3: Verificar Logs no Supabase

Acesse: https://app.supabase.com/project/seu-projeto/sql/new

Execute:

```sql
SELECT * FROM ai_usage_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

Deve mostrar os logs das chamadas de teste.

### Teste 4: Testar Frontend

1. Acesse seu app frontend
2. Abra o chatbot
3. Envie uma mensagem de texto
4. Verifique se funciona

---

## 🐛 Troubleshooting Rápido

### Erro: "Tabela ai_usage_logs não existe"

**Solução:** Execute a migration novamente no Supabase (passo 2).

### Erro: "Failed to connect to backend"

**Solução:**
1. Verifique se backend está online
2. Verifique `VITE_AI_BACKEND_URL` no Vercel
3. Teste a URL manualmente no navegador

### Erro: "SUPABASE_URL não configurada"

**Solução:** Verifique variáveis de ambiente no backend (Railway/Render).

### WebSocket não conecta

**Solução:**
1. Backend deve estar em HTTPS (wss://) em produção
2. Verifique CORS no `backend/src/main.ts`
3. Teste WebSocket com: `wscat -c ws://sua-url-backend/ai/live`

---

## 📋 Checklist Final

- [ ] Dependências instaladas (backend e frontend)
- [ ] Migration executada no Supabase
- [ ] Backend `.env` configurado (ou variáveis no Railway/Render)
- [ ] Backend deployado e acessível
- [ ] Frontend `VITE_AI_BACKEND_URL` configurada
- [ ] Frontend deployado
- [ ] Testes básicos funcionando
- [ ] Logs aparecendo no Supabase

---

## 📚 Documentação Completa

Para mais detalhes, veja:

- **`docs/COMANDOS_FINAIS_DEPLOY.md`** - Guia completo e detalhado
- **`docs/CONFIGURACAO_INFRA_BACKEND.md`** - Arquitetura e configuração
- **`docs/RESUMO_FINAL_IMPLEMENTACAO.md`** - Status completo
- **`backend/README.md`** - Documentação do backend

---

## 🎉 Pronto!

Após executar todos os comandos acima, seu sistema estará **100% funcional** com:

- ✅ Backend proxy seguro para Gemini
- ✅ WebSocket para Live Audio
- ✅ Logging completo de uso e custo
- ✅ Dashboards financeiros
- ✅ Limites mensais por academia
- ✅ Zero exposição de API keys no frontend

**Tempo estimado:** 30-60 minutos para deploy completo.

