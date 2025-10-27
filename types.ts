
export enum Goal {
  PERDER_PESO = 'perder peso',
  MANTER_PESO = 'manter peso',
  GANHAR_MASSA = 'ganhar massa muscular',
}

export interface User {
  nome: string;
  idade: number;
  genero: 'Masculino' | 'Feminino';
  peso: number;
  altura: number;
  objetivo: Goal;
  points: number;
  disciplineScore: number;
  completedChallengeIds: string[];
  isAnonymized: boolean;
  weightHistory: { date: string; weight: number }[];
  role: 'user' | 'professional';
  subscription: 'free' | 'premium';
}

export interface MacroNutrients {
  proteinas_g: number;
  carboidratos_g: number;
  gorduras_g: number;
}

export interface Meal {
  refeicao: string;
  horario_sugerido: string;
  alimentos: string[];
  calorias: number;
  macros: MacroNutrients;
}

export type MealPlan = Meal[];

export interface DailySummary {
    total_calorias: number;
    total_proteinas_g: number;
    total_carboidratos_g: number;
    total_gorduras_g: number;
}

export interface GeminiMealPlanResponse {
    planoAlimentar: MealPlan;
    resumo_diario: DailySummary;
    observacoes: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface AnalyzedFoodItem {
    alimento: string;
    quantidade_estimada: string;
}

export interface MealAnalysisResponse {
    alimentos_identificados: AnalyzedFoodItem[];
    estimativa_nutricional: {
        total_calorias: number;
        total_proteinas_g: number;
        total_carboidratos_g: number;
        total_gorduras_g: number;
    };
    avaliacao_geral: string;
}

export interface Challenge {
    id: string;
    type: 'daily' | 'weekly';
    title: string;
    description: string;
    points: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    check: (user: User) => boolean;
}


export interface Recipe {
    nome_receita: string;
    descricao: string;
    tempo_preparo_min: number;
    ingredientes: string[];
    instrucoes: string[];
    informacao_nutricional: {
        calorias: number;
        proteinas_g: number;
        carboidratos_g: number;
        gorduras_g: number;
    }
}

export interface ModerationResult {
    is_safe: boolean;
    reason: string;
}

export interface ForumReply {
    id: string;
    author: string;
    content: string;
    timestamp: string;
}
  
export interface ForumPost {
    id: string;
    author: string;
    title: string;
    content: string;
    timestamp: string;
    replies: ForumReply[];
}

export interface WorkoutDay {
    dia_semana: string;
    foco_treino: string;
    exercicios: string[];
}

export interface Supplement {
    nome: string;
    dosagem_sugerida: string;
    melhor_horario: string;
    justificativa: string;
}

export interface WellnessPlan {
    plano_treino_semanal: WorkoutDay[];
    recomendacoes_suplementos: Supplement[];
    dicas_adicionais: string;
}

export interface ProgressAnalysis {
    tendencia_geral: 'positiva' | 'negativa' | 'estagnada';
    analise_texto: string;
    projecao_proxima_semana: string;
    pontos_fortes: string[];
    areas_melhoria: string[];
}

export interface FoodSubstitution {
    alimento_sugerido: string;
    justificativa: string;
}

export interface FoodProductInfo {
    nome_produto: string;
    marca: string;
    calorias_por_100g: number;
    macros_por_100g: {
        proteinas_g: number;
        carboidratos_g: number;
        gorduras_g: number;
    };
    health_score_ia: number; // 0 a 10
    avaliacao_ia: string;
}

export interface Patient {
    id: string;
    name: string;
    goal: Goal;
    lastCheckin: string;
    progress: 'on_track' | 'stagnated' | 'behind';
}