# 🎨 Como Gerar os Ícones do App FitCoach.IA

Este guia explica como gerar todos os ícones necessários para o app a partir de uma imagem base.

## 📋 Pré-requisitos

1. **Instalar o Sharp** (biblioteca para processamento de imagens):
   ```bash
   npm install sharp --save-dev
   ```

2. **Preparar a imagem base**:
   - A imagem deve ser quadrada (proporção 1:1)
   - Recomendado: 1024x1024 pixels ou maior
   - Formatos suportados: PNG, JPG, SVG
   - A imagem deve ter boa qualidade e ser legível em tamanhos pequenos

## 🚀 Como Usar

### Passo 1: Salvar a imagem base

Salve a imagem que você quer usar como ícone do app na pasta `public/icons/` com um nome como:
- `app-icon-source.png`
- `icon-base.png`
- `fitcoach-icon.png`

**Exemplo:** Se você tem a imagem do boneco musculoso, salve como:
```
public/icons/app-icon-source.png
```

### Passo 2: Executar o script

Execute o comando:

```bash
npm run generate-app-icons public/icons/app-icon-source.png
```

Ou diretamente:

```bash
node scripts/generate-app-icons.js public/icons/app-icon-source.png
```

### Passo 3: Verificar os ícones gerados

O script irá gerar:

#### ✅ Ícones PWA (para instalação no navegador):
- `icon-72.png` (72x72)
- `icon-96.png` (96x96)
- `icon-128.png` (128x128)
- `icon-144.png` (144x144)
- `icon-152.png` (152x152)
- `icon-192.png` (192x192)
- `icon-384.png` (384x384)
- `icon-512.png` (512x512)

#### ✅ Ícones Android (mipmap):
- `res/mipmap-mdpi/ic_launcher.png` (48x48)
- `res/mipmap-hdpi/ic_launcher.png` (72x72)
- `res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

#### ✅ Ícones Adaptativos Android:
- `res/mipmap-*/ic_launcher_adaptive_fore.png` (ícone com padding)
- `res/mipmap-*/ic_launcher_adaptive_back.png` (fundo verde)

#### ✅ Ícones Especiais:
- `1024.png` (1024x1024) - Para App Store, Play Store
- `play_store_512.png` (512x512) - Para Google Play Store

## 📱 O que o Script Faz

1. **Ícones PWA**: Gera todos os tamanhos necessários para Progressive Web App
2. **Ícones Android**: Gera ícones em diferentes densidades (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
3. **Ícones Adaptativos**: Cria foreground (ícone com 20% de padding) e background (fundo verde #10b981)
4. **Ícones Especiais**: Gera 1024x1024 e 512x512 para lojas de aplicativos

## 🎨 Dicas de Design

- **Fundo**: O script mantém fundo transparente para ícones PWA
- **Ícones Adaptativos**: O foreground tem 20% de padding para funcionar bem em diferentes formas de ícone Android
- **Cor de Fundo**: Os ícones adaptativos usam verde #10b981 (cor primária do app)
- **Qualidade**: Todos os ícones são gerados com qualidade máxima (100%)

## ✅ Verificação

Após gerar os ícones:

1. **Teste no navegador**:
   - Abra DevTools > Application > Manifest
   - Verifique se não há erros relacionados a ícones

2. **Teste PWA**:
   - Tente instalar o app no navegador
   - Verifique se o ícone aparece corretamente

3. **Teste Android**:
   - Se estiver usando Capacitor/Cordova, verifique os ícones na pasta `res/`

## 🔧 Solução de Problemas

### Erro: "sharp não está instalado"
```bash
npm install sharp --save-dev
```

### Erro: "Arquivo não encontrado"
- Verifique se o caminho da imagem está correto
- Use caminho relativo a partir da raiz do projeto
- Exemplo: `public/icons/app-icon-source.png`

### Ícones ficaram pixelados
- Use uma imagem base maior (1024x1024 ou maior)
- Certifique-se de que a imagem original tem boa qualidade

### Ícones não aparecem no app
- Verifique o `manifest.json` se está referenciando os ícones corretos
- Limpe o cache do navegador
- Verifique se os arquivos foram gerados corretamente

## 📝 Notas Importantes

- O script mantém a proporção original da imagem (fit: 'contain')
- Fundos transparentes são preservados
- Ícones adaptativos Android têm padding automático de 20%
- Todos os ícones são gerados em formato PNG com alta qualidade

## 🎯 Exemplo Completo

```bash
# 1. Instalar dependências
npm install sharp --save-dev

# 2. Salvar imagem em public/icons/app-icon-source.png

# 3. Gerar todos os ícones
npm run generate-app-icons public/icons/app-icon-source.png

# 4. Verificar os arquivos gerados
ls public/icons/
ls public/icons/res/
```

---

**Pronto!** Agora você tem todos os ícones necessários para o app FitCoach.IA! 🎉

