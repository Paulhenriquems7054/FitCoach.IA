
export enum Goal {
  PERDER_PESO = 'perder peso',
  MANTER_PESO = 'manter peso',
  GANHAR_MASSA = 'ganhar massa muscular',
}

export interface User {
  nome: string;
  username?: string; // Nome de usuário para login
  password?: string; // Senha (será hasheada antes de salvar)
  photoUrl?: string; // URL da foto de perfil (base64 data URL)
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
  // Multi-tenancy: campos para academias
  gymId?: string; // ID da academia (se o usuário pertence a uma)
  gymRole?: 'student' | 'admin' | 'trainer'; // Papel na academia
  isGymManaged?: boolean; // Se o usuário foi criado/gerenciado por uma academia
  usageLimits?: {
    reportsGeneratedThisWeek?: number;
    photosAnalyzedToday?: number;
    lastReportDate?: string;
    lastPhotoAnalysisDate?: string;
  };
  dataPermissions?: {
    allowWeightHistory: boolean;
    allowMealPlans: boolean;
    allowPhotoAnalysis: boolean;
    allowWorkoutData: boolean;
    allowChatHistory: boolean;
  };
  securitySettings?: {
    biometricEnabled: boolean;
    securityNotifications: boolean;
    lastPasswordChange?: string;
  };
}

/**
 * Interface para configuração de academia (multi-tenancy)
 */
export interface Gym {
  id: string; // ID único da academia
  name: string; // Nome da academia
  logo?: string; // Logo em base64 ou URL
  primaryColor?: string; // Cor primária (hex)
  secondaryColor?: string; // Cor secundária (hex)
  accentColor?: string; // Cor de destaque (hex)
  appName?: string; // Nome personalizado do app (ex: "Academia XYZ - Nutri.IA")
  contactEmail?: string; // Email de contato
  contactPhone?: string; // Telefone de contato
  website?: string; // Website
  qrCode?: string; // QR code para distribuição (base64 ou URL)
  createdAt: string; // Data de criação
  updatedAt: string; // Data de última atualização
  isActive: boolean; // Se a academia está ativa
  maxStudents?: number; // Limite de alunos (opcional)
  currentStudents?: number; // Número atual de alunos
  features?: {
    customBranding: boolean; // Se permite branding personalizado
    customColors: boolean; // Se permite cores personalizadas
    customLogo: boolean; // Se permite logo personalizado
    analytics: boolean; // Se tem acesso a analytics
    studentManagement: boolean; // Se pode gerenciar alunos
  };
}

/**
 * Configuração de white-labeling para uma academia
 */
export interface GymBranding {
  gymId: string;
  appName: string; // Nome do app personalizado
  logo?: string; // Logo em base64
  colors: {
    primary: string; // Cor primária (hex)
    secondary: string; // Cor secundária (hex)
    accent: string; // Cor de destaque (hex)
    background?: string; // Cor de fundo
    text?: string; // Cor do texto
  };
  fonts?: {
    primary?: string; // Fonte primária
    secondary?: string; // Fonte secundária
  };
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