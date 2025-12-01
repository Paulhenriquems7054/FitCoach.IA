/**
 * Utilitários para limites e quotas por plano
 * Conforme documentação de lógica de planos
 */

export interface QuotaLimits {
  photoAnalysisPerDay: number;
  workoutAnalysisPerDay: number;
  customWorkoutsPerMonth: number;
  textMessagesPerDay: number;
  voiceMinutesPerDay: number;
}

/**
 * Retorna os limites de quota para um tipo de plano
 * Conforme documentação de lógica de planos
 */
export function getQuotaLimits(planType: string | null): QuotaLimits {
  const limits: Record<string, QuotaLimits> = {
    monthly: {
      photoAnalysisPerDay: Infinity,
      workoutAnalysisPerDay: Infinity,
      customWorkoutsPerMonth: Infinity,
      textMessagesPerDay: Infinity,
      voiceMinutesPerDay: 15,
    },
    annual: {
      photoAnalysisPerDay: Infinity,
      workoutAnalysisPerDay: Infinity,
      customWorkoutsPerMonth: Infinity,
      textMessagesPerDay: Infinity,
      voiceMinutesPerDay: 15,
    },
    annual_vip: {
      photoAnalysisPerDay: Infinity,
      workoutAnalysisPerDay: Infinity,
      customWorkoutsPerMonth: Infinity,
      textMessagesPerDay: Infinity,
      voiceMinutesPerDay: 15,
    },
    academy_starter: {
      photoAnalysisPerDay: Infinity,
      workoutAnalysisPerDay: Infinity,
      customWorkoutsPerMonth: Infinity,
      textMessagesPerDay: Infinity,
      voiceMinutesPerDay: 15,
    },
    academy_growth: {
      photoAnalysisPerDay: Infinity,
      workoutAnalysisPerDay: Infinity,
      customWorkoutsPerMonth: Infinity,
      textMessagesPerDay: Infinity,
      voiceMinutesPerDay: 15,
    },
    academy_pro: {
      photoAnalysisPerDay: Infinity,
      workoutAnalysisPerDay: Infinity,
      customWorkoutsPerMonth: Infinity,
      textMessagesPerDay: Infinity,
      voiceMinutesPerDay: 15,
    },
    personal_team_5: {
      photoAnalysisPerDay: Infinity,
      workoutAnalysisPerDay: Infinity,
      customWorkoutsPerMonth: Infinity,
      textMessagesPerDay: Infinity,
      voiceMinutesPerDay: 15,
    },
    personal_team_15: {
      photoAnalysisPerDay: Infinity,
      workoutAnalysisPerDay: Infinity,
      customWorkoutsPerMonth: Infinity,
      textMessagesPerDay: Infinity,
      voiceMinutesPerDay: 15,
    },
  };

  // Free tier - BLOQUEIO TOTAL para avaliação/teste
  return limits[planType || ''] || {
    photoAnalysisPerDay: 0,        // ❌ Bloqueado - requer Premium
    workoutAnalysisPerDay: 0,       // ❌ Bloqueado - requer Premium
    customWorkoutsPerMonth: 0,     // ❌ Bloqueado - requer Premium
    textMessagesPerDay: 0,         // ❌ Bloqueado - requer Premium
    voiceMinutesPerDay: 0,         // ❌ Bloqueado - requer Premium
  };
}

