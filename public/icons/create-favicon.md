# Como Criar o Favicon

Para criar os arquivos de favicon a partir do SVG ou de uma imagem base:

## Opção 1: Usando ferramentas online

1. Acesse https://realfavicongenerator.net/
2. Faça upload do arquivo `favicon.svg` ou de uma imagem 512x512px
3. Configure as opções:
   - Android Chrome: Ativado
   - iOS: Ativado
   - Windows Metro: Ativado
   - macOS Safari: Ativado
4. Baixe o pacote gerado
5. Extraia os arquivos para `public/icons/`:
   - `favicon.ico`
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `apple-touch-icon.png`

## Opção 2: Usando Node.js (sharp)

Se você tiver o `sharp` instalado, pode usar o script:

```bash
npm install sharp --save-dev
node scripts/generate-favicon.js
```

## Opção 3: Manualmente

1. Use uma imagem 512x512px como base
2. Redimensione para:
   - 16x16px → `favicon-16x16.png`
   - 32x32px → `favicon-32x32.png`
   - 180x180px → `apple-touch-icon.png`
   - 48x48px → `favicon.ico` (pode usar um conversor online)

## Design Sugerido

O favicon deve representar:
- Figura humana estilizada (silhueta)
- Halteres ou elementos de treino
- Cores: Verde esmeralda (#10b981) e branco
- Texto "N.IA" ou apenas o ícone

