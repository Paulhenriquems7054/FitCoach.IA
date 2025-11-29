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
  
  // Novos grupos adicionados
  'calistenia': 'GIFS CALISTENIA-20241202T155424Z-001/GIFS CALISTENIA',
  'calistênia': 'GIFS CALISTENIA-20241202T155424Z-001/GIFS CALISTENIA',
  'muscle up': 'GIFS CALISTENIA-20241202T155424Z-001/GIFS CALISTENIA',
  'planche': 'GIFS CALISTENIA-20241202T155424Z-001/GIFS CALISTENIA',
  
  'crossfit': 'GIFS CROSSFIT-20241202T155424Z-001/GIFS CROSSFIT',
  'burpee': 'GIFS CROSSFIT-20241202T155424Z-001/GIFS CROSSFIT',
  'kettlebell': 'GIFS CROSSFIT-20241202T155424Z-001/GIFS CROSSFIT',
  'arranco': 'GIFS CROSSFIT-20241202T155424Z-001/GIFS CROSSFIT',
  'arremesso': 'GIFS CROSSFIT-20241202T155424Z-001/GIFS CROSSFIT',
  'snatch': 'GIFS CROSSFIT-20241202T155424Z-001/GIFS CROSSFIT',
  'clean': 'GIFS CROSSFIT-20241202T155424Z-001/GIFS CROSSFIT',
  
  'mobilidade': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'alongamento': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'liberação': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'liberacao': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'rolo': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'espuma': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'flexibilidade': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'rotação': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'rotacao': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'postura': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'piriforme': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'isquiotibiais': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'quadríceps': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'quadriceps': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'adutores': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  'flexores': 'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO',
  
  'funcional': 'GIFS TREINAMENTO FUNCIONAL-20241202T155424Z-001/GIFS TREINAMENTO FUNCIONAL',
  'treinamento funcional': 'GIFS TREINAMENTO FUNCIONAL-20241202T155424Z-001/GIFS TREINAMENTO FUNCIONAL',
  'faixa': 'GIFS TREINAMENTO FUNCIONAL-20241202T155424Z-001/GIFS TREINAMENTO FUNCIONAL',
  'elástico': 'GIFS TREINAMENTO FUNCIONAL-20241202T155424Z-001/GIFS TREINAMENTO FUNCIONAL',
  'elastico': 'GIFS TREINAMENTO FUNCIONAL-20241202T155424Z-001/GIFS TREINAMENTO FUNCIONAL',
  'banda': 'GIFS TREINAMENTO FUNCIONAL-20241202T155424Z-001/GIFS TREINAMENTO FUNCIONAL',
  'gymstick': 'GIFS TREINAMENTO FUNCIONAL-20241202T155424Z-001/GIFS TREINAMENTO FUNCIONAL',
};

/**
 * Lista completa de todos os GIFs disponíveis por grupo muscular
 * Baseado nos nomes exatos dos arquivos
 */
const availableGifsByGroup: Record<string, string[]> = {
  'Abdômen (18)-20241202T155424Z-001/Abdômen (18)': [
    'Abd Concentrado Braços estendidos.gif',
    'Abdominais Oblíquos no Chão.gif',
    'Abdominais.gif',
    'Abdominal Bicicleta com Gymstick.gif',
    'Abdominal Bicicleta.gif',
    'Abdominal canivete no banco.gif',
    'Abdominal com Bola Medicinal.gif',
    'Abdominal com Braços Estendidos.gif',
    'Abdominal com Carga.gif',
    'Abdominal com Elevação de Pernas.gif',
    'Abdominal com Fitball.gif',
    'Abdominal com Giro de Bicicleta.gif',
    'Abdominal com joelhos dobrados com mãos na nuca.gif',
    'Abdominal com joelhos dobrados.gif',
    'Abdominal com Peso.gif',
    'Abdominal com Rolo Abdominal.gif',
    'Abdominal com sobrecarga.gif',
    'Abdominal Completo (1).gif',
    'Abdominal Concentrado.gif',
    'Abdominal Cruzado.gif',
    'Abdominal de Rã com Bola de Exercícios.gif',
    'Abdominal Declinado.gif',
    'Abdominal Encolhimento no Banco.gif',
    'Abdominal infra no solo com flexão de joelho.gif',
    'Abdominal Infra Suspenso.gif',
    'Abdominal Infra.gif',
    'Abdominal lateral no banco inclinado.gif',
    'Abdominal na Alavanca.gif',
    'Abdominal Nadador.gif',
    'Abdominal no Chão.gif',
    'Abdominal Obliquo com Bola.gif',
    'Abdominal Oblíquo Deitada.gif',
    'Abdominal Obliquo no Chão.gif',
    'Abdominal Oblíquo.gif',
    'Abdominal Rã.gif',
    'Abdominal Russian Twist.gif',
    'Abdominal Suspenso com Extensão.gif',
    'Abdominal tipo jack knife com elástico.gif',
    'abdominal.gif',
    'Abdominal-obliquo-2.gif',
    'Abdução de quadril no apoio lateral.gif',
    'Alpinista.gif',
    'Arremesso com Torção Russa da Bola com Parceiro.gif',
    'Besouro Morto com as Mãos no Ar.gif',
    'Chutes Alternados Sentados.gif',
    'Chutes no Prancha Invertida.gif',
    'Crunch en banco declinado.gif',
    'Dragon Flag.gif',
    'Elevação Alternada de Pernas deitado no Chão.gif',
    'Elevação Alternada de Pernas.gif',
    'Elevação de Joelhos com Puxada de Pernas.gif',
    'Elevação de Joelhos na Barra Fixa.gif',
    'Elevação de Perna e Quadril deitado com Faixa Elástica.gif',
    'Elevação de Perna na Prancha Lateral.gif',
    'Elevação de Perna na Prancha.gif',
    'Elevação de Pernas na máquina.gif',
    'Elevação de Pernas.gif',
    'Elevação em V com Halteres.gif',
    'Elevação Lateral Alternada com Halteres.gif',
    'Elevação lateral de joelhos na Barra Fixa.gif',
    'Elevación de piernas en suspensión.gif',
    'Encolhimento Abdominal em Pé com Cabo.gif',
    'Encolhimento de Abdominais de Joelhos com Cabo.gif',
    'Encolhimento Reverso.gif',
    'Escalador Cruzado de Montanha.gif',
    'Exercício de vácuo abdominal em quatro apoios.gif',
    'Exercício Teaser.gif',
    'Extensão com Roda Abdominal.gif',
    'Flexão de Joelho com Bola de Estabilidade.gif',
    'Flexão de Tronco em T.gif',
    'Giro com Barra na Máquina Landmine.gif',
    'Giro Sentado com Cruzamento de Braços no Cabo.gif',
    'Inclinação Lateral com Barra.gif',
    'Inclinação Lateral com Halteres.gif',
    'Inclinação Lateral com Peso em Bola de Estabilidade.gif',
    'Inclinação Lateral em Pé com Gymstick.gif',
    'Inclinação Lateral em Pé.gif',
    'Inseto Morto.gif',
    'Levantamento de quadril com pernas elevadas em banco inclinado.gif',
    'Limpador de Para-Brisa na Barra Fixa.gif',
    'L-Sit.gif',
    'Máquina Abdominal Coaster.gif',
    'Máquina de Abdominais Sentado.gif',
    'Máquina de abdominal completo.gif',
    'Máquina de Abdominal Sentado.gif',
    'Máquina de Torção Sentada.gif',
    'Meio Abdominal.gif',
    'Meio Giro.gif',
    'Pés à Barra.gif',
    'Posição de Canoinha.gif',
    'Posição do Barco.gif',
    'Prancha Alta com Rotação de Tronco.gif',
    'Prancha com Abertura de Pernas - Perna Estendida.gif',
    'Prancha com Elevação de Braço e Perna.gif',
    'Prancha com Movimento de Aranha.gif',
    'Prancha de frente para a prancha lateral.gif',
    'Prancha Frontal Alta (1).gif',
    'Prancha Frontal com Elevação de Braço e Perna.gif',
    'Prancha Frontal com Elevação de Braço.gif',
    'Prancha Frontal com elevação de joelhos.gif',
    'Prancha Frontal com Peso.gif',
    'Prancha Frontal com Rotação de Tronco.gif',
    'Prancha Invertida.gif',
    'Prancha joelho ao cotovelo.gif',
    'Prancha Lateral com Abdominal Oblíquo.gif',
    'Prancha lateral com flexão do quadril.gif',
    'Prancha Lateral.gif',
    'Prancha.gif',
    'Puxada de Pernas Sentado em Banco.gif',
    'Rolamento com barra em pé.gif',
    'Rolamento com barra.gif',
    'Sit-up.gif',
    'Tesoura de Pernas.gif',
    'Tesoura deitada.gif',
    'Toque de Calcanhar.gif',
    'Toque nos Dedos dos Pés com Giro de Caranguejo.gif',
    'Toques nos Dedos com o Corpo deitado.gif',
    'Torção com Barra Sentado.gif',
    'Torção com Cabo Sentado.gif',
    'Torção com Faixa Elástica de Resistência.gif',
    'Torção com Tronco Inclinado.gif',
    'Torção de Alto para Baixo com Cabo em Pé.gif',
    'Torção deitada com Peso.gif',
    'Torção em Pé com Cabo.gif',
    'Torção russa.gif',
    'Torção Sentada com Faixa de Resistência.gif',
    'V-Up com Bola de Estabilidade.gif',
    'V-Up.gif',
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
    'Caminhada Rápida Corrida Leve.gif',
  ],
  // Novos grupos adicionados
  'GIFS CALISTENIA-20241202T155424Z-001/GIFS CALISTENIA': [
    'Flexão de joelhos.gif',
    'Flexão de pivô com banco.gif',
    'Flexão de Punho Fechado.gif',
    'Flexão de Queda.gif',
    'Flexão de um braço com apoio.gif',
    'Flexão de um braço com bola medicinal.gif',
    'Flexão Declinada.gif',
    'Flexão diamante.gif',
    'Flexão em pivô.gif',
    'Flexão inclinada.gif',
    'Flexão Invertida.gif',
    'Flexão na parede.gif',
    'Flexão plus.gif',
    'Flexão reversa com cotovelos.gif',
    'Flexão.gif',
    'Flexões de apoio de mão na parede.gif',
    'Flexões hindu.gif',
    'Impossible Dips.gif',
    'Levantamento de panturrilha com apoio e sobrecarga.gif',
    'Levantamento Terra Unilateral.gif',
    'Mergulho Coreano.gif',
    'Mergulho de tríceps.gif',
    'Mergulhos para tríceps no chão.gif',
    'Muscle up.gif',
    'Paralela.gif',
    'Paralelas entre Cadeiras.gif',
    'Paralelas na Argola.gif',
    'Paralelas na Barra.gif',
    'Planche com Flexão de Braço.gif',
    'Planche.gif',
    'Ponte em Unilateral.gif',
    'Pulo de impulso de quadril de uma perna.gif',
    'Puxada escapular na barra fixa.gif',
    'Puxada Front Lever.gif',
    'Puxada isométrica.gif',
    'Remada com o Peso do Corpo na Porta.gif',
    'Remada Invertida Com Argolas.gif',
    'Remada Invertida na Mesa.gif',
    'Rosca concentrada com perna.gif',
    'Salto em Caixa com uma Perna.gif',
    'Salto em Distância.gif',
    'Salto na Caixa para Agachamento Pistola.gif',
    'Salto para Caixa 2 para 1.gif',
    'Suspensão Passiva.gif',
    'Swing 360.gif',
  ],
  'GIFS CROSSFIT-20241202T155424Z-001/GIFS CROSSFIT': [
    'Agachamento com barra e salto.gif',
    'Agachamento com barra no chão seguido de levantamento militar.gif',
    'Agachamento com Barra Sobre a Cabeça.gif',
    'Agachamento com salto ajoelhado.gif',
    'Agachamento com Salto usando Barra Hexagonal.gif',
    'Agachamento e press com kettlebell.gif',
    'Agachamento Pistol com TRX.gif',
    'Agachamento Pistola Apoiado.gif',
    'Agachamento Pistola com Apoio em Caixa.gif',
    'Agachamento Pistola com Halteres.gif',
    'Agachamento Pistola na Caixa.gif',
    'Andar de Pato.gif',
    'Arranco com Barra.gif',
    'Arranco com kettlebell de um braço.gif',
    'Arranco com kettlebell em afundo.gif',
    'Arranco de Potência.gif',
    'Arranco e Levantamento com Kettlebell.gif',
    'Arranque e Arremesso com Kettlebell.gif',
    'Arremesso com Barra.gif',
    'Arremesso com haltere de um braço.gif',
    'Arremesso de Medicina Bola com Levantamento de Tronco.gif',
    'Arremesso e Pressão com Barra.gif',
    'Balanços com Kettlebell.gif',
    'Barbell Hang Clean.gif',
    'Bola medicinal lançada para cima e para baixo.gif',
    'Bola na parede.gif',
    'Burpee Jack.gif',
    'Burpees.gif',
    'Caminhada com Halteres.gif',
    'Caminhada na Parada de Mão.gif',
    'Caminhada na Parede.gif',
    'Carregamento Zercher.gif',
    'Corda de batalha.gif',
    'Cruz de ferro com halteres.gif',
    'Desenvolvimento Arnold com kettlebell.gif',
    'Desenvolvimento de ombro com kettlebell.gif',
    'Desenvolvimentos com kettlebell unilateral de joelhos.gif',
    'Dumbbell Devil Press.gif',
    'Dumbbell Power Clean.gif',
    'Elevação de Perna Única com Equilíbrio e Rosca de Bíceps.gif',
    'Flexão com kettlebell profunda.gif',
    'Flexão com parada de mãos.gif',
    'Flexão de braço com as mãos entre bancos.gif',
    'Flexão de Braço com Bola de Estabilidade.gif',
    'Flexão de Braço com Bola Medicinal em Um Braço.gif',
    'Flexão de Braço Declinada com Bola de Estabilidade.gif',
    'Flexão de braço em posição de parada de mão com balanço.gif',
    'Flexões de apoio de mão na parede.gif',
    'Heaving Snatch Balance.gif',
    'Impulso com barra.gif',
    'Kettlebell em Forma de Oito.gif',
    'Kettlebell Hang Clean.gif',
    'Levantamento lateral com kettlebell.gif',
    'Levantamento Turco.gif',
    'Moinho com Kettlebell.gif',
    'Moinho de vento com haltere.gif',
    'Muscle Snatch.gif',
    'Muscle up.gif',
    'Power Clean.gif',
    'Pular Corda.gif',
    'Puxada com Halteres entre as Pernas.gif',
    'Remada com barra curvada para trás.gif',
    'Salto na Caixa para Agachamento Pistola.gif',
    'Salto na Caixa.gif',
    'Salto para Caixa 2 para 1.gif',
    'Subida na Corda sem Pernas.gif',
    'Swing de kettlebell de um braço.gif',
    'Swing de kettlebell.gif',
    'Virar Pneu.gif',
  ],
  'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO': [
    // Lista completa de 135 arquivos - adicionar conforme necessário
    'Abraços nos Joelhos em Pé.gif',
    'adução de pernas (alongamento do adutor maior).gif',
    'Adução de quadril deitado de lado.gif',
    'Alongamento Abraço com Tapinhas nas Costas.gif',
    'Alongamento assistido reverso (peitoral e ombro).gif',
    'Alongamento Borboleta.gif',
    'Alongamento com PVC na Posição Frontal de Rack.gif',
    'Alongamento da Esfinge.gif',
    'Alongamento da panturrilha agachado.gif',
    'Alongamento da panturrilha com descida do calcanhar.gif',
    'Alongamento da parte superior das costas.gif',
    'Alongamento das Costas com Rolo de Espuma.gif',
    'Alongamento de Adutores com Pernas Afastadas em Pé.gif',
    'Alongamento de Glúteos Deitado.gif',
    'Alongamento de Isquiotibiais deitado.gif',
    'Alongamento de Isquiotibiais em Pé.gif',
    'Alongamento de ombro com o braço cruzado.gif',
    'Alongamento de ombro reverso em pé.gif',
    'Alongamento de Panturrilha com Corda.gif',
    'Alongamento de panturrilha com uma perna esticada.gif',
    'Alongamento de panturrilha com uma perna.gif',
    'Alongamento de panturrilha em passo largo.gif',
    'Alongamento de panturrilha em posição estática.gif',
    'Alongamento de panturrilha na parede.gif',
    'Alongamento de Pernas Duplo.gif',
    'Alongamento de Punho.gif',
    'Alongamento de Quadríceps ajoelhado.gif',
    'Alongamento de Quadríceps em Quatro Apoios.gif',
    'Alongamento de quadril 90-90.gif',
    'Alongamento de rotação da coluna em pé.gif',
    'Alongamento de tríceps em pé.gif',
    'Alongamento Dinâmico do Peitoral.gif',
    'Alongamento do desviador ulnar e extensor do punho.gif',
    'Alongamento do Gastrocnêmio com Joelho Flexionado.gif',
    'Alongamento do manguito rotador.gif',
    'Alongamento do ombro com toalha.gif',
    'Alongamento do Peito Acima da Cabeça.gif',
    'Alongamento do peito com rolo de espuma.gif',
    'Alongamento do Peito e Parte Frontal dos Ombros.gif',
    'Alongamento do Peitoral até as Costas.gif',
    'Alongamento do Peitoral com um Braço em Pé.gif',
    'Alongamento do peitoral e do ombro na porta.gif',
    'Alongamento do peitoral reverso.gif',
    'Alongamento do Piriforme Sentado.gif',
    'Alongamento do tendão de Aquiles em pé.gif',
    'Alongamento do tibial posterior.gif',
    'Alongamento do trato iliotibial com rolo de espuma.gif',
    'Alongamento dos Adutores com a Perna Estendida ajoelhado.gif',
    'Alongamento dos Adutores com Pernas Abertas em Pé.gif',
    'Alongamento dos adutores da coxa com rolo de espuma.gif',
    'Alongamento dos Adutores em Posição Sentada com Pernas Abertas.gif',
    'Alongamento dos adutores sentado.gif',
    'Alongamento dos Extensores dos Dedos dos Pés.gif',
    'Alongamento dos flexores de quadril ajoelhado.gif',
    'Alongamento dos flexores do quadril em posição de joelho.gif',
    'Alongamento dos flexores dos dedos dos pés em pé.gif',
    'Alongamento dos isquiotibiais em pé com a perna cruzada.gif',
    'Alongamento dos isquiotibiais em pé.gif',
    'Alongamento dos Isquiotibiais Sentado.gif',
    'Alongamento dos latíssimos dorsais com rolo de espuma.gif',
    'Alongamento dos ombros por trás das costas.gif',
    'Alongamento em Círculos nos Punhos.gif',
    'Alongamento em Pé dos Quadríceps.gif',
    'Alongamento Inclinado Lateral em Pé.gif',
    'Alongamento Lateral da Parte Interna da Coxa.gif',
    'Alongamento na parede do canto.gif',
    'Alongamento Piriforme.gif',
    'Alongamento reverso assistido (peito e ombro).gif',
    'Alongamento Reverso de Pulso.gif',
    'Alongamento Sentado para a Panturrilha com Perna Esticada.gif',
    'Alongamentos de pés e tornozelos.gif',
    'Arremesso de Bola de Reação.gif',
    'Catavento corporal.gif',
    'Contração abdominal.gif',
    'Círculos com os braços.gif',
    'Círculos com um braço.gif',
    'Deslize de parede do serrátil com rolo de espuma.gif',
    'Dorsiflexão plantar.gif',
    'Elevação lateral de deltóide posterior com halteres.gif',
    'Exercício de bailarina sentada.gif',
    'Exercício de retração escapular sentada.gif',
    'Flexão alternada de ombro.gif',
    'Inclinação Lateral em Pé.gif',
    'Inclinação Lateral.gif',
    'Joelho Alternado no Peito.gif',
    'Levantamento de braço apoiado na parede.gif',
    'Postura da Cobra - Alongamento Abdominal.gif',
    'Postura da Virilha Sentada.gif',
    'Postura de meio sapo.gif',
    'Postura de peixe.gif',
    'Postura do Arco Oscilante.gif',
    'Postura do Arco.gif',
    'Postura do Bebê Feliz.gif',
    'Postura do sapo.gif',
    'Protração e retração da escápula.gif',
    'Puxada escapular na barra fixa.gif',
    'Pêndulo de ombro.gif',
    'Quadrúpede com elevação de braço e perna contralateral.gif',
    'Rolagem de espuma para isquiotibiais.gif',
    'Rolamento de espuma nas costas.gif',
    'Rolamento de espuma nos quadríceps.gif',
    'Rolamento de espuma nos romboides.gif',
    'Rolamento de Espuma para Panturrilhas.gif',
    'Rolando como uma Bola.gif',
    'Rolo de espuma ombro posterior.gif',
    'Rolo de espuma para fascite plantar.gif',
    'Rolo de espuma para ombro e peito frontal.gif',
    'Rolo de Espuma para os Glúteos.gif',
    'Rotação da coluna torácica de joelhos.gif',
    'Rotação de Pé e Tornozelo.gif',
    'Rotação do corpo superior deitado.gif',
    'Rotação em Pé.gif',
    'Rotação espinhal deitado.gif',
    'Rotação externa com cabo a 90 graus.gif',
    'Rotação externa com cabo em posição de joelhos.gif',
    'Rotação externa de halteres apoiada no banco.gif',
    'Rotação Externa de Ombro com Cabo.gif',
    'Rotação externa de ombro com faixa elástica.gif',
    'Rotação Externa De Quadril Com Faixa Elástica.gif',
    'Rotação Externa de Quadril Sentado com Faixa Elástica.gif',
    'Rotação externa do ombro deitado com haltere.gif',
    'Rotação externa do ombro.gif',
    'Rotação Externa do Pé com Faixa Elástica.gif',
    'Rotação interna de cabo a 90 graus.gif',
    'Rotação interna de ombro com cabo.gif',
    'Rotação interna do ombro sentada com cabo.gif',
    'Rotação interna do ombro.gif',
    'Rotação Interna do Quadril Sentado com Faixa Elástica.gif',
    'Rotação para trás de joelhos.gif',
    'Superman.gif',
    'Toque Lateral dos Dedos dos Pés em Pé.gif',
    'Toque nos Dedos dos Pés em Pé.gif',
    'Toque nos Dedos dos Pés Sentado.gif',
    'Toques de Dedos em Pé.gif',
    'Torção Oblíqua Sentada.gif',
  ],
  'GIFS TREINAMENTO FUNCIONAL-20241202T155424Z-001/GIFS TREINAMENTO FUNCIONAL': [
    // Lista completa de 206 arquivos - adicionar conforme necessário
    'Abdução de Quadril com Faixa.gif',
    'Abdução de Quadril em Decúbito Lateral.gif',
    'Abdução de Quadril em Pé.gif',
    'Abdução de Quadril Lateral.gif',
    'Abdução de Quadril Sentado com Faixa Elástica.gif',
    'Adução de Ombro com Faixa Elástica.gif',
    'Afundo Alternado com Salto.gif',
    'Afundo com Gymstick.gif',
    'Afundo Lateral.gif',
    'Afundo no banco.gif',
    'Afundo.gif',
    'Agachamento Búlgaro com Peso Corporal.gif',
    'Agachamento búlgaro com salto.gif',
    'Agachamento Camarão.gif',
    'Agachamento com Chute Lateral e Toque no Calcanhar.gif',
    'Agachamento com Elevação dos Joelhos.gif',
    'Agachamento com Faixa Elástica em Afundo.gif',
    'Agachamento com Faixa Elástica sobre a Cabeça.gif',
    'Agachamento com Gymstick.gif',
    'Agachamento com Salto.gif',
    'Agachamento com Sustentação e Elevação de Panturrilhas.gif',
    'Agachamento Cossaco.gif',
    'Agachamento Dividido Profundo.gif',
    'Agachamento Goblet com Kettlebell e Faixa Elástica.gif',
    'Agachamento na Parede com Bola de Exercício.gif',
    'Agachamento no Banco com Peso Corporal.gif',
    'Agachamento Pistola com Apoio em Caixa.gif',
    'Agachamento Pistola na Caixa.gif',
    'Agachamento Skater.gif',
    'Agachamento Sumô sem Pesos.gif',
    'Agachamento unilateral cruzado.gif',
    'Agachamento.gif',
    'Andar de Bicicleta ao Ar Livre.gif',
    'Arremesso de Bola de Reação.gif',
    'Arremesso de Medicina Bola com Levantamento de Tronco.gif',
    'Avanço com Joelho Alto em Cima da Bola Bosu.gif',
    'Avanço com Joelho Elevado em Caminhada.gif',
    'Avanço sem Peso Corporal.gif',
    'Balanço com gymstick.gif',
    'Balloon Drill.gif',
    'Bola medicinal lançada para cima e para baixo.gif',
    'Bola na parede.gif',
    'Bom Dia com Faixa Elástica de Resistência.gif',
    'Boxe jab.gif',
    'Boxe Sombra.gif',
    'Burpees.gif',
    'Caminhada Lateral com Faixa de Resistência.gif',
    'Caminhada Rápida.gif',
    'Caminhar.gif',
    'Cardio de Passos de Boxeador.gif',
    'Chute em Gancho.gif',
    'Chutes Alternados de Glúteos no Banco.gif',
    'Chutes até o Glúteo.gif',
    'Coice com Perna Flexionada.gif',
    'Coice de Burro.gif',
    'Cópia de Abdominal de Rã com Bola de Exercícios.gif',
    'Corda de batalha.gif',
    'Corrida com Elevação dos Joelhos.gif',
    'Corrida com Joelhos Altos.gif',
    'Corrida com Passos Rápidos.gif',
    'Corrida com Salto.gif',
    'Corrida de Passos Curtos.gif',
    'Corrida de Sprint com Assistência de Faixa Elástica.gif',
    'Corrida Estacionária.gif',
    'Corrida Latera.gif',
    'Corrida para Trás.gif',
    'Corrida.gif',
    'Crucifixo invertido com gymstick para deltoides posterior.gif',
    'Cruz de ferro com halteres.gif',
    'Cruzado de Direita.gif',
    'Desenvolvimento de ombro sentado com faixa de resistência.gif',
    'Desenvolvimento de ombro unilateral com banda.gif',
    'Desenvolvimento lateral com gymstick.gif',
    'Desenvolvimento militar atrás da cabeça com gymstick.gif',
    'Desenvolvimento militar com peso do corpo.gif',
    'Elevação com Giro do Cotovelo Oposto para o Joelho.gif',
    'Elevação da Perna em Pé com Faixa Elástica de Resistência.gif',
    'Elevação de Panturrilha com Faixa Elástica de Resistência.gif',
    'Elevação de panturrilha em pé.gif',
    'Elevação de Panturrilha em Uma Perna.gif',
    'Elevação de Perna Reta em Pé com Faixa de Resistência.gif',
    'Elevação de Perna Única com Equilíbrio e Rosca de Bíceps.gif',
    'Elevação de Pernas deitado de Lado.gif',
    'Elevação de Pernas estilo Sapo.gif',
    'Elevação de Quadril com Banda de Resistência de Joelhos.gif',
    'Elevação de Quadril com Peso Corporal.gif',
    'Elevação frontal lateral com elástico.gif',
    'Elevação lateral de braços.gif',
    'Elevação Lateral de Perna com Faixa Elástica Deitado de Lado.gif',
    'Elevação Lateral de Perna com Faixa Elástica.gif',
    'Elevação Pélvica com Banda de Resistência.gif',
    'Elevação Pélvica Declinado.gif',
    'Escalador de Montanha.gif',
    'Esquiador com gymstick.gif',
    'Exercício Pliométrico X.gif',
    'Exercícios das 5 Marcas.gif',
    'Exercícios de escada de agilidade lateral.gif',
    'Exercícios de Escada de Agilidade.gif',
    'Extensão De Glúteo Em Pé.gif',
    'Extensão de ombro com faixa.gif',
    'Extensão de Perna em Pé com Faixa de Resistência.gif',
    'Extensão De Perna Reta.gif',
    'Extensão de Pernas com Faixa Elástica Sentado.gif',
    'Extensão de Pernas Sentado com Faixa de Resistência.gif',
    'Extensão de Quadril no Banco.gif',
    'Extensão de Tríceps Acima da Cabeça com Gymstick.gif',
    'Extensão de tríceps com elástico na posição horizontal.gif',
    'Extensão de Tríceps com Faixa Elástica.gif',
    'Extensão de Tríceps com Faixas Elásticas.gif',
    'Flexão cobra.gif',
    'Flexão com Rotação.gif',
    'Flexão de Braço com Bola de Estabilidade.gif',
    'Flexão de Braço com Bola Medicinal com Apoio em Um Braço.gif',
    'Flexão de Braço com Uma Perna.gif',
    'Flexão de Braço Declinada com Bola de Estabilidade.gif',
    'Flexão de Braço na Parede com Pegada Fechada.gif',
    'Flexão de Braço no Bosu.gif',
    'Flexão de Braços com Apoio dos Joelhos Fechada.gif',
    'Flexão de joelhos.gif',
    'Flexão de ombro com faixa.gif',
    'Flexão de Parede.gif',
    'Flexão de Perna com Halteres em Decúbito Dorsal.gif',
    'Flexão de Pernas com Faixa Elástica.gif',
    'Flexão de pernas com toalha.gif',
    'Flexão de Pernas deitado com Faixa Elástica.gif',
    'Flexão de Pernas na Bola de Estabilidade.gif',
    'Flexão hindu modificada.gif',
    'Flexão.gif',
    'Gancho de Direita.gif',
    'Glúteo Coice com Gymstick.gif',
    'Glúteo Coice com Pernas Flexionada com Faixa.gif',
    'Glúteo Coice em Pé com Faixa Elástica.gif',
    'Glúteos Coice com Faixa Elástica.gif',
    'Hiperextensão Reversa com Faixa de Resistência.gif',
    'Inclinação Pélvica.gif',
    'Joelhos altos contra a parede.gif',
    'Lançamento de Bola Medicinal deitado.gif',
    'Lançamento de bola medicinal.gif',
    'Leg Press Alternado Deitado com Gymstick.gif',
    'Levantamento Lateral de Perna em Quatro Apoios.gif',
    'Levantamento Terra Unilateral.gif',
    'Medicine Ball Rotational Throw.gif',
    'Mergulho reverso.gif',
    'Minhoca.gif',
    'Nave Seal Burpee.gif',
    'Passagem de Bola Medicinal de Peito em Pé.gif',
    'Passo de Esqui.gif',
    'Passo Invertido com Elevação do Joelho.gif',
    'Passo Lateral em Alta Velocidade.gif',
    'Patinador.gif',
    'Polichinelo Frontal.gif',
    'Polichinelos.gif',
    'Ponte com Faixa Elástica.gif',
    'Ponte de Glúteos.gif',
    'Ponte em Unilateral.gif',
    'Ponte Unilateral Com Uma Perna Levantada.gif',
    'Ponte Unilateral no Banco.gif',
    'Pular Corda.gif',
    'Pulos com Abertura de Pernas.gif',
    'Pulos de Joelho Elevado.gif',
    'Puxada ajoelhada com banda de resistência.gif',
    'Puxada com Faixa Elástica.gif',
    'Puxar com Faixa Elástica.gif',
    'Quadrúpede com elevação de braço e perna contralateral.gif',
    'Rastejo de Urso.gif',
    'Remada afastada com banda de resistência.gif',
    'Remada com banda de resistência curvada para deltoides posterior.gif',
    'Remada sentada com faixa.gif',
    'Remada unilateral com gymstick.gif',
    'Rolamento na bola suíça.gif',
    'Rosca bíceps com faixa elástica.gif',
    'Rosca de bíceps unilateral com faixa de resistência.gif',
    'Rosca martelo com faixa de resistência.gif',
    'Rosca martelo com garrafa de água.gif',
    'Salto com halteres dividido.gif',
    'Salto com Joelhos Flexionados.gif',
    'Salto em Agachamento com Joelhos Flexionados.gif',
    'Salto em Distância.gif',
    'Salto em Uma Perna para a Frente.gif',
    'Salto na Caixa para Agachamento Pistola.gif',
    'Salto na Caixa.gif',
    'Salto para Caixa 2 para 1.gif',
    'Salto para Trás.gif',
    'Saltos com Joelhos Altos.gif',
    'Saltos de afastamento.gif',
    'Saltos em tesoura.gif',
    'Saltos Pliométricos em Zigue-Zague.gif',
    'Saltos Potentes.gif',
    'Snap Jumps.gif',
    'Soco direto de direita.gif',
    'Socos.gif',
    'Step com elástico.gif',
    'Stiff com Elástico de Resistência.gif',
    'Subida no Step com Elevação de Joelhos.gif',
    'Superman.gif',
    'Supino em Pé com Faixa Elástica.gif',
    'Swimming.gif',
    'Tesoura de Braços.gif',
    'Torções do Cotovelo para o Joelho.gif',
    'Tração lateral com elástico.gif',
    'Tríceps Francês com Faixa Elástica Acima da Cabeça.gif',
    'Tríceps Francês em Pé com Gymstick.gif',
    'Tríceps Testa com Faixa Elástica.gif',
    'V-Up com Bola de Estabilidade.gif',
    'Wall Sit com Inclinação de Tronco.gif',
    'Wall Sit.gif',
  ],
};

/**
 * Encontra o grupo muscular baseado no nome do exercício
 * Verifica keywords mais específicas primeiro para evitar falsos positivos
 */
function findMuscleGroup(exerciseName: string): string | null {
  const normalized = normalizeText(exerciseName);
  
  // PRIMEIRO: Verificar se o exercício está diretamente na lista de exercícios de QUALQUER grupo
  // Isso garante que exercícios sejam encontrados mesmo sem keywords no nome
  for (const [folder, gifs] of Object.entries(availableGifsByGroup)) {
    if (!gifs || gifs.length === 0) continue;
    
    const exerciseInGroup = gifs.some(gif => {
      const gifNameNormalized = normalizeText(gif.replace('.gif', ''));
      // Verificar correspondência exata ou parcial
      return gifNameNormalized === normalized || 
             gifNameNormalized.includes(normalized) || 
             normalized.includes(gifNameNormalized);
    });
    
    if (exerciseInGroup) {
      return folder;
    }
  }
  
  // SEGUNDO: Se não encontrou na lista direta, usar keywords específicas
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
  
  // TERCEIRO: Verificar todas as outras keywords
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
    'Antebraço (15)-20241202T155424Z-001/Antebraço (15)': 'Antebraço',
    'Antebraço (15)-20241202T155453Z-001/Antebraço (15)': 'Antebraço',
    'Bíceps (51)-20241202T155424Z-001/Bíceps (51)': 'Bíceps',
    'Bíceps (51)-20241202T155806Z-001/Bíceps (51)': 'Bíceps',
    'Cárdio Academia (11)-20241202T155424Z-001/Cárdio Academia (11)': 'Cárdio',
    'Cárdio Academia (11)-20241202T161427Z-001/Cárdio Academia (11)': 'Cárdio',
    'Costas (60)-20241202T155424Z-001/Costas (60)': 'Costas',
    'Costas (60)-20241202T162754Z-001/Costas (60)': 'Costas',
    'Eretores da Espinha (8)-20241202T164933Z-001/Eretores da Espinha (8)': 'Eretores da Espinha',
    'ERETORES DA ESPINHA-20241202T155424Z-001/ERETORES DA ESPINHA': 'Eretores da Espinha',
    'Glúteo (31)-20241202T155424Z-001/Glúteo (31)': 'Glúteo',
    'Glúteo (31)-20241202T165017Z-001/Glúteo (31)': 'Glúteo',
    'Ombro (73)-20241202T155424Z-001/Ombro (73)': 'Ombro',
    'Ombro (73)-20241202T165511Z-001/Ombro (73)': 'Ombro',
    'Panturrilha (20)-20241202T155424Z-001/Panturrilha (20)': 'Panturrilha',
    'Panturrilha (20)-20241202T173337Z-001/Panturrilha (20)': 'Panturrilha',
    'Peitoral (67)-20241202T155424Z-001/Peitoral (67)': 'Peitoral',
    'Peitoral (67)-20241202T175211Z-001/Peitoral (67)': 'Peitoral',
    'Pernas (70)-20241202T155424Z-001/Pernas (70)': 'Pernas',
    'Pernas (70)-20241202T181042Z-001/Pernas (70)': 'Pernas',
    'Trapézio (9)-20241202T155424Z-001/Trapézio (9)': 'Trapézio',
    'Trapézio (9)-20241202T183753Z-001/Trapézio (9)': 'Trapézio',
    'Tríceps (47)-20241202T155424Z-001/Tríceps (47)': 'Tríceps',
    'Tríceps (47)-20241202T183816Z-001/Tríceps (47)': 'Tríceps',
    // Novos grupos
    'GIFS CALISTENIA-20241202T155424Z-001/GIFS CALISTENIA': 'Calistenia',
    'GIFS CROSSFIT-20241202T155424Z-001/GIFS CROSSFIT': 'Crossfit',
    'MOBILIDADE ALONGAMENTO LIBERAÇÃO-20241202T155424Z-001/MOBILIDADE ALONGAMENTO LIBERAÇÃO': 'Mobilidade',
    'GIFS TREINAMENTO FUNCIONAL-20241202T155424Z-001/GIFS TREINAMENTO FUNCIONAL': 'Treinamento Funcional',
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
