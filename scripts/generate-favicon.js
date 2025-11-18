const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvgPath = path.join(__dirname, '../public/icons/favicon.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Tamanhos necessários para favicon
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateFavicons() {
  if (!fs.existsSync(inputSvgPath)) {
    console.error('Arquivo favicon.svg não encontrado em:', inputSvgPath);
    console.log('Criando um favicon básico...');
    return;
  }

  console.log('Gerando favicons a partir do SVG...');

  for (const { name, size } of sizes) {
    const outputPath = path.join(outputDir, name);
    try {
      await sharp(inputSvgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✓ Gerado: ${name}`);
    } catch (error) {
      console.error(`Erro ao gerar ${name}:`, error.message);
    }
  }

  console.log('\nFavicons gerados com sucesso!');
  console.log('Nota: favicon.ico precisa ser criado manualmente usando uma ferramenta online.');
  console.log('Recomendado: https://convertio.co/png-ico/ ou https://favicon.io/favicon-converter/');
}

generateFavicons().catch(console.error);

