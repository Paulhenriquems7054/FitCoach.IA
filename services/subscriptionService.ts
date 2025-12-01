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
    if (subscription.status !== 'active') {
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

