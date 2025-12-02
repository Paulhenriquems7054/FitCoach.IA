/**
 * Serviço para upgrade/downgrade de planos
 * Gerencia mudança de planos de assinatura
 */

import { getSupabaseClient, getActiveSubscription, getSubscriptionPlans } from './supabaseService';
import { cancelSubscription } from './cancellationService';
import { logger } from '../utils/logger';

export interface UpgradeDowngradeResult {
  success: boolean;
  error?: string;
  newSubscriptionId?: string;
}

/**
 * Faz upgrade ou downgrade de plano
 * Cancela plano atual e cria novo plano
 */
export async function changePlan(
  userId: string,
  newPlanName: string
): Promise<UpgradeDowngradeResult> {
  try {
    const supabase = getSupabaseClient();

    // 1. Buscar assinatura atual
    const currentSubscription = await getActiveSubscription(userId);

    if (!currentSubscription) {
      return { success: false, error: 'Nenhuma assinatura ativa encontrada' };
    }

    // 2. Buscar novo plano
    const plans = await getSubscriptionPlans();
    const newPlan = plans.find(p => p.name === newPlanName);

    if (!newPlan) {
      return { success: false, error: 'Plano não encontrado' };
    }

    // 3. Verificar se é realmente uma mudança
    if (currentSubscription.plan_id === newPlan.id) {
      return { success: false, error: 'Usuário já possui este plano' };
    }

    // 4. Cancelar assinatura atual (imediato se for downgrade, no final do período se for upgrade)
    const isUpgrade = isPlanUpgrade(currentSubscription.plan_id, newPlan.id, plans);
    
    if (isUpgrade) {
      // Upgrade: cancelar no final do período atual
      await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
        })
        .eq('id', currentSubscription.id);
    } else {
      // Downgrade: cancelar imediatamente
      const cancelResult = await cancelSubscription(userId);
      if (!cancelResult.success) {
        return { success: false, error: cancelResult.error || 'Erro ao cancelar assinatura atual' };
      }
    }

    // 5. Criar nova assinatura
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // Mensal por padrão

    const { data: newSubscription, error: createError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: newPlan.id,
        status: 'active',
        billing_cycle: 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: currentSubscription.payment_provider,
        payment_method_id: currentSubscription.payment_method_id,
      })
      .select()
      .single();

    if (createError || !newSubscription) {
      logger.error('Erro ao criar nova assinatura', 'upgradeDowngradeService', createError);
      return { success: false, error: 'Erro ao criar nova assinatura' };
    }

    // 6. Atualizar usuário
    await supabase
      .from('users')
      .update({
        plan_type: newPlanName as any,
        subscription_status: 'active',
      })
      .eq('id', userId);

    // 7. Criar/atualizar chave de API automaticamente se for admin de academia
    try {
      const { autoSetupGymApiKey } = await import('./gymApiKeyService');
      await autoSetupGymApiKey(userId, 'active');
    } catch (apiKeyError) {
      // Não bloquear upgrade se falhar ao criar chave
      logger.warn('Erro ao criar chave de API automaticamente (não crítico)', 'upgradeDowngradeService', apiKeyError);
    }

    logger.info(`Plano alterado para ${newPlanName} para usuário ${userId}`, 'upgradeDowngradeService');

    return {
      success: true,
      newSubscriptionId: newSubscription.id,
    };
  } catch (error) {
    logger.error('Erro ao alterar plano', 'upgradeDowngradeService', error);
    return { success: false, error: 'Erro inesperado ao alterar plano' };
  }
}

/**
 * Verifica se a mudança é um upgrade ou downgrade
 */
function isPlanUpgrade(
  currentPlanId: string,
  newPlanId: string,
  allPlans: any[]
): boolean {
  // Ordem de planos (do mais básico ao mais premium)
  const planOrder = [
    'free',
    'monthly',
    'annual_vip',
    'academy_starter_mini',
    'academy_starter',
    'academy_growth',
    'academy_pro',
    'personal_team_5',
    'personal_team_15',
  ];

  const currentPlan = allPlans.find(p => p.id === currentPlanId);
  const newPlan = allPlans.find(p => p.id === newPlanId);

  if (!currentPlan || !newPlan) {
    return false;
  }

  const currentIndex = planOrder.indexOf(currentPlan.name);
  const newIndex = planOrder.indexOf(newPlan.name);

  return newIndex > currentIndex;
}

/**
 * Lista planos disponíveis para upgrade/downgrade
 */
export async function getAvailablePlansForChange(
  userId: string
): Promise<{ current: any; available: any[] }> {
  const currentSubscription = await getActiveSubscription(userId);
  const allPlans = await getSubscriptionPlans();

  return {
    current: currentSubscription
      ? allPlans.find(p => p.id === currentSubscription.plan_id)
      : null,
    available: allPlans,
  };
}

