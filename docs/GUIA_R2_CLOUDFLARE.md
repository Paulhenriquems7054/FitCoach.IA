# Guia Completo: Configurar Cloudflare R2 para GIFs

Este guia te ajudará a configurar o Cloudflare R2 do zero para hospedar os GIFs do FitCoach.IA.

## 📋 Pré-requisitos

- Conta no Cloudflare (gratuita)
- Cartão de crédito (não será cobrado se ficar dentro dos limites gratuitos)
- Os arquivos GIFs do projeto (pasta `public/GIFS/`)

## 🚀 Passo a Passo

### Passo 1: Ativar R2 na sua conta Cloudflare

1. **Acesse o painel do Cloudflare:**
   - Vá para: https://dash.cloudflare.com/
   - Faça login na sua conta

2. **Navegue até R2:**
   - No menu lateral, clique em **R2** (ou acesse: https://dash.cloudflare.com/r2)
   - Se for a primeira vez, você verá uma tela de ativação

3. **Adicionar assinatura R2:**
   - Clique em **"Adicionar assinatura R2 à minha conta"** ou **"Subscribe to R2"**
   - Preencha os dados de pagamento (cartão de crédito)
   - ⚠️ **IMPORTANTE:** Você NÃO será cobrado se ficar dentro dos limites:
     - 10 GB de armazenamento grátis/mês
     - 1 milhão de operações Classe A grátis/mês
     - 10 milhões de operações Classe B grátis/mês
   - Como os GIFs são ~1.4 GB, você ficará dentro do limite gratuito!

4. **Confirmar ativação:**
   - Após adicionar o método de pagamento, o R2 será ativado
   - Você verá a tela principal do R2

### Passo 2: Criar um Bucket

1. **Criar novo bucket:**
   - Na tela do R2, clique em **"Create bucket"** ou **"Criar bucket"**
   - Ou use o botão **"Create"** → **"Bucket"**

2. **Configurar o bucket:**
   - **Nome do bucket:** `fitcoach-gifs` (ou outro nome de sua escolha)
   - **Localização:** Escolha a região mais próxima dos seus usuários (ex: `Western North America` para EUA, `Europe` para Europa)
   - ⚠️ **IMPORTANTE:** O nome do bucket deve ser único globalmente no Cloudflare

3. **Criar:**
   - Clique em **"Create bucket"**
   - Aguarde alguns segundos para o bucket ser criado

### Passo 3: Configurar Acesso Público (Domínio Customizado)

1. **Acessar configurações do bucket:**
   - Clique no bucket que você acabou de criar (`fitcoach-gifs`)
   - Vá na aba **"Settings"** ou **"Configurações"**

2. **Configurar domínio público:**
   - Role até a seção **"Public Access"** ou **"Acesso Público"**
   - Você verá duas opções:
     - **Opção A: Domínio R2 padrão (mais fácil)**
       - Clique em **"Connect domain"** ou **"Conectar domínio"**
       - O Cloudflare gerará automaticamente um domínio como: `pub-xxxxx.r2.dev`
       - Copie essa URL (você usará na variável de ambiente)
     - **Opção B: Domínio customizado (opcional)**
       - Se você tem um domínio próprio (ex: `fitcoach.ia`)
       - Pode criar um subdomínio como `gifs.fitcoach.ia`
       - Requer configuração DNS adicional

3. **Recomendação:**
   - Para começar rápido, use a **Opção A** (domínio R2 padrão)
   - É gratuito e funciona imediatamente
   - Você pode mudar para domínio customizado depois se quiser

### Passo 4: Fazer Upload dos GIFs

Você tem duas opções para fazer upload:

#### Opção A: Via Interface Web (Limitado a 100 arquivos)

⚠️ **LIMITAÇÃO:** O painel web do R2 permite upload de até 100 arquivos por vez. Como temos mais de 100 GIFs, **use a CLI do Wrangler** (Opção B).

Se quiser testar com poucos arquivos:
1. **Acessar o bucket:**
   - No painel do R2, clique no seu bucket (`fitcoach-gifs`)

2. **Upload de arquivos:**
   - Clique em **"Upload"** ou **"Upload files"**
   - Selecione alguns arquivos para testar
   - ⚠️ **IMPORTANTE:** Mantenha a estrutura de pastas!

#### Opção B: Via CLI (Recomendado - Sem limite de arquivos)

> 📖 **Guia completo:** Veja [UPLOAD_GIFS_WRANGLER.md](./UPLOAD_GIFS_WRANGLER.md) para instruções detalhadas.

**Resumo rápido:**

1. **Instalar Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Fazer login:**
   ```bash
   wrangler login
   ```
   - Isso abrirá o navegador para autenticar

3. **Fazer upload:**
   ```bash
   # Navegue até a pasta do projeto
   cd D:\FitCoach.IA
   
   # Faça upload da pasta GIFS mantendo a estrutura
   wrangler r2 object put fitcoach-gifs/GIFS --file public/GIFS --recursive
   ```
   
   **Ou use o script automatizado:**
   - Veja `docs/UPLOAD_GIFS_WRANGLER.md` para scripts PowerShell/Node.js prontos
   - Os scripts fazem upload de todos os grupos musculares automaticamente

### Passo 5: Verificar Estrutura dos Arquivos

Após o upload, verifique se a estrutura está correta:

1. **No painel do R2:**
   - Navegue pelo bucket
   - Você deve ver:
     ```
     GIFS/
     ├── Abdomen/
     │   ├── Abdominais.gif
     │   ├── Abdominal Bicicleta.gif
     │   └── ...
     ├── Biceps/
     │   ├── maquina-de-rosca-direta.gif
     │   └── ...
     └── ...
     ```

2. **Testar acesso público:**
   - Clique em um arquivo GIF
   - Copie a URL pública (ex: `https://pub-xxxxx.r2.dev/GIFS/Abdomen/Abdominais.gif`)
   - Cole no navegador para verificar se o GIF carrega

### Passo 6: Configurar Variável de Ambiente no Vercel

1. **Obter URL base do R2:**
   - No painel do R2, vá em **Settings** → **Public Access**
   - Copie a URL base (ex: `https://pub-xxxxx.r2.dev`)
   - ⚠️ **IMPORTANTE:** Não inclua a barra final (`/`)

2. **Configurar no Vercel:**
   - Acesse: https://vercel.com/dashboard
   - Selecione seu projeto (`FitCoach.IA`)
   - Vá em **Settings** → **Environment Variables**
   - Clique em **"Add New"**
   - Configure:
     - **Name:** `VITE_GIF_CDN_URL`
     - **Value:** `https://pub-xxxxx.r2.dev` (sua URL do R2)
     - **Environment:** Selecione todas (Production, Preview, Development)
   - Clique em **"Save"**

3. **Fazer novo deploy:**
   - Vá em **Deployments**
   - Clique nos três pontos (...) do último deploy
   - Selecione **"Redeploy"**
   - Ou faça um novo commit/push para trigger automático

### Passo 7: Testar

1. **Acessar o app no Vercel:**
   - Vá para: https://fit-coach-ia.vercel.app/#/biblioteca

2. **Verificar console do navegador:**
   - Abra o DevTools (F12)
   - Vá na aba **Console**
   - Você verá logs como:
     ```
     [SimpleGifDisplay] 📍 Caminho recebido: /GIFS/Abdomen/Abdominais.gif
     [SimpleGifDisplay] 🔗 URLs disponíveis: { local: "...", cdn: "https://pub-xxxxx.r2.dev/GIFS/..." }
     ```
   - Se o local falhar, verá:
     ```
     [SimpleGifDisplay] ❌ Erro ao carregar GIF: ...
     [SimpleGifDisplay] 🔄 Tentando CDN externo: https://pub-xxxxx.r2.dev/GIFS/...
     [SimpleGifDisplay] ✅ GIF carregado com sucesso: ...
     ```

3. **Verificar se os GIFs aparecem:**
   - Os GIFs devem aparecer normalmente
   - Se aparecerem, significa que estão sendo carregados do R2!

## 🔍 Solução de Problemas

### Problema: "Bucket name already exists"
- **Solução:** Escolha outro nome único (ex: `fitcoach-gifs-2024`, `fitcoach-gifs-paul`)

### Problema: "Upload muito lento"
- **Solução:** Use a CLI do Wrangler (Opção B) que é mais rápida para grandes volumes

### Problema: "GIFs não aparecem após configurar CDN"
- **Verifique:**
  1. A URL do R2 está correta na variável de ambiente?
  2. A estrutura de pastas no R2 está igual ao projeto? (`GIFS/Abdomen/...`)
  3. Os arquivos foram realmente enviados? (verifique no painel do R2)
  4. O domínio público está ativado? (Settings → Public Access)

### Problema: "Erro 403 Forbidden"
- **Solução:** Verifique se o domínio público está configurado corretamente no R2

### Problema: "Erro CORS"
- **Solução:** O R2 não tem problemas de CORS por padrão. Se ocorrer, verifique se está usando a URL correta.

## 💰 Custos

Com ~1.4 GB de GIFs:
- **Armazenamento:** 10 GB grátis ✅ (dentro do limite)
- **Operações Classe A:** ~1 milhão grátis ✅ (dentro do limite)
- **Operações Classe B:** ~10 milhões grátis ✅ (dentro do limite)
- **Custo mensal:** **$0.00** 🎉

Você só será cobrado se:
- Exceder 10 GB de armazenamento
- Exceder os limites de operações
- Como os GIFs são arquivos estáticos que são lidos (não escritos frequentemente), você provavelmente ficará sempre no plano gratuito!

## 📚 Recursos Adicionais

- [Documentação oficial do R2](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)

## ✅ Checklist Final

- [ ] R2 ativado na conta Cloudflare
- [ ] Bucket criado (`fitcoach-gifs`)
- [ ] Domínio público configurado (URL copiada)
- [ ] GIFs enviados mantendo estrutura `GIFS/...`
- [ ] Variável `VITE_GIF_CDN_URL` configurada no Vercel
- [ ] Novo deploy feito no Vercel
- [ ] GIFs aparecendo corretamente no app

---

**Pronto!** Seus GIFs agora estão hospedados no Cloudflare R2 e serão carregados automaticamente quando não estiverem disponíveis no Vercel. 🎉

