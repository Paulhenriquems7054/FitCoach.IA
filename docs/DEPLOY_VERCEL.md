# 🚀 Deploy no Vercel - Guia Completo

## ✅ Sim, o app funciona perfeitamente no Vercel!

O Nutri.IA pode ser hospedado no Vercel para demonstração ao cliente. O app já está preparado com fallback automático, então funcionará mesmo sem IA Local.

---

## 🎯 O que funciona no Vercel

### ✅ Funciona:
- ✅ **App completo** (React + Vite)
- ✅ **API Externa** (Gemini) - funciona perfeitamente
- ✅ **Fallback automático** - já implementado
- ✅ **Modo Offline** - respostas pré-definidas
- ✅ **Todas as funcionalidades** principais
- ✅ **PWA** - pode ser instalado como app
- ✅ **IndexedDB** - armazenamento local no navegador

### ⚠️ Limitações:
- ❌ **IA Local (Ollama)** - não funciona (requer servidor local)
- ⚠️ **Ollama embutido** - não disponível no Vercel

**Mas não se preocupe!** O app automaticamente usa a API externa (Gemini) como fallback, então tudo funciona normalmente.

---

## 📋 Pré-requisitos

1. **Conta no Vercel** (gratuita)
   - Acesse: https://vercel.com
   - Faça login com GitHub/GitLab/Bitbucket

2. **Repositório Git** (opcional, mas recomendado)
   - GitHub, GitLab ou Bitbucket
   - Ou faça deploy direto via CLI

3. **API Key do Gemini** (para demonstração)
   - Configure nas variáveis de ambiente do Vercel

---

## 🚀 Deploy Rápido (3 métodos)

### Método 1: Via Interface Web (Mais Fácil) ⭐

1. **Acesse o Vercel:**
   - https://vercel.com
   - Faça login

2. **Importe o projeto:**
   - Clique em "Add New Project"
   - Conecte seu repositório Git
   - Ou faça upload do código

3. **Configure o projeto:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (raiz)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Adicione variáveis de ambiente:**
   - Vá em "Environment Variables"
   - Adicione: `VITE_GEMINI_API_KEY` = sua chave API
   - (Opcional) Adicione outras variáveis se necessário

5. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build (2-3 minutos)
   - Pronto! Seu app estará online

### Método 2: Via CLI (Recomendado)

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   # Na raiz do projeto
   vercel
   ```

4. **Configurar variáveis:**
   ```bash
   vercel env add VITE_GEMINI_API_KEY
   # Cole sua chave quando solicitado
   ```

5. **Deploy de produção:**
   ```bash
   vercel --prod
   ```

### Método 3: Via Git (Automático)

1. **Conecte repositório:**
   - No Vercel, conecte seu repositório Git
   - Configure variáveis de ambiente
   - Cada push no `main`/`master` faz deploy automático

---

## ⚙️ Configuração Detalhada

### 1. Variáveis de Ambiente

No painel do Vercel, adicione:

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `VITE_GEMINI_API_KEY` | Sua chave API do Gemini | ✅ Sim (para demo) |
| `NODE_ENV` | `production` | ⚠️ Opcional (automático) |

**Como adicionar:**
1. Vá em **Settings** → **Environment Variables**
2. Clique em **Add New**
3. Digite o nome e valor
4. Selecione os ambientes (Production, Preview, Development)
5. Salve

### 2. Configuração do Build

O arquivo `vercel.json` já está configurado:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 3. Domínio Personalizado (Opcional)

1. Vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções
4. Aguarde validação (pode levar algumas horas)

---

## 🔧 Ajustes para Vercel

### O app já está preparado!

O código já tem:
- ✅ Fallback automático (IA Local → API → Offline)
- ✅ Variáveis de ambiente configuradas
- ✅ Build otimizado (Vite)
- ✅ PWA configurado
- ✅ Service Worker para cache

### Comportamento no Vercel:

1. **IA Local:** Não disponível (Ollama não roda no Vercel)
2. **API Externa:** ✅ Funciona perfeitamente
3. **Modo Offline:** ✅ Funciona (respostas pré-definidas)

O usuário nem perceberá a diferença! O app automaticamente usa a melhor opção disponível.

---

## 📱 Testando o Deploy

### Após o deploy:

1. **Acesse a URL fornecida:**
   - Exemplo: `https://nutri-ia.vercel.app`

2. **Teste as funcionalidades:**
   - ✅ Gerar plano alimentar
   - ✅ Analisar foto de refeição
   - ✅ Chatbot
   - ✅ Todas as páginas

3. **Verifique o console:**
   - Abra DevTools (F12)
   - Verifique se não há erros
   - Confirme que está usando API externa

---

## 🎨 Personalização

### 1. Nome do Projeto

No Vercel:
- **Settings** → **General** → **Project Name**
- Altere para o nome desejado

### 2. URL Personalizada

- **Settings** → **Domains**
- Adicione domínio customizado

### 3. Ambiente de Preview

Cada Pull Request cria um preview:
- URL única para cada PR
- Perfeito para testes antes de merge

---

## 🔒 Segurança

### Variáveis de Ambiente

- ✅ **Nunca commite** API keys no código
- ✅ Use variáveis de ambiente do Vercel
- ✅ Diferentes valores para Production/Preview

### Headers de Segurança

O `vercel.json` já inclui:
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options
- ✅ X-XSS-Protection
- ✅ Cache-Control otimizado

---

## 📊 Monitoramento

### Analytics (Opcional)

1. **Vercel Analytics:**
   - Ative em **Settings** → **Analytics**
   - Veja métricas de performance

2. **Logs:**
   - **Deployments** → Clique no deploy → **Logs**
   - Veja erros e warnings

---

## 🚨 Solução de Problemas

### Build falha

1. **Verifique os logs:**
   - Vá em **Deployments** → **Logs**
   - Procure por erros

2. **Verifique variáveis:**
   - Confirme que `VITE_GEMINI_API_KEY` está configurada
   - Verifique se o valor está correto

3. **Teste localmente:**
   ```bash
   npm run build
   # Se funcionar local, deve funcionar no Vercel
   ```

### App não carrega

1. **Verifique o console:**
   - Abra DevTools (F12)
   - Veja erros no console

2. **Verifique a URL:**
   - Confirme que está acessando a URL correta
   - Tente limpar cache do navegador

### API não funciona

1. **Verifique variáveis:**
   - Confirme que `VITE_GEMINI_API_KEY` está configurada
   - Verifique se a chave é válida

2. **Teste a chave:**
   - Use a chave em um teste local
   - Confirme que funciona

---

## 📝 Checklist de Deploy

Antes de fazer deploy:

- [ ] Código testado localmente
- [ ] `npm run build` funciona sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] `vercel.json` criado (já está criado)
- [ ] `.vercelignore` configurado (já está criado)
- [ ] README atualizado (opcional)
- [ ] Testes básicos realizados

---

## 🎯 URLs de Exemplo

Após o deploy, você terá:

- **Produção:** `https://nutri-ia.vercel.app`
- **Preview:** `https://nutri-ia-git-branch.vercel.app`
- **Customizado:** `https://nutri-ia.com` (se configurado)

---

## 💡 Dicas

1. **Use Preview Deploys:**
   - Cada PR cria um preview
   - Teste antes de merge

2. **Configure CI/CD:**
   - Deploy automático em cada push
   - Rollback fácil se necessário

3. **Monitore Performance:**
   - Use Vercel Analytics
   - Otimize conforme necessário

4. **Backup:**
   - Mantenha código no Git
   - Vercel mantém histórico de deploys

---

## ✅ Resumo

**Sim, o app funciona perfeitamente no Vercel!**

- ✅ Deploy simples e rápido
- ✅ Funciona com API externa (Gemini)
- ✅ Fallback automático já implementado
- ✅ PWA configurado
- ✅ Performance otimizada
- ✅ Gratuito para começar

**Limitação única:**
- ❌ IA Local (Ollama) não funciona (mas não é necessário, API externa funciona)

---

**Status:** ✅ Pronto para deploy  
**Tempo estimado:** 5-10 minutos  
**Dificuldade:** Fácil

---

## 🚀 Próximos Passos

1. Crie conta no Vercel
2. Faça deploy (método 1 é o mais fácil)
3. Configure variáveis de ambiente
4. Compartilhe a URL com o cliente!

**URL de exemplo após deploy:**
`https://nutri-ia.vercel.app`

