# Ícones do App Nutri.IA

Esta pasta contém os ícones do Progressive Web App (PWA) para instalação na área de trabalho.

## Ícones Necessários

O app precisa dos seguintes tamanhos de ícone:

- ✅ `icon-192.png` (192x192 px) - **JÁ EXISTE**
- ❌ `icon-72.png` (72x72 px) - **FALTANDO**
- ❌ `icon-96.png` (96x96 px) - **FALTANDO**
- ❌ `icon-128.png` (128x128 px) - **FALTANDO**
- ❌ `icon-144.png` (144x144 px) - **FALTANDO**
- ❌ `icon-152.png` (152x152 px) - **FALTANDO**
- ❌ `icon-384.png` (384x384 px) - **FALTANDO**
- ❌ `icon-512.png` (512x512 px) - **FALTANDO**

## Como Gerar os Ícones Faltantes

### Opção 1: Usando o Script Automático (Recomendado)

1. **Instale o sharp** (se ainda não tiver):
   ```bash
   npm install sharp --save-dev
   ```

2. **Prepare um ícone base** (recomendado: 1024x1024 px):
   - Crie ou obtenha um ícone base em alta resolução
   - Salve como `icon-base.png` nesta pasta ou em outro local

3. **Execute o script**:
   ```bash
   npm run generate-icons public/icons/icon-base.png
   ```
   ou
   ```bash
   node scripts/generate-icons.js public/icons/icon-base.png
   ```

### Opção 2: Usando Ferramentas Online

1. **PWA Asset Generator** (Mais fácil):
   - Acesse: https://www.pwabuilder.com/imageGenerator
   - Faça upload do `icon-192.png` existente ou de um ícone base maior
   - Baixe todos os tamanhos gerados
   - Coloque os arquivos nesta pasta (`public/icons/`)

2. **RealFaviconGenerator**:
   - Acesse: https://realfavicongenerator.net/
   - Faça upload do ícone base
   - Configure as opções
   - Baixe o pacote e extraia os ícones aqui

### Opção 3: Usando ImageMagick

Se você tem ImageMagick instalado:

```bash
cd public/icons
magick icon-192.png -resize 72x72 icon-72.png
magick icon-192.png -resize 96x96 icon-96.png
magick icon-192.png -resize 128x128 icon-128.png
magick icon-192.png -resize 144x144 icon-144.png
magick icon-192.png -resize 152x152 icon-152.png
magick icon-192.png -resize 384x384 icon-384.png
magick icon-192.png -resize 512x512 icon-512.png
```

## Design do Ícone

O ícone deve:
- ✅ Ser quadrado (proporção 1:1)
- ✅ Ter fundo transparente ou sólido (preferencialmente transparente)
- ✅ Ser legível em tamanhos pequenos (72x72)
- ✅ Representar nutrição/saúde/IA
- ✅ Usar cores do tema (verde esmeralda #10b981)

### Sugestões:
- 🍎 Maçã estilizada
- 🥗 Prato saudável
- 💚 Símbolo de saúde + IA
- 🧠 Logo "N.IA" estilizado
- 🎯 Combinação de nutrição + tecnologia

## Verificação

Após gerar os ícones:

1. ✅ Verifique se todos os 8 arquivos estão presentes
2. ✅ Teste no navegador: DevTools > Application > Manifest
3. ✅ Verifique se não há erros no console
4. ✅ Teste a instalação do PWA

## Teste de Instalação

### Desktop (Chrome/Edge):
1. Abra o app no navegador
2. Procure o ícone de instalação na barra de endereços
3. Ou vá em Menu > "Instalar app"

### Mobile (Android):
1. Abra o app no Chrome
2. Menu > "Adicionar à tela inicial"

### iOS (Safari):
1. Abra o app no Safari
2. Compartilhar > "Adicionar à Tela de Início"

## Notas Importantes

- **Ícones Maskable**: Os ícones 192x192 e 512x512 estão marcados como "maskable" no manifest.json. Isso significa que devem ter padding de ~20% para funcionar bem em diferentes dispositivos Android.
- **Formato**: Todos os ícones devem ser PNG com fundo transparente ou sólido.
- **Qualidade**: Use alta qualidade (100%) ao gerar os ícones para evitar pixelização.

## Links Úteis

- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Maskable.app Editor](https://maskable.app/editor) - Para criar ícones maskable
- [Web.dev - Add to Home Screen](https://web.dev/add-to-home-screen/)

