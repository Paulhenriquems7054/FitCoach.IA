/**
 * Script Node.js para normalizar nomes de GIFs
 * Remove acentos, converte para minúsculas, substitui espaços por hífens
 */

const fs = require('fs');
const path = require('path');

function normalizeName(name) {
  // Remover extensão temporariamente
  const isFile = /\.(gif|png|jpg|jpeg)$/i.test(name);
  const extension = isFile ? name.match(/\.(gif|png|jpg|jpeg)$/i)[0] : '';
  const nameWithoutExt = isFile ? name.replace(/\.(gif|png|jpg|jpeg)$/i, '') : name;
  
  // Normalizar: remover acentos, converter para minúsculas, substituir espaços e caracteres especiais
  let normalized = nameWithoutExt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '-') // Espaços para hífen
    .replace(/[()]/g, '') // Remover parênteses
    .replace(/[^\w\-]/g, '') // Remover caracteres especiais (manter apenas letras, números e hífen)
    .replace(/-+/g, '-') // Múltiplos hífens para um
    .replace(/^-|-$/g, ''); // Remover hífens no início/fim
  
  return normalized + extension;
}

function processDirectory(dirPath, dryRun = false) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const mapping = { folders: {}, files: {} };
  
  // Processar diretórios primeiro
  const directories = items.filter(item => item.isDirectory());
  for (const dir of directories) {
    const oldPath = path.join(dirPath, dir.name);
    const newName = normalizeName(dir.name);
    
    if (dir.name !== newName) {
      const newPath = path.join(dirPath, newName);
      console.log(`📂 ${dir.name} -> ${newName}`);
      
      if (!dryRun) {
        try {
          fs.renameSync(oldPath, newPath);
          console.log(`  ✓ Renomeado`);
        } catch (error) {
          console.error(`  ✗ Erro: ${error.message}`);
        }
      }
      
      // Processar subdiretórios recursivamente
      processDirectory(dryRun ? oldPath : newPath, dryRun);
    } else {
      // Mesmo nome, mas processar subdiretórios
      processDirectory(oldPath, dryRun);
    }
  }
  
  // Processar arquivos GIF
  const files = items.filter(item => item.isFile() && /\.gif$/i.test(item.name));
  for (const file of files) {
    const oldName = file.name;
    const newName = normalizeName(oldName);
    
    if (oldName !== newName) {
      const oldPath = path.join(dirPath, oldName);
      const newPath = path.join(dirPath, newName);
      console.log(`  📄 ${oldName} -> ${newName}`);
      
      if (!dryRun) {
        try {
          fs.renameSync(oldPath, newPath);
          console.log(`    ✓ Renomeado`);
        } catch (error) {
          console.error(`    ✗ Erro: ${error.message}`);
        }
      }
    }
  }
}

// Main
const gifsPath = path.join(__dirname, '..', 'public', 'GIFS');
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

if (!fs.existsSync(gifsPath)) {
  console.error('❌ Pasta public/GIFS não encontrada!');
  process.exit(1);
}

console.log('🔄 Normalizando nomes de GIFs...');
if (dryRun) {
  console.log('⚠️  MODO DRY-RUN: Nenhuma alteração será feita');
}
console.log('');

processDirectory(gifsPath, dryRun);

console.log('');
console.log('✅ Normalização concluída!');
if (dryRun) {
  console.log('⚠️  Para aplicar as alterações, execute sem --dry-run');
} else {
  console.log('⚠️  PRÓXIMOS PASSOS:');
  console.log('1. Atualizar exerciseGifService.ts com os novos nomes normalizados');
  console.log('2. Testar build local: npm run build');
  console.log('3. Testar preview: npm run preview');
}

