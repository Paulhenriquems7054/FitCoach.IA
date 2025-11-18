
import type { User, GeminiMealPlanResponse, MealAnalysisResponse, Recipe, MealPlan, DailySummary } from "../types";
import { Goal } from "../types";
import { logger } from "../utils/logger";
export { generateWellnessPlanOffline } from "./wellnessOfflineService";

// Cache keys
const CACHE_PREFIX = 'nutria_cache_';
const MEAL_PLAN_CACHE_KEY = `${CACHE_PREFIX}meal_plan`;
const ANALYSIS_CACHE_KEY = `${CACHE_PREFIX}analysis_`;

// Banco de dados local de alimentos (valores nutricionais por 100g)
interface FoodDatabase {
  [key: string]: {
    calorias: number;
    proteinas_g: number;
    carboidratos_g: number;
    gorduras_g: number;
  };
}

const foodDatabase: FoodDatabase = {
  // Proteínas
  'peito de frango': { calorias: 165, proteinas_g: 31, carboidratos_g: 0, gorduras_g: 3.6 },
  'frango': { calorias: 165, proteinas_g: 31, carboidratos_g: 0, gorduras_g: 3.6 },
  'coxa de frango': { calorias: 180, proteinas_g: 27, carboidratos_g: 0, gorduras_g: 7 },
  'salmão': { calorias: 208, proteinas_g: 20, carboidratos_g: 0, gorduras_g: 13 },
  'peixe': { calorias: 206, proteinas_g: 22, carboidratos_g: 0, gorduras_g: 12 },
  'atum': { calorias: 144, proteinas_g: 23, carboidratos_g: 0, gorduras_g: 5 },
  'tilápia': { calorias: 128, proteinas_g: 26, carboidratos_g: 0, gorduras_g: 2.7 },
  'carne bovina': { calorias: 250, proteinas_g: 26, carboidratos_g: 0, gorduras_g: 15 },
  'carne magra': { calorias: 200, proteinas_g: 26, carboidratos_g: 0, gorduras_g: 8 },
  'patinho': { calorias: 200, proteinas_g: 26, carboidratos_g: 0, gorduras_g: 8 },
  'alcatra': { calorias: 230, proteinas_g: 25, carboidratos_g: 0, gorduras_g: 12 },
  'ovo': { calorias: 155, proteinas_g: 13, carboidratos_g: 1.1, gorduras_g: 11 },
  'ovo cozido': { calorias: 155, proteinas_g: 13, carboidratos_g: 1.1, gorduras_g: 11 },
  'ovo frito': { calorias: 196, proteinas_g: 13, carboidratos_g: 1.1, gorduras_g: 15 },
  'ovo mexido': { calorias: 196, proteinas_g: 13, carboidratos_g: 1.1, gorduras_g: 15 },
  'peito de peru': { calorias: 104, proteinas_g: 20, carboidratos_g: 0.5, gorduras_g: 1.5 },
  'linguiça': { calorias: 301, proteinas_g: 13, carboidratos_g: 2, gorduras_g: 26 },
  'bacon': { calorias: 541, proteinas_g: 37, carboidratos_g: 1.4, gorduras_g: 42 },
  'camarão': { calorias: 99, proteinas_g: 24, carboidratos_g: 0, gorduras_g: 0.3 },
  'siri': { calorias: 97, proteinas_g: 19, carboidratos_g: 0, gorduras_g: 1.5 },
  
  // Carboidratos
  'arroz integral': { calorias: 111, proteinas_g: 2.6, carboidratos_g: 23, gorduras_g: 0.9 },
  'arroz branco': { calorias: 130, proteinas_g: 2.7, carboidratos_g: 28, gorduras_g: 0.3 },
  'arroz': { calorias: 130, proteinas_g: 2.7, carboidratos_g: 28, gorduras_g: 0.3 },
  'macarrão': { calorias: 131, proteinas_g: 5, carboidratos_g: 25, gorduras_g: 1.1 },
  'espaguete': { calorias: 131, proteinas_g: 5, carboidratos_g: 25, gorduras_g: 1.1 },
  'batata doce': { calorias: 86, proteinas_g: 1.6, carboidratos_g: 20, gorduras_g: 0.1 },
  'batata inglesa': { calorias: 77, proteinas_g: 2, carboidratos_g: 17, gorduras_g: 0.1 },
  'batata': { calorias: 77, proteinas_g: 2, carboidratos_g: 17, gorduras_g: 0.1 },
  'batata frita': { calorias: 312, proteinas_g: 3.4, carboidratos_g: 41, gorduras_g: 15 },
  'mandioca': { calorias: 160, proteinas_g: 1.4, carboidratos_g: 38, gorduras_g: 0.3 },
  'aipim': { calorias: 160, proteinas_g: 1.4, carboidratos_g: 38, gorduras_g: 0.3 },
  'inhame': { calorias: 118, proteinas_g: 2, carboidratos_g: 28, gorduras_g: 0.2 },
  'milho': { calorias: 96, proteinas_g: 3.4, carboidratos_g: 21, gorduras_g: 1.2 },
  'pão integral': { calorias: 247, proteinas_g: 13, carboidratos_g: 41, gorduras_g: 4.2 },
  'pão branco': { calorias: 265, proteinas_g: 9, carboidratos_g: 49, gorduras_g: 3.2 },
  'pão': { calorias: 265, proteinas_g: 9, carboidratos_g: 49, gorduras_g: 3.2 },
  'pão de forma': { calorias: 253, proteinas_g: 8, carboidratos_g: 50, gorduras_g: 3.2 },
  'tapioca': { calorias: 160, proteinas_g: 0.2, carboidratos_g: 39, gorduras_g: 0 },
  'cuscuz': { calorias: 112, proteinas_g: 3.1, carboidratos_g: 25, gorduras_g: 0.4 },
  'aveia': { calorias: 389, proteinas_g: 17, carboidratos_g: 66, gorduras_g: 7 },
  'quinoa': { calorias: 368, proteinas_g: 14, carboidratos_g: 64, gorduras_g: 6 },
  'granola': { calorias: 471, proteinas_g: 10, carboidratos_g: 64, gorduras_g: 20 },
  
  // Leguminosas
  'feijão preto': { calorias: 132, proteinas_g: 8.7, carboidratos_g: 23.7, gorduras_g: 0.5 },
  'feijão carioca': { calorias: 77, proteinas_g: 4.8, carboidratos_g: 14, gorduras_g: 0.5 },
  'feijão': { calorias: 77, proteinas_g: 4.8, carboidratos_g: 14, gorduras_g: 0.5 },
  'feijão branco': { calorias: 62, proteinas_g: 4.8, carboidratos_g: 10, gorduras_g: 0.5 },
  'lentilha': { calorias: 116, proteinas_g: 9, carboidratos_g: 20, gorduras_g: 0.4 },
  'grão de bico': { calorias: 164, proteinas_g: 8.9, carboidratos_g: 27, gorduras_g: 2.6 },
  'ervilha': { calorias: 81, proteinas_g: 5.4, carboidratos_g: 14, gorduras_g: 0.4 },
  'soja': { calorias: 173, proteinas_g: 17, carboidratos_g: 10, gorduras_g: 9 },
  
  // Vegetais
  'salada verde': { calorias: 15, proteinas_g: 1.4, carboidratos_g: 2.9, gorduras_g: 0.2 },
  'alface': { calorias: 15, proteinas_g: 1.4, carboidratos_g: 2.9, gorduras_g: 0.2 },
  'tomate': { calorias: 18, proteinas_g: 0.9, carboidratos_g: 3.9, gorduras_g: 0.2 },
  'cenoura': { calorias: 41, proteinas_g: 0.9, carboidratos_g: 9.6, gorduras_g: 0.2 },
  'brócolis': { calorias: 25, proteinas_g: 2.8, carboidratos_g: 5.2, gorduras_g: 0.4 },
  'couve': { calorias: 27, proteinas_g: 2.9, carboidratos_g: 4.3, gorduras_g: 0.4 },
  'couve flor': { calorias: 25, proteinas_g: 1.9, carboidratos_g: 5, gorduras_g: 0.3 },
  'espinafre': { calorias: 23, proteinas_g: 2.9, carboidratos_g: 3.6, gorduras_g: 0.4 },
  'repolho': { calorias: 25, proteinas_g: 1.3, carboidratos_g: 5.8, gorduras_g: 0.1 },
  'chuchu': { calorias: 19, proteinas_g: 0.7, carboidratos_g: 4.1, gorduras_g: 0.1 },
  'abobrinha': { calorias: 17, proteinas_g: 1.2, carboidratos_g: 3.1, gorduras_g: 0.2 },
  'berinjela': { calorias: 25, proteinas_g: 1, carboidratos_g: 6, gorduras_g: 0.2 },
  'pimentão': { calorias: 31, proteinas_g: 1, carboidratos_g: 7, gorduras_g: 0.3 },
  'cebola': { calorias: 40, proteinas_g: 1.1, carboidratos_g: 9.3, gorduras_g: 0.1 },
  'alho': { calorias: 149, proteinas_g: 6.4, carboidratos_g: 33, gorduras_g: 0.5 },
  'pepino': { calorias: 16, proteinas_g: 0.7, carboidratos_g: 3.6, gorduras_g: 0.1 },
  'rabanete': { calorias: 16, proteinas_g: 0.7, carboidratos_g: 3.4, gorduras_g: 0.1 },
  'beterraba': { calorias: 43, proteinas_g: 1.6, carboidratos_g: 10, gorduras_g: 0.2 },
  'abóbora': { calorias: 26, proteinas_g: 1, carboidratos_g: 6.5, gorduras_g: 0.1 },
  'quiabo': { calorias: 33, proteinas_g: 2, carboidratos_g: 7, gorduras_g: 0.3 },
  
  // Frutas
  'banana': { calorias: 89, proteinas_g: 1.1, carboidratos_g: 23, gorduras_g: 0.3 },
  'maçã': { calorias: 52, proteinas_g: 0.3, carboidratos_g: 14, gorduras_g: 0.2 },
  'laranja': { calorias: 47, proteinas_g: 0.9, carboidratos_g: 12, gorduras_g: 0.1 },
  'mamão': { calorias: 43, proteinas_g: 0.5, carboidratos_g: 11, gorduras_g: 0.1 },
  'manga': { calorias: 60, proteinas_g: 0.8, carboidratos_g: 15, gorduras_g: 0.4 },
  'abacaxi': { calorias: 50, proteinas_g: 0.5, carboidratos_g: 13, gorduras_g: 0.1 },
  'melancia': { calorias: 30, proteinas_g: 0.6, carboidratos_g: 7.6, gorduras_g: 0.2 },
  'melão': { calorias: 34, proteinas_g: 0.8, carboidratos_g: 8.2, gorduras_g: 0.2 },
  'uva': { calorias: 69, proteinas_g: 0.7, carboidratos_g: 18, gorduras_g: 0.2 },
  'morango': { calorias: 32, proteinas_g: 0.7, carboidratos_g: 7.7, gorduras_g: 0.3 },
  'kiwi': { calorias: 61, proteinas_g: 1.1, carboidratos_g: 15, gorduras_g: 0.5 },
  'pera': { calorias: 57, proteinas_g: 0.4, carboidratos_g: 15, gorduras_g: 0.1 },
  'pêssego': { calorias: 39, proteinas_g: 0.9, carboidratos_g: 9.5, gorduras_g: 0.3 },
  'abacate': { calorias: 160, proteinas_g: 2, carboidratos_g: 9, gorduras_g: 15 },
  'açaí': { calorias: 58, proteinas_g: 0.8, carboidratos_g: 6, gorduras_g: 3.9 },
  'coco': { calorias: 354, proteinas_g: 3.3, carboidratos_g: 15, gorduras_g: 33 },
  'limão': { calorias: 29, proteinas_g: 1.1, carboidratos_g: 9, gorduras_g: 0.3 },
  'maracujá': { calorias: 68, proteinas_g: 2.2, carboidratos_g: 16, gorduras_g: 0.7 },
  'goiaba': { calorias: 68, proteinas_g: 2.6, carboidratos_g: 15, gorduras_g: 0.9 },
  
  // Laticínios
  'iogurte natural': { calorias: 59, proteinas_g: 10, carboidratos_g: 3.6, gorduras_g: 0.4 },
  'iogurte grego': { calorias: 59, proteinas_g: 10, carboidratos_g: 3.6, gorduras_g: 0.4 },
  'iogurte': { calorias: 59, proteinas_g: 10, carboidratos_g: 3.6, gorduras_g: 0.4 },
  'queijo cottage': { calorias: 98, proteinas_g: 11, carboidratos_g: 3.4, gorduras_g: 4.3 },
  'queijo minas': { calorias: 320, proteinas_g: 21, carboidratos_g: 3, gorduras_g: 24 },
  'queijo mussarela': { calorias: 300, proteinas_g: 22, carboidratos_g: 2, gorduras_g: 22 },
  'queijo': { calorias: 300, proteinas_g: 22, carboidratos_g: 2, gorduras_g: 22 },
  'requeijão': { calorias: 257, proteinas_g: 9.4, carboidratos_g: 3.5, gorduras_g: 23 },
  'leite': { calorias: 42, proteinas_g: 3.4, carboidratos_g: 5, gorduras_g: 1 },
  'leite desnatado': { calorias: 34, proteinas_g: 3.4, carboidratos_g: 5, gorduras_g: 0.1 },
  'leite integral': { calorias: 61, proteinas_g: 3.2, carboidratos_g: 4.7, gorduras_g: 3.2 },
  'manteiga': { calorias: 717, proteinas_g: 0.9, carboidratos_g: 0.1, gorduras_g: 81 },
  'margarina': { calorias: 717, proteinas_g: 0.2, carboidratos_g: 0.7, gorduras_g: 81 },
  
  // Oleaginosas e sementes
  'castanha do pará': { calorias: 659, proteinas_g: 14, carboidratos_g: 12, gorduras_g: 67 },
  'amendoim': { calorias: 567, proteinas_g: 26, carboidratos_g: 16, gorduras_g: 49 },
  'castanha de caju': { calorias: 553, proteinas_g: 18, carboidratos_g: 30, gorduras_g: 44 },
  'nozes': { calorias: 654, proteinas_g: 15, carboidratos_g: 14, gorduras_g: 65 },
  'amêndoas': { calorias: 579, proteinas_g: 21, carboidratos_g: 22, gorduras_g: 50 },
  'avelã': { calorias: 628, proteinas_g: 15, carboidratos_g: 17, gorduras_g: 61 },
  'semente de chia': { calorias: 486, proteinas_g: 17, carboidratos_g: 42, gorduras_g: 31 },
  'semente de linhaça': { calorias: 534, proteinas_g: 18, carboidratos_g: 29, gorduras_g: 42 },
  'gergelim': { calorias: 573, proteinas_g: 18, carboidratos_g: 23, gorduras_g: 50 },
  
  // Óleos e gorduras
  'azeite de oliva': { calorias: 884, proteinas_g: 0, carboidratos_g: 0, gorduras_g: 100 },
  'óleo': { calorias: 884, proteinas_g: 0, carboidratos_g: 0, gorduras_g: 100 },
  'óleo de coco': { calorias: 862, proteinas_g: 0, carboidratos_g: 0, gorduras_g: 100 },
  
  // Bebidas
  'água': { calorias: 0, proteinas_g: 0, carboidratos_g: 0, gorduras_g: 0 },
  'suco de laranja': { calorias: 45, proteinas_g: 0.7, carboidratos_g: 10, gorduras_g: 0.2 },
  'suco': { calorias: 45, proteinas_g: 0.7, carboidratos_g: 10, gorduras_g: 0.2 },
  'refrigerante': { calorias: 37, proteinas_g: 0, carboidratos_g: 9.6, gorduras_g: 0 },
  'café': { calorias: 2, proteinas_g: 0.1, carboidratos_g: 0, gorduras_g: 0 },
  'chá': { calorias: 2, proteinas_g: 0, carboidratos_g: 0.3, gorduras_g: 0 },
  
  // Outros
  'mel': { calorias: 304, proteinas_g: 0.3, carboidratos_g: 82, gorduras_g: 0 },
  'açúcar': { calorias: 387, proteinas_g: 0, carboidratos_g: 100, gorduras_g: 0 },
  'sal': { calorias: 0, proteinas_g: 0, carboidratos_g: 0, gorduras_g: 0 },
  'vinagre': { calorias: 18, proteinas_g: 0, carboidratos_g: 0.9, gorduras_g: 0 },
  'mostarda': { calorias: 66, proteinas_g: 3.7, carboidratos_g: 5.8, gorduras_g: 3.3 },
  'ketchup': { calorias: 112, proteinas_g: 1.7, carboidratos_g: 26, gorduras_g: 0.3 },
  'maionese': { calorias: 680, proteinas_g: 1, carboidratos_g: 0.6, gorduras_g: 75 },
};

// Função auxiliar para calcular calorias baseadas em TMB (Taxa Metabólica Basal)
const calculateBMR = (user: User): number => {
  // Fórmula de Mifflin-St Jeor
  if (user.genero === 'Masculino') {
    return 10 * user.peso + 6.25 * user.altura - 5 * user.idade + 5;
  } else {
    return 10 * user.peso + 6.25 * user.altura - 5 * user.idade - 161;
  }
};

// Calcular necessidades calóricas diárias baseadas no objetivo
const calculateDailyCalories = (user: User): number => {
  const bmr = calculateBMR(user);
  const activityMultiplier = 1.5; // Moderadamente ativo
  const tdee = bmr * activityMultiplier;

  switch (user.objetivo) {
    case Goal.PERDER_PESO:
      return Math.round(tdee * 0.85); // Déficit de 15%
    case Goal.GANHAR_MASSA:
      return Math.round(tdee * 1.15); // Superávit de 15%
    case Goal.MANTER_PESO:
    default:
      return Math.round(tdee);
  }
};

// Distribuição de macros por objetivo
const getMacroDistribution = (calories: number, objetivo: Goal) => {
  switch (objetivo) {
    case Goal.PERDER_PESO:
      return { proteinas: 0.30, carboidratos: 0.35, gorduras: 0.35 };
    case Goal.GANHAR_MASSA:
      return { proteinas: 0.30, carboidratos: 0.45, gorduras: 0.25 };
    case Goal.MANTER_PESO:
    default:
      return { proteinas: 0.25, carboidratos: 0.45, gorduras: 0.30 };
  }
};

// Templates variados de refeições (para rotação)
const mealVariations = {
  cafe_manha_perder: [
    [
      { alimento: '1 xícara de café preto', quantidade: 1 },
      { alimento: '2 ovos mexidos', quantidade: 2 },
      { alimento: '1 fatia de pão integral', quantidade: 1 },
      { alimento: '1/2 abacate', quantidade: 0.5 },
    ],
    [
      { alimento: '1 xícara de chá verde', quantidade: 1 },
      { alimento: '1 tapioca com queijo cottage', quantidade: 1 },
      { alimento: '1 fruta', quantidade: 1 },
    ],
    [
      { alimento: '1 xícara de café com leite desnatado', quantidade: 1 },
      { alimento: '1 iogurte grego com granola', quantidade: 1 },
      { alimento: '1 punhado de castanhas', quantidade: 0.05 },
    ],
  ],
  almoco_perder: [
    [
      { alimento: '150g de peito de frango grelhado', quantidade: 1.5 },
      { alimento: '100g de arroz integral', quantidade: 1 },
      { alimento: '100g de feijão', quantidade: 1 },
      { alimento: 'Salada verde à vontade', quantidade: 1 },
    ],
    [
      { alimento: '150g de peixe grelhado', quantidade: 1.5 },
      { alimento: '100g de batata doce', quantidade: 1 },
      { alimento: 'Vegetais no vapor', quantidade: 1 },
    ],
    [
      { alimento: '150g de carne magra grelhada', quantidade: 1.5 },
      { alimento: '100g de quinoa', quantidade: 1 },
      { alimento: 'Salada variada', quantidade: 1 },
    ],
    [
      { alimento: '200g de salada de atum', quantidade: 2 },
      { alimento: 'Vegetais crus variados', quantidade: 1 },
      { alimento: '1 colher de azeite', quantidade: 0.01 },
    ],
  ],
  jantar_perder: [
    [
      { alimento: '150g de salmão grelhado', quantidade: 1.5 },
      { alimento: '150g de batata doce assada', quantidade: 1.5 },
      { alimento: 'Brócolis no vapor', quantidade: 1 },
    ],
    [
      { alimento: '150g de frango grelhado', quantidade: 1.5 },
      { alimento: 'Salada verde completa', quantidade: 1 },
      { alimento: '1 colher de azeite', quantidade: 0.01 },
    ],
    [
      { alimento: 'Omelete com 3 ovos e vegetais', quantidade: 3 },
      { alimento: 'Salada verde', quantidade: 1 },
    ],
  ],
  cafe_manha_ganhar: [
    [
      { alimento: '3 ovos mexidos', quantidade: 3 },
      { alimento: '2 fatias de pão integral', quantidade: 2 },
      { alimento: '1 banana', quantidade: 1 },
      { alimento: '1 xícara de leite', quantidade: 1 },
    ],
    [
      { alimento: 'Aveia com frutas e mel', quantidade: 1 },
      { alimento: '2 ovos cozidos', quantidade: 2 },
      { alimento: '1 punhado de castanhas', quantidade: 0.05 },
    ],
    [
      { alimento: 'Panqueca de aveia com banana', quantidade: 1 },
      { alimento: '1 iogurte grego', quantidade: 1 },
      { alimento: '1 colher de pasta de amendoim', quantidade: 0.02 },
    ],
  ],
  almoco_ganhar: [
    [
      { alimento: '200g de carne bovina magra', quantidade: 2 },
      { alimento: '150g de arroz branco', quantidade: 1.5 },
      { alimento: '100g de feijão', quantidade: 1 },
      { alimento: 'Salada verde', quantidade: 1 },
    ],
    [
      { alimento: '200g de peito de frango', quantidade: 2 },
      { alimento: '150g de macarrão integral', quantidade: 1.5 },
      { alimento: 'Molho de tomate', quantidade: 1 },
      { alimento: 'Queijo ralado', quantidade: 0.02 },
    ],
    [
      { alimento: '200g de salmão', quantidade: 2 },
      { alimento: '200g de batata doce', quantidade: 2 },
      { alimento: 'Vegetais variados', quantidade: 1 },
    ],
  ],
  jantar_ganhar: [
    [
      { alimento: '200g de peito de frango', quantidade: 2 },
      { alimento: '150g de batata doce', quantidade: 1.5 },
      { alimento: 'Vegetais variados', quantidade: 1 },
    ],
    [
      { alimento: '200g de carne bovina', quantidade: 2 },
      { alimento: '150g de arroz', quantidade: 1.5 },
      { alimento: 'Salada', quantidade: 1 },
    ],
  ],
  cafe_manha_manter: [
    [
      { alimento: '1 xícara de café com leite', quantidade: 1 },
      { alimento: '2 ovos cozidos', quantidade: 2 },
      { alimento: '1 fatia de pão integral', quantidade: 1 },
      { alimento: '1 fruta', quantidade: 1 },
    ],
    [
      { alimento: '1 iogurte natural com granola', quantidade: 1 },
      { alimento: '1 fruta', quantidade: 1 },
      { alimento: '1 punhado de castanhas', quantidade: 0.05 },
    ],
  ],
  almoco_manter: [
    [
      { alimento: '150g de peixe grelhado', quantidade: 1.5 },
      { alimento: '100g de arroz integral', quantidade: 1 },
      { alimento: '100g de feijão', quantidade: 1 },
      { alimento: 'Salada variada', quantidade: 1 },
    ],
    [
      { alimento: '150g de frango grelhado', quantidade: 1.5 },
      { alimento: '100g de batata doce', quantidade: 1 },
      { alimento: 'Vegetais no vapor', quantidade: 1 },
    ],
  ],
  jantar_manter: [
    [
      { alimento: '150g de frango grelhado', quantidade: 1.5 },
      { alimento: '100g de batata doce', quantidade: 1 },
      { alimento: 'Vegetais no vapor', quantidade: 1 },
    ],
    [
      { alimento: '150g de peixe', quantidade: 1.5 },
      { alimento: 'Salada completa', quantidade: 1 },
    ],
  ],
};

// Selecionar template aleatório baseado no objetivo
const getRandomMealTemplate = (objetivo: Goal, mealType: string) => {
  const key = `${mealType}_${objetivo === Goal.PERDER_PESO ? 'perder' : objetivo === Goal.GANHAR_MASSA ? 'ganhar' : 'manter'}`;
  const variations = mealVariations[key as keyof typeof mealVariations];
  if (variations && variations.length > 0) {
    return variations[Math.floor(Math.random() * variations.length)];
  }
  // Fallback para templates originais
  return [];
};

// Função para obter template de refeição (com variação aleatória)
const getMealTemplate = (objetivo: Goal, mealType: string): Array<{ alimento: string; quantidade: number }> => {
  const randomTemplate = getRandomMealTemplate(objetivo, mealType);
  if (randomTemplate && randomTemplate.length > 0) {
    return randomTemplate;
  }
  
  // Fallback para templates padrão
  const defaultTemplates: Record<string, Record<string, Array<{ alimento: string; quantidade: number }>>> = {
    [Goal.PERDER_PESO]: {
      cafe_manha: [
        { alimento: '1 xícara de café preto', quantidade: 1 },
        { alimento: '2 ovos mexidos', quantidade: 2 },
        { alimento: '1 fatia de pão integral', quantidade: 1 },
        { alimento: '1/2 abacate', quantidade: 0.5 },
      ],
      lanche_manha: [
        { alimento: '1 maçã', quantidade: 1 },
        { alimento: '10 castanhas do pará', quantidade: 0.1 },
      ],
      almoco: [
        { alimento: '150g de peito de frango grelhado', quantidade: 1.5 },
        { alimento: '100g de arroz integral', quantidade: 1 },
        { alimento: '100g de feijão', quantidade: 1 },
        { alimento: 'Salada verde à vontade', quantidade: 1 },
      ],
      lanche_tarde: [
        { alimento: '1 iogurte grego natural', quantidade: 1 },
        { alimento: '1 colher de aveia', quantidade: 0.03 },
      ],
      jantar: [
        { alimento: '150g de salmão grelhado', quantidade: 1.5 },
        { alimento: '150g de batata doce assada', quantidade: 1.5 },
        { alimento: 'Brócolis no vapor', quantidade: 1 },
      ],
    },
    [Goal.GANHAR_MASSA]: {
      cafe_manha: [
        { alimento: '3 ovos mexidos', quantidade: 3 },
        { alimento: '2 fatias de pão integral', quantidade: 2 },
        { alimento: '1 banana', quantidade: 1 },
        { alimento: '1 xícara de leite', quantidade: 1 },
      ],
      lanche_manha: [
        { alimento: '1 xícara de aveia com frutas', quantidade: 1 },
        { alimento: '1 colher de pasta de amendoim', quantidade: 0.02 },
      ],
      almoco: [
        { alimento: '200g de carne bovina magra', quantidade: 2 },
        { alimento: '150g de arroz branco', quantidade: 1.5 },
        { alimento: '100g de feijão', quantidade: 1 },
        { alimento: 'Salada verde', quantidade: 1 },
      ],
      lanche_tarde: [
        { alimento: '1 batata doce média', quantidade: 1 },
        { alimento: '1 lata de atum', quantidade: 1 },
      ],
      jantar: [
        { alimento: '200g de peito de frango', quantidade: 2 },
        { alimento: '150g de batata doce', quantidade: 1.5 },
        { alimento: 'Vegetais variados', quantidade: 1 },
      ],
    },
    [Goal.MANTER_PESO]: {
      cafe_manha: [
        { alimento: '1 xícara de café com leite', quantidade: 1 },
        { alimento: '2 ovos cozidos', quantidade: 2 },
        { alimento: '1 fatia de pão integral', quantidade: 1 },
        { alimento: '1 fruta', quantidade: 1 },
      ],
      lanche_manha: [
        { alimento: '1 iogurte natural', quantidade: 1 },
        { alimento: '1 punhado de castanhas', quantidade: 0.05 },
      ],
      almoco: [
        { alimento: '150g de peixe grelhado', quantidade: 1.5 },
        { alimento: '100g de arroz integral', quantidade: 1 },
        { alimento: '100g de feijão', quantidade: 1 },
        { alimento: 'Salada variada', quantidade: 1 },
      ],
      lanche_tarde: [
        { alimento: '1 fruta', quantidade: 1 },
        { alimento: '1 punhado de amendoim', quantidade: 0.03 },
      ],
      jantar: [
        { alimento: '150g de frango grelhado', quantidade: 1.5 },
        { alimento: '100g de batata doce', quantidade: 1 },
        { alimento: 'Vegetais no vapor', quantidade: 1 },
      ],
    },
  };
  
  return defaultTemplates[objetivo]?.[mealType] || [];
};

// Calcular valores nutricionais de uma refeição
const calculateMealNutrition = (mealItems: Array<{ alimento: string; quantidade: number }>): {
  calorias: number;
  macros: {
    proteinas_g: number;
    carboidratos_g: number;
    gorduras_g: number;
  };
} => {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  mealItems.forEach(({ alimento, quantidade }) => {
    const foodName = alimento.toLowerCase();
    let found = false;

    for (const [key, nutrition] of Object.entries(foodDatabase)) {
      if (foodName.includes(key)) {
        const multiplier = quantidade;
        totalCalories += nutrition.calorias * multiplier;
        totalProtein += nutrition.proteinas_g * multiplier;
        totalCarbs += nutrition.carboidratos_g * multiplier;
        totalFat += nutrition.gorduras_g * multiplier;
        found = true;
        break;
      }
    }

    // Valores padrão se não encontrado
    if (!found) {
      totalCalories += 50 * quantidade;
      totalProtein += 2 * quantidade;
      totalCarbs += 5 * quantidade;
      totalFat += 1 * quantidade;
    }
  });

  return {
    calorias: Math.round(totalCalories),
    macros: {
      proteinas_g: Math.round(totalProtein),
      carboidratos_g: Math.round(totalCarbs),
      gorduras_g: Math.round(totalFat),
    },
  };
};

// Gerar plano alimentar offline
export const generateMealPlanOffline = (user: User, language: 'pt' | 'en' | 'es' = 'pt'): GeminiMealPlanResponse => {
  const dailyCalories = calculateDailyCalories(user);
  
  // Obter templates dinamicamente (com variação aleatória)
  const template = {
    cafe_manha: getMealTemplate(user.objetivo, 'cafe_manha'),
    lanche_manha: getMealTemplate(user.objetivo, 'lanche_manha'),
    almoco: getMealTemplate(user.objetivo, 'almoco'),
    lanche_tarde: getMealTemplate(user.objetivo, 'lanche_tarde'),
    jantar: getMealTemplate(user.objetivo, 'jantar'),
  };

  const langLabels = {
    pt: {
      cafe_manha: 'Café da Manhã',
      lanche_manha: 'Lanche da Manhã',
      almoco: 'Almoço',
      lanche_tarde: 'Lanche da Tarde',
      jantar: 'Jantar',
    },
    en: {
      cafe_manha: 'Breakfast',
      lanche_manha: 'Morning Snack',
      almoco: 'Lunch',
      lanche_tarde: 'Afternoon Snack',
      jantar: 'Dinner',
    },
    es: {
      cafe_manha: 'Desayuno',
      lanche_manha: 'Merienda',
      almoco: 'Almuerzo',
      lanche_tarde: 'Merienda',
      jantar: 'Cena',
    },
  };

  const labels = langLabels[language];
  const horarios = {
    pt: { cafe_manha: '08:00', lanche_manha: '10:30', almoco: '12:30', lanche_tarde: '16:00', jantar: '19:30' },
    en: { cafe_manha: '08:00', lanche_manha: '10:30', almoco: '12:30', lanche_tarde: '16:00', jantar: '19:30' },
    es: { cafe_manha: '08:00', lanche_manha: '10:30', almoco: '12:30', lanche_tarde: '16:00', jantar: '19:30' },
  };

  const mealPlan: MealPlan = [
    {
      refeicao: labels.cafe_manha,
      horario_sugerido: horarios[language].cafe_manha,
      alimentos: template.cafe_manha.map(item => `${item.quantidade > 1 ? item.quantidade + 'x ' : ''}${item.alimento}`),
      ...calculateMealNutrition(template.cafe_manha),
    },
    {
      refeicao: labels.lanche_manha,
      horario_sugerido: horarios[language].lanche_manha,
      alimentos: template.lanche_manha.map(item => `${item.quantidade > 1 ? item.quantidade + 'x ' : ''}${item.alimento}`),
      ...calculateMealNutrition(template.lanche_manha),
    },
    {
      refeicao: labels.almoco,
      horario_sugerido: horarios[language].almoco,
      alimentos: template.almoco.map(item => `${item.quantidade > 1 ? item.quantidade + 'x ' : ''}${item.alimento}`),
      ...calculateMealNutrition(template.almoco),
    },
    {
      refeicao: labels.lanche_tarde,
      horario_sugerido: horarios[language].lanche_tarde,
      alimentos: template.lanche_tarde.map(item => `${item.quantidade > 1 ? item.quantidade + 'x ' : ''}${item.alimento}`),
      ...calculateMealNutrition(template.lanche_tarde),
    },
    {
      refeicao: labels.jantar,
      horario_sugerido: horarios[language].jantar,
      alimentos: template.jantar.map(item => `${item.quantidade > 1 ? item.quantidade + 'x ' : ''}${item.alimento}`),
      ...calculateMealNutrition(template.jantar),
    },
  ];

  // Calcular resumo diário
  const resumo_diario: DailySummary = mealPlan.reduce(
    (acc, meal) => ({
      total_calorias: acc.total_calorias + meal.calorias,
      total_proteinas_g: acc.total_proteinas_g + meal.macros.proteinas_g,
      total_carboidratos_g: acc.total_carboidratos_g + meal.macros.carboidratos_g,
      total_gorduras_g: acc.total_gorduras_g + meal.macros.gorduras_g,
    }),
    { total_calorias: 0, total_proteinas_g: 0, total_carboidratos_g: 0, total_gorduras_g: 0 }
  );

  const observacoesText = {
    pt: `Plano gerado offline baseado no seu objetivo de ${user.objetivo}. Lembre-se de beber pelo menos 2 litros de água por dia e manter uma rotina de exercícios regular. Este plano é uma sugestão e pode ser ajustado conforme suas necessidades.`,
    en: `Plan generated offline based on your goal of ${user.objetivo}. Remember to drink at least 2 liters of water per day and maintain a regular exercise routine. This plan is a suggestion and can be adjusted according to your needs.`,
    es: `Plan generado offline basado en tu objetivo de ${user.objetivo}. Recuerda beber al menos 2 litros de agua por día y mantener una rutina de ejercicios regular. Este plan es una sugerencia y puede ajustarse según tus necesidades.`,
  };

  const result: GeminiMealPlanResponse = {
    planoAlimentar: mealPlan,
    resumo_diario,
    observacoes: observacoesText[language],
  };

  // Salvar no cache
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MEAL_PLAN_CACHE_KEY, JSON.stringify(result));
    } catch (e) {
      logger.warn('Não foi possível salvar no cache', 'offlineService', e);
    }
  }

  return result;
};

// Análise melhorada de refeição offline com detecção básica de padrões
export const analyzeMealPhotoOffline = async (base64Image: string, mimeType: string): Promise<MealAnalysisResponse> => {
  const cacheKey = `${ANALYSIS_CACHE_KEY}${base64Image.substring(0, 50)}`;
  
  // Tentar recuperar do cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Ignorar erro de cache
    }
  }

  // Análise básica usando padrões de cores e tamanho da imagem
  // (simulação - em produção, usaria um modelo de visão embarcado)
  const imageSize = base64Image.length;
  const isLargeMeal = imageSize > 50000; // Imagens maiores podem indicar pratos maiores
  
  // Padrões de refeições comuns no Brasil
  const mealPatterns = [
    {
      name: 'Prato típico brasileiro',
      foods: [
        { alimento: 'Arroz branco', quantidade_estimada: '100g' },
        { alimento: 'Feijão', quantidade_estimada: '100g' },
        { alimento: 'Carne bovina ou frango', quantidade_estimada: '150g' },
        { alimento: 'Salada verde', quantidade_estimada: 'À vontade' },
      ],
      nutrition: { total_calorias: 550, total_proteinas_g: 40, total_carboidratos_g: 50, total_gorduras_g: 15 },
    },
    {
      name: 'Refeição leve',
      foods: [
        { alimento: 'Salada variada', quantidade_estimada: 'À vontade' },
        { alimento: 'Proteína grelhada', quantidade_estimada: '120g' },
        { alimento: 'Carboidrato complexo', quantidade_estimada: '80g' },
      ],
      nutrition: { total_calorias: 350, total_proteinas_g: 30, total_carboidratos_g: 30, total_gorduras_g: 10 },
    },
    {
      name: 'Refeição completa',
      foods: [
        { alimento: 'Arroz integral', quantidade_estimada: '120g' },
        { alimento: 'Feijão ou lentilha', quantidade_estimada: '100g' },
        { alimento: 'Peixe grelhado', quantidade_estimada: '150g' },
        { alimento: 'Vegetais no vapor', quantidade_estimada: '150g' },
        { alimento: 'Salada verde', quantidade_estimada: 'À vontade' },
      ],
      nutrition: { total_calorias: 480, total_proteinas_g: 38, total_carboidratos_g: 45, total_gorduras_g: 12 },
    },
  ];

  // Selecionar padrão baseado em heurísticas simples
  const selectedPattern = isLargeMeal ? mealPatterns[2] : mealPatterns[Math.floor(Math.random() * mealPatterns.length)];

  const avaliacao_geral = `Análise realizada offline baseada em padrões de refeições típicas. Esta é uma estimativa aproximada. Para uma análise mais precisa com identificação detalhada de alimentos e quantidades exatas, é recomendado estar online. A refeição parece ser uma ${selectedPattern.name.toLowerCase()}, com boa distribuição de macronutrientes.`;

  const result: MealAnalysisResponse = {
    alimentos_identificados: selectedPattern.foods,
    estimativa_nutricional: selectedPattern.nutrition,
    avaliacao_geral,
  };

  // Salvar no cache
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      logger.warn('Não foi possível salvar análise no cache', 'offlineService', e);
    }
  }

  return result;
};

// Buscar receitas offline (cache ou templates)
export const searchRecipesOffline = async (query: string, user: User): Promise<Recipe[]> => {
  // Receitas básicas em cache
  const basicRecipes: Recipe[] = [
    {
      nome_receita: 'Frango Grelhado com Arroz Integral',
      descricao: 'Receita simples e saudável, rica em proteínas',
      tempo_preparo_min: 30,
      ingredientes: [
        '150g de peito de frango',
        '100g de arroz integral',
        'Sal e pimenta a gosto',
        'Azeite de oliva',
        'Salada verde',
      ],
      instrucoes: [
        'Tempere o frango com sal e pimenta',
        'Grelhe o frango por 6-7 minutos de cada lado',
        'Cozinhe o arroz integral conforme instruções da embalagem',
        'Sirva com salada verde temperada',
      ],
      informacao_nutricional: {
        calorias: 450,
        proteinas_g: 40,
        carboidratos_g: 45,
        gorduras_g: 8,
      },
    },
    {
      nome_receita: 'Salada de Atum com Vegetais',
      descricao: 'Refeição leve e nutritiva',
      tempo_preparo_min: 15,
      ingredientes: [
        '1 lata de atum em água',
        'Alface, tomate, cebola',
        'Azeite de oliva',
        'Limão',
        'Sal a gosto',
      ],
      instrucoes: [
        'Lave e corte os vegetais',
        'Escorra o atum',
        'Misture todos os ingredientes',
        'Tempere com azeite e limão',
      ],
      informacao_nutricional: {
        calorias: 250,
        proteinas_g: 25,
        carboidratos_g: 10,
        gorduras_g: 12,
      },
    },
  ];

  // Filtrar receitas baseado na query (busca simples)
  const filtered = basicRecipes.filter(
    (recipe) =>
      recipe.nome_receita.toLowerCase().includes(query.toLowerCase()) ||
      recipe.descricao.toLowerCase().includes(query.toLowerCase())
  );

  return filtered.length > 0 ? filtered : basicRecipes.slice(0, 2);
};

// Verificar se há cache disponível
export const getCachedMealPlan = (): GeminiMealPlanResponse | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(MEAL_PLAN_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    logger.warn('Erro ao ler cache', 'offlineService', e);
  }
  
  return null;
};

// Verificar status online
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Chat offline com respostas pré-definidas
interface ChatResponse {
  keywords: string[];
  responses: string[];
}

const chatResponses: ChatResponse[] = [
  {
    keywords: ['calorias', 'caloria', 'calórico', 'energia'],
    responses: [
      'As calorias são unidades de energia que nosso corpo usa como combustível. Para perder peso, você precisa consumir menos calorias do que gasta. Para ganhar massa, precisa consumir mais.',
      'O cálculo de calorias depende do seu objetivo. Para perder peso, recomendo um déficit de 15-20%. Para ganhar massa, um superávit de 10-15%.',
      'Lembre-se: a qualidade das calorias importa tanto quanto a quantidade. Priorize alimentos nutritivos!',
    ],
  },
  {
    keywords: ['proteína', 'proteínas', 'proteico'],
    responses: [
      'As proteínas são essenciais para construção e reparo muscular. Recomendo 1.6-2.2g por kg de peso corporal para quem treina.',
      'Boas fontes de proteína: frango, peixe, ovos, carne magra, leguminosas e laticínios.',
      'Distribua a proteína ao longo do dia, incluindo em todas as refeições principais.',
    ],
  },
  {
    keywords: ['carboidrato', 'carboidratos', 'carbo', 'açúcar'],
    responses: [
      'Os carboidratos são a principal fonte de energia. Prefira carboidratos complexos como arroz integral, batata doce e aveia.',
      'O timing dos carboidratos é importante: consuma mais antes e depois dos treinos.',
      'Evite carboidratos refinados e açúcares simples, especialmente à noite.',
    ],
  },
  {
    keywords: ['gordura', 'gorduras', 'lipídios', 'óleo'],
    responses: [
      'As gorduras são importantes para produção hormonal e absorção de vitaminas. Priorize gorduras boas como azeite, abacate e castanhas.',
      'Recomendo 20-30% das calorias diárias vindas de gorduras saudáveis.',
      'Evite gorduras trans e limite gorduras saturadas.',
    ],
  },
  {
    keywords: ['água', 'hidratação', 'beber água'],
    responses: [
      'A hidratação é fundamental! Recomendo pelo menos 2-3 litros de água por dia, mais se você treina intensamente.',
      'Beba água ao longo do dia, não apenas quando sentir sede. A sede já é um sinal de desidratação.',
      'Água ajuda na digestão, transporte de nutrientes e regulação da temperatura corporal.',
    ],
  },
  {
    keywords: ['perder peso', 'emagrecer', 'dieta', 'déficit'],
    responses: [
      'Para perder peso de forma saudável, crie um déficit calórico moderado (15-20%) e mantenha atividade física regular.',
      'Foque em alimentos ricos em nutrientes e baixos em calorias: vegetais, proteínas magras e carboidratos complexos.',
      'Lembre-se: perda de peso sustentável é um processo gradual. Evite dietas muito restritivas.',
    ],
  },
  {
    keywords: ['ganhar massa', 'hipertrofia', 'músculo', 'musculação'],
    responses: [
      'Para ganhar massa muscular, você precisa de superávit calórico (10-15%) e treino de força consistente.',
      'Priorize proteínas (1.6-2.2g/kg), carboidratos para energia e gorduras saudáveis.',
      'O descanso é tão importante quanto o treino e a alimentação para ganho de massa.',
    ],
  },
  {
    keywords: ['café da manhã', 'desjejum', 'primeira refeição'],
    responses: [
      'O café da manhã é importante para quebrar o jejum noturno. Inclua proteína, carboidrato complexo e uma fruta.',
      'Exemplos: ovos com pão integral, aveia com frutas, ou tapioca com queijo cottage.',
      'Não pule o café da manhã! Ele ajuda a manter o metabolismo ativo.',
    ],
  },
  {
    keywords: ['lanche', 'lanches', 'snack', 'merenda'],
    responses: [
      'Lanche saudável: fruta com castanhas, iogurte com granola, ou queijo com pão integral.',
      'Faça lanches entre as refeições principais para manter o metabolismo ativo e evitar fome excessiva.',
      'Combine proteína com carboidrato nos lanches para maior saciedade.',
    ],
  },
  {
    keywords: ['jantar', 'ceia', 'última refeição'],
    responses: [
      'O jantar deve ser mais leve que o almoço. Priorize proteína magra, vegetais e carboidrato moderado.',
      'Evite refeições muito pesadas à noite. Prefira jantar 2-3 horas antes de dormir.',
      'Exemplos: peixe grelhado com salada, frango com vegetais, ou omelete com salada.',
    ],
  },
  {
    keywords: ['suplemento', 'suplementos', 'whey', 'creatina'],
    responses: [
      'Suplementos são complementos, não substituem uma alimentação equilibrada. Consulte um nutricionista antes de usar.',
      'Os suplementos mais estudados são: whey protein, creatina, vitamina D e ômega-3.',
      'Lembre-se: comida sempre vem primeiro! Suplementos são extras.',
    ],
  },
  {
    keywords: ['vegetariano', 'vegano', 'plant based'],
    responses: [
      'É totalmente possível ter uma alimentação saudável sendo vegetariano ou vegano. Foque em proteínas vegetais: leguminosas, quinoa, tofu.',
      'Combine diferentes fontes de proteína vegetal ao longo do dia para obter todos os aminoácidos essenciais.',
      'Considere suplementar vitamina B12 se for vegano, e vitamina D e ferro se necessário.',
    ],
  },
];

// Buscar resposta do chat offline
export const getOfflineChatResponse = (message: string, user: User): string => {
  const lowerMessage = message.toLowerCase();
  
  // Buscar resposta baseada em palavras-chave
  for (const responseSet of chatResponses) {
    const hasKeyword = responseSet.keywords.some(keyword => lowerMessage.includes(keyword));
    if (hasKeyword) {
      const randomResponse = responseSet.responses[Math.floor(Math.random() * responseSet.responses.length)];
      return randomResponse;
    }
  }
  
  // Respostas genéricas
  const genericResponses = [
    `Olá ${user.nome}! Como posso ajudar você com sua jornada nutricional?`,
    'Que tal me contar mais sobre sua dúvida? Posso ajudar com questões sobre nutrição, planos alimentares e hábitos saudáveis.',
    'Estou aqui para ajudar! Você pode perguntar sobre calorias, macronutrientes, receitas saudáveis ou qualquer dúvida nutricional.',
    `Com base no seu objetivo de ${user.objetivo}, posso ajudar com dicas personalizadas. O que você gostaria de saber?`,
    'No momento estou em modo offline, mas posso ajudar com informações básicas sobre nutrição. Conecte-se à internet para respostas mais detalhadas.',
  ];
  
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
};

/**
 * Gera um relatório semanal offline baseado nos dados do usuário
 */
export const generateWeeklyReportOffline = (user: User, language: 'pt' | 'en' | 'es' = 'pt'): string => {
  const langPrompts = {
    pt: {
      title: "Relatório de Progresso Semanal",
      analysis: "Análise de Progresso",
      strengths: "Pontos Fortes",
      improvements: "Pontos a Melhorar",
      tip: "Dica da Semana",
      motivation: "Mensagem Motivacional"
    },
    en: {
      title: "Weekly Progress Report",
      analysis: "Progress Analysis",
      strengths: "Strengths",
      improvements: "Areas for Improvement",
      tip: "Tip of the Week",
      motivation: "Motivational Message"
    },
    es: {
      title: "Informe de Progreso Semanal",
      analysis: "Análisis de Progreso",
      strengths: "Puntos Fuertes",
      improvements: "Áreas de Mejora",
      tip: "Consejo de la Semana",
      motivation: "Mensaje de Motivación"
    }
  };
  const t = langPrompts[language];

  // Calcular métricas básicas
  const weightHistory = user.weightHistory || [];
  const totalCheckIns = weightHistory.length;
  const lastWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : user.peso;
  const firstWeight = weightHistory.length > 0 ? weightHistory[0].weight : user.peso;
  const weightVariation = lastWeight - firstWeight;
  const disciplineScore = user.disciplineScore || 0;

  // Determinar mensagens baseadas no objetivo
  const goalMessages = {
    [Goal.PERDER_PESO]: {
      analysis: weightVariation < 0 
        ? `Parabéns! Você está no caminho certo para ${user.objetivo}. Sua dedicação está gerando resultados positivos. Continue mantendo o foco e a disciplina.`
        : `Você está trabalhando duro para ${user.objetivo}. Lembre-se de que o progresso nem sempre é linear. Continue persistindo e ajustando sua rotina conforme necessário.`,
      strengths: [
        `Você manteve ${totalCheckIns} registro${totalCheckIns !== 1 ? 's' : ''} de peso, demonstrando comprometimento com seu objetivo.`,
        `Sua pontuação de disciplina de ${disciplineScore}% mostra que você está criando hábitos consistentes.`,
        `Focar em ${user.objetivo} requer determinação, e você está demonstrando isso.`
      ],
      improvements: [
        'Tente aumentar a frequência de check-ins para ter um acompanhamento mais preciso do progresso.',
        'Considere adicionar mais proteínas magras às suas refeições para manter a saciedade.',
        'Mantenha-se hidratado - beba pelo menos 2 litros de água por dia.'
      ],
      tip: 'Uma dica valiosa: tente fazer refeições menores e mais frequentes ao longo do dia. Isso ajuda a manter o metabolismo ativo e reduz a fome.',
      motivation: 'Cada pequeno passo te aproxima do seu objetivo. Continue firme! 💪'
    },
    [Goal.GANHAR_PESO]: {
      analysis: weightVariation > 0
        ? `Excelente progresso! Você está ganhando peso de forma saudável em direção ao seu objetivo de ${user.objetivo}.`
        : `Você está trabalhando para ${user.objetivo}. Lembre-se de que ganhar peso de forma saudável requer tempo e consistência.`,
      strengths: [
        `Seus ${totalCheckIns} registro${totalCheckIns !== 1 ? 's' : ''} mostram que você está monitorando seu progresso.`,
        `Disciplina de ${disciplineScore}% é um bom começo para alcançar seus objetivos.`,
        `Focar em ganho de massa magra é um objetivo nobre e você está no caminho certo.`
      ],
      improvements: [
        'Inclua mais fontes de proteína de alta qualidade em cada refeição.',
        'Considere fazer lanches nutritivos entre as refeições principais.',
        'Mantenha um diário alimentar para garantir que está consumindo calorias suficientes.'
      ],
      tip: 'Para ganhar peso de forma saudável, priorize alimentos ricos em nutrientes e não apenas calorias vazias. Combine proteínas, carboidratos complexos e gorduras boas.',
      motivation: 'Seu corpo está se transformando a cada refeição nutritiva. Continue! 🌟'
    },
    [Goal.MANTER_PESO]: {
      analysis: Math.abs(weightVariation) < 1
        ? `Perfeito! Você está mantendo seu peso estável, o que demonstra excelente controle e disciplina.`
        : `Você está trabalhando para manter seu peso. Pequenas variações são normais, o importante é a tendência geral.`,
      strengths: [
        `Manter ${totalCheckIns} registro${totalCheckIns !== 1 ? 's' : ''} mostra que você está atento ao seu peso.`,
        `Sua disciplina de ${disciplineScore}% é essencial para manter o equilíbrio.`,
        `Manter o peso requer tanto dedicação quanto ganhar ou perder. Você está fazendo isso!`
      ],
      improvements: [
        'Continue monitorando seu peso regularmente para detectar mudanças cedo.',
        'Mantenha uma alimentação equilibrada com todos os grupos alimentares.',
        'Inclua atividade física regular para manter o metabolismo ativo.'
      ],
      tip: 'Para manter o peso, é importante encontrar um equilíbrio entre o que você come e o que você gasta. Preste atenção aos sinais de fome e saciedade do seu corpo.',
      motivation: 'Manter o equilíbrio é uma conquista diária. Continue assim! ⚖️'
    }
  };

  const messages = goalMessages[user.objetivo] || goalMessages[Goal.PERDER_PESO];

  // Construir o relatório
  const report = `
**${t.analysis}**

${messages.analysis}

**${t.strengths}**

${messages.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}

**${t.improvements}**

${messages.improvements.map((i, idx) => `${idx + 1}. ${i}`).join('\n\n')}

**${t.tip}**

${messages.tip}

**${t.motivation}**

${messages.motivation}
  `.trim();

  return report;
};

