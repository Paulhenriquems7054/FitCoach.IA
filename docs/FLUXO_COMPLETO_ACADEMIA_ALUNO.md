# 🔄 Fluxo Completo: Academia → Aluno

## 📋 Visão Geral do Fluxo

Este documento descreve o fluxo completo desde a compra do plano pela academia até o aluno acessar o app.

## 🎯 Fluxo Passo a Passo

### 1️⃣ Academia Compra Plano

```
Cliente (Academia)
  ↓
Acessa: https://pagina-de-vendas-fit-coach-ai.vercel.app/
  ↓
Escolhe plano B2B (Starter Mini, Starter, Growth, Pro)
  ↓
Clica em "Assinar Agora"
  ↓
Redirecionado para: https://pay.cakto.com.br/[checkout_id]
  ↓
Efetua pagamento na Cakto
```

### 2️⃣ Webhook Processa Pagamento

```
Cakto envia webhook → Supabase Edge Function
  ↓
Processa pagamento:
  ✅ Cria empresa na tabela companies
  ✅ Gera master_code (ex: ACADEMIA-ABC)
  ✅ Cria código de convite padrão (ex: ABC123)
  ✅ Envia email com informações
```

### 3️⃣ Academia Recebe Informações

**📧 Email Automático:**
```
Assunto: ✅ Academia Ativada - Código de Convite: ABC123

Conteúdo:
  ✅ Código de convite: ABC123
  ✅ Master code: ACADEMIA-ABC
  ✅ Link do app: https://pagina-de-vendas-fit-coach-ai.vercel.app/
  ✅ Link direto com código: https://pagina-de-vendas-fit-coach-ai.vercel.app/#/login?invite=ABC123
  ✅ Instruções de uso
```

**🌐 Página de Ativação:**
```
URL: https://pagina-de-vendas-fit-coach-ai.vercel.app/#/activation-success?email={email}

Exibe:
  ✅ Código de convite destacado
  ✅ Master code
  ✅ Botões para copiar
  ✅ Link completo para compartilhar
```

### 4️⃣ Academia Compartilha com Alunos

**Academia compartilha:**
- 🔗 **Link do app:** `https://pagina-de-vendas-fit-coach-ai.vercel.app/`
- 🔑 **Código de convite:** `ABC123`

**Formas de compartilhar:**
- WhatsApp
- Email
- QR Code (futuro)
- Link direto: `https://pagina-de-vendas-fit-coach-ai.vercel.app/#/login?invite=ABC123`

### 5️⃣ Aluno Recebe e Usa Código

```
Aluno recebe:
  - Link do app
  - Código de convite: ABC123
  ↓
Acessa: https://pagina-de-vendas-fit-coach-ai.vercel.app/
  ↓
Vai para página de login
  ↓
Clica em "Criar Conta"
  ↓
Insere código de convite: ABC123
  ↓
Clica em "Validar"
  ↓
Código validado ✅
  ↓
Preenche dados:
  - Nome
  - Email
  - Senha
  ↓
Clica em "Criar Conta"
```

### 6️⃣ Sistema Processa Cadastro

```
Sistema processa:
  ✅ Valida código de convite
  ✅ Vincula aluno à academia (academy_id)
  ✅ Define role: 'student'
  ✅ Ativa trial de 3 dias de IA automaticamente
  ✅ Cria perfil do aluno
```

### 7️⃣ Aluno Acessa o App

```
Aluno faz login:
  - Email ou username
  - Senha
  ↓
Acessa o app:
  ✅ Trial de 3 dias ativo
  ✅ 5 min/dia de voz (15 min total)
  ✅ 1 análise de prato
  ✅ 1 plano alimentar
  ✅ Chat de texto ilimitado
```

## 📊 Diagrama do Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ACADEMIA COMPRA PLANO                                     │
│    Página de Vendas → Cakto → Pagamento                      │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. WEBHOOK PROCESSA                                          │
│    ✅ Cria empresa                                           │
│    ✅ Gera master_code                                        │
│    ✅ Cria código de convite                                  │
│    ✅ Envia email                                            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ACADEMIA RECEBE                                           │
│    📧 Email com código                                       │
│    🌐 Página de ativação                                     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ACADEMIA COMPARTILHA                                      │
│    🔗 Link do app                                            │
│    🔑 Código de convite: ABC123                             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. ALUNO USA CÓDIGO                                          │
│    Acessa app → Login → Insere código → Valida              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. SISTEMA CRIA PERFIL                                       │
│    ✅ Vincula à academia                                     │
│    ✅ Ativa trial de 3 dias                                  │
│    ✅ Cria perfil                                            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. ALUNO ACESSA APP                                           │
│    ✅ Trial ativo                                            │
│    ✅ Funcionalidades de IA disponíveis                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Informações Importantes

### Para a Academia

**O que recebe:**
- ✅ `master_code`: Identificador único (ex: `ACADEMIA-ABC`)
- ✅ Código de convite: Para compartilhar com alunos (ex: `ABC123`)
- ✅ Link do app: `https://pagina-de-vendas-fit-coach-ai.vercel.app/`
- ✅ Link direto: `https://pagina-de-vendas-fit-coach-ai.vercel.app/#/login?invite=ABC123`

**Como compartilhar:**
1. Compartilhar código: `ABC123`
2. Compartilhar link: `https://pagina-de-vendas-fit-coach-ai.vercel.app/`
3. Compartilhar link direto: `https://pagina-de-vendas-fit-coach-ai.vercel.app/#/login?invite=ABC123`

### Para o Aluno

**O que precisa:**
- ✅ Link do app
- ✅ Código de convite

**O que acontece ao usar o código:**
- ✅ Vinculado à academia automaticamente
- ✅ Recebe trial de 3 dias de IA
- ✅ Pode usar funcionalidades de IA durante trial
- ✅ Após trial, precisa assinar plano individual

## 📝 Exemplo Prático

### Cenário Real

1. **Academia "FitLife" compra plano Starter:**
   - Acessa página de vendas
   - Escolhe "Starter"
   - Paga R$ 149,90/mês
   - Recebe email com:
     - Master code: `ACADEMIA-XYZ`
     - Código de convite: `XYZ789`
     - Link: `https://pagina-de-vendas-fit-coach-ai.vercel.app/`

2. **Academia compartilha com aluno "João":**
   - Envia via WhatsApp:
     ```
     Olá João! Use este código para acessar o app:
     Código: XYZ789
     Link: https://pagina-de-vendas-fit-coach-ai.vercel.app/
     ```

3. **João se cadastra:**
   - Acessa o link
   - Vai em "Criar Conta"
   - Insere código: `XYZ789`
   - Valida código ✅
   - Preenche: Nome, Email, Senha
   - Cria conta

4. **João acessa o app:**
   - Faz login
   - Trial de 3 dias ativo ✅
   - Pode usar IA (5 min/dia voz, 1 análise, 1 plano)

5. **Após 3 dias:**
   - Trial expira
   - Funcionalidades bloqueadas
   - João precisa assinar plano individual (R$ 34,90/mês)

## ✅ Checklist de Funcionalidades

- [x] Webhook cria código de convite automaticamente
- [x] Email enviado com código e link
- [x] Página de ativação exibe código
- [x] Aluno pode usar código para criar conta
- [x] Trial de 3 dias ativado automaticamente
- [x] Aluno vinculado à academia
- [x] Link direto com código funciona

## 🎯 Resumo

**Academia:**
1. Compra plano → Recebe código de convite
2. Compartilha código com alunos
3. Alunos usam código para criar conta

**Aluno:**
1. Recebe código de convite
2. Acessa app e insere código
3. Cria perfil
4. Recebe trial de 3 dias
5. Acessa funcionalidades de IA

**Sistema:**
1. Processa pagamento
2. Cria código automaticamente
3. Envia email
4. Valida código quando aluno usa
5. Ativa trial automaticamente

