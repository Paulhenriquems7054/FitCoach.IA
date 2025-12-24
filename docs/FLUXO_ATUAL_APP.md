# 📱 Como o FitCoach.IA Funciona Agora

## 🎯 Visão Geral

O FitCoach.IA é uma aplicação **B2B2C** (Business-to-Business-to-Consumer) que oferece:
- **Para Academias (B2B)**: Plataforma de gestão de alunos e treinos
- **Para Alunos (B2C)**: Coach de IA para treinos e nutrição personalizados
- **Para Desenvolvedores**: Dashboard completo com métricas e controle total

---

## 🚀 Fluxo de Entrada no App

### 1️⃣ **Primeiro Acesso (Usuário Novo)**

```
┌─────────────────┐
│  Landing Page    │ ← Tela inicial com "Treinos e Nutrição Consciente"
│  (Pública)       │    - Botão "Entrar" no header
└────────┬────────┘    - Botão deslizante "DESLIZE PARA ENTRAR"
         │              - Link "Tenho um convite"
         │
         ▼
┌─────────────────┐
│  Login Page     │ ← Tela completa de login/cadastro
│  (Pública)       │    - Login com nome/email e senha
└────────┬────────┘    - Cadastro com código de convite (opcional)
         │              - Cadastro sem código (plano free)
         │              - Recuperação de senha
         │
         ▼
┌─────────────────┐
│  Welcome Survey │ ← APENAS para alunos vinculados a academia
│  (Condicional)  │    - Aparece no primeiro acesso de alunos
└────────┬────────┘    - NÃO aparece para usuários B2C individuais
         │              - NÃO aparece para admins/personals
         │
         ▼
┌─────────────────┐
│  Dashboard      │ ← Home do usuário (baseado no tipo)
└─────────────────┘
```

### 2️⃣ **Usuário Já Logado**

```
┌─────────────────┐
│  Verificação    │ ← Checa se está logado
│  de Login       │
└────────┬────────┘
         │
         ├─→ Logado? ──→ Dashboard (baseado no tipo de usuário)
         │
         └─→ Não logado? ──→ Landing Page → Login Page
```

---

## 👥 Tipos de Usuários e Permissões

### 🎓 **Aluno (Student) - B2B2C**
- **Como se cadastra**: Recebe código de convite da academia
- **Trial de IA**: 7 dias automático ao aceitar convite
- **Acesso**: Dashboard de aluno, treinos, progresso
- **Enquete**: Aparece no primeiro acesso
- **Paywall**: Aparece quando trial expira (planos de IA individuais)
- **Rotas bloqueadas**: `/admin-dashboard`, `/student-management`, `/gym-admin`

### 🏋️ **Personal Trainer**
- **Como se cadastra**: Código de convite da academia (role: `personal`)
- **Acesso**: Dashboard de personal, visualizar alunos, criar treinos
- **Sem acesso**: Cobranças, detalhes de pagamento de alunos
- **Rotas permitidas**: `/professional`, `/trainer-workout`

### 🏢 **Admin da Academia**
- **Como se cadastra**: Código mestre ou convite da academia (role: `admin_academy`)
- **Acesso**: Dashboard administrativo, gerenciar alunos, gerar convites
- **Sem acesso**: Detalhes de uso de IA dos alunos, pagamentos individuais
- **Rotas permitidas**: `/student-management`, `/gym-admin`, `/admin-dashboard`

### 👨‍💻 **Desenvolvedor (Owner)**
- **Como se cadastra**: Username `Desenvolvedor` ou `dev123`
- **Acesso**: Dashboard completo com métricas B2B2C
- **Controle total**: Limites, preços, métricas, trials
- **Rotas permitidas**: Todas, especialmente `/admin-dashboard`

### 👤 **Usuário B2C Individual**
- **Como se cadastra**: Sem código (cadastro livre) ou código `ESTE-FREE`
- **Plano**: `free` por padrão
- **Acesso**: Dashboard individual, funcionalidades básicas
- **Sem enquete**: Não aparece Welcome Survey
- **Rotas permitidas**: Rotas de usuário comum

---

## 🔐 Sistema de Autenticação

### **Login**
- **Método**: Nome/email + senha
- **Armazenamento**: IndexedDB (local) + Supabase (cloud)
- **Sessão**: Persistente até logout manual ou 30min de inatividade

### **Cadastro**
1. **Com Código de Convite**:
   - Valida código → Vincula a academia → Inicia trial de IA (se aluno)
   
2. **Sem Código (Livre)**:
   - Cria conta com plano `free`
   - Status: `inactive` (pode ativar depois)
   - Sem vínculo com academia

3. **Com Código Mestre**:
   - Valida código mestre → Define plano premium
   - Status: `active`

---

## 🎯 Sistema de Rotas

### **Rotas Públicas** (não requerem login)
- `/landing` - Landing page inicial
- `/login` - Página de login/cadastro
- `/presentation` - Apresentação do app
- `/premium` - Página de planos premium

### **Rotas Protegidas** (requerem login)
- `/` - Home (Dashboard baseado no tipo de usuário)
- `/welcome-survey` - Enquete de onboarding (apenas alunos)
- `/analyzer` - Análise de fotos de comida
- `/generator` - Gerador de planos alimentares
- `/reports` - Relatórios e progresso
- `/perfil` - Perfil do usuário
- `/configuracoes` - Configurações

### **Rotas Administrativas**
- `/admin-dashboard` - Dashboard do desenvolvedor/admin
- `/student-management` - Gerenciamento de alunos (academia)
- `/gym-admin` - Administração da academia
- `/professional` - Dashboard do personal trainer
- `/permissions` - Gerenciamento de permissões

### **Rotas Especiais**
- `/student-ai-plans` - Planos de IA para alunos (paywall)
- `/premium` - Planos premium
- `/subscription-status` - Status de assinatura

---

## 🧪 Sistema de Trial e Paywall

### **Trial de IA (Alunos)**
- **Duração**: 7 dias a partir do primeiro acesso
- **Início**: Automático ao aceitar convite da academia
- **Acesso**: Funcionalidades de IA completas durante trial
- **Expiração**: Bloqueia IA e mostra paywall

### **Paywall**
- **Quando aparece**: 
  - Trial expirado (alunos)
  - Tentativa de usar IA sem plano ativo
- **O que oferece**: Planos individuais de IA
  - Básico: R$ 19,90/mês
  - Plus: R$ 39,90/mês
  - Ilimitado: R$ 79,90/mês
- **Onde aparece**: 
  - Componente `TrialExpiredPaywall`
  - Página `/student-ai-plans`

---

## 🛡️ Controle de Acesso à IA

### **Guards de API**
- **Função**: `assertAiAccessOrThrow(user, feature)`
- **Onde está**: `services/aiAccessService.ts`
- **Verifica**:
  - Se usuário tem assinatura ativa
  - Se trial não expirou
  - Se plano permite a funcionalidade

### **Componentes Protegidos**
- `AiAccessGate` - Wrapper que bloqueia UI se sem acesso
- `PlateAnalyzer` - Análise de fotos (feature: `vision`)
- `LiveConversation` - Conversa por voz (feature: `voice`)
- `ChatbotPopup` - Chat de texto (feature: `chat`)
- `generateMealPlan` - Geração de planos (feature: `plan`)

### **Tracking de Uso**
- **Serviço**: `aiMetricsService.ts`
- **Registra**:
  - Início de trial
  - Expiração de trial
  - Conversão para pago
  - Uso de IA (chat, voice, vision, plan)

---

## 📊 Sistema de Métricas B2B2C

### **Métricas Disponíveis** (Dashboard Desenvolvedor)
- **Trials Iniciados**: Total de alunos que iniciaram trial
- **Conversões**: Alunos que converteram para plano pago
- **Taxa de Conversão**: % de conversão trial → pago
- **Média Dias Trial**: Tempo médio em trial antes de converter
- **Top Academias**: Ranking por taxa de conversão
- **Uso de IA**: Uso médio por aluno (mensagens, voz, visão, planos)

### **Onde Visualizar**
- `/admin-dashboard` - Seção "Métricas B2B2C - Conversão de Alunos"

---

## 🔄 Fluxo de Convites (B2B2C)

### **Como Funciona**
1. **Academia gera convite**:
   - Admin acessa `/student-management`
   - Clica em "Gerar Convite Aluno" ou "Gerar Convite Personal"
   - Recebe link/QR Code: `#/login?invite=CODIGO`

2. **Aluno aceita convite**:
   - Acessa link ou insere código na LoginPage
   - Cria conta → Vincula a `academy_id`
   - Inicia trial de IA automaticamente (7 dias)

3. **Trial expira**:
   - IA bloqueada
   - Paywall aparece
   - Aluno pode assinar plano individual

---

## 🎨 Interface e UX

### **Landing Page**
- **Design**: Glassmorphism, gradientes, animações
- **Elementos**:
  - Logo centralizado no header
  - Título: "Treinos e Nutrição Consciente"
  - Botão deslizante interativo
  - Link "Tenho um convite"

### **Login Page**
- **Design**: Card centralizado, tema claro/escuro
- **Funcionalidades**:
  - Login com nome/email e senha
  - Cadastro com código de convite (modal)
  - Cadastro sem código (modal)
  - Recuperação de senha (modal)
  - Toggle de tema

### **Dashboard**
- **Layout**: Sidebar + Header + Main content
- **Responsivo**: Mobile-first, adapta para tablet/desktop
- **Tema**: Suporta claro/escuro/sistema

---

## 🔧 Tecnologias e Arquitetura

### **Frontend**
- **Framework**: React + TypeScript
- **Build**: Vite
- **Roteamento**: Hash-based (`window.location.hash`)
- **Estado**: Context API (UserContext, ThemeContext, etc.)
- **Storage**: IndexedDB (local) + Supabase (cloud)

### **Backend**
- **BaaS**: Supabase (Auth, Database, Storage)
- **IA**: Google Gemini API
- **Autenticação**: Supabase Auth + IndexedDB (fallback offline)

### **PWA**
- **Service Worker**: Gerenciado em `index.tsx`
- **Manifest**: `manifest.json`
- **Offline**: Suporte básico

---

## 📝 Notas Importantes

### **Welcome Survey**
- ✅ Aparece **APENAS** para alunos vinculados a academia (`tenantRole === 'student' && academyId`)
- ❌ **NÃO** aparece para usuários B2C individuais
- ❌ **NÃO** aparece para admins/personals

### **Trial de IA**
- ✅ Apenas alunos têm trial automático
- ✅ Trial dura 7 dias
- ✅ Após expirar, paywall aparece automaticamente

### **Permissões**
- ✅ Alunos não acessam rotas administrativas
- ✅ Academias não veem detalhes de pagamento de alunos
- ✅ Personals não têm acesso a cobranças
- ✅ Desenvolvedor tem acesso total

### **Cadastro Livre**
- ✅ Qualquer pessoa pode se cadastrar sem código
- ✅ Recebe plano `free` automaticamente
- ✅ Pode usar funcionalidades básicas
- ✅ Pode ativar plano premium depois

---

## 🚨 Resolução de Problemas

### **App fica em "Carregando..."**
- Verificar console do navegador
- Verificar se há erros de redirecionamento
- Limpar localStorage e IndexedDB se necessário

### **Trial não inicia**
- Verificar se aluno aceitou convite corretamente
- Verificar `aiTrialStartAt` e `aiTrialEndAt` no banco
- Verificar se `aiSubscriptionStatus === 'trial'`

### **Paywall não aparece**
- Verificar se trial realmente expirou
- Verificar se `AiAccessGate` está envolvendo componentes
- Verificar logs de `aiAccessService`

---

## 📚 Arquivos Principais

- `App.tsx` - Roteamento principal e lógica de acesso
- `pages/LoginPage.tsx` - Login e cadastro
- `pages/LandingPage.tsx` - Landing page inicial
- `pages/WelcomeSurveyPage.tsx` - Enquete de onboarding
- `services/aiAccessService.ts` - Controle de acesso à IA
- `services/inviteService.ts` - Gerenciamento de convites
- `services/aiMetricsService.ts` - Métricas B2B2C
- `components/AiAccessGate.tsx` - Guard de UI para IA
- `components/TrialExpiredPaywall.tsx` - Paywall de trial expirado

---

**Última atualização**: 23/12/2025

