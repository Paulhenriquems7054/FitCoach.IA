/**
 * Serviço para mapear exercícios aos GIFs animados
 * Busca inteligente baseada em nomes exatos dos arquivos GIF e similaridade
 * 
 * Os GIFs estão organizados em: public/GIFS/[Grupo Muscular]-[timestamp]/[Grupo Muscular]/[arquivo.gif]
 * 
 * Funcionalidades:
 * - Mapeamento automático baseado nos nomes exatos dos arquivos GIF
 * - Busca por similaridade de nomes (Levenshtein distance)
 * - Cache em memória para melhor performance
 */

// Cache em memória para resultados de busca
const gifCache = new Map<string, string | null>();

/**
 * Calcula a distância de Levenshtein entre duas strings
 * Usado para encontrar similaridade entre nomes de exercícios
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Inicializar matriz
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Preencher matriz
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // Deletar
          matrix[i][j - 1] + 1,     // Inserir
          matrix[i - 1][j - 1] + 1   // Substituir
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcula similaridade entre duas strings (0-1, onde 1 é idêntico)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Normaliza texto para busca (remove acentos, lowercase, etc)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove caracteres especiais
    .trim();
}

// Mapeamento de grupos musculares para pastas de GIFs
const muscleGroupFolders: Record<string, string> = {
  'abd': 'Abdômen (18)-20241202T155424Z-001/Abdômen (18)',
  'abdomen': 'Abdômen (18)-20241202T155424Z-001/Abdômen (18)',
  'abdominal': 'Abdômen (18)-20241202T155424Z-001/Abdômen (18)',
  'core': 'Abdômen (18)-20241202T155424Z-001/Abdômen (18)',
  'prancha': 'Abdômen (18)-20241202T155424Z-001/Abdômen (18)',
  
  'antebraço': 'Antebraço (15)-20241202T155453Z-001/Antebraço (15)',
  'antebraco': 'Antebraço (15)-20241202T155453Z-001/Antebraço (15)',
  'pulso': 'Antebraço (15)-20241202T155453Z-001/Antebraço (15)',
  'punho': 'Antebraço (15)-20241202T155453Z-001/Antebraço (15)',
  
  'bíceps': 'Bíceps (51)-20241202T155806Z-001/Bíceps (51)',
  'biceps': 'Bíceps (51)-20241202T155806Z-001/Bíceps (51)',
  'rosca': 'Bíceps (51)-20241202T155806Z-001/Bíceps (51)',
  
  'cardio': 'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)',
  'cárdio': 'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)',
  'esteira': 'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)',
  'bicicleta': 'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)',
  'bike': 'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)',
  'elíptico': 'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)',
  'eliptico': 'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)',
  
  'costas': 'Costas (60)-20241202T162754Z-001/Costas (60)',
  'remo': 'Costas (60)-20241202T162754Z-001/Costas (60)',
  'remada': 'Costas (60)-20241202T162754Z-001/Costas (60)',
  'puxada': 'Costas (60)-20241202T162754Z-001/Costas (60)',
  'barra fixa': 'Costas (60)-20241202T162754Z-001/Costas (60)',
  'pullover': 'Costas (60)-20241202T162754Z-001/Costas (60)',
  'levantamento terra': 'Costas (60)-20241202T162754Z-001/Costas (60)',
  
  'eretor': 'Eretores da Espinha (8)-20241202T164933Z-001/Eretores da Espinha (8)',
  'lombar': 'Eretores da Espinha (8)-20241202T164933Z-001/Eretores da Espinha (8)',
  'hiperextensão': 'Eretores da Espinha (8)-20241202T164933Z-001/Eretores da Espinha (8)',
  'hiperextensao': 'Eretores da Espinha (8)-20241202T164933Z-001/Eretores da Espinha (8)',
  
  'glúteo': 'Glúteo (31)-20241202T165017Z-001/Glúteo (31)',
  'gluteo': 'Glúteo (31)-20241202T165017Z-001/Glúteo (31)',
  'glúteos': 'Glúteo (31)-20241202T165017Z-001/Glúteo (31)',
  'elevação pélvica': 'Glúteo (31)-20241202T165017Z-001/Glúteo (31)',
  'elevacao pelvica': 'Glúteo (31)-20241202T165017Z-001/Glúteo (31)',
  'ponte': 'Glúteo (31)-20241202T165017Z-001/Glúteo (31)',
  'stiff': 'Glúteo (31)-20241202T165017Z-001/Glúteo (31)',
  
  'ombro': 'Ombro (73)-20241202T165511Z-001/Ombro (73)',
  'ombros': 'Ombro (73)-20241202T165511Z-001/Ombro (73)',
  'desenvolvimento': 'Ombro (73)-20241202T165511Z-001/Ombro (73)',
  'elevação': 'Ombro (73)-20241202T165511Z-001/Ombro (73)',
  'elevacao': 'Ombro (73)-20241202T165511Z-001/Ombro (73)',
  'deltoide': 'Ombro (73)-20241202T165511Z-001/Ombro (73)',
  
  'panturrilha': 'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)',
  'panturrinha': 'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)',
  'gêmeos': 'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)',
  'gemeos': 'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)',
  'flexão plantar': 'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)',
  'flexao plantar': 'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)',
  'elevação de panturrilha': 'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)',
  'elevacao de panturrilha': 'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)',
  'levantamento de panturrilha': 'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)',
  
  'peitoral': 'Peitoral (67)-20241202T175211Z-001/Peitoral (67)',
  'peito': 'Peitoral (67)-20241202T175211Z-001/Peitoral (67)',
  'supino': 'Peitoral (67)-20241202T175211Z-001/Peitoral (67)',
  'crucifixo': 'Peitoral (67)-20241202T175211Z-001/Peitoral (67)',
  'voador': 'Peitoral (67)-20241202T175211Z-001/Peitoral (67)',
  'flexão': 'Peitoral (67)-20241202T175211Z-001/Peitoral (67)',
  'flexao': 'Peitoral (67)-20241202T175211Z-001/Peitoral (67)',
  'paralelas': 'Peitoral (67)-20241202T175211Z-001/Peitoral (67)',
  
  'pernas': 'Pernas (70)-20241202T181042Z-001/Pernas (70)',
  'perna': 'Pernas (70)-20241202T181042Z-001/Pernas (70)',
  'agachamento': 'Pernas (70)-20241202T181042Z-001/Pernas (70)',
  'leg press': 'Pernas (70)-20241202T181042Z-001/Pernas (70)',
  'afundo': 'Pernas (70)-20241202T181042Z-001/Pernas (70)',
  'lunges': 'Pernas (70)-20241202T181042Z-001/Pernas (70)',
  'passada': 'Pernas (70)-20241202T181042Z-001/Pernas (70)',
  'cadeira extensora': 'Pernas (70)-20241202T181042Z-001/Pernas (70)',
  'cadeira flexora': 'Pernas (70)-20241202T181042Z-001/Pernas (70)',
  
  'trapézio': 'Trapézio (9)-20241202T183753Z-001/Trapézio (9)',
  'trapezio': 'Trapézio (9)-20241202T183753Z-001/Trapézio (9)',
  'encolhimento': 'Trapézio (9)-20241202T183753Z-001/Trapézio (9)',
  
  'tríceps': 'Tríceps (47)-20241202T183816Z-001/Tríceps (47)',
  'triceps': 'Tríceps (47)-20241202T183816Z-001/Tríceps (47)',
  'tricep': 'Tríceps (47)-20241202T183816Z-001/Tríceps (47)',
  'mergulho': 'Tríceps (47)-20241202T183816Z-001/Tríceps (47)',
};

/**
 * Lista completa de todos os GIFs disponíveis por grupo muscular
 * Baseado nos nomes exatos dos arquivos
 */
const availableGifsByGroup: Record<string, string[]> = {
  'Abdômen (18)-20241202T155424Z-001/Abdômen (18)': [
    'abdominal.gif',
    'Abdominal canivete no banco.gif',
    'Prancha Alta com Rotação de Tronco.gif',
    'Abdominal Russian Twist.gif',
    'Abdominal Obliquo no Chão.gif',
    'Prancha Frontal com Rotação de Tronco.gif',
    'Prancha Frontal com elevação de joelhos.gif',
    'Abdominal Infra.gif',
    'Abdominal Infra Suspenso.gif',
    'Abdominal com Fitball.gif',
    'Abdominal Encolhimento no Banco.gif',
    'Abdominal Obliquo com Bola.gif',
    'Abdominal Bicicleta.gif',
    'Abdominal Completo (1).gif',
    'Prancha Lateral.gif',
    'Prancha Frontal Alta (1).gif',
    'Abdominal Oblíquo Deitada.gif',
    'Abdominal com Carga.gif',
    'Abd Concentrado Braços estendidos.gif',
  ],
  'Peitoral (67)-20241202T175211Z-001/Peitoral (67)': [
    'Cross over polia Alta.gif',
    'Supino Reto na Máquina.gif',
    'Supino pegada martelo.gif',
    'Supino no smith com o triângulo.gif',
    'Supino no banco inclinado 30 graus com pegada invertida.gif',
    'Supino na máquina.gif',
    'Supino na máquina Smith.gif',
    'Supino na Máquina para Miolo do Peitoral.gif',
    'Supino invertido com pegada aberta.gif',
    'Supino inclinado na máquina.gif',
    'Supino Inclinado na Máquina com Pegada Martelo.gif',
    'Supino Inclinado na Alavanca.gif',
    'Supino inclinado com pegada fechada.gif',
    'Supino Inclinado com Halteres.gif',
    'Supino Inclinado com Halteres em Martelo.gif',
    'Supino Inclinado com Halteres e Pegada Invertida.gif',
    'Supino inclinado com halteres e pegada fechada.gif',
    'Supino inclinado com cabo.gif',
    'Supino inclinado com barra.gif',
    'Supino Declinado Unilateral Pegada Martelo com Haltere.gif',
    'Voador unilateral no Solo com Barra.gif',
    'Voador no pec deck.gif',
    'Voador na Máquina.gif',
    'Voador com Halteres para Cima.gif',
    'Supino.gif',
    'Supino Unilateral no Cabo.gif',
    'Supino Unilateral com Halteres com Pegada Reversa.gif',
    'Supino unilateral com Alavanca.gif',
    'Supino declinado pegada martelo.gif',
    'Supino declinado na máquina Smith.gif',
    'Supino Declinado com Halteres.gif',
    'Supino declinada na máquina.gif',
    'Supino declinada com alavanca.gif',
    'Supino com pegada fechada.gif',
    'Supino com Pegada Fechada Sentado com Cabo.gif',
    'Supino com pegada aberta.gif',
    'Supino com kettlebell no chão.gif',
    'Supino com barra declinado.gif',
    'Supino com banco inclinado no Smith.gif',
    'Supino com Alavanca.gif',
    'Supino com kettlebell de um braço.gif',
    'Supino com Halteres.gif',
    'Supino com haltere pegada fechada.gif',
    'Supino com cabo sentado.gif',
    'Supino com Halteres Pegada Invertida.gif',
    'Supino com barra no chão.gif',
    'Supino com halteres com pegada fechada.gif',
    'Supino Alternado com Halteres.gif',
    'Pullover de braço reto com halteres (joelhos a 90 graus).gif',
    'Pullover com Halteres na Bola de Estabilidade.gif',
    'Pullover com haltere.gif',
    'Paralelas.gif',
    'Máquina de voador de peito inclinado.gif',
    'Mergulho de peito assistido.gif',
    'Crucifixo Unilateral em Declinado com Cabo.gif',
    'Crucifixo Deitado com Cabo.gif',
    'Crucifixo com halteres.gif',
    'Crucifixo com Halteres Inclinado.gif',
    'Crucifixo com Halteres Declinado.gif',
    'Crucifixo com Cabo Declinado.gif',
    'Crossover Unilateral com Cabo.gif',
    'Crossover na Alavanca.gif',
    'Cross over polia baixa.gif',
    'Crossover de Cabo Alto.gif',
    'Crossover de peitoral superior com cabo.gif',
    'Crossover com Cabos.gif',
    'Anilha Press.gif',
  ],
  'Costas (60)-20241202T162754Z-001/Costas (60)': [
    'Serrote.gif',
    'Remada Unilateral com Cabo.gif',
    'Remada Unilateral com Barra.gif',
    'Remada unilateral com barra landmine.gif',
    'Remada T invertida com alavanca.gif',
    'Remada T com Landmine.gif',
    'Remada T com alavanca.gif',
    'Remada sentado com cabo pegada fechada.gif',
    'Remada Sentada na Máquina.gif',
    'Remada Sentada com Corda na Polia.gif',
    'Remada Sentada com Carga de Anilhas.gif',
    'Remada Sentada com Cabo.gif',
    'Remada Sentada com Anilhas.gif',
    'Remada Renegada com Halteres.gif',
    'Remada Invertida.gif',
    'Remada Inclinada no banco com Cabo.gif',
    'Remada Inclinada com Pegada Reversa com Halteres.gif',
    'Remada Inclinada com Pegada Neutra com Halteres.gif',
    'Remada Inclinada com Cabo.gif',
    'Remada frontal com alavanca.gif',
    'Remada de espingarda.gif',
    'Remada Curvada no Smith.gif',
    'Remada Curvada Inclinada com Barra.gif',
    'Remada Curvada em T.gif',
    'Remada Curvada com Pegada Invertida na Barra.gif',
    'Remada curvada com kettlebell.gif',
    'Remada com Cabo Sentada Unilateral com Torção.gif',
    'Remada curvada com halteres.gif',
    'Remada cruzada no cross.gif',
    'Remada com Halteres em Posição Prancha.gif',
    'Remada curvada com barra de pegada alternada ampla com adução de escapula.gif',
    'Remada Curvada com Barra.gif',
    'Remada curvada com halteres com pegada invertida.gif',
    'Puxada na Polia Alta com Pegada Fechada.gif',
    'Puxada em Pé com Torção no Cabo.gif',
    'Puxada com Um Braço com Peso Adicional.gif',
    'Puxada com Um Braço com Cabo.gif',
    'Puxada Alta.gif',
    'Puxada alta unilateral alta ajoelhada.gif',
    'Puxada Alta Neutra com Cabos Duplos no Chão.gif',
    'Puxada alta na polia nuca.gif',
    'Puxada alta na Máquina Nuca.gif',
    'Puxada Alta Invertida.gif',
    'Puxada Alta com Um Joelho Apoiado.gif',
    'Puxada Alta com Triângulo.gif',
    'Puxada Alta com Alavanca.gif',
    'Pullover na Máquina de Alavanca.gif',
    'Pullover com Cabo.gif',
    'Pullover com cabo sentado.gif',
    'Pullover com Barra.gif',
    'Pulldown Unilateral no Cabo.gif',
    'Pulldown inclinado com corda.gif',
    'Pulldown com corda.gif',
    'Pullover com Barra W Pegada invertida.gif',
    'Pullover com barra no banco declinado.gif',
    'Máquina de remo.gif',
    'Levantamento Terra.gif',
    'Levantamento Terra Romeno.gif',
    'Barra fixa.gif',
    'Barra Fixa Assistida.gif',
  ],
  'Pernas (70)-20241202T181042Z-001/Pernas (70)': [
    'Agachamento Sumô com Halteres.gif',
    'Agachamento no Smith.gif',
    'Agachamento Sumô com Barra.gif',
    'Agachamento Skater.gif',
    'Agachamento Sissy.gif',
    'Agachamento no Landmine.gif',
    'Agachamento na Parede com Bola de Exercício.gif',
    'Agachamento na Máquina Hack.gif',
    'Agachamento Jefferson.gif',
    'Agachamento Hack Invertido.gif',
    'Agachamento Goblet com Haltere.gif',
    'Agachamento hack com barra.gif',
    'Agachamento Frontal.gif',
    'Agachamento Frontal com Kettlebell.gif',
    'Agachamento Frontal com Cabo.gif',
    'Agachamento Frontal com Barra no Smith.gif',
    'Agachamento Frontal com Barra no Banco.gif',
    'Agachamento com Trava.gif',
    'Agachamento com Salto usando Barra Hexagonal.gif',
    'Agachamento com salto e halteres.gif',
    'Agachamento com kettlebell.gif',
    'Agachamento com Halteres no Banco.gif',
    'Agachamento com Cinto.gif',
    'Agachamento Unil.gif',
    'Agachamento Frontal com haltere.gif',
    'Agachamento búlgaro com salto.gif',
    'Agachamento Búlgaro com Halteres.gif',
    'Agachamento Búlgaro com Barra.gif',
    'Afundo na Máquina Smith.gif',
    'Agachamento Cossack com Barra.gif',
    'Afundo com Barra.gif',
    'Afundo no banco com halteres.gif',
    'Adução do Quadril Lateral com Alavanca.gif',
    'Afundo com landmine.gif',
    'Adução do Quadril com Cabo.gif',
    'Agachamento em plié com halteres.gif',
    'Cadeira Abdutora.gif',
    'Agachamento livre com barra.gif',
    'agachamento na maquina.gif',
    'agachamento no cross.gif',
    'levantamento tarra com halteres.gif',
    'leg press pés afastados.gif',
    'passada a frente com halteres.gif',
    'passada a frente com barra.gif',
    'Agachamento com halteres com uma perna.gif',
    'agachamento bulgaro.gif',
    'agachamento no banco.gif',
    'cadeira flex.gif',
    'mesa flex unilateral.gif',
    'mesa flex.gif',
    'passada com halteres.gif',
    'Aduçã de Quadril na Polia .gif',
    'máquina adutora.gif',
    'agachamento livre pés juntos.gif',
    'Flexão Plantar com peso corporal.gif',
    'cadeira adutora.gif',
    'Agachamento Sumo Peso Corporal.gif',
    'Retrocesso com halteres.gif',
    'agachamento pés afastados.gif',
    'agachamento sumo com halteres.gif',
    'agachamento sumo livre.gif',
    'agachamento barra.gif',
    'Agachamento terra com halteres do lado.gif',
    'cadeira extensora.gif',
    'afundo livre.gif',
    'leg press.gif',
    'Retrocesso com Barra.gif',
  ],
  'Ombro (73)-20241202T165511Z-001/Ombro (73)': [
    'Voador para deltoides posterior com cabo.gif',
    'Voador invertido.gif',
    'Remada lateral com halteres sentado.gif',
    'Remada inversa com cabos deitado.gif',
    'Remada inclinada a 45 graus.gif',
    'Remada de deltoide posterior sentado com haltere.gif',
    'Remada com halteres para a posterior de ombros.gif',
    'Máquina de elevação lateral.gif',
    'Levantamento frontal unilateral com cabo.gif',
    'Levantamento frontal de cabo com dois braços.gif',
    'Levantamento frontal com barra.gif',
    'Levantamento frontal com anilha.gif',
    'Levantamento frontal alternado com haltere sentado.gif',
    'Levantamento de halteres de 3 maneiras.gif',
    'Elevações frontais com halteres apoiadas no peito.gif',
    'Elevação Posterior unilateral com halteres em Decúbito Prono.gif',
    'Elevação lateral deitado.gif',
    'Elevação lateral unilateral com halteres.gif',
    'Elevação lateral de halteres inclinada.gif',
    'Elevação lateral unilateral com haltere inclinado.gif',
    'Elevação lateral de braços com halteres.gif',
    'Elevação lateral unilateral com cabo.gif',
    'Elevação lateral e frontal com halteres.gif',
    'Elevação lateral na máquina.gif',
    'Elevação lateral com tronco inclinado.gif',
    'Elevação lateral com halteres sentado.gif',
    'Elevação lateral com halteres para deltoides posteriores deitado.gif',
    'Elevação lateral com halteres com apoio no peito.gif',
    'Elevação lateral com braço flexionado.gif',
    'Elevação lateral com barra no chão.gif',
    'Elevação lateral de braços com cabo.gif',
    'Elevação lateral cruzada no crossover.gif',
    'Elevação lateral alternada com halteres.gif',
    'Elevação frontal com halteres.gif',
    'Elevação frontal com halteres sentado.gif',
    'Elevação frontal com dois braços com halteres.gif',
    'elevação frontal com cabo duplo no cross.gif',
    'Elevação frontal com barra w inclinada.gif',
    'Elevação frontal com barra girando.gif',
    'Elevação Frontal Alternada Com Halteres.gif',
    'Desenvolvimento militar de uma mão com kettlebell.gif',
    'Desenvolvimento militar inclinado com barra presa no chão.gif',
    'Desenvolvimento militar em pé na máquina Smith.gif',
    'Desenvolvimento militar com pegada fechada.gif',
    'Desenvolvimento militar com barra.gif',
    'Desenvolvimento militar com barra no chão ajoelhado.gif',
    'Desenvolvimento de ombros na máquina.gif',
    'Desenvolvimento de ombros na máquina Smith.gif',
    'Desenvolvimento de Ombros com Rotação Alternada com Halteres.gif',
    'Desenvolvimento de ombros com halteres em pé com pegada neutra.gif',
    'Desenvolvimento de ombros com barra W com pegada invertida.gif',
    'Desenvolvimento de ombros atrás do pescoço sentado.gif',
    'Desenvolvimento de ombro unilateral com halter.gif',
    'Desenvolvimento de ombro reversa na máquina.gif',
    'Desenvolvimento de Ombro no Banco com Halteres.gif',
    'Desenvolvimento de ombro na máquina.gif',
    'Desenvolvimento de ombro na máquina (pegada martelo).gif',
    'Desenvolvimento de ombro deitado.gif',
    'Desenvolvimento de ombro com halteres em Z.gif',
    'Desenvolvimento de ombro com halteres em forma de W.gif',
    'Círculos de Braço com Pesos.gif',
    'Crucifixo inverso unilateral com cabo.gif',
    'Desenvolvimento arnold com um braço.gif',
    'Desenvolvimento Arnold (metade).gif',
    'Desenvolvimento de ombro com cabo.gif',
    'Desenvolvimento de ombro com cabo ajoelhado.gif',
    'Desenvolvimento de ombro com barra sentado.gif',
    'Desenvolvimento de Ombro Alternada em Pé com Halteres.gif',
    'Desenvolvimento cubano sentado com halteres.gif',
    'Desenvolvimento Cubano com Halteres.gif',
    'Desenvolvimento Arnold.gif',
    'Levantamento de halteres de 4 maneiras (2).gif',
    'Desenvolvimento de ombros atrás da cabeça na máquina Smith.gif',
  ],
  'Bíceps (51)-20241202T155806Z-001/Bíceps (51)': [
    'Rosca concentrada com cabo.gif',
    'Rosca com cabo de um braço.gif',
    'Rosca com barra.gif',
    'Rosca bíceps unilateral.gif',
    'Rosca bíceps unilateral no cabo alto.gif',
    'Rosca bíceps unilateral com pegada invertida em cabo.gif',
    'Rosca Bilateral com Cabo em Banco Inclinado.gif',
    'Rosca com halteres.gif',
    'Rosca com Polia Alta.gif',
    'Rosca com halteres no colete scott.gif',
    'Rosca bíceps com pegada fechada na barra W.gif',
    'Rosca bíceps sentado.gif',
    'Rosca bíceps inclinada com halteres sentado.gif',
    'Rosca bíceps inclinada com cabos.gif',
    'Rosca bíceps com halteres.gif',
    'Rosca bíceps com cabo ajoelhado.gif',
    'Rosca bíceps alta com halteres.gif',
    'Rosca alternada com halteres sentado.gif',
    'Rosca alternada com barra.gif',
    'Máquina de rosca direta.gif',
    'Rosca Direta com Barra.gif',
    'Rosca martelo com halter no colete scott.gif',
    'Rosca martelo com corda.gif',
    'Rosca no Cabo.gif',
    'Rosca inversa com barra W.gif',
    'Rosca Inversa com Halteres.gif',
    'Rosca Direta com Cabo deitado.gif',
    'Rosca martelo.gif',
    'Rosca martelo com halteres no banco scott.gif',
    'Rosca martelo sentada.gif',
    'Rosca direta com barra w.gif',
    'Rosca Direta com Barra no colete scott.gif',
    'Rosca Direta com Barra em Pegada Fechada.gif',
    'Rosca Direta com Barra deitado em Banco Alto.gif',
    'Rosca concentrada unilateral com cabo.gif',
    'Rosca de Bíceps com Puxada de Cabo.gif',
    'Rosca Concentrada com Pegada Fechada Sentado.gif',
    'Rosca de Bíceps com Halteres no Banco Scott.gif',
    'Rosca de bíceps com alavanca.gif',
    'Rosca concentrada.gif',
    'Rosca Zottman.gif',
    'Rosca Unilateral com Cabo.gif',
    'Rosca spider unilateral.gif',
    'Rosca spider com único haltere.gif',
    'Rosca scott unilateral com halteres.gif',
    'Rosca scott com halteres.gif',
    'Rosca Scott com Halteres Martelo no Banco.gif',
    'Rosca Scott com Barra W.gif',
    'Rosca Scott com Alavanca.gif',
    'Rosca scott alternados com halteres.gif',
    'Rosca pronada no banco inclinado.gif',
  ],
  'Tríceps (47)-20241202T183816Z-001/Tríceps (47)': [
    'Tríceps testa pegada neutra com halteres.gif',
    'Tríceps testa com barra.gif',
    'Tríceps Testa com Barra Pegada Invertida.gif',
    'Tríceps Testa com Banco Declinado com Halteres.gif',
    'Tríceps pulley pegada invertida.gif',
    'Tríceps no Banco.gif',
    'Tríceps pulley corda.gif',
    'Tríceps pulley barra.gif',
    'Tríceps Pulley barra V.gif',
    'Tríceps francês no banco inclinado com halter.gif',
    'Tríceps francês na polia com corda.gif',
    'Tríceps Francês com Halteres.gif',
    'Tríceps Coice com Cabo.gif',
    'Tríceps Francês com Halter Bilateral.gif',
    'Tríceps Francês Alternada com Halteres no Banco Inclinado.gif',
    'Tríceps Coice com Halteres.gif',
    'Supino declinado pegada fechada.gif',
    'Supino Reto pegada fechada.gif',
    'Tríceps Mergulho Máquina.gif',
    'Triceps frances barra W.gif',
    'triceps Pulley  unilateral.gif',
    'Tríceps Unil pegada supinada.gif',
    'Triceps Francês Na Polia Baixagif.gif',
    'Tríceps Francês Unil na Polia Baixa.gif',
    'Apoio de Frente Diamante.gif',
    'Tríceps Coice Unil com Halter.gif',
    'Tríceps Coice na Polia Média.gif',
    'Tríceps Coice  inclinado no cross bilateral.gif',
    'Tríceps Coice pegada pronada Unil na Polia Baixa.gif',
    'Tríceps Coice em Pé.gif',
    'Tríceps Coice Unil Inclinado com Halter.gif',
    'Tríceps Coice unil no Banco.gif',
    'Tríceps Mergulho no banco.gif',
    'Supino Reto fechado com halteres.gif',
    'Tríceps Testa Deitado com Halter.gif',
    'Triceps frances Unilateral Deitado no banco.gif',
    'Tríceps com Halter no Banco.gif',
    'Tríceps na Polia deitado no banco reto.gif',
    'Tríceps no aparelho scort.gif',
    'Tríceps Paralela.gif',
    'Tríceps Unilateral 90g Deitado no Banco Reto.gif',
    'Tríceps Mergulho no Banco M.gif',
    'triceps apoaiado na pareda.gif',
    'Tríceps Testa Unil deitado no banco.gif',
    'Apoio de Frente Pegada Fechada.gif',
    'Tríceps Testa com Halter Deitada no Chão.gif',
    'Apoio de frente pegada fechada parede.gif',
  ],
  'Glúteo (31)-20241202T165017Z-001/Glúteo (31)': [
    'Abdução Lateral do Quadril com Alavanca.gif',
    'Extensão de Quadril com Cabo.gif',
    'Abdução de quadril com cabo.gif',
    'Puxada De Cabo Ajoelhada.gif',
    'Ponte com Halteres.gif',
    'Máquina de Abdução de Quadril.gif',
    'Gluteos Coice nilateral Polia Baixa.gif',
    'Glúteo Coice No Smith.gif',
    'Glúteo Coice Na Alavanca.gif',
    'Glúteo Coice Na Máquina.gif',
    'Extensão de Quadril em Pé com Alavanca.gif',
    'Glúteo Coice Na Máquina De Extensão De Pernas.gif',
    'Elevação Pélvica Unilateral Com Barra.gif',
    'Elevação Pélvica Na Máquina.gif',
    'Elevação Pélvica na Máquina Smith.gif',
    'Extensão de Perna na Máquina Smith Reversa.gif',
    'Elevação Pélvica na Máquina de Extensão de Pernas.gif',
    'Elevação Pélvica Com Barra.gif',
    'Elevação Pélvica Com Barra Declinado.gif',
    'Abdução de Quadril com Ponte.gif',
    'Elevação Pélvica com Banda de Resistência.gif',
    'Agachamento na Máquina Abdutora.gif',
    'Stiff unil com medball.gif',
    'levantamento terra com barra.gif',
    'stiff unilateral com kettibel.gif',
    'stiff no smth unilateral.gif',
    'stiff no smth.gif',
    'stiff unilateral.gif',
    'stiff com barra.gif',
    'Stiff com Halteres.gif',
    'stiff.gif',
  ],
  'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)': [
    'Levantamento de panturrilha com apoio e sobrecarga.gif',
    'Levantamento de panturrilha com apoio de uma perna.gif',
    'Levantamento de panturrilha com apoio de banco.gif',
    'Levantamento de panturrilha com alavanca.gif',
    'Elevação de Panturrilhas.gif',
    'Elevação de Panturrilhas no Hack.gif',
    'Elevação Unilateral de Panturrilha no Leg Press.gif',
    'Elevação de Panturrilha Sentado com Alavanca.gif',
    'Elevação de Panturrilha no Leg Press.gif',
    'Elevação de Panturrilha no Leg Press horizontal.gif',
    'Elevação de Panturrilha Sentado com Peso.gif',
    'Elevação de Panturrilha em Máquina em pé.gif',
    'Elevação de Panturrilha Sentado com Barra.gif',
    'Elevação de Panturrilha com Uma Perna na Máquina Hack.gif',
    'Agachamento com Sustentação e Elevação de Panturrilhas.gif',
    'Elevação de Panturrilha com Barra em Pé.gif',
    'Flexão Plantar no Smith.gif',
    'Flexão Plantar Máquina.gif',
    'panturrinha no leg press.gif',
    'Flexão Plantar com peso corporal.gif',
  ],
  'Trapézio (9)-20241202T183753Z-001/Trapézio (9)': [
    'remada alta pegada abeta com barra.gif',
    'remada alta com halteres.gif',
    'encolhimento pegada fechada barra no cross.gif',
    'encolhimento maquina.gif',
    'encolhimento no smith.gif',
    'encolhimento sentado no banco inlinado com halteres.gif',
    'encolhimento sentado no banco com halteres.gif',
    'encolhimento livre com halteres.gif',
    'encolhimento na barra livre.gif',
  ],
  'Antebraço (15)-20241202T155453Z-001/Antebraço (15)': [
    'Flexão de Pulso Neutra Sentado com Halteres.gif',
    'Rosca Inversa com Barra.gif',
    'Rosca de Punho Reversa com Barra.gif',
    'Rosca de Punho Pegada Neutra com Anilhas.gif',
    'Rosca de punho com barra.gif',
    'Rosca de Punho com Barra Atrás das Costas.gif',
    'Rosca de Dedos com Halteres.gif',
    'Rosca de dedo com barra.gif',
    'Rolinho de antebraço.gif',
    'Hand Grip.gif',
    'Flexão de Punho Reversa com Barra Sobre um Banco.gif',
    'Flexão de Punho com Halteres.gif',
    'Flexão de Punho com Cabo em um Braço no Chão.gif',
    'Flexão de Punho Reversa com Anilha.gif',
    'Antebraços.gif',
  ],
  'Eretores da Espinha (8)-20241202T164933Z-001/Eretores da Espinha (8)': [
    'Superman.gif',
    'Hiperextensão.gif',
    'Hiperextensão no Chão.gif',
    'Hiperextensão de Lombar no Banco Plano.gif',
    'Hiperextensão Invertida de Sapo.gif',
    'Extensão lombar sentada.gif',
    'Extensão Lombar com Peso.gif',
    'Hiperextensão com Torção.gif',
  ],
  'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)': [
    'Plataforma Vibratória.gif',
    'Máquina Simulador Escada.gif',
    'Máquina Elíptica.gif',
    'Máquina de Caminhada Ondulatório.gif',
    'Hands Bike.gif',
    'Esteira Ergométrica.gif',
    'Esteira com Inclinação.gif',
    'Corrida na Bicicleta Ergométrica.gif',
    'Bicicleta Ergométrica Reclinada.gif',
    'Bike.gif',
    'Airbike.gif',
  ],
};

/**
 * Encontra o grupo muscular baseado no nome do exercício
 * Verifica keywords mais específicas primeiro para evitar falsos positivos
 */
function findMuscleGroup(exerciseName: string): string | null {
  const normalized = normalizeText(exerciseName);
  
  // Keywords específicas que devem ser verificadas primeiro (mais longas e específicas)
  const specificKeywords = [
    'elevação de panturrilha',
    'elevacao de panturrilha',
    'levantamento de panturrilha',
    'flexão plantar',
    'flexao plantar',
    'elevação pélvica',
    'elevacao pelvica',
    'barra fixa',
    'levantamento terra',
    'remada alta',
    'puxada alta',
  ];
  
  // Verificar keywords específicas primeiro
  for (const keyword of specificKeywords) {
    if (normalized.includes(keyword) && muscleGroupFolders[keyword]) {
      return muscleGroupFolders[keyword];
    }
  }
  
  // Depois verificar todas as outras keywords
  for (const [keyword, folder] of Object.entries(muscleGroupFolders)) {
    // Pular keywords já verificadas
    if (specificKeywords.includes(keyword)) continue;
    
    if (normalized.includes(keyword)) {
      return folder;
    }
  }
  
  return null;
}

/**
 * Busca GIF por similaridade dentro de um grupo muscular
 * @param exerciseName - Nome do exercício normalizado
 * @param muscleGroupFolder - Pasta do grupo muscular
 * @param threshold - Limite mínimo de similaridade (0-1)
 * @returns Nome do arquivo GIF mais similar ou null
 */
function findSimilarGif(
  exerciseName: string,
  muscleGroupFolder: string,
  threshold: number = 0.4
): string | null {
  const availableGifs = availableGifsByGroup[muscleGroupFolder];
  if (!availableGifs || availableGifs.length === 0) return null;

  let bestMatch: { gif: string; similarity: number } | null = null;

  for (const gif of availableGifs) {
    // Normalizar nome do GIF (remover extensão e normalizar)
    const gifName = normalizeText(gif.replace('.gif', ''));
    const similarity = calculateSimilarity(exerciseName, gifName);

    if (similarity >= threshold) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { gif, similarity };
      }
    }
  }

  return bestMatch ? bestMatch.gif : null;
}

/**
 * Busca o GIF mais adequado para um exercício
 * @param exerciseName - Nome do exercício
 * @returns Caminho relativo para o GIF ou null se não encontrado
 */
export function getExerciseGif(exerciseName: string): string | null {
  if (!exerciseName) return null;
  
  // Verificar cache primeiro
  const cacheKey = normalizeText(exerciseName);
  if (gifCache.has(cacheKey)) {
    return gifCache.get(cacheKey) || null;
  }
  
  const normalized = normalizeText(exerciseName);
  let result: string | null = null;
  
  // 1. Buscar por grupo muscular
  const muscleGroup = findMuscleGroup(exerciseName);
  if (muscleGroup) {
    const availableGifs = availableGifsByGroup[muscleGroup];
    if (availableGifs && availableGifs.length > 0) {
      // 2. PRIMEIRO: Tentar encontrar match exato (ignorando case e acentos)
      const exactMatch = availableGifs.find(gif => {
        const gifNameNormalized = normalizeText(gif.replace('.gif', ''));
        return gifNameNormalized === normalized;
      });
      
      if (exactMatch) {
        result = `/GIFS/${muscleGroup}/${exactMatch}`;
        gifCache.set(cacheKey, result);
        return result;
      }
      
      // 3. SEGUNDO: Tentar encontrar match parcial (nome do exercício contém no nome do GIF ou vice-versa)
      const partialMatch = availableGifs.find(gif => {
        const gifNameNormalized = normalizeText(gif.replace('.gif', ''));
        return gifNameNormalized.includes(normalized) || normalized.includes(gifNameNormalized);
      });
      
      if (partialMatch) {
        result = `/GIFS/${muscleGroup}/${partialMatch}`;
        gifCache.set(cacheKey, result);
        return result;
      }
      
      // 4. TERCEIRO: Buscar por palavras-chave principais (ex: "Abd Concentrado" deve encontrar "Abd Concentrado Braços estendidos")
      const exerciseWords = normalized.split(/\s+/).filter(w => w.length > 2); // Palavras com mais de 2 caracteres
      if (exerciseWords.length > 0) {
        const keywordMatch = availableGifs.find(gif => {
          const gifNameNormalized = normalizeText(gif.replace('.gif', ''));
          // Verificar se todas as palavras principais estão no nome do GIF
          const allWordsMatch = exerciseWords.every(word => gifNameNormalized.includes(word));
          // Ou se o nome do GIF contém o nome do exercício
          return allWordsMatch || gifNameNormalized.includes(normalized);
        });
        
        if (keywordMatch) {
          result = `/GIFS/${muscleGroup}/${keywordMatch}`;
          gifCache.set(cacheKey, result);
          return result;
        }
      }
      
      // 5. QUARTO: Tentar encontrar GIF similar por similaridade de nome
      const similarGif = findSimilarGif(normalized, muscleGroup, 0.3); // Reduzido threshold para 0.3
      if (similarGif) {
        result = `/GIFS/${muscleGroup}/${similarGif}`;
        // Armazenar no cache
        gifCache.set(cacheKey, result);
        return result;
      }
      
      // 6. ÚLTIMO: Se não encontrou similar, tentar retornar um GIF genérico do grupo
      // Retornar o primeiro GIF do grupo como fallback genérico
      result = `/GIFS/${muscleGroup}/${availableGifs[0]}`;
      gifCache.set(cacheKey, result);
      return result;
    }
  }
  
  // Armazenar null no cache para evitar buscas repetidas
  gifCache.set(cacheKey, null);
  return null;
}

/**
 * Limpa o cache de GIFs
 * Útil para forçar nova busca ou liberar memória
 */
export function clearGifCache(): void {
  gifCache.clear();
}

/**
 * Retorna o tamanho atual do cache
 */
export function getCacheSize(): number {
  return gifCache.size;
}

/**
 * Gera URL completa para o GIF
 */
export function getGifUrl(folder: string, filename: string): string {
  return `/GIFS/${folder}/${filename}`;
}

/**
 * Retorna lista de todos os exercícios disponíveis baseados nos nomes dos arquivos GIF
 * Remove a extensão .gif e retorna apenas os nomes dos exercícios
 */
export function getAllAvailableExercises(): string[] {
  const exercises: string[] = [];
  
  // Iterar sobre todos os grupos musculares
  for (const gifs of Object.values(availableGifsByGroup)) {
    for (const gif of gifs) {
      // Remover extensão .gif e adicionar à lista
      const exerciseName = gif.replace('.gif', '');
      if (exerciseName && !exercises.includes(exerciseName)) {
        exercises.push(exerciseName);
      }
    }
  }
  
  // Ordenar alfabeticamente
  return exercises.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Verifica se um exercício existe na lista de GIFs disponíveis
 */
export function isExerciseAvailable(exerciseName: string): boolean {
  const normalized = normalizeText(exerciseName);
  const allExercises = getAllAvailableExercises();
  
  // Verificar se há algum exercício que corresponda (por similaridade ou nome exato)
  for (const exercise of allExercises) {
    const normalizedExercise = normalizeText(exercise);
    if (normalizedExercise === normalized || normalizedExercise.includes(normalized) || normalized.includes(normalizedExercise)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Retorna lista formatada de exercícios disponíveis agrupados por grupo muscular
 * Útil para incluir no prompt da IA
 */
export function getAvailableExercisesByGroup(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  // Mapeamento de pastas para nomes de grupos limpos
  const groupNameMap: Record<string, string> = {
    'Abdômen (18)-20241202T155424Z-001/Abdômen (18)': 'Abdômen',
    'Antebraço (15)-20241202T155453Z-001/Antebraço (15)': 'Antebraço',
    'Bíceps (51)-20241202T155806Z-001/Bíceps (51)': 'Bíceps',
    'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)': 'Cárdio',
    'Costas (60)-20241202T162754Z-001/Costas (60)': 'Costas',
    'Eretores da Espinha (8)-20241202T164933Z-001/Eretores da Espinha (8)': 'Eretores da Espinha',
    'Glúteo (31)-20241202T165017Z-001/Glúteo (31)': 'Glúteo',
    'Ombro (73)-20241202T165511Z-001/Ombro (73)': 'Ombro',
    'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)': 'Panturrilha',
    'Peitoral (67)-20241202T175211Z-001/Peitoral (67)': 'Peitoral',
    'Pernas (70)-20241202T181042Z-001/Pernas (70)': 'Pernas',
    'Trapézio (9)-20241202T183753Z-001/Trapézio (9)': 'Trapézio',
    'Tríceps (47)-20241202T183816Z-001/Tríceps (47)': 'Tríceps',
  };
  
  for (const [folder, gifs] of Object.entries(availableGifsByGroup)) {
    // Usar mapeamento para obter nome limpo do grupo
    const groupName = groupNameMap[folder] || folder.split('/')[0].split('-')[0].trim();
    const exercises = gifs.map(gif => gif.replace('.gif', ''));
    
    if (!grouped[groupName]) {
      grouped[groupName] = [];
    }
    grouped[groupName].push(...exercises);
  }
  
  return grouped;
}

/**
 * Retorna uma string formatada com todos os exercícios disponíveis
 * Para ser incluída no prompt da IA
 */
export function getAvailableExercisesPrompt(): string {
  const allExercises = getAllAvailableExercises();
  
  // Criar uma lista mais compacta, agrupando por tipo de exercício
  const exerciseTypes: Record<string, string[]> = {
    'Agachamentos': allExercises.filter(e => e.toLowerCase().includes('agachamento')),
    'Supinos': allExercises.filter(e => e.toLowerCase().includes('supino')),
    'Remadas': allExercises.filter(e => e.toLowerCase().includes('remada')),
    'Puxadas': allExercises.filter(e => e.toLowerCase().includes('puxada')),
    'Rosca': allExercises.filter(e => e.toLowerCase().includes('rosca')),
    'Tríceps': allExercises.filter(e => e.toLowerCase().includes('tríceps')),
    'Elevações': allExercises.filter(e => e.toLowerCase().includes('elevação')),
    'Desenvolvimento': allExercises.filter(e => e.toLowerCase().includes('desenvolvimento')),
    'Abdominais': allExercises.filter(e => e.toLowerCase().includes('abdominal')),
    'Prancha': allExercises.filter(e => e.toLowerCase().includes('prancha')),
    'Cardio': allExercises.filter(e => e.toLowerCase().includes('esteira') || e.toLowerCase().includes('bicicleta') || e.toLowerCase().includes('elíptico')),
    'Outros': allExercises.filter(e => {
      const lower = e.toLowerCase();
      return !lower.includes('agachamento') && !lower.includes('supino') && 
             !lower.includes('remada') && !lower.includes('puxada') && 
             !lower.includes('rosca') && !lower.includes('tríceps') &&
             !lower.includes('elevação') && !lower.includes('desenvolvimento') &&
             !lower.includes('abdominal') && !lower.includes('prancha') &&
             !lower.includes('esteira') && !lower.includes('bicicleta') && !lower.includes('elíptico');
    }),
  };
  
  let prompt = '\n\nEXERCÍCIOS DISPONÍVEIS (use APENAS estes exercícios, pois temos GIFs animados para eles):\n\n';
  
  for (const [type, exercises] of Object.entries(exerciseTypes)) {
    if (exercises.length === 0) continue;
    
    prompt += `${type} (${exercises.length} exercícios):\n`;
    // Mostrar apenas os primeiros 15 de cada tipo
    const limitedExercises = exercises.slice(0, 15);
    limitedExercises.forEach((exercise, idx) => {
      prompt += `  ${idx + 1}. ${exercise}\n`;
    });
    if (exercises.length > 15) {
      prompt += `  ... e mais ${exercises.length - 15} exercícios deste tipo\n`;
    }
    prompt += '\n';
  }
  
  prompt += '\nIMPORTANTE: Use APENAS os exercícios listados acima. Não invente nomes de exercícios.';
  prompt += '\nSe precisar de um exercício específico, escolha o mais similar da lista acima.';
  prompt += `\nTotal de exercícios disponíveis: ${allExercises.length}`;
  
  return prompt;
}
