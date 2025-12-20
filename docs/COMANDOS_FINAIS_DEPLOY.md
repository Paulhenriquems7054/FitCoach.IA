# Comandos Finais - Deploy Completo

Este documento contém **TODOS** os comandos necessários para fazer o deploy completo do sistema com Live Audio via WebSocket.

---

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase configurada
- Conta no Railway/Render/Fly.io para backend (ou outro serviço)
- Conta no Vercel para frontend (ou outro serviço)
- Google Gemini API Key

---

## 1️⃣ Backend - Instalar Dependências

```bash
cd backend
npm install
```

Isso instalará:
- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`
- `@google/genai`
- E outras dependências necessárias

---

## 2️⃣ Backend - Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do `backend/`:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Gemini API
GEMINI_API_KEY=sua_chave_gemini_aqui

# Porta (opcional, padrão: 3000)
PORT=3000
```

**Como obter as chaves:**

1. **SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY:**
   - Acesse: https://app.supabase.com/project/seu-projeto/settings/api
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (NUNCA exponha no frontend!)

2. **GEMINI_API_KEY:**
   - Acesse: https://aistudio.google.com/apikey
   - Crie uma nova API key ou use existente

---

## 3️⃣ Supabase - Executar Migration

Execute a migration para criar as tabelas de logging de IA:

```bash
# Via Supabase CLI (recomendado)
supabase migration up migration_ai_usage_logs

# OU via SQL Editor no Dashboard:
# 1. Acesse: https://app.supabase.com/project/seu-projeto/sql/new
# 2. Copie o conteúdo de: supabase/migration_ai_usage_logs.sql
# 3. Cole e execute
```

**Ou via Dashboard:**

1. Acesse: https://app.supabase.com/project/seu-projeto/sql/new
2. Abra o arquivo: `supabase/migration_ai_usage_logs.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **Run**

---

## 4️⃣ Frontend - Instalar Dependências

```bash
# Na raiz do projeto (não dentro de backend/)
npm install
```

Isso instalará `socket.io-client` e outras dependências.

---

## 5️⃣ Frontend - Configurar Variável de Ambiente

No Vercel (ou sua plataforma de deploy):

1. Acesse **Settings** → **Environment Variables**
2. Adicione:
   ```
   VITE_AI_BACKEND_URL=https://seu-backend-url.railway.app
   ```
   (Substitua pela URL real do seu backend)

**OU configure proxy no `vercel.json`:**

Se preferir usar proxy no mesmo domínio:

1. Edite `vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/ai/:path*",
         "destination": "https://seu-backend-url.railway.app/ai/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

2. Deixe `VITE_AI_BACKEND_URL` vazio ou não defina (usa `/api` por padrão)

---

## 6️⃣ Backend - Deploy

### Opção A: Railway (Recomendado)

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Inicializar projeto
cd backend
railway init

# 4. Adicionar variáveis de ambiente
railway variables set SUPABASE_URL=https://seu-projeto.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
railway variables set GEMINI_API_KEY=sua_chave_gemini
railway variables set PORT=3000

# 5. Deploy
railway up
```

Railway gerará uma URL pública. Anote essa URL para usar em `VITE_AI_BACKEND_URL`.

### Opção B: Render

1. Acesse: https://render.com
2. New → Web Service
3. Conecte seu repositório GitHub
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
5. Adicione variáveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `PORT=3000`
6. Deploy

---

## 7️⃣ Frontend - Deploy no Vercel

```bash
# Via CLI
npm i -g vercel
vercel login
vercel --prod

# OU via GitHub:
# 1. Push código para GitHub
# 2. Acesse: https://vercel.com
# 3. Import Project → Selecione repositório
# 4. Configure:
#    - Framework Preset: Vite
#    - Root Directory: . (raiz)
#    - Build Command: npm run build
#    - Output Directory: dist
# 5. Adicione variáveis de ambiente:
#    - VITE_AI_BACKEND_URL
# 6. Deploy
```

---

## 8️⃣ Testar Sistema Completo

### 1. Testar Endpoint REST

```bash
curl -X POST https://seu-backend-url/ai/text \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "gymId": null,
    "feature": "chat",
    "model": "gemini-1.5-flash",
    "prompt": "Olá, como você está?"
  }'
```

### 2. Testar WebSocket (Live Audio)

Use o app frontend e teste o chatbot com Live Audio.

### 3. Verificar Logs no Supabase

```sql
-- Ver logs de uso de IA
SELECT * FROM ai_usage_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver agregados mensais
SELECT * FROM ai_monthly_usage 
ORDER BY year_month DESC;
```

---

## 9️⃣ Verificar Tudo Está Funcionando

### ✅ Checklist

- [ ] Backend online e acessível
- [ ] Frontend online e acessível
- [ ] Migration executada no Supabase
- [ ] Variáveis de ambiente configuradas (backend e frontend)
- [ ] Chat de texto funcionando
- [ ] Web search funcionando
- [ ] Maps search funcionando
- [ ] TTS funcionando
- [ ] Live Audio funcionando (WebSocket)
- [ ] Dashboards mostrando uso/custo
- [ ] Logs sendo gravados no Supabase

---

## 🔧 Troubleshooting

### Erro: "Failed to connect to WebSocket"

**Causa:** Backend não está acessível ou CORS não configurado.

**Solução:**
1. Verifique se o backend está online
2. Verifique `VITE_AI_BACKEND_URL` no frontend
3. Verifique CORS no `backend/src/main.ts`

### Erro: "SUPABASE_URL não configurada"

**Causa:** Variáveis de ambiente não configuradas no backend.

**Solução:**
1. Verifique `.env` no backend (local) ou variáveis no Railway/Render
2. Reinicie o backend após adicionar variáveis

### Erro: "Tabela ai_usage_logs não existe"

**Causa:** Migration não foi executada.

**Solução:**
1. Execute `supabase/migration_ai_usage_logs.sql` no Supabase
2. Verifique no SQL Editor se as tabelas foram criadas

### WebSocket não conecta

**Causa:** Proxy não configurado ou URL incorreta.

**Solução:**
1. Verifique a URL do WebSocket (deve ser `ws://` ou `wss://`)
2. Se usar proxy no Vercel, configure no `vercel.json`
3. Se usar host separado, use `VITE_AI_BACKEND_URL` completa

---

## 📊 Monitoramento Pós-Deploy

### Verificar Custos no Supabase

```sql
-- Custo total por academia no mês atual
SELECT 
  gym_id,
  SUM(total_cost_usd) as total_cost,
  SUM(total_tokens_in) as total_tokens_in,
  SUM(total_tokens_out) as total_tokens_out
FROM ai_monthly_usage
WHERE year_month = TO_CHAR(NOW(), 'YYYY-MM')
GROUP BY gym_id;
```

### Verificar Uso de Voz

```sql
-- Usuários que mais usaram voz
SELECT 
  user_id,
  SUM(voice_used_today_seconds) as total_seconds
FROM users
WHERE last_usage_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id
ORDER BY total_seconds DESC
LIMIT 10;
```

---

## 🎉 Pronto!

Após seguir todos os passos, o sistema estará 100% funcional com:

- ✅ Backend proxy seguro para Gemini
- ✅ WebSocket para Live Audio
- ✅ Logging completo de uso e custo
- ✅ Dashboards financeiros
- ✅ Limites mensais por academia
- ✅ Zero exposição de API keys no frontend

**Próximos passos opcionais:**
- Adicionar autenticação JWT no backend
- Implementar rate limiting
- Configurar alertas de custo
- Adicionar métricas em tempo real

