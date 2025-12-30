/**
 * Serviço para gerenciar limites específicos de trial
 * - 5 minutos diários de voz (totalizando 15 minutos nos 3 dias)
 * - 1 análise de prato durante todo o trial
 * - 1 geração de plano alimentar durante todo o trial
 */

import type { User } from '../types';
import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';
import { getTrialDaysRemaining } from './trialAccessService';

export interface TrialLimitsStatus {
  voice: {
    dailyLimitSeconds: number; // 300 segundos = 5 minutos
    canUse: boolean;
    remainingToday: number; // segundos restantes hoje
    totalUsedInTrial: number; // total usado durante todo o trial
    totalAvailableInTrial: number; // 900 segundos = 15 minutos total
  };
  photoAnalysis: {
    canUse: boolean;
    used: number; // quantas análises já foram feitas
    limit: number; // 1 durante todo o trial
  };
  mealPlan: {
    canUse: boolean;
    used: number; // quantos planos já foram gerados
    limit: number; // 1 durante todo o trial
  };
}

/**
 * Verifica se o usuário está em trial
 * ESTRATÉGIA: Alunos recebem 3 dias grátis de IA, usuários indicados também
 * Após trial, alunos precisam assinar plano individual (B2C)
 */
function isInTrial(user: User): boolean {
  // Verificar se tem trial ativo (alunos e usuários indicados)
  return user.trialActive === true && 
         user.trialExpiresAt && 
         new Date(user.trialExpiresAt) > new Date();
}

/**
 * Obtém o status completo dos limites de trial
 */
export async function getTrialLimitsStatus(user: User): Promise<TrialLimitsStatus> {
  const supabase = getSupabaseClient();
  
  // Se não está em trial, retornar limites padrão (sem restrições)
  if (!isInTrial(user)) {
    return {
      voice: {
        dailyLimitSeconds: 900, // 15 minutos padrão
        canUse: true,
        remainingToday: 900,
        totalUsedInTrial: 0,
        totalAvailableInTrial: 900,
      },
      photoAnalysis: {
        canUse: true,
        used: 0,
        limit: Infinity,
      },
      mealPlan: {
        canUse: true,
        used: 0,
        limit: Infinity,
      },
    };
  }

  // Buscar dados do usuário do Supabase
  const { data: userData, error } = await supabase
    .from('users')
    .select('voice_daily_limit_seconds, voice_used_today_seconds, last_usage_date, trial_photo_analysis_count, trial_meal_plan_count, trial_voice_total_seconds')
    .eq('id', user.id || '')
    .single();

  if (error || !userData) {
    logger.warn('Erro ao buscar limites de trial, usando valores padrão', 'trialLimitsService', error);
    // Retornar valores padrão para trial
    return {
      voice: {
        dailyLimitSeconds: 300, // 5 minutos diários
        canUse: true,
        remainingToday: 300,
        totalUsedInTrial: 0,
        totalAvailableInTrial: 900, // 15 minutos total
      },
      photoAnalysis: {
        canUse: true,
        used: 0,
        limit: 1,
      },
      mealPlan: {
        canUse: true,
        used: 0,
        limit: 1,
      },
    };
  }

  // Calcular limites de voz
  const dailyLimitSeconds = userData.voice_daily_limit_seconds || 300; // 5 minutos
  const totalAvailableInTrial = 900; // 15 minutos total (5 min x 3 dias)
  const totalUsedInTrial = userData.trial_voice_total_seconds || 0;
  
  // Reset diário se necessário
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastUsageDate = userData.last_usage_date 
    ? new Date(userData.last_usage_date).toISOString().split('T')[0]
    : null;
  
  let usedToday = userData.voice_used_today_seconds || 0;
  if (lastUsageDate !== today) {
    usedToday = 0;
  }
  
  const remainingToday = Math.max(0, dailyLimitSeconds - usedToday);
  const remainingInTrial = Math.max(0, totalAvailableInTrial - totalUsedInTrial);
  const canUseVoice = remainingInTrial > 0 && remainingToday > 0;

  // Limites de análise de foto
  const photoAnalysisUsed = userData.trial_photo_analysis_count || 0;
  const photoAnalysisLimit = 1;
  const canUsePhotoAnalysis = photoAnalysisUsed < photoAnalysisLimit;

  // Limites de plano alimentar
  const mealPlanUsed = userData.trial_meal_plan_count || 0;
  const mealPlanLimit = 1;
  const canUseMealPlan = mealPlanUsed < mealPlanLimit;

  return {
    voice: {
      dailyLimitSeconds,
      canUse: canUseVoice,
      remainingToday,
      totalUsedInTrial,
      totalAvailableInTrial,
    },
    photoAnalysis: {
      canUse: canUsePhotoAnalysis,
      used: photoAnalysisUsed,
      limit: photoAnalysisLimit,
    },
    mealPlan: {
      canUse: canUseMealPlan,
      used: mealPlanUsed,
      limit: mealPlanLimit,
    },
  };
}

/**
 * Registra uso de voz durante o trial
 */
export async function recordTrialVoiceUsage(userId: string, secondsUsed: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    
    // Buscar dados atuais
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('trial_voice_total_seconds, voice_used_today_seconds, last_usage_date')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      return { success: false, error: 'Erro ao buscar dados do usuário' };
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastUsageDate = userData.last_usage_date 
      ? new Date(userData.last_usage_date).toISOString().split('T')[0]
      : null;

    // Reset diário se necessário
    let usedToday = userData.voice_used_today_seconds || 0;
    if (lastUsageDate !== today) {
      usedToday = 0;
    }

    const totalUsedInTrial = (userData.trial_voice_total_seconds || 0) + secondsUsed;
    const newUsedToday = usedToday + secondsUsed;

    // Atualizar no Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        trial_voice_total_seconds: totalUsedInTrial,
        voice_used_today_seconds: newUsedToday,
        last_usage_date: today,
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('Erro ao registrar uso de voz no trial', 'trialLimitsService', updateError);
      return { success: false, error: 'Erro ao atualizar uso' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Erro ao registrar uso de voz no trial', 'trialLimitsService', error);
    return { success: false, error: 'Erro ao processar' };
  }
}

/**
 * Registra uso de análise de foto durante o trial
 */
export async function recordTrialPhotoAnalysis(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    
    // Buscar dados atuais
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('trial_photo_analysis_count')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      return { success: false, error: 'Erro ao buscar dados do usuário' };
    }

    const currentCount = userData.trial_photo_analysis_count || 0;
    const newCount = currentCount + 1;

    // Atualizar no Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        trial_photo_analysis_count: newCount,
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('Erro ao registrar análise de foto no trial', 'trialLimitsService', updateError);
      return { success: false, error: 'Erro ao atualizar contador' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Erro ao registrar análise de foto no trial', 'trialLimitsService', error);
    return { success: false, error: 'Erro ao processar' };
  }
}

/**
 * Registra uso de geração de plano alimentar durante o trial
 */
export async function recordTrialMealPlan(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    
    // Buscar dados atuais
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('trial_meal_plan_count')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      return { success: false, error: 'Erro ao buscar dados do usuário' };
    }

    const currentCount = userData.trial_meal_plan_count || 0;
    const newCount = currentCount + 1;

    // Atualizar no Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        trial_meal_plan_count: newCount,
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('Erro ao registrar plano alimentar no trial', 'trialLimitsService', updateError);
      return { success: false, error: 'Erro ao atualizar contador' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Erro ao registrar plano alimentar no trial', 'trialLimitsService', error);
    return { success: false, error: 'Erro ao processar' };
  }
}

/**
 * Verifica se pode usar análise de foto (trial)
 */
export async function canUsePhotoAnalysis(user: User): Promise<{ allowed: boolean; message?: string }> {
  if (!isInTrial(user)) {
    return { allowed: true };
  }

  const limits = await getTrialLimitsStatus(user);
  if (!limits.photoAnalysis.canUse) {
    return {
      allowed: false,
      message: 'Você já usou sua análise de prato gratuita do trial. Assine um plano para continuar usando esta funcionalidade.',
    };
  }

  return { allowed: true };
}

/**
 * Verifica se pode gerar plano alimentar (trial)
 */
export async function canUseMealPlan(user: User): Promise<{ allowed: boolean; message?: string }> {
  // Desenvolvedor sempre tem acesso
  const isDeveloper = user?.username === 'dev123' || user?.username === 'dev' || user?.nome === 'Desenvolvedor';
  if (isDeveloper) {
    return { allowed: true };
  }

  if (!isInTrial(user)) {
    return { allowed: true };
  }

  const limits = await getTrialLimitsStatus(user);
  if (!limits.mealPlan.canUse) {
    return {
      allowed: false,
      message: 'Você já gerou seu plano alimentar gratuito do trial. Assine um plano para continuar usando esta funcionalidade.',
    };
  }

  return { allowed: true };
}

