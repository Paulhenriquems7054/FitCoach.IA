/**
 * Script para verificar se os nomes dos GIFs no código correspondem aos arquivos reais
 * Execute: node scripts/verify-gif-names.js
 */

const fs = require('fs');
const path = require('path');

// Função para normalizar nome de arquivo (mesma lógica do TypeScript)
function normalizeFileName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '-') // Espaços para hífen
    .replace(/[()]/g, '') // Remove parênteses
    .replace(/[^\w\-.]/g, '') // Remove caracteres especiais
    .replace(/-+/g, '-') // Múltiplos hífens para um
    .replace(/^-|-$/g, ''); // Remove hífens no início/fim
}

// Lista de pastas para verificar
const folders = [
  'abdomen-18-20241202t155424z-001/abdomen-18',
  'antebraco-15-20241202t155453z-001/antebraco-15',
  'biceps-51-20241202t155806z-001/biceps-51',
  'cardio-academia-11-20241202t161427z-001/cardio-academia-11',
  'costas-60-20241202t162754z-001/costas-60',
  'gluteo-31-20241202t165017z-001/gluteo-31',
  'ombro-73-20241202t165511z-001/ombro-73',
  'panturrilha-20-20241202t173337z-001/panturrilha-20',
  'peitoral-67-20241202t175211z-001/peitoral-67',
  'pernas-70-20241202t181042z-001/pernas-70',
  'trapezio-9-20241202t183753z-001/trapezio-9',
  'triceps-47-20241202t183816z-001/triceps-47',
  'mobilidade-alongamento-liberacao-20241202t155424z-001/mobilidade-alongamento-liberacao',
  'eretores-da-espinha-20241202t155424z-001/eretores-da-espinha',
];

const gifsPath = path.join(__dirname, '../public/GIFS');
const issues = [];

folders.forEach(folder => {
  const fullPath = path.join(gifsPath, folder);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Pasta não encontrada: ${folder}`);
    return;
  }

  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.gif'));
  console.log(`\n📁 ${folder}: ${files.length} arquivos`);
  
  // Verificar se todos os arquivos estão normalizados
  files.forEach(file => {
    const normalized = normalizeFileName(file);
    if (file !== normalized) {
      issues.push({
        folder,
        original: file,
        normalized,
        expected: normalized
      });
    }
  });
});

if (issues.length > 0) {
  console.log(`\n❌ Encontrados ${issues.length} arquivos com nomes não normalizados:`);
  issues.slice(0, 10).forEach(issue => {
    console.log(`  - ${issue.folder}/${issue.original}`);
    console.log(`    Esperado: ${issue.normalized}`);
  });
  if (issues.length > 10) {
    console.log(`  ... e mais ${issues.length - 10} arquivos`);
  }
} else {
  console.log('\n✅ Todos os arquivos estão normalizados corretamente!');
}

