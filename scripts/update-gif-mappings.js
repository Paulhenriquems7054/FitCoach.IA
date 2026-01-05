/**
 * Script para atualizar os mapeamentos de GIFs no exerciseGifService.ts
 * com os nomes normalizados das pastas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/[^\w\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Mapeamento de nomes antigos para novos (baseado nos padrões observados)
const folderMappings = {
  'Antebraço (15)-20241202T155453Z-001/Antebraço (15)': 'antebraco-15-20241202t155453z-001/antebraco-15',
  'Bíceps (51)-20241202T155806Z-001/Bíceps (51)': 'biceps-51-20241202t155806z-001/biceps-51',
  'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)': 'cardio-academia-11-20241202t161427z-001/cardio-academia-11',
  'Costas (60)-20241202T162754Z-001/Costas (60)': 'costas-60-20241202t162754z-001/costas-60',
  'Eretores da Espinha (8)-20241202T164933Z-001/Eretores da Espinha (8)': 'eretores-da-espinha-8-20241202t164933z-001/eretores-da-espinha-8',
  'Glúteo (31)-20241202T165017Z-001/Glúteo (31)': 'gluteo-31-20241202t165017z-001/gluteo-31',
  'Ombro (73)-20241202T165511Z-001/Ombro (73)': 'ombro-73-20241202t165511z-001/ombro-73',
  'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)': 'panturrilha-20-20241202t173337z-001/panturrilha-20',
  'Peitoral (67)-20241202T175211Z-001/Peitoral (67)': 'peitoral-67-20241202t175211z-001/peitoral-67',
  'Pernas (70)-20241202T181042Z-001/Pernas (70)': 'pernas-70-20241202t181042z-001/pernas-70',
  'Trapézio (9)-20241202T183753Z-001/Trapézio (9)': 'trapezio-9-20241202t183753z-001/trapezio-9',
  'Tríceps (47)-20241202T183816Z-001/Tríceps (47)': 'triceps-47-20241202t183816z-001/triceps-47',
};

// Ler o arquivo
const filePath = path.join(__dirname, '..', 'services', 'exerciseGifService.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Atualizar muscleGroupFolders
for (const [oldPath, newPath] of Object.entries(folderMappings)) {
  // Substituir no muscleGroupFolders
  const regex = new RegExp(`'([^']+)': '${oldPath.replace(/[()]/g, '\\$&')}'`, 'g');
  content = content.replace(regex, `'$1': '${newPath}'`);
}

// Atualizar availableGifsByGroup
for (const [oldPath, newPath] of Object.entries(folderMappings)) {
  const regex = new RegExp(`'${oldPath.replace(/[()]/g, '\\$&')}':`, 'g');
  content = content.replace(regex, `'${newPath}':`);
}

// Salvar o arquivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Mapeamentos atualizados com sucesso!');
console.log('📝 Arquivo atualizado:', filePath);

