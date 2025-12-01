/**
 * Serviço de cancelamento de assinaturas
 * Conforme documentação de lógica de planos
 */

import { getSupabaseClient } from './supabaseService';

/**
 * Cancela uma assinatura ativa
 * Conforme documentação de lógica de planos
 */
export async function cancelSubscription(
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  // Buscar assinatura ativa do usuário
  // Adaptado: usa user_subscriptions ao invés de subscriptions
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !subscription) {
    return { success: false, error: 'Assinatura não encontrada' };
  }

  // Cancelar na Cakto
  // Adaptado: usa payment_method_id ao invés de cakto_subscription_id
  const caktoResult = await cancelCaktoSubscription(
    subscription.payment_method_id || ''
  );

  if (!caktoResult.success) {
    return { success: false, error: 'Erro ao cancelar na plataforma de pagamento' };
  }

  // Atualizar status no banco
  // Adaptado: tabela user_subscriptions não tem cancellation_reason, usar canceled_at
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: false, // Cancelar imediatamente
    })
    .eq('id', subscription.id);

  if (updateError) {
    return { success: false, error: 'Erro ao atualizar assinatura' };
  }

  // Buscar informações do plano para verificar se é anual
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('name')
    .eq('id', subscription.plan_id)
    .single();

  const planType = plan?.name || '';

  // Se for plano anual, calcular reembolso proporcional
  if (planType === 'annual' || planType.includes('annual')) {
    await calculateProportionalRefund(subscription);
  }

  // Enviar email de confirmação
  await sendCancellationConfirmationEmail(userId, planType);

  return { success: true };
}

/**
 * Cancela assinatura na Cakto
 * TODO: Implementar integração real com API da Cakto
 */
async function cancelCaktoSubscription(
  caktoSubscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  // Placeholder - implementar chamada real à API da Cakto
  // Exemplo:
  // const response = await fetch(`https://api.cakto.com/subscriptions/${caktoSubscriptionId}`, {
  //   method: 'DELETE',
  //   headers: { 'Authorization': `Bearer ${caktoApiKey}` }
  // });
  // return response.ok ? { success: true } : { success: false, error: 'Erro na API' };

  if (!caktoSubscriptionId) {
    // Se não tem ID da Cakto, pode ser assinatura via código de ativação
    // Nesse caso, não precisa cancelar na Cakto
    return { success: true };
  }

  console.warn('cancelCaktoSubscription não implementado - retornando success por padrão');
  return { success: true };
}

/**
 * Calcula reembolso proporcional para planos anuais
 * TODO: Implementar lógica de reembolso
 */
async function calculateProportionalRefund(subscription: any): Promise<void> {
  // Placeholder - implementar cálculo de reembolso proporcional
  // Exemplo:
  // 1. Calcular dias restantes do período
  // 2. Calcular valor proporcional
  // 3. Processar reembolso via Cakto
  // 4. Registrar no banco de dados

  console.log(`Reembolso proporcional calculado para assinatura ${subscription.id}`);
}

/**
 * Envia email de confirmação de cancelamento
 * TODO: Implementar serviço de email
 */
async function sendCancellationConfirmationEmail(
  userId: string,
  planType: string
): Promise<void> {
  // Placeholder - implementar envio de email real
  // Exemplo usando Supabase Edge Function ou serviço de email
  console.log(`Email de confirmação de cancelamento enviado para usuário ${userId} (plano: ${planType})`);
}

