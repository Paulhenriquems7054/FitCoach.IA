/**
 * Serviço de renovação automática de assinaturas
 * Conforme documentação de lógica de planos
 */

import { getSupabaseClient } from './supabaseService';

/**
 * Verifica e renova assinaturas que precisam ser renovadas
 * Conforme documentação de lógica de planos
 */
export async function checkAndRenewSubscriptions(): Promise<void> {
  const supabase = getSupabaseClient();

  // Buscar assinaturas que precisam ser renovadas
  // Adaptado: usa user_subscriptions ao invés de subscriptions
  // Adaptado: usa current_period_end ao invés de next_billing_date
  // Adaptado: verifica payment_provider para identificar recorrentes (is_recurring não existe)
  const { data: subscriptions, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('status', 'active')
    .neq('payment_provider', 'activation_code') // Apenas recorrentes
    .lte('current_period_end', new Date().toISOString());

  if (error) {
    console.error('Erro ao buscar assinaturas para renovação:', error);
    return;
  }

  for (const subscription of subscriptions || []) {
    try {
      // Verificar pagamento na Cakto
      // Nota: Adaptado - usa payment_method_id ao invés de cakto_subscription_id
      const paymentStatus = await checkCaktoPayment(subscription.payment_method_id || '');

      if (paymentStatus === 'paid') {
        // Renovar assinatura
        // Buscar informações do plano para determinar o tipo
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('name')
          .eq('id', subscription.plan_id)
          .single();

        const planType = plan?.name || subscription.billing_cycle || 'monthly';
        const newEndDate = calculateNextBillingDate(
          planType,
          new Date()
        );

        await supabase
          .from('user_subscriptions')
          .update({
            current_period_start: new Date().toISOString(),
            current_period_end: newEndDate.toISOString(),
            status: 'active',
          })
          .eq('id', subscription.id);

        // Enviar email de confirmação
        await sendRenewalConfirmationEmail(subscription.user_id);
      } else {
        // Pagamento falhou - suspender assinatura
        // Adaptado: usa 'past_due' ao invés de 'suspended' (não existe na tabela)
        await supabase
          .from('user_subscriptions')
          .update({ status: 'past_due' })
          .eq('id', subscription.id);

        // Enviar email de notificação
        await sendPaymentFailedEmail(subscription.user_id);
      }
    } catch (error) {
      console.error(`Erro ao renovar assinatura ${subscription.id}:`, error);
    }
  }
}

/**
 * Calcula a próxima data de cobrança baseado no tipo de plano
 * Conforme documentação de lógica de planos
 */
function calculateNextBillingDate(
  planType: string,
  currentDate: Date
): Date {
  const nextDate = new Date(currentDate);

  if (planType.includes('monthly') || planType.includes('b2b') || planType.includes('personal')) {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (planType === 'annual' || planType.includes('annual')) {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    // Padrão: mensal
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
}

/**
 * Verifica status de pagamento na Cakto
 * TODO: Implementar integração real com API da Cakto
 */
async function checkCaktoPayment(caktoSubscriptionId: string): Promise<'paid' | 'failed' | 'pending'> {
  // Placeholder - implementar chamada real à API da Cakto
  // Exemplo:
  // const response = await fetch(`https://api.cakto.com/subscriptions/${caktoSubscriptionId}`);
  // const data = await response.json();
  // return data.status === 'paid' ? 'paid' : 'failed';
  
  console.warn('checkCaktoPayment não implementado - retornando paid por padrão');
  return 'paid';
}

/**
 * Envia email de confirmação de renovação
 * TODO: Implementar serviço de email
 */
async function sendRenewalConfirmationEmail(userId: string): Promise<void> {
  // Placeholder - implementar envio de email real
  // Exemplo usando Supabase Edge Function ou serviço de email
  console.log(`Email de confirmação de renovação enviado para usuário ${userId}`);
}

/**
 * Envia email de notificação de falha no pagamento
 * TODO: Implementar serviço de email
 */
async function sendPaymentFailedEmail(userId: string): Promise<void> {
  // Placeholder - implementar envio de email real
  // Exemplo usando Supabase Edge Function ou serviço de email
  console.log(`Email de falha no pagamento enviado para usuário ${userId}`);
}

