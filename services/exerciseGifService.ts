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

import type { ExerciseInfo } from '../types/exercise';

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

/**
 * Normaliza nome de arquivo/pasta para formato compatível com Vercel
 * Remove acentos, converte para minúsculas, substitui espaços por hífens
 * Remove parênteses e caracteres especiais
 */
function normalizeFileName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '-') // Espaços para hífen
    .replace(/[()]/g, '') // Remove parênteses
    .replace(/[^\w\-.]/g, '') // Remove caracteres especiais (manter letras, números, hífen e ponto)
    .replace(/-+/g, '-') // Múltiplos hífens para um
    .replace(/^-|-$/g, ''); // Remove hífens no início/fim
}

/**
 * Normaliza caminho completo para formato compatível com Vercel
 * Aplica normalizeFileName em cada segmento do caminho
 */
function normalizeFilePath(path: string): string {
  const segments = path.split('/').filter(s => s.length > 0);
  const prefix = path.startsWith('/') ? '/' : '';
  const normalizedSegments = segments.map(segment => {
    // Se tiver extensão, preservar
    if (segment.includes('.')) {
      const parts = segment.split('.');
      const name = parts.slice(0, -1).join('.');
      const ext = parts[parts.length - 1];
      return normalizeFileName(name) + '.' + ext.toLowerCase();
    }
    return normalizeFileName(segment);
  });
  return prefix + normalizedSegments.join('/');
}

/**
 * Normaliza caminho para Vercel (remove acentos, converte para minúsculas)
 * Esta função é usada em produção para garantir compatibilidade com Vercel
 */
function normalizePathForVercel(path: string): string {
  // Se não estiver em produção, retornar o caminho original
  if (!import.meta.env.PROD) {
    return path;
  }

  // Em produção (Vercel), normalizar o caminho
  return normalizeFilePath(path);
}

// Mapeamento de grupos musculares para pastas de GIFs
// ATUALIZADO: Nova estrutura simplificada (pastas diretas sem subpastas)
const muscleGroupFolders: Record<string, string> = {
  // Abdômen
  'abd': 'Abdomen',
  'abdomen': 'Abdomen',
  'abdominal': 'Abdomen',
  'core': 'Abdomen',
  'prancha': 'Abdomen',

  // Antebraço
  'antebraço': 'Antebraco',
  'antebraco': 'Antebraco',
  'pulso': 'Antebraco',
  'punho': 'Antebraco',

  // Bíceps
  'bíceps': 'Biceps',
  'biceps': 'Biceps',
  'rosca': 'Biceps',

  // Cárdio
  'cardio': 'Cardio',
  'cárdio': 'Cardio',
  'esteira': 'Cardio',
  'bicicleta': 'Cardio',
  'bike': 'Cardio',
  'elíptico': 'Cardio',
  'eliptico': 'Cardio',

  // Costas
  'costas': 'Costas',
  'remo': 'Costas',
  'remada': 'Costas',
  'puxada': 'Costas',
  'barra fixa': 'Costas',
  'pullover': 'Costas',
  'levantamento terra': 'Costas',

  // Glúteo (note: pasta é "GluteoS" com S maiúsculo)
  'glúteo': 'GluteoS',
  'gluteo': 'GluteoS',
  'glúteos': 'GluteoS',
  'gluteos': 'GluteoS',
  'elevação pélvica': 'GluteoS',
  'elevacao pelvica': 'GluteoS',
  'ponte': 'GluteoS',
  'stiff': 'GluteoS',

  // Ombro
  'ombro': 'Ombro',
  'ombros': 'Ombro',
  'desenvolvimento': 'Ombro',
  'elevação': 'Ombro',
  'elevacao': 'Ombro',
  'deltoide': 'Ombro',

  // Panturrilha
  'panturrilha': 'Panturrilha',
  'panturrinha': 'Panturrilha',
  'gêmeos': 'Panturrilha',
  'gemeos': 'Panturrilha',
  'flexão plantar': 'Panturrilha',
  'flexao plantar': 'Panturrilha',
  'elevação de panturrilha': 'Panturrilha',
  'elevacao de panturrilha': 'Panturrilha',
  'levantamento de panturrilha': 'Panturrilha',

  // Peitoral
  'peitoral': 'Peitoral',
  'peito': 'Peitoral',
  'supino': 'Peitoral',
  'crucifixo': 'Peitoral',
  'voador': 'Peitoral',
  'flexão': 'Peitoral',
  'flexao': 'Peitoral',
  'paralelas': 'Peitoral',

  // Pernas
  'pernas': 'Pernas',
  'perna': 'Pernas',
  'agachamento': 'Pernas',
  'leg press': 'Pernas',
  'afundo': 'Pernas',
  'lunges': 'Pernas',
  'passada': 'Pernas',
  'cadeira extensora': 'Pernas',
  'cadeira flexora': 'Pernas',

  // Trapézio
  'trapézio': 'Trapezio',
  'trapezio': 'Trapezio',
  'encolhimento': 'Trapezio',

  // Tríceps
  'tríceps': 'Triceps',
  'triceps': 'Triceps',
  'tricep': 'Triceps',
  'mergulho': 'Triceps',
};

/**
 * Função auxiliar para normalizar nome de pasta para busca
 * Converte nomes como "Abdomen" para formato usado no sistema de arquivos
 */
function normalizeFolderName(folderName: string): string {
  // IMPORTANTE: NÃO normalizar os nomes das pastas - usar exatamente como estão no sistema de arquivos
  // As pastas reais são: Abdomen, Antebraco, Biceps, Cardio, Costas, GluteoS, Ombro, Panturrilha, Peitoral, Pernas, Trapezio, Triceps
  // Não remover acentos, não alterar espaços - usar o nome exato
  return folderName;
}

/**
 * Lista completa de todos os GIFs disponíveis por grupo muscular
 * ATUALIZADO: Nomes exatos dos arquivos conforme estão no sistema de arquivos
 * Gerado automaticamente a partir dos arquivos reais nas pastas
 */
const availableGifsByGroup: Record<string, string[]> = {
  'Abdomen': [
    'Abdominais Oblíquos no Chão.gif',
    'Abdominais.gif',
    'Abdominal Bicicleta com Gymstick.gif',
    'Abdominal Bicicleta.gif',
    'Abdominal com Bola Medicinal.gif',
    'Abdominal com Braços Estendidos.gif',
    'Abdominal com Elevação de Pernas.gif',
    'Abdominal com Giro de Bicicleta.gif',
    'Abdominal com joelhos dobrados com mãos na nuca.gif',
    'Abdominal com joelhos dobrados.gif',
    'Abdominal com Peso.gif',
    'Abdominal com Rolo Abdominal.gif',
    'Abdominal com sobrecarga.gif',
    'Abdominal Cruzado.gif',
    'Abdominal de Rã com Bola de Exercícios.gif',
    'Abdominal Declinado.gif',
    'Abdominal infra no solo com flexão de joelho.gif',
    'Abdominal lateral no banco inclinado.gif',
    'Abdominal na Alavanca.gif',
    'Abdominal Nadador.gif',
    'Abdominal no Chão.gif',
    'Abdominal Oblíquo.gif',
    'Abdominal Rã.gif',
    'Abdominal Suspenso com Extensão.gif',
    'Abdominal tipo jack knife com elástico.gif',
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
    'Prancha com Abertura de Pernas - Perna Estendida.gif',
    'Prancha com Elevação de Braço e Perna.gif',
    'Prancha com Movimento de Aranha.gif',
    'Prancha de frente para a prancha lateral.gif',
    'Prancha Frontal com Elevação de Braço e Perna.gif',
    'Prancha Frontal com Elevação de Braço.gif',
    'Prancha Frontal com Peso.gif',
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
  'Peitoral': [
    'anilha-press.gif',
    'cross-over-polia-alta.gif',
    'cross-over-polia-baixa.gif',
    'crossover-com-cabos.gif',
    'crossover-de-cabo-alto.gif',
    'crossover-de-peitoral-superior-com-cabo.gif',
    'crossover-na-alavanca.gif',
    'crossover-unilateral-com-cabo.gif',
    'crucifixo-com-cabo-declinado.gif',
    'crucifixo-com-halteres-declinado.gif',
    'crucifixo-com-halteres-inclinado.gif',
    'crucifixo-com-halteres.gif',
    'crucifixo-deitado-com-cabo.gif',
    'crucifixo-unilateral-em-declinado-com-cabo.gif',
    'maquina-de-voador-de-peito-inclinado.gif',
    'mergulho-de-peito-assistido.gif',
    'paralelas.gif',
    'pullover-com-haltere.gif',
    'pullover-com-halteres-na-bola-de-estabilidade.gif',
    'pullover-de-braco-reto-com-halteres-joelhos-a-90-graus.gif',
    'supino-alternado-com-halteres.gif',
    'supino-com-alavanca.gif',
    'supino-com-banco-inclinado-no-smith.gif',
    'supino-com-barra-declinado.gif',
    'supino-com-barra-no-chao.gif',
    'supino-com-cabo-sentado.gif',
    'supino-com-haltere-pegada-fechada.gif',
    'supino-com-halteres-com-pegada-fechada.gif',
    'supino-com-halteres-pegada-invertida.gif',
    'supino-com-halteres.gif',
    'supino-com-kettlebell-de-um-braco.gif',
    'supino-com-kettlebell-no-chao.gif',
    'supino-com-pegada-aberta.gif',
    'supino-com-pegada-fechada-sentado-com-cabo.gif',
    'supino-com-pegada-fechada.gif',
    'supino-declinada-com-alavanca.gif',
    'supino-declinada-na-maquina.gif',
    'supino-declinado-com-halteres.gif',
    'supino-declinado-na-maquina-smith.gif',
    'supino-declinado-pegada-martelo.gif',
    'supino-declinado-unilateral-pegada-martelo-com-haltere.gif',
    'supino-inclinado-com-barra.gif',
    'supino-inclinado-com-cabo.gif',
    'supino-inclinado-com-halteres-e-pegada-fechada.gif',
    'supino-inclinado-com-halteres-e-pegada-invertida.gif',
    'supino-inclinado-com-halteres-em-martelo.gif',
    'supino-inclinado-com-halteres.gif',
    'supino-inclinado-com-pegada-fechada.gif',
    'supino-inclinado-na-alavanca.gif',
    'supino-inclinado-na-maquina-com-pegada-martelo.gif',
    'supino-inclinado-na-maquina.gif',
    'supino-invertido-com-pegada-aberta.gif',
    'supino-na-maquina-para-miolo-do-peitoral.gif',
    'supino-na-maquina-smith.gif',
    'supino-na-maquina.gif',
    'supino-no-banco-inclinado-30-graus-com-pegada-invertida.gif',
    'supino-no-smith-com-o-triangulo.gif',
    'supino-pegada-martelo.gif',
    'supino-reto-na-maquina.gif',
    'supino-unilateral-com-alavanca.gif',
    'supino-unilateral-com-halteres-com-pegada-reversa.gif',
    'supino-unilateral-no-cabo.gif',
    'supino.gif',
    'voador-com-halteres-para-cima.gif',
    'voador-na-maquina.gif',
    'voador-no-pec-deck.gif',
    'voador-unilateral-no-solo-com-barra.gif',
  ],
  'Costas': [
    'barra-fixa-assistida.gif',
    'barra-fixa.gif',
    'levantamento-terra-romeno.gif',
    'levantamento-terra.gif',
    'maquina-de-remo.gif',
    'pulldown-com-corda.gif',
    'pulldown-inclinado-com-corda.gif',
    'pulldown-unilateral-no-cabo.gif',
    'pullover-com-barra-no-banco-declinado.gif',
    'pullover-com-barra-w-pegada-invertida.gif',
    'pullover-com-barra.gif',
    'pullover-com-cabo-sentado.gif',
    'pullover-com-cabo.gif',
    'pullover-na-maquina-de-alavanca.gif',
    'puxada-alta-com-alavanca.gif',
    'puxada-alta-com-triangulo.gif',
    'puxada-alta-com-um-joelho-apoiado.gif',
    'puxada-alta-invertida.gif',
    'puxada-alta-na-maquina-nuca.gif',
    'puxada-alta-na-polia-nuca.gif',
    'puxada-alta-neutra-com-cabos-duplos-no-chao.gif',
    'puxada-alta-unilateral-alta-ajoelhada.gif',
    'puxada-alta.gif',
    'puxada-com-um-braco-com-cabo.gif',
    'puxada-com-um-braco-com-peso-adicional.gif',
    'puxada-em-pe-com-torcao-no-cabo.gif',
    'puxada-na-polia-alta-com-pegada-fechada.gif',
    'remada-com-cabo-sentada-unilateral-com-torcao.gif',
    'remada-com-halteres-em-posicao-prancha.gif',
    'remada-cruzada-no-cross.gif',
    'remada-curvada-com-barra-de-pegada-alternada-ampla-com-aducao-de-escapula.gif',
    'remada-curvada-com-barra.gif',
    'remada-curvada-com-halteres-com-pegada-invertida.gif',
    'remada-curvada-com-halteres.gif',
    'remada-curvada-com-kettlebell.gif',
    'remada-curvada-com-pegada-invertida-na-barra.gif',
    'remada-curvada-em-t.gif',
    'remada-curvada-inclinada-com-barra.gif',
    'remada-curvada-no-smith.gif',
    'remada-de-espingarda.gif',
    'remada-frontal-com-alavanca.gif',
    'remada-inclinada-com-cabo.gif',
    'remada-inclinada-com-pegada-neutra-com-halteres.gif',
    'remada-inclinada-com-pegada-reversa-com-halteres.gif',
    'remada-inclinada-no-banco-com-cabo.gif',
    'remada-invertida.gif',
    'remada-renegada-com-halteres.gif',
    'remada-sentada-com-anilhas.gif',
    'remada-sentada-com-cabo.gif',
    'remada-sentada-com-carga-de-anilhas.gif',
    'remada-sentada-com-corda-na-polia.gif',
    'remada-sentada-na-maquina.gif',
    'remada-sentado-com-cabo-pegada-fechada.gif',
    'remada-t-com-alavanca.gif',
    'remada-t-com-landmine.gif',
    'remada-t-invertida-com-alavanca.gif',
    'remada-unilateral-com-barra-landmine.gif',
    'remada-unilateral-com-barra.gif',
    'remada-unilateral-com-cabo.gif',
    'serrote.gif',
  ],
  'Pernas': [
    'aduca-de-quadril-na-polia.gif',
    'aducao-do-quadril-com-cabo.gif',
    'aducao-do-quadril-lateral-com-alavanca.gif',
    'afundo-com-barra.gif',
    'afundo-com-landmine.gif',
    'afundo-livre.gif',
    'afundo-na-maquina-smith.gif',
    'afundo-no-banco-com-halteres.gif',
    'agachamento-barra.gif',
    'agachamento-bulgaro-com-barra.gif',
    'agachamento-bulgaro-com-halteres.gif',
    'agachamento-bulgaro-com-salto.gif',
    'agachamento-bulgaro.gif',
    'agachamento-com-cinto.gif',
    'agachamento-com-halteres-com-uma-perna.gif',
    'agachamento-com-halteres-no-banco.gif',
    'agachamento-com-kettlebell.gif',
    'agachamento-com-salto-e-halteres.gif',
    'agachamento-com-salto-usando-barra-hexagonal.gif',
    'agachamento-com-trava.gif',
    'agachamento-cossack-com-barra.gif',
    'agachamento-em-plie-com-halteres.gif',
    'agachamento-frontal-com-barra-no-banco.gif',
    'agachamento-frontal-com-barra-no-smith.gif',
    'agachamento-frontal-com-cabo.gif',
    'agachamento-frontal-com-haltere.gif',
    'agachamento-frontal-com-kettlebell.gif',
    'agachamento-frontal.gif',
    'agachamento-goblet-com-haltere.gif',
    'agachamento-hack-com-barra.gif',
    'agachamento-hack-invertido.gif',
    'agachamento-jefferson.gif',
    'agachamento-livre-com-barra.gif',
    'agachamento-livre-pes-juntos.gif',
    'agachamento-na-maquina-hack.gif',
    'agachamento-na-maquina.gif',
    'agachamento-na-parede-com-bola-de-exercicio.gif',
    'agachamento-no-banco.gif',
    'agachamento-no-cross.gif',
    'agachamento-no-landmine.gif',
    'agachamento-no-smith.gif',
    'agachamento-pes-afastados.gif',
    'agachamento-sissy.gif',
    'agachamento-skater.gif',
    'agachamento-sumo-com-barra.gif',
    'agachamento-sumo-com-halteres.gif',
    'agachamento-sumo-livre.gif',
    'agachamento-sumo-peso-corporal.gif',
    'agachamento-terra-com-halteres-do-lado.gif',
    'agachamento-unil.gif',
    'cadeira-abdutora.gif',
    'cadeira-adutora.gif',
    'cadeira-extensora.gif',
    'cadeira-flex.gif',
    'flexao-plantar-com-peso-corporal.gif',
    'flexao-plantar-maquina.gif',
    'flexao-plantar-no-smith.gif',
    'leg-press-pes-afastados.gif',
    'leg-press.gif',
    'levantamento-tarra-com-halteres.gif',
    'maquina-adutora.gif',
    'mesa-flex-unilateral.gif',
    'mesa-flex.gif',
    'panturrinha-no-leg-press.gif',
    'passada-a-frente-com-barra.gif',
    'passada-a-frente-com-halteres.gif',
    'passada-com-halteres.gif',
    'retrocesso-com-barra.gif',
    'retrocesso-com-halteres.gif',
  ],
  'Ombro': [
    'circulos-de-braco-com-pesos.gif',
    'crucifixo-inverso-unilateral-com-cabo.gif',
    'desenvolvimento-arnold-com-um-braco.gif',
    'desenvolvimento-arnold-metade.gif',
    'desenvolvimento-arnold.gif',
    'desenvolvimento-cubano-com-halteres.gif',
    'desenvolvimento-cubano-sentado-com-halteres.gif',
    'desenvolvimento-de-ombro-alternada-em-pe-com-halteres.gif',
    'desenvolvimento-de-ombro-com-barra-sentado.gif',
    'desenvolvimento-de-ombro-com-cabo-ajoelhado.gif',
    'desenvolvimento-de-ombro-com-cabo.gif',
    'desenvolvimento-de-ombro-com-halteres-em-forma-de-w.gif',
    'desenvolvimento-de-ombro-com-halteres-em-z.gif',
    'desenvolvimento-de-ombro-deitado.gif',
    'desenvolvimento-de-ombro-na-maquina-pegada-martelo.gif',
    'desenvolvimento-de-ombro-na-maquina.gif',
    'desenvolvimento-de-ombro-no-banco-com-halteres.gif',
    'desenvolvimento-de-ombro-reversa-na-maquina.gif',
    'desenvolvimento-de-ombro-unilateral-com-halter.gif',
    'desenvolvimento-de-ombros-atras-da-cabeca-na-maquina-smith.gif',
    'desenvolvimento-de-ombros-atras-do-pescoco-sentado.gif',
    'desenvolvimento-de-ombros-com-barra-w-com-pegada-invertida.gif',
    'desenvolvimento-de-ombros-com-halteres-em-pe-com-pegada-neutra.gif',
    'desenvolvimento-de-ombros-com-rotacao-alternada-com-halteres.gif',
    'desenvolvimento-de-ombros-na-maquina-smith.gif',
    'desenvolvimento-de-ombros-na-maquina.gif',
    'desenvolvimento-militar-com-barra-no-chao-ajoelhado.gif',
    'desenvolvimento-militar-com-barra.gif',
    'desenvolvimento-militar-com-pegada-fechada.gif',
    'desenvolvimento-militar-de-uma-mao-com-kettlebell.gif',
    'desenvolvimento-militar-em-pe-na-maquina-smith.gif',
    'desenvolvimento-militar-inclinado-com-barra-presa-no-chao.gif',
    'elevacao-frontal-alternada-com-halteres.gif',
    'elevacao-frontal-com-barra-girando.gif',
    'elevacao-frontal-com-barra-w-inclinada.gif',
    'elevacao-frontal-com-cabo-duplo-no-cross.gif',
    'elevacao-frontal-com-dois-bracos-com-halteres.gif',
    'elevacao-frontal-com-halteres-sentado.gif',
    'elevacao-frontal-com-halteres.gif',
    'elevacao-lateral-alternada-com-halteres.gif',
    'elevacao-lateral-com-barra-no-chao.gif',
    'elevacao-lateral-com-braco-flexionado.gif',
    'elevacao-lateral-com-halteres-com-apoio-no-peito.gif',
    'elevacao-lateral-com-halteres-para-deltoides-posteriores-deitado.gif',
    'elevacao-lateral-com-halteres-sentado.gif',
    'elevacao-lateral-com-tronco-inclinado.gif',
    'elevacao-lateral-cruzada-no-crossover.gif',
    'elevacao-lateral-de-bracos-com-cabo.gif',
    'elevacao-lateral-de-bracos-com-halteres.gif',
    'elevacao-lateral-de-halteres-inclinada.gif',
    'elevacao-lateral-deitado.gif',
    'elevacao-lateral-e-frontal-com-halteres.gif',
    'elevacao-lateral-na-maquina.gif',
    'elevacao-lateral-unilateral-com-cabo.gif',
    'elevacao-lateral-unilateral-com-haltere-inclinado.gif',
    'elevacao-lateral-unilateral-com-halteres.gif',
    'elevacao-posterior-unilateral-com-halteres-em-decubito-prono.gif',
    'elevacoes-frontais-com-halteres-apoiadas-no-peito.gif',
    'levantamento-de-halteres-de-3-maneiras.gif',
    'levantamento-de-halteres-de-4-maneiras-2.gif',
    'levantamento-frontal-alternado-com-haltere-sentado.gif',
    'levantamento-frontal-com-anilha.gif',
    'levantamento-frontal-com-barra.gif',
    'levantamento-frontal-de-cabo-com-dois-bracos.gif',
    'levantamento-frontal-unilateral-com-cabo.gif',
    'maquina-de-elevacao-lateral.gif',
    'remada-com-halteres-para-a-posterior-de-ombros.gif',
    'remada-de-deltoide-posterior-sentado-com-haltere.gif',
    'remada-inclinada-a-45-graus.gif',
    'remada-inversa-com-cabos-deitado.gif',
    'remada-lateral-com-halteres-sentado.gif',
    'voador-invertido.gif',
    'voador-para-deltoides-posterior-com-cabo.gif',
  ],
  'Biceps': [
    'maquina-de-rosca-direta.gif',
    'rosca-alternada-com-barra.gif',
    'rosca-alternada-com-halteres-sentado.gif',
    'rosca-biceps-alta-com-halteres.gif',
    'rosca-biceps-com-cabo-ajoelhado.gif',
    'rosca-biceps-com-halteres.gif',
    'rosca-biceps-com-pegada-fechada-na-barra-w.gif',
    'rosca-biceps-inclinada-com-cabos.gif',
    'rosca-biceps-inclinada-com-halteres-sentado.gif',
    'rosca-biceps-sentado.gif',
    'rosca-biceps-unilateral-com-pegada-invertida-em-cabo.gif',
    'rosca-biceps-unilateral-no-cabo-alto.gif',
    'rosca-biceps-unilateral.gif',
    'rosca-bilateral-com-cabo-em-banco-inclinado.gif',
    'rosca-com-barra.gif',
    'rosca-com-cabo-de-um-braco.gif',
    'rosca-com-halteres-no-colete-scott.gif',
    'rosca-com-halteres.gif',
    'rosca-com-polia-alta.gif',
    'rosca-concentrada-com-cabo.gif',
    'rosca-concentrada-com-pegada-fechada-sentado.gif',
    'rosca-concentrada-unilateral-com-cabo.gif',
    'rosca-concentrada.gif',
    'rosca-de-biceps-com-alavanca.gif',
    'rosca-de-biceps-com-halteres-no-banco-scott.gif',
    'rosca-de-biceps-com-puxada-de-cabo.gif',
    'rosca-direta-com-barra-deitado-em-banco-alto.gif',
    'rosca-direta-com-barra-em-pegada-fechada.gif',
    'rosca-direta-com-barra-no-colete-scott.gif',
    'rosca-direta-com-barra-w.gif',
    'rosca-direta-com-barra.gif',
    'rosca-direta-com-cabo-deitado.gif',
    'rosca-inversa-com-barra-w.gif',
    'rosca-inversa-com-halteres.gif',
    'rosca-martelo-com-corda.gif',
    'rosca-martelo-com-halter-no-colete-scott.gif',
    'rosca-martelo-com-halteres-no-banco-scott.gif',
    'rosca-martelo-sentada.gif',
    'rosca-martelo.gif',
    'rosca-no-cabo.gif',
    'rosca-pronada-no-banco-inclinado.gif',
    'rosca-scott-alternados-com-halteres.gif',
    'rosca-scott-com-alavanca.gif',
    'rosca-scott-com-barra-w.gif',
    'rosca-scott-com-halteres-martelo-no-banco.gif',
    'rosca-scott-com-halteres.gif',
    'rosca-scott-unilateral-com-halteres.gif',
    'rosca-spider-com-unico-haltere.gif',
    'rosca-spider-unilateral.gif',
    'rosca-unilateral-com-cabo.gif',
    'rosca-zottman.gif',
  ],
  'Triceps': [
    'apoio-de-frente-diamante.gif',
    'apoio-de-frente-pegada-fechada-parede.gif',
    'apoio-de-frente-pegada-fechada.gif',
    'supino-declinado-pegada-fechada.gif',
    'supino-reto-fechado-com-halteres.gif',
    'supino-reto-pegada-fechada.gif',
    'triceps-apoaiado-na-pareda.gif',
    'triceps-coice-com-cabo.gif',
    'triceps-coice-com-halteres.gif',
    'triceps-coice-em-pe.gif',
    'triceps-coice-inclinado-no-cross-bilateral.gif',
    'triceps-coice-na-polia-media.gif',
    'triceps-coice-pegada-pronada-unil-na-polia-baixa.gif',
    'triceps-coice-unil-com-halter.gif',
    'triceps-coice-unil-inclinado-com-halter.gif',
    'triceps-coice-unil-no-banco.gif',
    'triceps-com-halter-no-banco.gif',
    'triceps-frances-alternada-com-halteres-no-banco-inclinado.gif',
    'triceps-frances-barra-w.gif',
    'triceps-frances-com-halter-bilateral.gif',
    'triceps-frances-com-halteres.gif',
    'triceps-frances-na-polia-baixagif.gif',
    'triceps-frances-na-polia-com-corda.gif',
    'triceps-frances-no-banco-inclinado-com-halter.gif',
    'triceps-frances-unil-na-polia-baixa.gif',
    'triceps-frances-unilateral-deitado-no-banco.gif',
    'triceps-mergulho-maquina.gif',
    'triceps-mergulho-no-banco-m.gif',
    'triceps-mergulho-no-banco.gif',
    'triceps-na-polia-deitado-no-banco-reto.gif',
    'triceps-no-aparelho-scort.gif',
    'triceps-no-banco.gif',
    'triceps-paralela.gif',
    'triceps-pulley-barra-v.gif',
    'triceps-pulley-barra.gif',
    'triceps-pulley-corda.gif',
    'triceps-pulley-pegada-invertida.gif',
    'triceps-pulley-unilateral.gif',
    'triceps-testa-com-banco-declinado-com-halteres.gif',
    'triceps-testa-com-barra-pegada-invertida.gif',
    'triceps-testa-com-barra.gif',
    'triceps-testa-com-halter-deitada-no-chao.gif',
    'triceps-testa-deitado-com-halter.gif',
    'triceps-testa-pegada-neutra-com-halteres.gif',
    'triceps-testa-unil-deitado-no-banco.gif',
    'triceps-unil-pegada-supinada.gif',
    'triceps-unilateral-90g-deitado-no-banco-reto.gif',
  ],
  'GluteoS': [
    'abducao-de-quadril-com-cabo.gif',
    'abducao-de-quadril-com-ponte.gif',
    'abducao-lateral-do-quadril-com-alavanca.gif',
    'agachamento-na-maquina-abdutora.gif',
    'elevacao-pelvica-com-banda-de-resistencia.gif',
    'elevacao-pelvica-com-barra-declinado.gif',
    'elevacao-pelvica-com-barra.gif',
    'elevacao-pelvica-na-maquina-de-extensao-de-pernas.gif',
    'elevacao-pelvica-na-maquina-smith.gif',
    'elevacao-pelvica-na-maquina.gif',
    'elevacao-pelvica-unilateral-com-barra.gif',
    'extensao-de-perna-na-maquina-smith-reversa.gif',
    'extensao-de-quadril-com-cabo.gif',
    'extensao-de-quadril-em-pe-com-alavanca.gif',
    'gluteo-coice-na-alavanca.gif',
    'gluteo-coice-na-maquina-de-extensao-de-pernas.gif',
    'gluteo-coice-na-maquina.gif',
    'gluteo-coice-no-smith.gif',
    'gluteos-coice-nilateral-polia-baixa.gif',
    'levantamento-terra-com-barra.gif',
    'maquina-de-abducao-de-quadril.gif',
    'ponte-com-halteres.gif',
    'puxada-de-cabo-ajoelhada.gif',
    'stiff-com-barra.gif',
    'stiff-com-halteres.gif',
    'stiff-no-smth-unilateral.gif',
    'stiff-no-smth.gif',
    'stiff-unil-com-medball.gif',
    'stiff-unilateral-com-kettibel.gif',
    'stiff-unilateral.gif',
    'stiff.gif',
  ],
  'Panturrilha': [
    'agachamento-com-sustentacao-e-elevacao-de-panturrilhas.gif',
    'elevacao-de-panturrilha-com-barra-em-pe.gif',
    'elevacao-de-panturrilha-com-uma-perna-na-maquina-hack.gif',
    'elevacao-de-panturrilha-em-maquina-em-pe.gif',
    'elevacao-de-panturrilha-no-leg-press-horizontal.gif',
    'elevacao-de-panturrilha-no-leg-press.gif',
    'elevacao-de-panturrilha-sentado-com-alavanca.gif',
    'elevacao-de-panturrilha-sentado-com-barra.gif',
    'elevacao-de-panturrilha-sentado-com-peso.gif',
    'elevacao-de-panturrilhas-no-hack.gif',
    'elevacao-de-panturrilhas.gif',
    'elevacao-unilateral-de-panturrilha-no-leg-press.gif',
    'flexao-plantar-com-peso-corporal.gif',
    'flexao-plantar-maquina.gif',
    'flexao-plantar-no-smith.gif',
    'levantamento-de-panturrilha-com-alavanca.gif',
    'levantamento-de-panturrilha-com-apoio-de-banco.gif',
    'levantamento-de-panturrilha-com-apoio-de-uma-perna.gif',
    'levantamento-de-panturrilha-com-apoio-e-sobrecarga.gif',
    'panturrinha-no-leg-press.gif',
  ],
  'Trapezio': [
    'encolhimento-livre-com-halteres.gif',
    'encolhimento-maquina.gif',
    'encolhimento-na-barra-livre.gif',
    'encolhimento-no-smith.gif',
    'encolhimento-pegada-fechada-barra-no-cross.gif',
    'encolhimento-sentado-no-banco-com-halteres.gif',
    'encolhimento-sentado-no-banco-inlinado-com-halteres.gif',
    'remada-alta-com-halteres.gif',
    'remada-alta-pegada-abeta-com-barra.gif',
  ],
  'Antebraco': [
    'antebracos.gif',
    'flexao-de-pulso-neutra-sentado-com-halteres.gif',
    'flexao-de-punho-com-cabo-em-um-braco-no-chao.gif',
    'flexao-de-punho-com-halteres.gif',
    'flexao-de-punho-reversa-com-anilha.gif',
    'flexao-de-punho-reversa-com-barra-sobre-um-banco.gif',
    'hand-grip.gif',
    'rolinho-de-antebraco.gif',
    'rosca-de-dedo-com-barra.gif',
    'rosca-de-dedos-com-halteres.gif',
    'rosca-de-punho-com-barra-atras-das-costas.gif',
    'rosca-de-punho-com-barra.gif',
    'rosca-de-punho-pegada-neutra-com-anilhas.gif',
    'rosca-de-punho-reversa-com-barra.gif',
    'rosca-inversa-com-barra.gif',
  ],
  'Cardio': [
    'airbike.gif',
    'bicicleta-ergometrica-reclinada.gif',
    'bike.gif',
    'caminhada-rapida-corrida-leve.gif',
    'corrida-na-bicicleta-ergometrica.gif',
    'esteira-com-inclinacao.gif',
    'esteira-ergometrica.gif',
    'hands-bike.gif',
    'maquina-de-caminhada-ondulatorio.gif',
    'maquina-eliptica.gif',
    'maquina-simulador-escada.gif',
    'plataforma-vibratoria.gif',
  ],
  // NOTA: Pastas de Mobilidade, Calistenia, Crossfit, Treinamento Funcional e Eretores foram removidas
  // Se precisar adicionar de volta, criar as pastas correspondentes
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
    // Se a lista estiver vazia, pular (será verificado por keywords depois)
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
 * Mapeamento de sinônimos comuns para melhorar matching
 */
const synonymMap: Record<string, string[]> = {
  'carga': ['sobrecarga', 'peso'],
  'sobrecarga': ['carga', 'peso'],
  'peso': ['carga', 'sobrecarga'],
  'halter': ['halteres', 'dumbbell'],
  'halteres': ['halter', 'dumbbell'],
  'barra': ['barbell'],
  'barbell': ['barra'],
};

/**
 * Expande sinônimos em uma string normalizada
 */
function expandSynonyms(normalized: string): string[] {
  const variations = [normalized];
  const words = normalized.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (synonymMap[word]) {
      for (const synonym of synonymMap[word]) {
        const newWords = [...words];
        newWords[i] = synonym;
        variations.push(newWords.join(' '));
      }
    }
  }

  return variations;
}

/**
 * Normaliza caminho de GIF de forma robusta e consistente
 * Remove acentos, converte para minúsculas, substitui espaços por hífens
 * Remove parênteses e caracteres especiais
 * Garante compatibilidade com URLs e sistema de arquivos
 * 
 * IMPORTANTE: Esta função deve ser usada SEMPRE antes de construir caminhos de GIFs
 * 
 * @param path - Caminho do GIF (pode ser parcial ou completo)
 * @returns Caminho normalizado no formato /gifs/pasta/arquivo.gif
 */
export function normalizeGifPath(path: string): string {
  if (!path) return path;

  // Se já estiver codificado, decodificar primeiro
  let cleaned = path;
  try {
    if (path.includes('%')) {
      cleaned = decodeURIComponent(path);
    }
  } catch (e) {
    // Se falhar na decodificação, usar o caminho original
    cleaned = path;
  }

  // Dividir o caminho em segmentos
  const segments = cleaned.split('/').filter(s => s.length > 0);
  const prefix = cleaned.startsWith('/') ? '/' : '';

  const normalizedSegments = segments.map(segment => {
    // Se tiver extensão, preservar
    if (segment.includes('.')) {
      const parts = segment.split('.');
      const name = parts.slice(0, -1).join('.');
      const ext = parts[parts.length - 1];

      // Normalizar nome do arquivo
      const normalizedName = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, '-') // Espaços para hífen
        .replace(/[()]/g, '') // Remove parênteses
        .replace(/[^\w\-.]/g, '') // Remove caracteres especiais (manter letras, números, hífen e ponto)
        .replace(/-+/g, '-') // Múltiplos hífens para um
        .replace(/^-|-$/g, ''); // Remove hífens no início/fim

      return normalizedName + '.' + ext.toLowerCase();
    }

    // Normalizar nome da pasta
    return segment
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '-') // Espaços para hífen
      .replace(/[()]/g, '') // Remove parênteses
      .replace(/[^\w\-.]/g, '') // Remove caracteres especiais
      .replace(/-+/g, '-') // Múltiplos hífens para um
      .replace(/^-|-$/g, ''); // Remove hífens no início/fim
  });

  // Garantir que comece com /gifs/ (minúsculo para compatibilidade com arquivos reais)
  let result = prefix + normalizedSegments.join('/');
  if (!result.startsWith('/gifs/') && !result.startsWith('/GIFS/')) {
    if (result.startsWith('/')) {
      result = '/gifs' + result.substring(1);
    } else {
      result = '/gifs/' + result;
    }
  }

  // Converter /GIFS/ para /gifs/ (minúsculo) para compatibilidade com arquivos reais
  result = result.replace(/^\/GIFS\//i, '/gifs/');

  return result;
}

/**
 * Limpa e padroniza o caminho do GIF (função legada - usa normalizeGifPath internamente)
 * @deprecated Use normalizeGifPath diretamente
 */
function cleanGifPath(path: string): string {
  return normalizeGifPath(path);
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
    const cached = gifCache.get(cacheKey);
    // Debug para Prancha
    if (exerciseName.toLowerCase().includes('prancha')) {
      // console.log('🔍 [CACHE] Prancha encontrado no cache:', cached);
    }
    return cached || null;
  }

  const normalized = normalizeText(exerciseName);
  let result: string | null = null;

  // 1. Buscar por grupo muscular
  const muscleGroup = findMuscleGroup(exerciseName);

  if (muscleGroup) {
    const availableGifs = availableGifsByGroup[muscleGroup];

    // Debug: verificar se o grupo foi encontrado
    if (!availableGifs && import.meta.env.DEV) {
      console.warn(`[getExerciseGif] ⚠️ Grupo "${muscleGroup}" encontrado mas não há GIFs disponíveis. Grupos disponíveis:`, Object.keys(availableGifsByGroup));
    }
    if (availableGifs && availableGifs.length > 0) {
      // 0. PRIMEIRO: Tentar match direto sem normalização (caso o nome já seja exato)
      const directMatch = availableGifs.find(gif => {
        const gifNameWithoutExt = gif.replace(/\.gif$/i, '');
        return gifNameWithoutExt === exerciseName;
      });

      if (directMatch) {
        const normalizedFolder = normalizeFolderName(muscleGroup);
        // Codificar nome do arquivo para garantir compatibilidade com Vercel (espaços e acentos)
        const encodedFileName = encodeURIComponent(directMatch);
        result = `/GIFS/${normalizedFolder}/${encodedFileName}`;
        gifCache.set(cacheKey, result);
        return result;
      }

      // 1. SEGUNDO: Tentar encontrar match exato (ignorando case e acentos)
      const exactMatch = availableGifs.find(gif => {
        const gifNameNormalized = normalizeText(gif.replace('.gif', ''));
        const matches = gifNameNormalized === normalized;
        return matches;
      });

      if (exactMatch) {
        // IMPORTANTE: Usar o nome exato do arquivo como está na lista
        // O Vite dev server trata corretamente arquivos com acentos e espaços
        // Não é necessário usar encodeURIComponent - isso causava erros 404
        const normalizedFolder = normalizeFolderName(muscleGroup);
        // Construir caminho completo: /GIFS/pasta/arquivo.gif
        // Codificar nome do arquivo para garantir compatibilidade com Vercel (espaços e acentos)
        const encodedFileName = encodeURIComponent(exactMatch);
        result = `/GIFS/${normalizedFolder}/${encodedFileName}`;

        gifCache.set(cacheKey, result);
        return result;
      }

      // 3. SEGUNDO: Tentar encontrar match parcial (nome do exercício contém no nome do GIF ou vice-versa)
      // Também tentar com sinônimos expandidos
      const normalizedVariations = expandSynonyms(normalized);
      const partialMatch = availableGifs.find(gif => {
        const gifNameNormalized = normalizeText(gif.replace('.gif', ''));
        // Verificar match direto
        if (gifNameNormalized.includes(normalized) || normalized.includes(gifNameNormalized)) {
          if (import.meta.env.DEV && exerciseName.toLowerCase().includes('carga')) {
            console.log('[getExerciseGif] ✅ Match parcial direto encontrado:', {
              exerciseName,
              normalized,
              gif,
              gifNameNormalized
            });
          }
          return true;
        }
        // Verificar com sinônimos
        for (const variation of normalizedVariations) {
          if (gifNameNormalized.includes(variation) || variation.includes(gifNameNormalized)) {
            if (import.meta.env.DEV && exerciseName.toLowerCase().includes('carga')) {
              console.log('[getExerciseGif] ✅ Match parcial com sinônimo encontrado:', {
                exerciseName,
                normalized,
                variation,
                gif,
                gifNameNormalized
              });
            }
            return true;
          }
        }
        return false;
      });

      if (partialMatch) {
        // Usar o nome exato do arquivo
        const normalizedFolder = normalizeFolderName(muscleGroup);
        // Codificar nome do arquivo para garantir compatibilidade com Vercel (espaços e acentos)
        const encodedFileName = encodeURIComponent(partialMatch);
        result = `/GIFS/${normalizedFolder}/${encodedFileName}`;
        if (import.meta.env.DEV && exerciseName.toLowerCase().includes('carga')) {
          console.log('[getExerciseGif] ✅ Caminho gerado via match parcial:', result);
        }
        gifCache.set(cacheKey, result);
        return result;
      }

      // 4. TERCEIRO: Buscar por palavras-chave principais (ex: "Abd Concentrado" deve encontrar "Abd Concentrado Braços estendidos")
      const exerciseWords = normalized.split(/\s+/).filter(w => w.length > 2); // Palavras com mais de 2 caracteres
      if (exerciseWords.length > 0) {
        const keywordMatch = availableGifs.find(gif => {
          const gifNameNormalized = normalizeText(gif.replace('.gif', ''));
          // Verificar se todas as palavras principais estão no nome do GIF (com sinônimos)
          const allWordsMatch = exerciseWords.every(word => {
            if (gifNameNormalized.includes(word)) return true;
            // Verificar sinônimos
            if (synonymMap[word]) {
              return synonymMap[word].some(synonym => gifNameNormalized.includes(synonym));
            }
            return false;
          });
          // Ou se o nome do GIF contém o nome do exercício
          if (allWordsMatch) return true;
          if (gifNameNormalized.includes(normalized)) return true;
          // Verificar com sinônimos expandidos
          for (const variation of normalizedVariations) {
            if (gifNameNormalized.includes(variation)) return true;
          }
          return false;
        });

        if (keywordMatch) {
          // Usar o nome exato do arquivo
          const encodedFileName = encodeURIComponent(keywordMatch);
          // NOVA ESTRUTURA: pastas são diretas
          const normalizedFolder = normalizeFolderName(muscleGroup);
          result = `/gifs/${normalizedFolder}/${encodedFileName}`;
          gifCache.set(cacheKey, result);
          return result;
        }
      }

      // 5. QUARTO: Tentar encontrar GIF similar por similaridade de nome
      const similarGif = findSimilarGif(normalized, muscleGroup, 0.3); // Reduzido threshold para 0.3
      if (similarGif) {
        // Usar o nome exato do arquivo
        const encodedFileName = encodeURIComponent(similarGif);
        // NOVA ESTRUTURA: pastas são diretas
        const normalizedFolder = normalizeFolderName(muscleGroup);
        result = `/gifs/${normalizedFolder}/${encodedFileName}`;
        // Armazenar no cache
        gifCache.set(cacheKey, result);
        return result;
      }

      // 6. ÚLTIMO: Se não encontrou similar, tentar retornar um GIF genérico do grupo
      // Retornar o primeiro GIF do grupo como fallback genérico
      const encodedFileName = encodeURIComponent(availableGifs[0]);
      // NOVA ESTRUTURA: pastas são diretas
      const normalizedFolder = normalizeFolderName(muscleGroup);
      result = `/gifs/${normalizedFolder}/${encodedFileName}`;
      gifCache.set(cacheKey, result);
      return result;
    }
  }

  // Armazenar null no cache para evitar buscas repetidas
  if (import.meta.env.DEV) {
    console.warn(`[getExerciseGif] ❌ GIF não encontrado para: "${exerciseName}"`, {
      normalized,
      muscleGroup: muscleGroup || 'NÃO ENCONTRADO',
      availableGifsCount: muscleGroup ? availableGifsByGroup[muscleGroup]?.length || 0 : 0,
    });
  }
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
 * Usa normalizeGifPath para garantir consistência
 */
export function getGifUrl(folder: string, filename: string): string {
  // Normalizar sempre usando normalizeGifPath
  const normalizedFolder = normalizeGifPath(folder);
  const normalizedFilename = normalizeGifPath(filename);
  // Extrair apenas o nome do arquivo (último segmento)
  const fileName = normalizedFilename.split('/').pop() || normalizedFilename;
  const rawPath = `${normalizedFolder}/${fileName}`;
  return normalizeGifPath(rawPath);
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
  console.log('[getAvailableExercisesByGroup] ⚡ Função chamada');
  const grouped: Record<string, string[]> = {};

  // Mapeamento de pastas para nomes de grupos limpos
  // ATUALIZADO: Nova estrutura simplificada
  const groupNameMap: Record<string, string> = {
    // Nova estrutura - pastas diretas
    'Abdomen': 'Abdômen',
    'Antebraco': 'Antebraço',
    'Biceps': 'Bíceps',
    'Cardio': 'Cárdio',
    'Costas': 'Costas',
    'GluteoS': 'Glúteo', // Note: pasta tem "S" maiúsculo
    'Ombro': 'Ombro',
    'Panturrilha': 'Panturrilha',
    'Peitoral': 'Peitoral',
    'Pernas': 'Pernas',
    'Trapezio': 'Trapézio',
    'Triceps': 'Tríceps',

    // Compatibilidade com nomes antigos (caso ainda existam referências)
    'abdomen-18-20241202t155424z-001/abdomen-18': 'Abdômen',
    'antebraco-15-20241202t155453z-001/antebraco-15': 'Antebraço',
    'biceps-51-20241202t155806z-001/biceps-51': 'Bíceps',
    'cardio-academia-11-20241202t161427z-001/cardio-academia-11': 'Cárdio',
    'costas-60-20241202t162754z-001/costas-60': 'Costas',
    'gluteo-31-20241202t165017z-001/gluteo-31': 'Glúteo',
    'ombro-73-20241202t165511z-001/ombro-73': 'Ombro',
    'panturrilha-20-20241202t173337z-001/panturrilha-20': 'Panturrilha',
    'peitoral-67-20241202t175211z-001/peitoral-67': 'Peitoral',
    'pernas-70-20241202t181042z-001/pernas-70': 'Pernas',
    'trapezio-9-20241202t183753z-001/trapezio-9': 'Trapézio',
    'triceps-47-20241202t183816z-001/triceps-47': 'Tríceps',
  };

  // Usar Set para evitar duplicatas dentro de cada grupo
  const groupedSets: Record<string, Set<string>> = {};
  const unmappedFolders: string[] = [];

  const totalFolders = Object.keys(availableGifsByGroup).length;
  console.log(`[getAvailableExercisesByGroup] 📁 Total de pastas no availableGifsByGroup: ${totalFolders}`);
  console.log(`[getAvailableExercisesByGroup] 📁 Pastas:`, Object.keys(availableGifsByGroup));

  for (const [folder, gifs] of Object.entries(availableGifsByGroup)) {
    // Usar mapeamento para obter nome limpo do grupo
    let groupName = groupNameMap[folder];

    // Se não encontrou no mapeamento, tentar inferir do nome da pasta
    if (!groupName) {
      // Tentar extrair nome do grupo da pasta
      const folderParts = folder.split('/');
      const firstPart = folderParts[0] || folderParts[folderParts.length - 1];

      // Remover timestamps e normalizar
      groupName = firstPart
        .replace(/-20241202t\d+z-\d+/gi, '')
        .replace(/^GIFS\s+/i, '')
        .replace(/\s+\(.*?\)/g, '')
        .trim();

      // Normalizar nomes conhecidos - ATUALIZADO para nova estrutura
      const lowerName = groupName.toLowerCase();
      if (lowerName === 'abdomen' || lowerName.includes('abdomen')) groupName = 'Abdômen';
      else if (lowerName === 'antebraco' || lowerName.includes('antebraco')) groupName = 'Antebraço';
      else if (lowerName === 'biceps' || lowerName.includes('biceps')) groupName = 'Bíceps';
      else if (lowerName === 'cardio' || lowerName.includes('cardio')) groupName = 'Cárdio';
      else if (lowerName === 'costas' || lowerName.includes('costas')) groupName = 'Costas';
      else if (lowerName === 'gluteos' || lowerName === 'gluteo' || lowerName.includes('gluteo')) groupName = 'Glúteo';
      else if (lowerName === 'ombro' || lowerName.includes('ombro')) groupName = 'Ombro';
      else if (lowerName === 'panturrilha' || lowerName.includes('panturrilha')) groupName = 'Panturrilha';
      else if (lowerName === 'peitoral' || lowerName.includes('peitoral')) groupName = 'Peitoral';
      else if (lowerName === 'pernas' || lowerName.includes('pernas')) groupName = 'Pernas';
      else if (lowerName === 'trapezio' || lowerName.includes('trapezio')) groupName = 'Trapézio';
      else if (lowerName === 'triceps' || lowerName.includes('triceps')) groupName = 'Tríceps';

      if (import.meta.env.DEV && !groupNameMap[folder]) {
        unmappedFolders.push(folder);
      }
    }

    const exercises = gifs.map(gif => gif.replace(/\.gif$/i, '').trim()).filter(ex => ex.length > 0);

    // Se o groupName ainda estiver vazio ou inválido após inferência, usar o nome da pasta como fallback
    if (!groupName || groupName.trim() === '') {
      const folderParts = folder.split('/');
      groupName = folderParts[folderParts.length - 1] || folderParts[0] || folder;
      // Limpar o nome
      groupName = groupName
        .replace(/-20241202t\d+z-\d+/gi, '')
        .replace(/^GIFS\s+/i, '')
        .replace(/\s+\(.*?\)/g, '')
        .trim();

      if (import.meta.env.DEV) {
        console.warn(`[getAvailableExercisesByGroup] ⚠️ Grupo sem nome válido, usando fallback: "${groupName}" para pasta: "${folder}"`);
      }
    }

    if (!groupedSets[groupName]) {
      groupedSets[groupName] = new Set<string>();
    }

    // Adicionar todos os exercícios ao Set (remove duplicatas automaticamente)
    let addedCount = 0;
    let skippedCount = 0;
    exercises.forEach(ex => {
      if (ex && ex.length > 0) {
        const beforeSize = groupedSets[groupName].size;
        groupedSets[groupName].add(ex);
        const afterSize = groupedSets[groupName].size;
        if (afterSize > beforeSize) {
          addedCount++;
        } else {
          skippedCount++;
        }
      }
    });

    if (import.meta.env.DEV && exercises.length > 0) {
      console.log(`[getAvailableExercisesByGroup] Processando pasta "${folder}" -> grupo "${groupName}": ${exercises.length} exercícios (adicionados: ${addedCount}, duplicatas ignoradas: ${skippedCount}, total no grupo: ${groupedSets[groupName].size})`);
    }
  }

  // Avisar sobre pastas não mapeadas em desenvolvimento
  if (import.meta.env.DEV && unmappedFolders.length > 0) {
    console.warn('[getAvailableExercisesByGroup] Pastas não mapeadas (usando inferência):', unmappedFolders);
  }

  // Converter Sets de volta para arrays e ordenar
  for (const [groupName, exerciseSet] of Object.entries(groupedSets)) {
    const exerciseArray = Array.from(exerciseSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    grouped[groupName] = exerciseArray;

    if (import.meta.env.DEV) {
      console.log(`[getAvailableExercisesByGroup] Grupo final "${groupName}": ${exerciseArray.length} exercícios únicos`);
    }
  }

  // Debug: contar total de exercícios (sempre executar)
  const totalExercises = Object.values(grouped).reduce((sum, exercises) => sum + exercises.length, 0);
  const totalGifsInSource = Object.values(availableGifsByGroup).reduce((sum, gifs) => sum + gifs.length, 0);
  console.log(`[getAvailableExercisesByGroup] ✅ Total de exercícios únicos retornados: ${totalExercises}`);
  console.log(`[getAvailableExercisesByGroup] 📊 Total de GIFs no source (availableGifsByGroup): ${totalGifsInSource}`);
  console.log(`[getAvailableExercisesByGroup] 📊 Total de grupos no source: ${Object.keys(availableGifsByGroup).length}`);
  console.log(`[getAvailableExercisesByGroup] 📊 Total de grupos retornados: ${Object.keys(grouped).length}`);
  console.log(`[getAvailableExercisesByGroup] 📊 Pastas processadas: ${Object.keys(availableGifsByGroup).length}`);
  Object.entries(grouped).forEach(([group, exercises]) => {
    console.log(`[getAvailableExercisesByGroup] 📋 ${group}: ${exercises.length} exercícios`);
  });
  if (unmappedFolders.length > 0) {
    console.warn(`[getAvailableExercisesByGroup] ⚠️ ${unmappedFolders.length} pastas não mapeadas:`, unmappedFolders);
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

/**
 * Converte nome de arquivo normalizado para nome legível de exercício
 * Ex: "flexao-de-pulso-neutra-sentado-com-halteres" -> "Flexão de Pulso Neutra Sentado com Halteres"
 */
function denormalizeExerciseName(normalizedName: string): string {
  // Dividir por hífens
  const words = normalizedName.split('-');
  
  // Capitalizar primeira letra de cada palavra
  const capitalized = words.map(word => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
  
  // Juntar com espaços
  let result = capitalized.join(' ');
  
  // Restaurar acentos comuns (mapeamento básico)
  const accentMap: Record<string, string> = {
    'ao': 'ão',
    'oes': 'ões',
    'coes': 'ções',
    'aoes': 'ões',
  };
  
  // Aplicar mapeamento de acentos
  for (const [key, value] of Object.entries(accentMap)) {
    // Procurar padrões no final das palavras
    result = result.replace(new RegExp(`\\b(\\w+)${key}\\b`, 'gi'), (match, prefix) => {
      return prefix + value;
    });
  }
  
  // Correções específicas comuns
  result = result.replace(/\bFlexao\b/gi, 'Flexão');
  result = result.replace(/\bRosca\b/gi, 'Rosca');
  result = result.replace(/\bAntebraco\b/gi, 'Antebraço');
  result = result.replace(/\bAntebracos\b/gi, 'Antebraços');
  result = result.replace(/\bBraco\b/gi, 'Braço');
  result = result.replace(/\bBraco\b/gi, 'Braço');
  result = result.replace(/\bAtras\b/gi, 'Atrás');
  result = result.replace(/\bChao\b/gi, 'Chão');
  result = result.replace(/\bPunho\b/gi, 'Punho');
  result = result.replace(/\bPulso\b/gi, 'Pulso');
  result = result.replace(/\bHalteres\b/gi, 'Halteres');
  result = result.replace(/\bAnilhas\b/gi, 'Anilhas');
  result = result.replace(/\bBarra\b/gi, 'Barra');
  result = result.replace(/\bCabo\b/gi, 'Cabo');
  result = result.replace(/\bSentado\b/gi, 'Sentado');
  result = result.replace(/\bReversa\b/gi, 'Reversa');
  result = result.replace(/\bNeutra\b/gi, 'Neutra');
  result = result.replace(/\bPegada\b/gi, 'Pegada');
  result = result.replace(/\bBanco\b/gi, 'Banco');
  result = result.replace(/\bDedos\b/gi, 'Dedos');
  result = result.replace(/\bDedo\b/gi, 'Dedo');
  result = result.replace(/\bRolinho\b/gi, 'Rolinho');
  result = result.replace(/\bHand Grip\b/gi, 'Hand Grip');
  
  return result;
}

/**
 * Retorna lista completa de exercícios com caminhos de GIF já construídos
 * CONSTRÓI OS CAMINHOS DIRETAMENTE dos nomes dos arquivos, sem matching inteligente
 * Garante que TODOS os GIFs sejam encontrados
 * 
 * Esta é a solução definitiva para garantir que todos os GIFs apareçam corretamente
 */
export function getAvailableExercisesWithGifPaths(): ExerciseInfo[] {
  const exercises: ExerciseInfo[] = [];
  
  // Mapeamento de pastas para nomes de grupos limpos
  const groupNameMap: Record<string, string> = {
    'Abdomen': 'Abdômen',
    'Antebraco': 'Antebraço',
    'Biceps': 'Bíceps',
    'Cardio': 'Cárdio',
    'Costas': 'Costas',
    'GluteoS': 'Glúteo',
    'Ombro': 'Ombro',
    'Panturrilha': 'Panturrilha',
    'Peitoral': 'Peitoral',
    'Pernas': 'Pernas',
    'Trapezio': 'Trapézio',
    'Triceps': 'Tríceps',
  };
  
  // Iterar sobre todos os grupos de GIFs
  for (const [folder, gifs] of Object.entries(availableGifsByGroup)) {
    // Obter nome do grupo
    const groupName = groupNameMap[folder] || folder;
    
    // Normalizar nome da pasta (preservar case original)
    const normalizedFolder = normalizeFolderName(folder);
    
    // Para cada GIF, criar um exercício com caminho já construído
    for (const gifFileName of gifs) {
      // Remover extensão .gif para obter nome do exercício
      const fileNameWithoutExt = gifFileName.replace(/\.gif$/i, '').trim();
      
      // Detectar se o nome já está normalizado (com hífens) ou se tem espaços/acentos
      // Se tem espaços, usar diretamente; se tem hífens, denormalizar
      let exerciseName: string;
      if (fileNameWithoutExt.includes(' ')) {
        // Nome já tem espaços (ex: "Abdominais Oblíquos no Chão")
        // Capitalizar primeira letra de cada palavra
        exerciseName = fileNameWithoutExt
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        // Nome normalizado (ex: "flexao-de-pulso-neutra")
        // Converter para nome legível
        exerciseName = denormalizeExerciseName(fileNameWithoutExt);
      }
      
      // Construir caminho DIRETAMENTE: /GIFS/pasta/arquivo.gif
      // Codificar cada segmento separadamente para garantir compatibilidade com Vercel
      // Isso é necessário porque alguns arquivos têm espaços e acentos nos nomes
      const encodedFolder = encodeURIComponent(normalizedFolder).replace(/%2F/g, '/');
      const encodedFileName = encodeURIComponent(gifFileName);
      const gifPath = `/GIFS/${encodedFolder}/${encodedFileName}`;

      exercises.push({
        name: exerciseName,
        gifPath: gifPath,
        muscleGroup: groupName,
      });
    }
  }

  // Ordenar por nome
  const sorted = exercises.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  if (import.meta.env.DEV) {
    console.log(`[getAvailableExercisesWithGifPaths] ✅ Total de exercícios criados: ${sorted.length}`);
    const withGif = sorted.filter(ex => ex.gifPath).length;
    const withoutGif = sorted.filter(ex => !ex.gifPath).length;
    console.log(`[getAvailableExercisesWithGifPaths] 📊 Com GIF: ${withGif}, Sem GIF: ${withoutGif}`);
  }

  return sorted;
}


