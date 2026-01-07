/**
 * Tipos e interfaces para exercícios
 * Estrutura expandida para suportar informações completas
 */

export type ExerciseLevel = 'iniciante' | 'intermediário' | 'avançado';

export interface Exercise {
  id?: string;
  name: string;
  muscleGroup: string;
  subMuscleGroup?: string;
  gifUrl?: string | null;
  imageFallback?: string | null;
  description?: string;
  executionTips?: string[];
  commonMistakes?: string[];
  level?: ExerciseLevel;
}

/**
 * Interface para compatibilidade com código existente
 * Permite migração gradual
 */
export interface ExerciseInfo {
  name: string;
  gifPath: string | null;
  muscleGroup: string;
  // Campos opcionais para compatibilidade futura
  description?: string;
  executionTips?: string[];
  commonMistakes?: string[];
  level?: ExerciseLevel;
}

