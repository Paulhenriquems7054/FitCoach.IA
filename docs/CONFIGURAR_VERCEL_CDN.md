# Configurar VITE_GIF_CDN_URL no Vercel

## ✅ URL do R2 Obtida

**URL pública do R2:**
```
https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev
```

⚠️ **IMPORTANTE:** Esta URL **NÃO** deve ter barra final (`/`)

## ⚙️ Passo a Passo: Configurar no Vercel

### 1. Acessar Vercel

1. Acesse: https://vercel.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **FitCoach.IA**

### 2. Adicionar Variável de Ambiente

1. **Vá em Settings:**
   - No menu lateral, clique em **Settings** (Configurações)

2. **Acessar Environment Variables:**
   - No menu de Settings, clique em **Environment Variables** (Variáveis de Ambiente)

3. **Adicionar Nova Variável:**
   - Clique no botão **"Add New"** (Adicionar Nova) ou **"Add"** (Adicionar)

4. **Preencher os Campos:**
   - **Name (Nome):** `VITE_GIF_CDN_URL`
     - ⚠️ **EXATAMENTE** assim, com maiúsculas e underscores
   - **Value (Valor):** `https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev`
     - ⚠️ **Sem barra final** (`/`)
     - ⚠️ Com `https://` no início
   - **Environment (Ambiente):** Selecione **TODAS** as opções:
     - ☑️ Production (Produção)
     - ☑️ Preview (Visualização)
     - ☑️ Development (Desenvolvimento)

5. **Salvar:**
   - Clique em **"Save"** (Salvar)

### 3. Verificação

Após salvar, você deve ver a variável na lista:

```
VITE_GIF_CDN_URL = https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev
[Production] [Preview] [Development]
```

## 🚀 Próximo Passo: Fazer Deploy

Após configurar a variável:

1. **Vá em Deployments:**
   - No menu lateral, clique em **Deployments** (Implantações)

2. **Fazer Redeploy:**
   - Clique nos **três pontos (...)** do último deploy
   - Selecione **"Redeploy"** (Reimplantar)
   - Aguarde o deploy concluir (pode levar alguns minutos)

3. **Ou fazer novo commit:**
   - Faça qualquer alteração (ou apenas um commit vazio)
   - Faça push - o Vercel fará deploy automaticamente

## ✅ Testar

Após o deploy:

1. **Acesse o app:**
   - Vá para: https://fit-coach-ia.vercel.app/#/biblioteca
   - Ou qualquer página onde os GIFs são exibidos

2. **Verificar no console:**
   - Abra DevTools (F12)
   - Vá na aba **Console**
   - Você verá logs indicando quando o CDN é usado

3. **Testar URL direta:**
   - Teste acessar: `https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev/GIFS/Abdomen/Abdominais.gif`
   - Se o GIF aparecer, está funcionando! ✅

## 🔍 Exemplo de Como Fica

### No Vercel:

```
Name: VITE_GIF_CDN_URL
Value: https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev
Environments: ☑️ Production ☑️ Preview ☑️ Development
```

### No Código (automático):

O código já está preparado para usar essa variável. Quando o app tentar carregar um GIF e falhar no servidor local, automaticamente tentará:

```
https://pub-be71add17115442eb45d8f0c1308bb06.r2.dev/GIFS/Abdomen/Abdominais.gif
```

---

**Pronto! Configure no Vercel e faça o deploy!** 🚀












