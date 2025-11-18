/**
 * Script para gerar ícones do PWA em diferentes tamanhos
 * 
 * Requisitos:
 * npm install sharp
 * 
 * Uso:
 * node scripts/generate-icons.js <caminho-do-icone-base>
 * 
 * Exemplo:
 * node scripts/generate-icons.js public/icons/icon-base.png
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Verificar se sharp está instalado
try {
  require.resolve('sharp');
} catch (e) {
  console.error('❌ Erro: sharp não está instalado.');
  console.log('📦 Instale com: npm install sharp');
  process.exit(1);
}

// Obter caminho do ícone base
const inputPath = process.argv[2];

if (!inputPath) {
  console.error('❌ Erro: Caminho do ícone base não fornecido.');
  console.log('📖 Uso: node scripts/generate-icons.js <caminho-do-icone-base>');
  console.log('📖 Exemplo: node scripts/generate-icons.js public/icons/icon-base.png');
  process.exit(1);
}

// Verificar se o arquivo existe
if (!fs.existsSync(inputPath)) {
  console.error(`❌ Erro: Arquivo não encontrado: ${inputPath}`);
  process.exit(1);
}

// Criar diretório de saída se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Diretório criado: ${outputDir}`);
}

console.log(`🖼️  Gerando ícones a partir de: ${inputPath}`);
console.log(`📂 Diretório de saída: ${outputDir}\n`);

// Gerar cada tamanho
let successCount = 0;
let errorCount = 0;

Promise.all(
  sizes.map(size => {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    
    return sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo transparente
      })
      .png({ 
        quality: 100,
        compressionLevel: 9 
      })
      .toFile(outputPath)
      .then(() => {
        console.log(`✓ Gerado: icon-${size}.png (${size}x${size}px)`);
        successCount++;
      })
      .catch(err => {
        console.error(`✗ Erro ao gerar icon-${size}.png:`, err.message);
        errorCount++;
      });
  })
).then(() => {
  console.log(`\n✅ Concluído!`);
  console.log(`   ✓ Sucesso: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ✗ Erros: ${errorCount}`);
  }
  console.log(`\n📝 Próximos passos:`);
  console.log(`   1. Verifique os ícones em: ${outputDir}`);
  console.log(`   2. Teste o manifest.json no navegador`);
  console.log(`   3. Teste a instalação do PWA`);
});

