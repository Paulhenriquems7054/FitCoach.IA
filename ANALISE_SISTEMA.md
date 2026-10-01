# FitCoach.IA — Análise Completa do Sistema

> Documento gerado em 30/09/2026 com base na análise profunda da estrutura do projeto.

---

## 1. O que é o Sistema

**FitCoach.IA** é um **SaaS de saúde e fitness com IA**, voltado para três públicos simultâneos:

| Segmento | Descrição |
|---|---|
| **B2C (Usuários individuais)** | Pagam assinatura direta, trial de 7 dias |
| **B2B (Academias)** | Pagam plano mensal e gerenciam seus alunos |
| **Personal Trainers** | Gerenciam equipes de 5 ou 15 alunos |

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | NestJS (Node.js) — deploy separado em Railway/Render |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth (email + senha) |
| IA | Google Gemini API (texto, visão, áudio streaming) |
| Pagamentos | Cakto (gateway brasileiro) |
| Deploy frontend | Vercel |
| Mobile | Capacitor (PWA/mobile) |
| Estado global | Context API (UserContext, ThemeContext, I18nContext, DeviceContext) |
| Cache offline | IndexedDB + localStorage |

---

## 3. Arquitetura Geral

```
Usuário
   │
   ▼
React SPA (Vercel)
   │  HTTP / WebSocket
   ▼
NestJS Backend (Railway / Render)
   │                    │
   ▼                    ▼
Supabase           Google Gemini API
(PostgreSQL + Auth) (texto, visão, voz)
   │
   ▼
Cakto (webhooks de pagamento)
```

O frontend é uma SPA (Single Page Application) em React com Context API para estado global.  
A lógica de IA fica no backend NestJS, que faz a ponte com a API do Gemini — mantendo a chave de API segura no servidor.  
O Supabase gerencia dados e autenticação. O Cakto processa pagamentos via webhooks.

---

## 4. Módulos e Funcionalidades Principais

### 4.1 IA (Core do Produto)

| Funcionalidade | Descrição | Provider |
|---|---|---|
| **Meal Plans** | Geração de plano alimentar semanal personalizado | Gemini API |
| **Photo Analysis** | Análise de foto de prato ou corpo | Gemini Vision |
| **Workout Plans** | Geração de treinos semanais customizados | Gemini API |
| **Wellness Plans** | Plano holístico (nutrição + exercício + suplementos) | Gemini API |
| **Chat Assistant** | Chat em tempo real com IA (texto + voz) | Gemini Live |
| **Voice Analysis** | Análise e interação por voz em streaming | Gemini Live Audio |
| **Weekly Reports** | Relatórios automáticos de progresso | Gemini API |
| **Food Substitutions** | Alternativas saudáveis para refeições | Gemini API |
| **Recipe Search** | Busca de receitas com filtros personalizados | Gemini API |

### 4.2 Gestão de Usuário (B2C)

- Onboarding com perfil: peso, altura, objetivos, restrições alimentares
- Histórico de peso e progresso visual
- Conquistas e pontos de disciplina (gamificação)
- Posts e comunidade social
- Desafios e rankings

### 4.3 Gestão de Academia (B2B)

| Feature | Descrição |
|---|---|
| **GymAdminPage** | Dashboard com métricas de uso de IA |
| **StudentManagement** | Criação, edição e bloqueio de alunos |
| **Analytics** | Relatórios de uso por aluno e período |
| **Custom Branding** | Logo, cores e nome personalizado da academia |
| **Batch Operations** | Criação de alunos em lote |
| **Permissions** | Controle de acesso por cargo (admin, trainer, recepcionista) |

---

## 5. Autenticação

```
1. LoginPage → Supabase Auth (email + senha)
2. Token JWT armazenado no localStorage
3. UserContext gerencia estado global de autenticação
4. Na inicialização do app: verifica trial e status de assinatura
5. Rotas protegidas redirecionam para /login se sessão expirada
```

---

## 6. Modelo de Acesso e Limites de IA

### Fluxo de Acesso

```
Novo usuário → Trial 7 dias (acesso ilimitado à IA)
       │
       ▼ Trial expirou
Paywall → Assinar plano  OU  vincular-se a uma academia
       │
       ▼ Com assinatura ativa
Limites mensais por tipo de uso:
  ├── Texto  (chat)   → X mensagens/mês
  ├── Imagem (fotos)  → X análises/mês
  └── Voz   (Live)   → X minutos/mês
       │
       ▼ Limite de voz esgotado
Recarga FitVoice (compra avulsa):
  ├── Turbo:       20 min   (R$  5,00) — válido por 24h
  ├── Reserve:    100 min   (R$ 12,90) — sem expiração
  └── Pass Libre: ilimitado (R$ 19,90) — válido por 30 dias
```

### Tipos de Usuário e Acesso

| Perfil | Acesso à IA | Comportamento |
|---|---|---|
| Individual — Trial | Ilimitado | 7 dias a partir do cadastro |
| Individual — Assinante | Limitado | Limites mensais por tipo (renovam todo mês) |
| Aluno de Academia | Limitado | Limites compartilhados com a academia |
| Aluno — Voz Extra | Recarga paga | FitVoice (Turbo, Reserve, Pass Libre) |
| Personal Trainer | Limitado | Limite por aluno da equipe |

### Componentes de Controle de Acesso

- `<AiAccessGate>` — Bloqueia acesso se trial expirado ou sem assinatura
- `<AiTrialCounter>` — Exibe dias restantes do trial
- `<TrialExpiredPaywall>` — Força upgrade quando trial expira
- `aiAccessService.ts` — Verifica status de acesso programaticamente
- `academiaLimitsService.ts` — Verifica limites mensais via RPC no Supabase

---

## 7. Fluxo de Pagamento (Cakto)

```
1. Usuário acessa /premium
2. Redirecionamento para checkout externo do Cakto (link por plano)
3. Usuário completa o pagamento
4. Cakto dispara webhook para o backend
5. Backend atualiza subscription_status no Supabase
6. Frontend detecta a mudança via UserContext e libera o acesso
```

### Planos Disponíveis

| Plano | Tipo | Público |
|---|---|---|
| Mensal | B2C | Usuário individual |
| Anual VIP | B2C | Usuário individual com desconto |
| Academy Starter | B2B | Academia pequena |
| Academy Growth | B2B | Academia média |
| Academy Pro | B2B | Academia grande |
| Personal Team 5 | Trainer | Equipe de 5 alunos |
| Personal Team 15 | Trainer | Equipe de 15 alunos |

---

## 8. Integração com IA (Google Gemini)

### Endpoints do Backend NestJS

| Rota | Tipo | Função |
|---|---|---|
| `POST /api/ai/text` | HTTP | Geração de planos e respostas de chat |
| `POST /api/ai/image` | HTTP | Análise de fotos via Gemini Vision |
| `POST /api/ai/voice` | HTTP | Interação por voz |
| `WebSocket /ai/live` | WS | Streaming de áudio com Gemini Live |

### Fluxo de Chamada de IA

```
Frontend
   │
   ├── Verifica limite → academiaLimitsService → Supabase RPC
   │                    (verificar_limite_antes_uso)
   │
   ├── [Limite OK] → POST /api/ai/* → NestJS → Gemini API
   │
   └── [Sem internet] → offlineService.ts (respostas pré-computadas)
```

### Fallback Offline

- `offlineService.ts` fornece respostas mock pré-computadas
- Cache armazenado em `localStorage` e `IndexedDB`
- Funciona sem internet para funcionalidades básicas
- **Não substitui a IA real em produção**

---

## 9. Fluxos de Usuário

### 9.1 Novo Usuário (B2C)

```
Landing Page
    ↓
Cadastro (email + senha)
    ↓
Onboarding (peso, altura, objetivo, restrições)
    ↓
HomePage com trial ativo (7 dias ilimitado)
    ↓
Dia 7: Notificação de expiração
    ├── Assinar plano → Checkout Cakto → Acesso liberado
    └── Ignorar → Redirecionado para /premium (paywall)
```

### 9.2 Usuário com Assinatura Ativa

```
Login
    ↓
HomePage com limites mensais ativos
    ├── Chat: X mensagens/mês
    ├── Fotos: X análises/mês
    └── Voz: X minutos/mês
         ↓ Limite esgotado
    ├── Aguardar renovação mensal
    └── Comprar recarga FitVoice
```

### 9.3 Aluno de Academia (B2B)

```
QR Code ou convite da academia
    ↓
Cadastro com matrícula
    ↓
Vinculado automaticamente à academia (gym_id)
    ↓
Acesso com limites do plano da academia
    ├── Treinos gerados pelo trainer
    ├── Meal plans personalizados
    ├── Chat com IA
    └── Analytics do progresso
```

### 9.4 Admin / Trainer de Academia

```
Login com conta admin
    ↓
GymAdminPage
    ├── Dashboard: alunos ativos, uso de IA, métricas
    ├── Criar/bloquear alunos (individual ou lote)
    ├── Gerar treinos customizados
    ├── Visualizar progresso dos alunos
    └── Gerenciar permissões (roles)
```

---

## 10. Variáveis de Ambiente Críticas

| Variável | Descrição |
|---|---|
| `VITE_GEMINI_API_KEY` | Chave da API do Google Gemini |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública do Supabase |
| `VITE_AI_BACKEND_URL` | URL do backend NestJS em produção |

---

## 11. Pontos de Atenção

### ⚠️ Críticos

1. **Backend NestJS precisa de deploy separado** — não está no Vercel nem no Supabase. Sem ele, toda a funcionalidade de IA para de funcionar.
2. **Webhook do Cakto deve estar configurado** — é ele que ativa as assinaturas após pagamento. Sem o webhook, o sistema não reconhece o pagamento.
3. **Chave do Gemini exposta no frontend** — se `VITE_GEMINI_API_KEY` estiver definida no frontend, ela fica pública. Toda chamada de IA deve passar pelo backend NestJS.

### ℹ️ Arquiteturais

4. **Multi-tenant:** dados de academias são isolados por `gym_id` no Supabase — nunca misturar dados entre academias
5. **Limites verificados via RPC:** a função `verificar_limite_antes_uso` no Supabase deve existir e estar correta para o controle funcionar
6. **Fallback offline:** existe para respostas mock, não para IA real — não deve ser apresentado ao usuário como IA genuína
7. **Trial baseado em data:** o sistema calcula o trial com base em `user.trialStartDate` — garantir que esse campo seja preenchido no cadastro

---

## 12. Resumo Geral

| Aspecto | Detalhe |
|---|---|
| Tipo | SaaS B2B2C de saúde e fitness |
| Frontend | React 19 + Vite (Vercel) |
| Backend | NestJS (Railway/Render) |
| IA | Google Gemini (texto, visão, voz) |
| Banco | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Pagamentos | Cakto (gateway BR) |
| Modelo de negócio | Freemium (trial 7d) + Subscription mensal/anual |
| Multi-tenant | Academias com isolamento por gym_id |
| Limites de IA | Por tipo (texto, imagem, voz) renovados mensalmente |
| Recargas | FitVoice — Turbo, Reserve, Pass Libre |
| Linguagem | TypeScript (frontend e backend) |
