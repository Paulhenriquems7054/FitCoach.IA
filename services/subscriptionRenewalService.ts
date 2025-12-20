/**
 * Serviço de Renovação Automática de Assinaturas
 * Verifica e renova assinaturas que estão próximas do vencimento
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

/**
 * Verifica assinaturas que precisam ser renovadas
 * Deve ser executado diariamente via cron job no backend
 */
export async function checkAndRenewSubscriptions(): Promise<void> {
  const supabase = getSupabaseClient();
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  // Buscar assinaturas que expiram em até 3 dias e estão configuradas para renovação automática
  const { data: subscriptionsToRenew, error } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('status', 'active')
    .eq('cancel_at_period_end', false)
    .lte('current_period_end', threeDaysFromNow.toISOString())
    .gte('current_period_end', now.toISOString());

  if (error) {
    logger.error('Erro ao buscar assinaturas para renovação', 'subscriptionRenewalService', error);
    return;
  }

  if (!subscriptionsToRenew || subscriptionsToRenew.length === 0) {
    logger.info('Nenhuma assinatura precisa ser renovada', 'subscriptionRenewalService');
    return;
  }

  logger.info(`${subscriptionsToRenew.length} assinaturas encontradas para renovação`, 'subscriptionRenewalService');

  // Processar cada assinatura
  for (const subscription of subscriptionsToRenew) {
    try {
      await renewSubscription(subscription.id, subscription.user_id);
    } catch (error) {
      logger.error(`Erro ao renovar assinatura ${subscription.id}`, 'subscriptionRenewalService', error);
      // Continuar com outras assinaturas mesmo se uma falhar
    }
  }
}

/**
 * Renova uma assinatura específica
 */
async function renewSubscription(subscriptionId: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // Buscar assinatura atual
  const { data: subscription, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('id', subscriptionId)
    .single();

  if (fetchError || !subscription) {
    throw new Error('Assinatura não encontrada');
  }

  // Verificar se há pagamento recorrente configurado
  // Por enquanto, vamos apenas estender o período (em produção, processaria novo pagamento)
  const now = new Date();
  const currentPeriodEnd = new Date(subscription.current_period_end);
  const billingCycle = subscription.billing_cycle;

  // Calcular novo período
  const newPeriodStart = currentPeriodEnd.toISOString();
  const newPeriodEnd = new Date(currentPeriodEnd);
  
  if (billingCycle === 'monthly') {
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
  } else {
    newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
  }

  // Atualizar assinatura
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      current_period_start: newPeriodStart,
      current_period_end: newPeriodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', subscriptionId);

  if (updateError) {
    throw new Error(`Erro ao atualizar assinatura: ${updateError.message}`);
  }

  // Atualizar usuário
  await supabase
    .from('users')
    .update({
      expiry_date: newPeriodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', userId);

  logger.info(`Assinatura ${subscriptionId} renovada até ${newPeriodEnd.toISOString()}`, 'subscriptionRenewalService');
}

/**
 * Expira assinaturas que passaram da data de vencimento
 */
export async function expireOldSubscriptions(): Promise<void> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  // Buscar assinaturas que expiraram
  const { data: expiredSubscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('id, user_id')
    .eq('status', 'active')
    .lt('current_period_end', now);

  if (error) {
    logger.error('Erro ao buscar assinaturas expiradas', 'subscriptionRenewalService', error);
    return;
  }

  if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
    return;
  }

  // Marcar como expiradas
  for (const subscription of expiredSubscriptions) {
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      logger.error(`Erro ao expirar assinatura ${subscription.id}`, 'subscriptionRenewalService', updateError);
      continue;
    }

    // Atualizar usuário
    await supabase
      .from('users')
      .update({
        subscription_status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.user_id);

    logger.info(`Assinatura ${subscription.id} marcada como expirada`, 'subscriptionRenewalService');
  }
}

