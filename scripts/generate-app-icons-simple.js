/**
 * Script simplificado para gerar ícones usando sharp
 * Se sharp não estiver disponível, fornece instruções alternativas
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Erro: sharp não está instalado ou não foi encontrado.');
  console.log('\n📦 Tente instalar novamente:');
  console.log('   npm install sharp --save-dev');
  console.log('\n💡 Alternativa: Use uma ferramenta online como:');
  console.log('   https://www.pwabuilder.com/imageGenerator');
  console.log('   https://realfavicongenerator.net/');
  process.exit(1);
}

// Obter caminho do ícone base
const inputPath = process.argv[2];

if (!inputPath) {
  console.error('❌ Erro: Caminho da imagem base não fornecido.');
  console.log('📖 Uso: node scripts/generate-app-icons-simple.js <caminho-da-imagem>');
  console.log('📖 Exemplo: node scripts/generate-app-icons-simple.js public/icons/play_store_512.png');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`❌ Erro: Arquivo não encontrado: ${inputPath}`);
  process.exit(1);
}

const outputDir = path.join(__dirname, '../public/icons');
const androidResDir = path.join(outputDir, 'res');

// Criar diretórios
[outputDir, androidResDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const pwaSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const adaptiveSizes = {
  'mipmap-mdpi': { foreground: 108, background: 108 },
  'mipmap-hdpi': { foreground: 162, background: 162 },
  'mipmap-xhdpi': { foreground: 216, background: 216 },
  'mipmap-xxhdpi': { foreground: 324, background: 324 },
  'mipmap-xxxhdpi': { foreground: 432, background: 432 }
};

console.log(`🖼️  Gerando ícones a partir de: ${inputPath}\n`);

let successCount = 0;
let errorCount = 0;

async function generateIcons() {
  // PWA Icons
  console.log('📱 Gerando ícones PWA...');
  for (const size of pwaSizes) {
    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 100 })
        .toFile(path.join(outputDir, `icon-${size}.png`));
      console.log(`  ✓ icon-${size}.png`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ icon-${size}.png: ${err.message}`);
      errorCount++;
    }
  }

  // Android Icons
  console.log('\n🤖 Gerando ícones Android...');
  for (const [folder, size] of Object.entries(androidSizes)) {
    const folderPath = path.join(androidResDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 100 })
        .toFile(path.join(folderPath, 'ic_launcher.png'));
      console.log(`  ✓ ${folder}/ic_launcher.png`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ ${folder}/ic_launcher.png: ${err.message}`);
      errorCount++;
    }
  }

  // Adaptive Icons
  console.log('\n🎨 Gerando ícones adaptativos Android...');
  for (const [folder, sizes] of Object.entries(adaptiveSizes)) {
    const folderPath = path.join(androidResDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Foreground
    try {
      const padding = Math.round(sizes.foreground * 0.2);
      const iconSize = sizes.foreground - (padding * 2);
      await sharp(inputPath)
        .resize(iconSize, iconSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 100 })
        .toFile(path.join(folderPath, 'ic_launcher_adaptive_fore.png'));
      console.log(`  ✓ ${folder}/ic_launcher_adaptive_fore.png`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ ${folder}/foreground: ${err.message}`);
      errorCount++;
    }

    // Background
    try {
      await sharp({
        create: {
          width: sizes.background,
          height: sizes.background,
          channels: 4,
          background: { r: 16, g: 185, b: 129, alpha: 1 }
        }
      })
        .png({ quality: 100 })
        .toFile(path.join(folderPath, 'ic_launcher_adaptive_back.png'));
      console.log(`  ✓ ${folder}/ic_launcher_adaptive_back.png`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ ${folder}/background: ${err.message}`);
      errorCount++;
    }
  }

  // Special Icons
  console.log('\n⭐ Gerando ícones especiais...');
  try {
    await sharp(inputPath)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100 })
      .toFile(path.join(outputDir, '1024.png'));
    console.log('  ✓ 1024.png');
    successCount++;
  } catch (err) {
    console.error('  ✗ 1024.png:', err.message);
    errorCount++;
  }

  console.log(`\n✅ Concluído!`);
  console.log(`   ✓ Sucesso: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ✗ Erros: ${errorCount}`);
  }
}

generateIcons().catch(console.error);

