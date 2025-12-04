/**
 * Serviço completo de verificação de assinaturas
 * Implementa cache, verificação de recursos e controle de acesso
 */

import { getSupabaseClient, getActiveSubscription } from './supabaseService';
import { logger } from '../utils/logger';

export interface SubscriptionStatus {
  isActive: boolean;
  planType: string | null;
  features: {
    photoAnalysis: boolean;
    workoutAnalysis: boolean;
    customWorkouts: boolean;
    textChat: boolean;
    voiceChat: boolean;
    voiceMinutesDaily: number; // Minutos disponíveis hoje
    voiceMinutesTotal: number; // Total acumulado (Banco de Voz)
    voiceUnlimitedUntil?: Date; // Se tem Passe Livre ativo
  };
  expiresAt: Date | null;
  canUpgrade: boolean;
}

export interface UserAccess {
  userId: string;
  subscriptionId: string | null;
  isPremium: boolean;
  planType: SubscriptionStatus['planType'] | null;
  features: SubscriptionStatus['features'];
}

/**
 * Verifica o status completo da assinatura do usuário
 * Inclui verificação de recursos disponíveis, minutos de voz, etc.
 */
export async function checkSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  try {
    const supabase = getSupabaseClient();

    // 1. Buscar assinatura ativa no Supabase
    const subscription = await getActiveSubscription(userId);

    if (!subscription) {
      return {
        isActive: false,
        planType: null,
        features: getFreeTierFeatures(),
        expiresAt: null,
        canUpgrade: true,
      };
    }

    // 2. Verificar se assinatura não expirou
    const now = new Date();
    const endDate = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;

    if (endDate && endDate < now) {
      // Assinatura expirada - atualizar status
      await supabase
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id);

      return {
        isActive: false,
        planType: null,
        features: getFreeTierFeatures(),
        expiresAt: endDate,
        canUpgrade: true,
      };
    }

    // Verificar status da assinatura
    const isPremiumStatus = subscription.status === 'active' || subscription.status === 'trialing';
    if (!isPremiumStatus) {
      return {
        isActive: false,
        planType: null,
        features: getFreeTierFeatures(),
        expiresAt: endDate,
        canUpgrade: true,
      };
    }

    // 3. Buscar informações do plano
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();

    if (planError || !plan) {
      logger.warn('Plano não encontrado para assinatura', 'subscriptionService', planError);
      return {
        isActive: false,
        planType: null,
        features: getFreeTierFeatures(),
        expiresAt: endDate,
        canUpgrade: true,
      };
    }

    // 4. Buscar dados de uso de voz do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('voice_daily_limit_seconds, voice_used_today_seconds, voice_balance_upsell, last_usage_date')
      .eq('id', userId)
      .single();

    if (userError) {
      logger.warn('Erro ao buscar dados de voz do usuário', 'subscriptionService', userError);
    }

    // 5. Calcular recursos disponíveis
    const voiceUsage = userData || {};
    const dailyReset = getDailyResetTime();
    const today = dailyReset.toISOString().split('T')[0];
    const lastUsageDate = voiceUsage.last_usage_date 
      ? new Date(voiceUsage.last_usage_date).toISOString().split('T')[0]
      : null;

    // Reset diário se necessário
    let minutesUsedToday = 0;
    if (lastUsageDate === today) {
      minutesUsedToday = Math.floor((voiceUsage.voice_used_today_seconds || 0) / 60);
    } else {
      // Reset necessário - atualizar no banco
      await supabase
        .from('users')
        .update({
          voice_used_today_seconds: 0,
          last_usage_date: today,
        })
        .eq('id', userId);
    }

    const planLimits = getPlanLimits(plan.name);
    const voiceMinutesDaily = Math.max(
      0,
      planLimits.voiceMinutesDaily - minutesUsedToday
    );

    // Verificar Passe Livre (buscar em recargas ativas)
    const { data: activePassLibre } = await supabase
      .from('recharges')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('recharge_type', 'pass_libre')
      .eq('status', 'active')
      .gt('expires_at', now.toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const unlimitedUntil = activePassLibre?.expires_at
      ? new Date(activePassLibre.expires_at)
      : null;
    const hasUnlimitedVoice = unlimitedUntil && unlimitedUntil > now;

    // 6. Retornar status
    return {
      isActive: true,
      planType: plan.name,
      features: {
        photoAnalysis: true, // Todos os planos premium têm acesso
        workoutAnalysis: true,
        customWorkouts: true,
        textChat: true,
        voiceChat: true,
        voiceMinutesDaily: hasUnlimitedVoice ? Infinity : voiceMinutesDaily,
        voiceMinutesTotal: Math.floor((voiceUsage.voice_balance_upsell || 0) / 60), // Converter segundos para minutos
        voiceUnlimitedUntil: unlimitedUntil || undefined,
      },
      expiresAt: endDate,
      canUpgrade: false,
    };
  } catch (error) {
    logger.error('Erro ao verificar assinatura', 'subscriptionService', error);
    // Fallback: permitir acesso limitado
    return {
      isActive: false,
      planType: null,
      features: getFreeTierFeatures(),
      expiresAt: null,
      canUpgrade: true,
    };
  }
}

/**
 * Retorna os limites do plano
 */
function getPlanLimits(planType: string): { voiceMinutesDaily: number } {
  const limits: Record<string, { voiceMinutesDaily: number }> = {
    monthly: { voiceMinutesDaily: 15 },
    annual_vip: { voiceMinutesDaily: 15 },
    academy_starter_mini: { voiceMinutesDaily: 15 },
    academy_starter: { voiceMinutesDaily: 15 },
    academy_growth: { voiceMinutesDaily: 15 },
    academy_pro: { voiceMinutesDaily: 15 },
    personal_team_5: { voiceMinutesDaily: 15 },
    personal_team_15: { voiceMinutesDaily: 15 },
  };

  return limits[planType] || { voiceMinutesDaily: 0 };
}

/**
 * Retorna as features do plano gratuito
 */
function getFreeTierFeatures(): SubscriptionStatus['features'] {
  return {
    photoAnalysis: false, // Apenas preview
    workoutAnalysis: false, // Apenas preview
    customWorkouts: false,
    textChat: false, // Apenas mensagens limitadas
    voiceChat: false,
    voiceMinutesDaily: 0,
    voiceMinutesTotal: 0,
  };
}

/**
 * Retorna a data/hora de reset diário (00:00:00)
 */
function getDailyResetTime(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Interface para status de acesso do usuário
 */
export interface AccessStatus {
  hasAccess: boolean;
  source: 'b2c' | 'academy' | 'personal' | null;
  plan: any | null;
  features: {
    photoAnalysis: boolean;
    workoutAnalysis: boolean;
    customWorkouts: boolean;
    textChat: boolean;
    voiceChat: boolean;
    voiceMinutesDaily: number;
  };
}

/**
 * Verifica o acesso do usuário (B2C, Academia ou Personal Trainer)
 * Esta é a função principal para verificar acesso premium
 */
export async function checkUserAccess(
  userId: string,
  userEmail: string
): Promise<AccessStatus> {
  const supabase = getSupabaseClient();

  try {
    // 1. Verificar assinatura B2C direta
    const { data: b2cSubscription } = await supabase
      .from('user_subscriptions')
      .select('*, app_plans(*)')
      .eq('user_email', userEmail)
      .eq('status', 'active')
      .single();

    if (b2cSubscription) {
      return {
        hasAccess: true,
        source: 'b2c',
        plan: b2cSubscription,
        features: getFeaturesForPlan(b2cSubscription.app_plans),
      };
    }

    // 2. Verificar vínculo com academia
    const { data: academyLink } = await supabase
      .from('student_academy_links')
      .select(`
        *,
        academy_subscriptions (
          *,
          app_plans (*)
        )
      `)
      .eq('student_user_id', userId)
      .eq('status', 'active')
      .single();

    if (academyLink) {
      const academy = academyLink.academy_subscriptions;
      
      // Verificar se a assinatura da academia ainda está ativa
      if (academy && academy.status === 'active') {
        return {
          hasAccess: true,
          source: 'academy',
          plan: academy,
          features: getFeaturesForPlan(academy.app_plans),
        };
      } else {
        // Academia cancelou ou expirou
        return {
          hasAccess: false,
          source: null,
          plan: null,
          features: getFreeTierFeaturesForAccess(),
        };
      }
    }

    // 3. Verificar vínculo com personal trainer (se implementado)
    // TODO: Implementar verificação de personal trainer quando necessário

    // 4. Sem acesso Premium
    return {
      hasAccess: false,
      source: null,
      plan: null,
      features: getFreeTierFeaturesForAccess(),
    };
  } catch (error) {
    logger.error('Erro ao verificar acesso do usuário', 'subscriptionService', error);
    return {
      hasAccess: false,
      source: null,
      plan: null,
      features: getFreeTierFeaturesForAccess(),
    };
  }
}

/**
 * Retorna as features baseadas no plano
 */
function getFeaturesForPlan(plan: any): AccessStatus['features'] {
  return {
    photoAnalysis: true,
    workoutAnalysis: true,
    customWorkouts: true,
    textChat: true,
    voiceChat: true,
    voiceMinutesDaily: plan?.minutes_voice_per_day || 15,
  };
}

/**
 * Retorna as features do plano gratuito (para AccessStatus)
 */
function getFreeTierFeaturesForAccess(): AccessStatus['features'] {
  return {
    photoAnalysis: false,
    workoutAnalysis: false,
    customWorkouts: false,
    textChat: false,
    voiceChat: false,
    voiceMinutesDaily: 0,
  };
}

