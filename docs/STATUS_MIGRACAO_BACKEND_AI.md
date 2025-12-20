# Status da Migração: Backend AI Proxy

## ✅ Concluído

### 1. Endpoints Backend REST

- ✅ `POST /ai/text` - Chat de texto genérico
- ✅ `POST /ai/grounded` - Web search (Google Search)
- ✅ `POST /ai/maps` - Maps search (Google Maps com geolocalização)
- ✅ `POST /ai/tts` - Text-to-Speech
- ✅ `GET /ai/usage` - Agregação de uso para dashboards

### 2. Frontend Migrado

- ✅ `generateGroundedResponse()` → usa `/ai/grounded`
- ✅ `generateMapsGroundedResponse()` → usa `/ai/maps`
- ✅ `generateSpeechFromText()` → usa `/ai/tts`
- ✅ `sendMessageToGemini()` → usa `/ai/text`

### 3. Segurança e Controle de Custos

- ✅ API keys da Gemini **nunca** expostas no frontend
- ✅ Logging automático em `ai_usage_logs`
- ✅ Agregação mensal em `ai_monthly_usage`
- ✅ Validação de limites mensais por academia
- ✅ Cálculo de custo estimado por chamada

### 4. Dashboards e Monitoramento

- ✅ `GymFinanceDashboardPage.tsx` - Dashboard completo de uso/custo
- ✅ Cards no `AdminDashboardPage.tsx`:
  - Chamadas Gemini (mês)
  - Tokens (mês)
  - Custo estimado (R$)
  - Minutos de voz usados (mês)

### 5. Documentação

- ✅ `docs/CONFIGURACAO_INFRA_BACKEND.md` - Guia completo de deploy
- ✅ `docs/WEBSOCKET_LIVE_AUDIO.md` - Arquitetura para Live Audio
- ✅ `backend/README.md` - Documentação do backend
- ✅ `vercel.json` atualizado com exemplo de proxy

### 6. Banco de Dados

- ✅ Migration `supabase/migration_ai_usage_logs.sql` criada
- ✅ Tabelas: `ai_usage_logs`, `ai_monthly_usage`

---

## ⏳ Pendente (Futuro)

### 1. Live Audio via WebSocket

**Status:** Documentação completa, implementação pendente

- ⏳ WebSocket Gateway no backend (`AiLiveGateway`)
- ⏳ Migrar `startLiveAudioSession()` para usar WebSocket
- ⏳ Tool calls (web/maps) dentro do Live Audio via backend
- ⏳ Monitoramento de limites em tempo real

**Complexidade:** Alta (requer testes extensivos)

**Prioridade:** Média (funciona atualmente via SDK direto)

**Documentação:** Veja `docs/WEBSOCKET_LIVE_AUDIO.md`

---

### 2. Processamento de Imagem/Vídeo

**Status:** Ainda usa SDK direto no frontend

- ⏳ `processImageWithGemini()` → endpoint `/ai/image`
- ⏳ `analyzeVideoWithGemini()` → endpoint `/ai/video`

**Prioridade:** Baixa (menos crítico para segurança/custo)

---

### 3. Melhorias Futuras

- ⏳ Autenticação JWT no backend (atualmente aceita qualquer `userId`)
- ⏳ Rate limiting por usuário/academia
- ⏳ Cache de respostas frequentes
- ⏳ Dashboard em tempo real (WebSocket)
- ⏳ Alertas automáticos quando limite mensal próximo

---

## 🔒 Segurança Atual

### ✅ Implementado

- API keys nunca no frontend
- Validação de limites mensais
- Logging centralizado
- Separação de dados por `gym_id`

### ⚠️ A Melhorar

- Autenticação JWT no backend (atualmente não valida `userId`)
- Rate limiting por IP/usuário
- Criptografia de API keys no banco (se houver)

---

## 📊 Métricas e Logging

### Tabelas Criadas

```sql
ai_usage_logs
├── id (uuid)
├── gym_id (text)
├── user_id (uuid)
├── feature (text) -- 'chat', 'grounded', 'maps', 'tts', etc
├── model (text)
├── tokens_in (integer)
├── tokens_out (integer)
├── cost_usd (numeric)
└── created_at (timestamptz)

ai_monthly_usage
├── id (uuid)
├── gym_id (text)
├── year_month (text) -- 'YYYY-MM'
├── total_tokens_in (bigint)
├── total_tokens_out (bigint)
├── total_cost_usd (numeric)
├── hard_limit_usd (numeric) -- opcional
└── updated_at (timestamptz)
```

### Logging Automático

Cada chamada ao backend:
1. ✅ Registra em `ai_usage_logs`
2. ✅ Atualiza agregados em `ai_monthly_usage`
3. ✅ Valida limite mensal antes de processar

---

## 🚀 Como Usar

### Frontend

O código já está migrado. Apenas configure:

```env
VITE_AI_BACKEND_URL=https://backend.fitcoach.ai
```

Ou deixe vazio para usar proxy `/api` no Vercel.

### Backend

Configure variáveis:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

Execute migration no Supabase:

```bash
# Via Supabase CLI ou Dashboard SQL Editor
supabase migration up migration_ai_usage_logs
```

---

## 📝 Próximos Passos Recomendados

1. **Imediato:**
   - [ ] Deploy do backend em produção (Railway/Render)
   - [ ] Configurar `VITE_AI_BACKEND_URL` no frontend
   - [ ] Testar todos os endpoints em produção
   - [ ] Validar dashboards de custo

2. **Curto Prazo:**
   - [ ] Implementar autenticação JWT no backend
   - [ ] Adicionar rate limiting
   - [ ] Monitorar custos reais vs estimados

3. **Médio Prazo:**
   - [ ] Migrar Live Audio para WebSocket
   - [ ] Processamento de imagem/vídeo no backend
   - [ ] Dashboard em tempo real

---

## ✅ Checklist de Deploy

### Backend

- [ ] Backend deployado e acessível
- [ ] Variáveis de ambiente configuradas
- [ ] Health check funcionando
- [ ] Migration executada no Supabase

### Frontend

- [ ] `VITE_AI_BACKEND_URL` configurada OU proxy `/api` no Vercel
- [ ] Testar chat de texto
- [ ] Testar web search
- [ ] Testar maps search
- [ ] Testar TTS
- [ ] Verificar dashboards de custo

### Validação

- [ ] Verificar logs em `ai_usage_logs`
- [ ] Verificar agregados em `ai_monthly_usage`
- [ ] Validar cálculo de custo
- [ ] Testar limite mensal (se configurado)

---

## 📚 Arquivos Criados/Modificados

### Backend

- `backend/src/ai/ai.service.ts` - Expandido com grounded, maps, TTS
- `backend/src/ai/ai.controller.ts` - Novos endpoints
- `backend/src/ai/ai-usage.controller.ts` - Dashboard de uso
- `backend/src/ai/ai-pricing.ts` - Cálculo de custos
- `backend/src/ai/ai.module.ts` - Módulo NestJS
- `backend/README.md` - Documentação

### Frontend

- `chatbot/services/geminiService.ts` - Migrado para backend
- `services/aiUsageService.ts` - Novo serviço para dashboards
- `pages/GymFinanceDashboardPage.tsx` - Novo dashboard
- `pages/AdminDashboardPage.tsx` - Novos cards de custo

### Documentação

- `docs/CONFIGURACAO_INFRA_BACKEND.md`
- `docs/WEBSOCKET_LIVE_AUDIO.md`
- `docs/STATUS_MIGRACAO_BACKEND_AI.md` (este arquivo)

### Banco de Dados

- `supabase/migration_ai_usage_logs.sql`

### Infra

- `vercel.json` - Atualizado com proxy exemplo

---

**Última atualização:** 2024-01-XX

