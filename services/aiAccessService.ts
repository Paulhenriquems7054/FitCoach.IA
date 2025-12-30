import type { User } from '../types';
import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export type AiAccessReason = 'subscription' | 'trial' | 'trial_expired' | 'none';

export interface AiAccessStatus {
  hasAccess: boolean;
  reason: AiAccessReason;
  daysRemaining?: number;
}

function getDaysRemaining(end?: string | null): number | undefined {
  if (!end) return undefined;
  const now = new Date();
  const endDate = new Date(end);
  const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Obtém a assinatura ativa de IA para um usuário (tabela subscriptions)
 */
async function getActiveUserAiSubscription(userId: string) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('owner_type', 'user')
      .eq('owner_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      logger.error('Erro ao buscar assinatura de IA do usuário', 'aiAccessService', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Erro fatal ao buscar assinatura de IA do usuário', 'aiAccessService', error);
    return null;
  }
}

export async function getAiAccessStatus(user: User): Promise<AiAccessStatus> {
  if (!user || !user.id) {
    return { hasAccess: false, reason: 'none' };
  }

  // 1. Verificar assinatura ativa (prioridade: campo simplificado ou tabela subscriptions)
  const hasActiveSubscription = user.subscriptionActive === true || 
    (user.aiSubscriptionStatus === 'active') ||
    await getActiveUserAiSubscription(user.id as any) !== null;
  
  if (hasActiveSubscription) {
    return { hasAccess: true, reason: 'subscription' };
  }

  // 2. Verificar trial ativo (apenas para usuários indicados, não alunos)
  // Alunos que acessam pelo código da academia NÃO têm trial
  const isStudent = user.tenantRole === 'student' || user.gymRole === 'student';
  const trialExpires = user.trialExpiresAt || user.aiTrialEndAt || null;
  const isTrialActive = !isStudent && 
    (user.trialActive === true || 
     (user.aiSubscriptionStatus === 'trial' && trialExpires && new Date(trialExpires) > new Date()));
  
  if (isTrialActive && trialExpires) {
    const daysRemaining = getDaysRemaining(trialExpires);
    if (daysRemaining !== undefined && daysRemaining > 0) {
      return { hasAccess: true, reason: 'trial', daysRemaining };
    }
  }

  // 3. Trial expirado ou nunca iniciou
  if (user.aiSubscriptionStatus === 'trial' || user.aiSubscriptionStatus === 'expired' || 
      (trialExpires && new Date(trialExpires) < new Date())) {
    // Registrar evento de trial expirado (métricas) apenas uma vez
    if (user.aiSubscriptionStatus !== 'expired' && user.id) {
      try {
        const { trackTrialExpired } = await import('./aiMetricsService');
        await trackTrialExpired(user.id as any, user.academyId || undefined);
      } catch (error) {
        logger.warn('Erro ao registrar trial expirado (métricas)', 'aiAccessService', error);
      }
    }
    return { hasAccess: false, reason: 'trial_expired' };
  }

  return { hasAccess: false, reason: 'none' };
}

/**
 * Garante que o usuário pode usar IA (Gemini) para uma feature específica
 * Lança erro com code/reason para o frontend exibir paywall
 */
export async function assertAiAccessOrThrow(user: User, feature: 'chat' | 'voice' | 'vision' | 'plan') {
  const status = await getAiAccessStatus(user);
  if (!status.hasAccess) {
    const error: any = new Error('AI_ACCESS_DENIED');
    error.code = 'AI_ACCESS_DENIED';
    error.reason = status.reason;
    error.feature = feature;
    throw error;
  }
}


