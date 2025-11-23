/**
 * Script completo para gerar todos os ícones do app FitCoach.IA
 * 
 * Gera:
 * - Ícones PWA (72, 96, 128, 144, 152, 192, 384, 512)
 * - Ícones Android (mipmap em diferentes densidades)
 * - Ícones adaptativos Android (foreground e background)
 * 
 * Requisitos:
 * npm install sharp --save-dev
 * 
 * Uso:
 * node scripts/generate-app-icons.js <caminho-da-imagem-base>
 * 
 * Exemplo:
 * node scripts/generate-app-icons.js public/icons/app-icon-source.png
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tamanhos para PWA
const pwaSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Tamanhos para Android (densidades)
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Tamanhos para ícones adaptativos Android
const adaptiveSizes = {
  'mipmap-mdpi': { foreground: 108, background: 108 },
  'mipmap-hdpi': { foreground: 162, background: 162 },
  'mipmap-xhdpi': { foreground: 216, background: 216 },
  'mipmap-xxhdpi': { foreground: 324, background: 324 },
  'mipmap-xxxhdpi': { foreground: 432, background: 432 }
};

const outputDir = path.join(__dirname, '../public/icons');
const androidResDir = path.join(outputDir, 'res');

// Verificar se sharp está instalado
try {
  await import('sharp');
} catch (e) {
  console.error('❌ Erro: sharp não está instalado.');
  console.log('📦 Instale com: npm install sharp --save-dev');
  process.exit(1);
}

// Obter caminho do ícone base
const inputPath = process.argv[2];

if (!inputPath) {
  console.error('❌ Erro: Caminho da imagem base não fornecido.');
  console.log('📖 Uso: node scripts/generate-app-icons.js <caminho-da-imagem>');
  console.log('📖 Exemplo: node scripts/generate-app-icons.js public/icons/app-icon-source.png');
  process.exit(1);
}

// Verificar se o arquivo existe
if (!fs.existsSync(inputPath)) {
  console.error(`❌ Erro: Arquivo não encontrado: ${inputPath}`);
  process.exit(1);
}

// Criar diretórios se não existirem
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Diretório criado: ${outputDir}`);
}

if (!fs.existsSync(androidResDir)) {
  fs.mkdirSync(androidResDir, { recursive: true });
  console.log(`📁 Diretório criado: ${androidResDir}`);
}

console.log(`🖼️  Gerando ícones a partir de: ${inputPath}`);
console.log(`📂 Diretório de saída: ${outputDir}\n`);

let successCount = 0;
let errorCount = 0;

// Função para criar imagem com fundo sólido (para ícones adaptativos)
async function createBackgroundImage(size, color = { r: 16, g: 185, b: 129, alpha: 1 }) {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: color
    }
  }).png();
}

// Função para criar foreground (ícone centralizado com padding)
async function createForegroundImage(inputPath, size) {
  const padding = Math.round(size * 0.2); // 20% de padding
  const iconSize = size - (padding * 2);
  
  return sharp(inputPath)
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
    .png();
}

// Gerar ícones PWA
console.log('📱 Gerando ícones PWA...');
for (const size of pwaSizes) {
  const outputPath = path.join(outputDir, `icon-${size}.png`);
  
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ 
        quality: 100,
        compressionLevel: 9 
      })
      .toFile(outputPath);
    
    console.log(`  ✓ icon-${size}.png (${size}x${size}px)`);
    successCount++;
  } catch (err) {
    console.error(`  ✗ Erro ao gerar icon-${size}.png:`, err.message);
    errorCount++;
  }
}

// Gerar ícones Android (mipmap)
console.log('\n🤖 Gerando ícones Android (mipmap)...');
for (const [folder, size] of Object.entries(androidSizes)) {
  const folderPath = path.join(androidResDir, folder);
  
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  
  const outputPath = path.join(folderPath, 'ic_launcher.png');
  
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100 })
      .toFile(outputPath);
    
    console.log(`  ✓ ${folder}/ic_launcher.png (${size}x${size}px)`);
    successCount++;
  } catch (err) {
    console.error(`  ✗ Erro ao gerar ${folder}/ic_launcher.png:`, err.message);
    errorCount++;
  }
}

// Gerar ícones adaptativos Android
console.log('\n🎨 Gerando ícones adaptativos Android...');
for (const [folder, sizes] of Object.entries(adaptiveSizes)) {
  const folderPath = path.join(androidResDir, folder);
  
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  
  // Foreground (ícone com padding)
  const foregroundPath = path.join(folderPath, 'ic_launcher_adaptive_fore.png');
  try {
    const foreground = await createForegroundImage(inputPath, sizes.foreground);
    await foreground.toFile(foregroundPath);
    console.log(`  ✓ ${folder}/ic_launcher_adaptive_fore.png (${sizes.foreground}x${sizes.foreground}px)`);
    successCount++;
  } catch (err) {
    console.error(`  ✗ Erro ao gerar foreground ${folder}:`, err.message);
    errorCount++;
  }
  
  // Background (fundo sólido verde)
  const backgroundPath = path.join(folderPath, 'ic_launcher_adaptive_back.png');
  try {
    const background = await createBackgroundImage(sizes.background);
    await background.toFile(backgroundPath);
    console.log(`  ✓ ${folder}/ic_launcher_adaptive_back.png (${sizes.background}x${sizes.background}px)`);
    successCount++;
  } catch (err) {
    console.error(`  ✗ Erro ao gerar background ${folder}:`, err.message);
    errorCount++;
  }
}

// Gerar ícones especiais
console.log('\n⭐ Gerando ícones especiais...');

// 1024x1024 (para App Store, Play Store, etc)
try {
  await sharp(inputPath)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ quality: 100 })
    .toFile(path.join(outputDir, '1024.png'));
  console.log('  ✓ 1024.png (1024x1024px)');
  successCount++;
} catch (err) {
  console.error('  ✗ Erro ao gerar 1024.png:', err.message);
  errorCount++;
}

// 512x512 (para Play Store)
try {
  await sharp(inputPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ quality: 100 })
    .toFile(path.join(outputDir, 'play_store_512.png'));
  console.log('  ✓ play_store_512.png (512x512px)');
  successCount++;
} catch (err) {
  console.error('  ✗ Erro ao gerar play_store_512.png:', err.message);
  errorCount++;
}

// Resumo
console.log(`\n✅ Concluído!`);
console.log(`   ✓ Sucesso: ${successCount}`);
if (errorCount > 0) {
  console.log(`   ✗ Erros: ${errorCount}`);
}
console.log(`\n📝 Próximos passos:`);
console.log(`   1. Verifique os ícones em: ${outputDir}`);
console.log(`   2. Teste o manifest.json no navegador`);
console.log(`   3. Teste a instalação do PWA`);
console.log(`   4. Verifique os ícones Android em: ${androidResDir}`);

