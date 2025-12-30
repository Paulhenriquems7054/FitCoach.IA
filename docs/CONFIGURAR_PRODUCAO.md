# 🚀 Guia de Configuração de Produção - FitCoach.IA

Este guia explica como configurar o app para produção no Vercel.

## 📋 Pré-requisitos

1. ✅ Conta no Vercel (gratuita)
2. ✅ Conta no Supabase (gratuita)
3. ✅ API Key do Google Gemini
4. ✅ Repositório Git (GitHub/GitLab/Bitbucket)

---

## 🔧 Passo 1: Configurar Variáveis de Ambiente no Vercel

### 1.1 Acessar Configurações do Projeto

1. Acesse: https://vercel.com
2. Faça login
3. Selecione seu projeto (ou crie um novo)
4. Vá em **Settings** → **Environment Variables**

### 1.2 Adicionar Variáveis

Adicione as seguintes variáveis (uma por vez):

#### Variável 1: VITE_GEMINI_API_KEY
- **Nome:** `VITE_GEMINI_API_KEY`
- **Valor:** Sua chave API do Gemini
- **Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Como obter:**
1. Acesse: https://aistudio.google.com/apikey
2. Crie uma nova API key ou use uma existente
3. Copie a chave

#### Variável 2: VITE_SUPABASE_URL
- **Nome:** `VITE_SUPABASE_URL`
- **Valor:** URL do seu projeto Supabase (ex: `https://hflwyatppivyncocllnu.supabase.co`)
- **Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Como obter:**
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie o **Project URL**

#### Variável 3: VITE_SUPABASE_ANON_KEY
- **Nome:** `VITE_SUPABASE_ANON_KEY`
- **Valor:** Chave `anon public` do Supabase
- **Ambientes:** ✅ Production, ✅ Preview, ✅ Development

**Como obter:**
1. No mesmo lugar (Settings → API)
2. Copie a chave **anon public** (começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 1.3 Verificar Variáveis

Após adicionar todas as variáveis, verifique se estão corretas:
- ✅ Todas as 3 variáveis estão presentes
- ✅ Valores estão corretos (sem espaços extras)
- ✅ Todas estão habilitadas para Production

---

## 🚀 Passo 2: Fazer Deploy

### 2.1 Via Interface Web (Recomendado)

1. No Vercel, clique em **Deployments**
2. Clique em **Redeploy** no último deploy
3. Ou faça um novo push no repositório Git

### 2.2 Via CLI

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm install -g vercel

# Login
vercel login

# Deploy de produção
vercel --prod
```

### 2.3 Via Git (Automático)

1. Conecte seu repositório Git no Vercel
2. Configure as variáveis de ambiente
3. Cada push na branch `main` faz deploy automático

---

## ✅ Passo 3: Verificar Deploy

### 3.1 Testar App em Produção

1. Acesse a URL fornecida pelo Vercel (ex: `https://fit-coach-ia.vercel.app`)
2. Verifique se o app carrega corretamente
3. Teste funcionalidades básicas:
   - ✅ Login/Cadastro
   - ✅ Chat de IA
   - ✅ Análise de imagem

### 3.2 Verificar Console

1. Abra DevTools (F12)
2. Vá na aba **Console**
3. Verifique se não há erros relacionados a:
   - ❌ Variáveis de ambiente não encontradas
   - ❌ API keys inválidas
   - ❌ Supabase não conectado

### 3.3 Verificar Network

1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Verifique se as requisições estão funcionando:
   - ✅ Requisições para Supabase (status 200)
   - ✅ Requisições para Gemini API (status 200)

---

## 🔗 Passo 4: Configurar Domínio Personalizado (Opcional)

### 4.1 Adicionar Domínio

1. No Vercel, vá em **Settings** → **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `fitcoach.ia`)
4. Siga as instruções de configuração DNS

### 4.2 Configurar DNS

Configure os registros DNS conforme instruções do Vercel:
- **Tipo A:** Apontar para IP do Vercel
- **Tipo CNAME:** Apontar para `cname.vercel-dns.com`

### 4.3 Aguardar Validação

- Pode levar algumas horas para o DNS propagar
- O Vercel notificará quando o domínio estiver ativo

---

## 🔍 Passo 5: Configurar Cakto (Pagamentos)

### 5.1 URLs de Retorno

Para cada plano na Cakto, configure a URL de retorno:

```
https://seu-dominio.vercel.app/#/activation-success?email={email}
```

**Planos a configurar:**
- ✅ Starter Mini
- ✅ Starter
- ✅ Growth
- ✅ Pro
- ✅ Personal Team 5
- ✅ Personal Team 15

**Guia completo:** `docs/CONFIGURAR_URL_RETORNO_CAKTO.md`

### 5.2 Webhook URL

Configure o webhook na Cakto:

```
https://seu-projeto.supabase.co/functions/v1/cakto-webhook
```

**Como configurar:**
1. Acesse: https://app.cakto.com.br
2. Vá em **Configurações** → **Webhooks**
3. Adicione a URL acima
4. Teste o webhook

---

## 🧪 Passo 6: Testes em Produção

### 6.1 Testes Críticos

Execute os seguintes testes:

#### ✅ Teste 1: Autenticação
- [ ] Cadastro de novo usuário
- [ ] Login
- [ ] Recuperação de senha
- [ ] Logout

#### ✅ Teste 2: Funcionalidades de IA
- [ ] Chat de texto
- [ ] Chat de voz
- [ ] Análise de imagem

#### ✅ Teste 3: Assinaturas
- [ ] Trial de 3 dias
- [ ] Compra de plano
- [ ] Ativação automática via webhook

#### ✅ Teste 4: Sistema de Convites
- [ ] Criação de convite
- [ ] Aceitação de convite
- [ ] Trial automático para alunos

---

## 📊 Passo 7: Monitoramento

### 7.1 Verificar Logs

1. No Vercel, vá em **Deployments**
2. Clique no último deploy
3. Veja os **Logs** para erros

### 7.2 Configurar Error Tracking (Opcional)

Quando implementar Sentry:

1. Crie conta em: https://sentry.io
2. Crie um projeto
3. Adicione variável no Vercel:
   - **Nome:** `VITE_SENTRY_DSN`
   - **Valor:** DSN do Sentry

### 7.3 Configurar Analytics (Opcional)

Quando implementar analytics:

1. Crie conta no serviço escolhido (Google Analytics, Plausible, etc.)
2. Adicione variável no Vercel:
   - **Nome:** `VITE_ANALYTICS_ID`
   - **Valor:** ID do analytics

---

## 🚨 Solução de Problemas

### Problema: App não carrega

**Solução:**
1. Verifique se todas as variáveis de ambiente estão configuradas
2. Verifique os logs do deploy no Vercel
3. Verifique o console do navegador (F12)

### Problema: Erro "API key not valid"

**Solução:**
1. Verifique se `VITE_GEMINI_API_KEY` está correta
2. Verifique se a chave não expirou
3. Gere uma nova chave se necessário

### Problema: Erro "Supabase não configurado"

**Solução:**
1. Verifique se `VITE_SUPABASE_URL` está correta
2. Verifique se `VITE_SUPABASE_ANON_KEY` está correta
3. Verifique se as variáveis estão habilitadas para Production

### Problema: Webhook não funciona

**Solução:**
1. Verifique se a URL do webhook está correta
2. Verifique se a função está deployada no Supabase
3. Verifique os logs da função no Supabase

---

## ✅ Checklist Final

Antes de considerar o app pronto para produção:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] App testado em produção
- [ ] URLs de retorno do Cakto configuradas
- [ ] Webhook testado
- [ ] Domínio personalizado configurado (opcional)
- [ ] Testes críticos executados
- [ ] Monitoramento configurado (opcional)

---

## 📝 Próximos Passos

Após configurar produção:

1. **Monitorar:** Acompanhe logs e erros
2. **Otimizar:** Melhore performance conforme necessário
3. **Expandir:** Adicione features baseadas em feedback
4. **Escalar:** Prepare para crescimento de usuários

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique a documentação: `docs/`
2. Consulte o FAQ: `docs/FAQ.md`
3. Veja troubleshooting: `docs/TROUBLESHOOTING.md`
4. Verifique logs no Vercel e Supabase

---

**Status:** ✅ Pronto para produção após seguir este guia

