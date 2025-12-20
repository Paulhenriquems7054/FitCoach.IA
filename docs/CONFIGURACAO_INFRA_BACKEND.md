# Configuração de Infraestrutura - Backend AI Proxy

Este documento explica como configurar a infraestrutura para o backend NestJS que centraliza as chamadas à API Gemini.

## Visão Geral

O backend NestJS (`backend/`) atua como um proxy seguro entre o frontend e a API Gemini, fornecendo:
- ✅ Controle de custos (logging em `ai_usage_logs` e `ai_monthly_usage`)
- ✅ Segurança (API keys nunca expostas no frontend)
- ✅ Limites mensais por academia
- ✅ Endpoints REST para: texto, grounded (web search), maps, TTS

## Opções de Deploy

### Opção A: Backend em host separado (Recomendado para produção)

**Exemplo:** Backend em Railway/Render/Fly.io em `https://backend.fitcoach.ai`

1. **Configure a variável de ambiente no frontend:**
   ```env
   VITE_AI_BACKEND_URL=https://backend.fitcoach.ai
   ```

2. **No Vercel (frontend):**
   - Settings → Environment Variables
   - Adicione: `VITE_AI_BACKEND_URL` = `https://backend.fitcoach.ai`
   - Selecione os ambientes (Production, Preview)

3. **No backend NestJS:**
   Configure as variáveis:
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   GEMINI_API_KEY=sua_chave_gemini
   PORT=3000
   ```

**Vantagem:** Frontend e backend podem escalar independentemente.

---

### Opção B: Proxy via Vercel Rewrites (Mesmo domínio)

**Exemplo:** Frontend em `https://app.fitcoach.ai`, backend em `https://backend.fitcoach.ai`

1. **Atualize `vercel.json` no frontend:**
   ```json
   {
     "rewrites": [
       {
         "source": "/api/ai/:path*",
         "destination": "https://backend.fitcoach.ai/ai/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

2. **No frontend, deixe `VITE_AI_BACKEND_URL` vazio ou não definida:**
   - O código usa `/api` como fallback padrão

3. **O frontend chamará:**
   - `/api/ai/text` → Vercel proxy → `https://backend.fitcoach.ai/ai/text`
   - `/api/ai/grounded` → Vercel proxy → `https://backend.fitcoach.ai/ai/grounded`
   - etc.

**Vantagem:** CORS simplificado, tudo no mesmo domínio para o browser.

**Desvantagem:** Depende do Vercel para proxy; pode ter latência extra.

---

## Configuração do Backend NestJS

### Variáveis de Ambiente Obrigatórias

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Gemini API
GEMINI_API_KEY=sua_chave_gemini_aqui

# Porta (opcional, padrão: 3000)
PORT=3000
```

### Deploy no Railway (Exemplo)

1. **Crie um projeto no Railway:**
   - Acesse https://railway.app
   - New Project → Deploy from GitHub
   - Selecione o repositório
   - Configure o root directory: `backend/`

2. **Configure as variáveis:**
   - Variables → Add Variable
   - Adicione todas as variáveis acima

3. **Configure o build:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

4. **Railway gerará uma URL pública:**
   - Exemplo: `https://backend-production-xxxx.up.railway.app`
   - Use essa URL em `VITE_AI_BACKEND_URL` ou no proxy do Vercel

---

## Estrutura de Endpoints

### POST `/ai/text`
Chamada genérica de texto.

**Request:**
```json
{
  "userId": "uuid",
  "gymId": "string|null",
  "feature": "chat|meal_plan|coach_tip|...",
  "model": "gemini-1.5-flash",
  "prompt": "texto do prompt"
}
```

**Response:**
```json
{
  "text": "resposta do modelo",
  "tokensIn": 100,
  "tokensOut": 50,
  "costUsd": 0.0001
}
```

### POST `/ai/grounded`
Chamada com Google Search.

**Request:**
```json
{
  "userId": "uuid",
  "gymId": "string|null",
  "model": "gemini-1.5-flash",
  "prompt": "pergunta para buscar na web"
}
```

**Response:**
```json
{
  "text": "resposta",
  "webResults": [
    { "uri": "...", "title": "..." }
  ],
  "tokensIn": 100,
  "tokensOut": 50,
  "costUsd": 0.0001
}
```

### POST `/ai/maps`
Chamada com Google Maps.

**Request:**
```json
{
  "userId": "uuid",
  "gymId": "string|null",
  "model": "gemini-1.5-flash",
  "prompt": "onde encontrar academia",
  "latitude": -23.5,
  "longitude": -46.6
}
```

**Response:**
```json
{
  "text": "resposta",
  "mapsResults": [
    {
      "uri": "...",
      "title": "...",
      "reviews": [...]
    }
  ],
  "tokensIn": 100,
  "tokensOut": 50,
  "costUsd": 0.0001
}
```

### POST `/ai/tts`
Text-to-Speech.

**Request:**
```json
{
  "userId": "uuid",
  "gymId": "string|null",
  "text": "frase para converter em áudio",
  "voiceName": "Zephyr"
}
```

**Response:**
```json
{
  "audioBase64": "base64_encoded_audio",
  "tokensIn": 50,
  "tokensOut": 15,
  "costUsd": 0.00005
}
```

### GET `/ai/usage`
Agregação de uso de IA (para dashboards).

**Query params:**
- `gymId`: ID da academia
- `from`: Data inicial (ISO 8601, opcional)
- `to`: Data final (ISO 8601, opcional)

**Response:**
```json
{
  "totals": {
    "calls": 100,
    "tokensIn": 50000,
    "tokensOut": 25000,
    "costUsd": 12.5
  },
  "byDay": [
    {
      "date": "2024-01-15",
      "calls": 10,
      "tokensIn": 5000,
      "tokensOut": 2500,
      "costUsd": 1.25,
      "byFeature": {
        "chat": { "calls": 5, "costUsd": 0.6 },
        "tts": { "calls": 5, "costUsd": 0.65 }
      }
    }
  ]
}
```

---

## Checklist de Deploy

### Frontend (Vercel)
- [ ] Variável `VITE_AI_BACKEND_URL` configurada OU
- [ ] Proxy `/api/ai/*` configurado no `vercel.json`
- [ ] Testar chamada: `fetch('${VITE_AI_BACKEND_URL || '/api'}/ai/text', ...)`

### Backend (Railway/Render/etc)
- [ ] `SUPABASE_URL` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] `GEMINI_API_KEY` configurada
- [ ] Tabelas `ai_usage_logs` e `ai_monthly_usage` criadas no Supabase
- [ ] Health check funcionando: `GET /` ou `GET /health`

### Supabase
- [ ] Migration `migration_ai_usage_logs.sql` executada
- [ ] RLS policies ajustadas (se necessário, logs podem ser `service_role-only`)

---

## Troubleshooting

### Erro: "Failed to fetch"
- Verifique se o backend está online
- Verifique CORS no backend (se estiver em host diferente)
- Verifique a URL em `VITE_AI_BACKEND_URL`

### Erro: "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados"
- Confirme as variáveis no backend
- Reinicie o backend após adicionar variáveis

### Erro: "Limite mensal de uso de IA atingido"
- Verifique `ai_monthly_usage.hard_limit_usd` para a academia
- Ajuste o limite ou aguarde o próximo ciclo mensal

---

## Próximos Passos

- [ ] Implementar WebSocket para Live Audio (`/ai/live`)
- [ ] Adicionar autenticação JWT no backend
- [ ] Implementar rate limiting por usuário/academia
- [ ] Dashboard de uso em tempo real

