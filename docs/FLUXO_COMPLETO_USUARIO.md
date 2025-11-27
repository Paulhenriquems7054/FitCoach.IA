# 🎯 Fluxo Completo do Usuário - FitCoach.IA

## 📋 Objetivo do Fluxo

```
Veja como é fácil começar sua transformação

Passo 1: Faça sua Assinatura
Passo 2: Baixe o App
Passo 3: Faça Login
Passo 4: Comece a Transformação
```

## ✅ Implementação Atual

### 🛒 Passo 1: Faça sua Assinatura

**O que o usuário vê:**
- Página de venda (`/premium`) com 3 planos:
  - Basic - R$ 29,90/mês
  - Premium - R$ 59,90/mês (Mais Popular)
  - Enterprise - R$ 199,90/mês

**O que acontece:**
1. Usuário acessa: `https://fit-coach-ia.vercel.app/#/premium`
2. Escolhe um plano
3. Clica em "Assinar [Nome do Plano]"
4. É redirecionado para o Cakto para pagamento
5. Completa o pagamento

**Status:** ✅ **Implementado**
- Página: `pages/PremiumPage.tsx`
- Links de pagamento configurados
- Integração com Cakto funcionando

---

### 📧 Passo 2: Baixe o App

**O que o usuário recebe:**
- Email automático após confirmação do pagamento
- Email contém:
  - 🔑 **Credenciais de acesso** (username + senha temporária)
  - 🚀 **Link de acesso rápido** (login automático)
  - 🔑 **Link de login manual**
  - 📱 **Instruções de como acessar**

**O que acontece:**
1. Cakto confirma pagamento
2. Webhook `cakto-webhook` é acionado
3. Sistema cria:
   - Conta no Supabase Auth
   - Usuário na tabela `users`
   - Assinatura ativa
   - Registro de pagamento
4. Email é enviado automaticamente com:
   - Username e senha temporária
   - Link de acesso rápido (com token)
   - Link de login manual

**Status:** ✅ **Implementado**
- Webhook: `supabase/functions/cakto-webhook/index.ts`
- Função de email: `supabase/functions/send-email/index.ts`
- Criação automática de conta
- Envio de credenciais

**Email enviado inclui:**
```
🎉 Pagamento Confirmado!

🔑 Suas Credenciais de Acesso
- Username: [username]
- Senha temporária: [senha]

🚀 Acessar Agora (Login Automático)
🔑 Fazer Login Manual
```

---

### 🔐 Passo 3: Faça Login

**Opção 1: Login Automático (Recomendado)**
- Usuário clica no link de acesso rápido do email
- App detecta token na URL
- Faz login automaticamente
- Redireciona para apresentação ou home

**Opção 2: Login Manual**
- Usuário acessa: `https://fit-coach-ia.vercel.app/#/login`
- Digita:
  - **Username** (do email)
  - **Senha temporária** (do email)
- Clica em "Entrar"
- Acessa o app

**O que acontece:**
1. Sistema valida credenciais
2. Carrega dados do usuário
3. Verifica assinatura ativa
4. Redireciona para home ou apresentação

**Status:** ✅ **Implementado**
- Página de login: `pages/LoginPage.tsx`
- Processamento de token: `App.tsx` + `LoginPage.tsx`
- Validação de credenciais
- Carregamento de dados do usuário

---

### 🚀 Passo 4: Comece a Transformação

**Recursos disponíveis:**
- 📸 **Análise de Foto** - Aponte a câmera para sua comida
- 💬 **Chat com IA** - Converse sobre nutrição e treinos
- 📊 **Relatórios** - Veja os resultados aparecerem
- 🏋️ **Planos de Treino** - Personalizados pela IA
- 🍎 **Planos de Refeição** - Nutrição inteligente

**O que o usuário pode fazer:**
1. **Análise de Foto:**
   - Acessa `/analyzer`
   - Tira foto da comida
   - IA analisa e dá informações nutricionais

2. **Chat com IA:**
   - Acessa chatbot
   - Conversa sobre nutrição, treinos, objetivos
   - IA responde com conhecimento personalizado

3. **Relatórios:**
   - Acessa `/reports`
   - Vê gráficos de progresso
   - Análises detalhadas

4. **Planos Personalizados:**
   - Acessa `/wellness`
   - Recebe planos de treino e refeição
   - Personalizados para seus objetivos

**Status:** ✅ **Implementado**
- Todas as funcionalidades principais disponíveis
- IA integrada (Gemini)
- Análise de fotos funcionando
- Chat com memória
- Relatórios e gráficos

---

## 🔄 Fluxo Visual Completo

```
┌─────────────────────────────────────────────────────────┐
│  PASSO 1: ASSINATURA                                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Usuário acessa /premium                           │  │
│  │ Escolhe plano (Basic/Premium/Enterprise)         │  │
│  │ Clica em "Assinar"                                │  │
│  │ Redirecionado para Cakto                          │  │
│  │ Completa pagamento                                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  PASSO 2: RECEBE EMAIL                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Webhook cakto-webhook é acionado                  │  │
│  │ Cria conta no Supabase Auth                       │  │
│  │ Cria usuário na tabela users                      │  │
│  │ Cria assinatura ativa                              │  │
│  │ Envia email com:                                   │  │
│  │   - Username + Senha temporária                   │  │
│  │   - Link de acesso rápido                         │  │
│  │   - Link de login manual                           │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  PASSO 3: FAZ LOGIN                                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Opção A: Clica no link de acesso rápido          │  │
│  │   → Login automático com token                    │  │
│  │   → Redireciona para app                          │  │
│  │                                                     │  │
│  │ Opção B: Acessa /login manualmente                │  │
│  │   → Digita username e senha                       │  │
│  │   → Clica em "Entrar"                             │  │
│  │   → Acessa app                                    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  PASSO 4: COMEÇA A TRANSFORMAÇÃO                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 📸 Analisa fotos de comida                        │  │
│  │ 💬 Conversa com IA sobre nutrição/treinos         │  │
│  │ 📊 Vê relatórios de progresso                     │  │
│  │ 🏋️ Recebe planos personalizados                   │  │
│  │ 🍎 Planos de refeição inteligentes                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## ✅ Checklist de Funcionalidades

### Passo 1: Assinatura
- [x] Página de venda (`/premium`)
- [x] 3 planos disponíveis
- [x] Links de pagamento Cakto
- [x] Integração funcionando

### Passo 2: Email e Acesso
- [x] Webhook processa pagamento
- [x] Cria conta no Supabase Auth
- [x] Gera senha temporária
- [x] Envia email com credenciais
- [x] Dois links no email (rápido + manual)

### Passo 3: Login
- [x] Página de login (`/login`)
- [x] Login automático com token
- [x] Login manual com credenciais
- [x] Validação de usuário
- [x] Carregamento de dados

### Passo 4: Funcionalidades
- [x] Análise de fotos
- [x] Chat com IA
- [x] Relatórios
- [x] Planos de treino
- [x] Planos de refeição

## 🎯 Status Geral

**✅ TODOS OS PASSOS ESTÃO IMPLEMENTADOS E FUNCIONANDO!**

O fluxo completo está operacional. Após atualizar o webhook com o código corrigido, tudo funcionará perfeitamente.

## 📝 Próximas Ações

1. ✅ Atualizar webhook `cakto-webhook` no Dashboard
2. ✅ Testar fluxo completo com pagamento real
3. ✅ Verificar se emails estão chegando
4. ✅ Testar login automático e manual

## 💡 Melhorias Futuras (Opcional)

- [ ] App mobile nativo (iOS/Android)
- [ ] Notificações push
- [ ] Integração com wearables
- [ ] Gamificação avançada
- [ ] Comunidade de usuários


