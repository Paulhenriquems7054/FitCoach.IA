
export enum Goal {
  PERDER_PESO = 'perder peso',
  MANTER_PESO = 'manter peso',
  GANHAR_MASSA = 'ganhar massa muscular',
}

export interface User {
  nome: string;
  username?: string; // Nome de usuário para login
  password?: string; // Senha (será hasheada antes de salvar)
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

export interface LoginCredentials {
  username: string;
  password: string;
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

// Estrutura expandida para exercícios com mais detalhes
export interface Exercise {
    name: string;
    reps?: string;
    sets?: string;
    tips?: string;
    calories?: number;
    rest?: string;
}

export interface WorkoutDay {
    dia_semana: string;
    foco_treino: string;
    exercicios: string[] | Exercise[]; // Suporta tanto string[] (legado) quanto Exercise[] (novo)
    duracao_estimada?: string;
    intensidade?: 'baixa' | 'moderada' | 'alta';
    observacoes?: string;
}

export interface Supplement {
    nome: string;
    dosagem_sugerida: string;
    melhor_horario: string;
    justificativa: string;
    beneficios?: string[];
    contraindicacoes?: string;
}

export interface WellnessTips {
    hidratacao?: string;
    horario_treino?: string;
    descanso?: string;
    sono?: string;
    nutricao?: string;
}

export interface WellnessPlan {
    plano_treino_semanal: WorkoutDay[];
    recomendacoes_suplementos: Supplement[];
    dicas_adicionais: string;
    dicas_inteligentes?: WellnessTips;
    data_geracao?: string;
    versao?: number;
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

export interface Patient {
    id: string;
    name: string;
    goal: Goal;
    lastCheckin: string;
    progress: 'on_track' | 'stagnated' | 'behind';
}