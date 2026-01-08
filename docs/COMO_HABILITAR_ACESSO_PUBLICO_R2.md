# Como Habilitar Acesso Público no R2

## 📍 Localização

Na tela de configurações do R2, você verá a seção:

**"URL de desenvolvimento público"**
> Exponha o conteúdo deste bucket R2 à internet através do URL de Desenvolvimento Público quando este estiver habilitado.
> 
> **O URL público de desenvolvimento está desativado para este bucket.**

## 🔓 Passo a Passo

### 1. Habilitar URL Público

1. **Na seção "URL de desenvolvimento público":**
   - Você verá um botão ou toggle para **"Habilitar"** ou **"Ativar"**
   - Clique nele

2. **Confirmar ativação:**
   - Pode aparecer um aviso perguntando se você tem certeza
   - Confirme a ativação

3. **Aguardar processamento:**
   - O Cloudflare pode levar alguns segundos para gerar o domínio
   - Aguarde até aparecer a URL pública

### 2. Copiar a URL Gerada

Após habilitar, você verá algo como:

```
URL de desenvolvimento público: https://pub-1234567890abcdef.r2.dev
```

**⚠️ IMPORTANTE:**
- Copie a **URL completa** (ex: `https://pub-1234567890abcdef.r2.dev`)
- **NÃO inclua a barra final** (`/`)
- Você precisará dessa URL no próximo passo

### 3. Testar a URL

Você pode testar se está funcionando acessando:
```
https://pub-xxxxx.r2.dev/GIFS/Abdomen/Abdominais.gif
```

Substitua `pub-xxxxx.r2.dev` pela sua URL real.

Se o GIF aparecer, está funcionando! ✅

## 🔄 Se Não Aparecer o Botão "Habilitar"

Algumas vezes a interface pode estar em português. Procure por:
- **"Habilitar"**
- **"Ativar"**  
- **"Enable"**
- **"Connect domain"**
- **"Conectar domínio"**

Ou tente clicar diretamente no texto "O URL público de desenvolvimento está desativado para este bucket" - pode ser um link clicável.

## 📝 Exemplo Visual

Após habilitar, a seção ficará assim:

```
URL de desenvolvimento público
Exponha o conteúdo deste bucket R2 à internet através do URL de Desenvolvimento Público quando este estiver habilitado.

O URL público de desenvolvimento está ativado para este bucket.

URL: https://pub-1234567890abcdef.r2.dev
[Botão: Copiar]
```

## ✅ Próximo Passo

Depois de copiar a URL, você precisará:
1. Configurar a variável `VITE_GIF_CDN_URL` no Vercel com essa URL
2. Fazer um novo deploy

