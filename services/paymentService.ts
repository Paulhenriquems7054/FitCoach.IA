/**
 * Serviço de Integração com Cakto
 * Gerencia pagamentos, assinaturas e recargas
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';
import type { User } from '../types';
import { createB2BCode } from './b2bCodeService';

// Tipos de recarga conforme página de vendas
export type RechargeType = 'turbo' | 'reserve' | 'pass_libre';

export interface RechargeConfig {
  type: RechargeType;
  name: string;
  price: number;
  description: string;
  caktoCheckoutId: string;
  // Configurações específicas
  minutes?: number; // Para turbo e reserve
  validityHours?: number; // Para turbo (24h)
  validityDays?: number; // Para pass_libre (30 dias)
  unlimited?: boolean; // Para pass_libre
}

// Configuração de recargas conforme página de vendas
export const RECHARGE_CONFIGS: Record<RechargeType, RechargeConfig> = {
  turbo: {
    type: 'turbo',
    name: 'Ajuda Rápida',
    price: 5.00,
    description: '+20 Minutos de Voz',
    caktoCheckoutId: 'TURBO_CHECKOUT_ID', // TODO: Obter ID real da Cakto
    minutes: 20,
    validityHours: 24,
  },
  reserve: {
    type: 'reserve',
    name: 'Minutos de Reserva',
    price: 12.90,
    description: '+100 Minutos de Voz',
    caktoCheckoutId: 'RESERVE_CHECKOUT_ID', // TODO: Obter ID real da Cakto
    minutes: 100,
    // Não expira
  },
  pass_libre: {
    type: 'pass_libre',
    name: 'Conversa Ilimitada',
    price: 19.90,
    description: 'Ilimitado por 30 dias',
    caktoCheckoutId: 'PASS_LIBRE_CHECKOUT_ID', // TODO: Obter ID real da Cakto
    unlimited: true,
    validityDays: 30,
  },
};

/**
 * Obtém link de checkout da Cakto para um plano de assinatura
 */
export function getCaktoCheckoutLink(planName: string): string | null {
  const baseUrl = 'https://pay.cakto.com.br/';

  const mapping: Record<string, string> = {
    // Planos B2C
    monthly: '3ujuqzz_703304',
    annual_vip: 'xphpm5f_703310',

    // Planos B2B (Academias)
    academy_starter: 'cemyp2n_668537',
    academy_growth: 'vi6djzq_668541',
    academy_pro: '3dis6ds_668546',

    // Planos Personal Trainer
    personal_team_5: '3dgheuc_666289',
    personal_team_15: '3etp85e_666303',
  };

  const checkoutId = mapping[planName];
  if (!checkoutId) {
    return null;
  }

  return `${baseUrl}${checkoutId}`;
}

/**
 * Obtém link de checkout da Cakto para uma recarga
 */
export function getCaktoRechargeLink(rechargeType: RechargeType): string | null {
  const config = RECHARGE_CONFIGS[rechargeType];
  if (!config || !config.caktoCheckoutId) {
    return null;
  }

  // Se o ID ainda não foi configurado (tem TODO), retornar null
  if (config.caktoCheckoutId.includes('CHECKOUT_ID')) {
    logger.warn(`Checkout ID não configurado para recarga ${rechargeType}`, 'paymentService');
    return null;
  }

  return `https://pay.cakto.com.br/${config.caktoCheckoutId}`;
}

/**
 * Inicia processo de checkout para assinatura
 */
export async function initiateSubscriptionCheckout(
  planName: string,
  userId: string,
  userEmail?: string
): Promise<{ checkoutUrl: string; paymentId?: string }> {
  const checkoutUrl = getCaktoCheckoutLink(planName);

  if (!checkoutUrl) {
    throw new Error(`Plano ${planName} não possui link de checkout configurado`);
  }

  // Criar registro de pagamento pendente no Supabase
  const supabase = getSupabaseClient();
  const { data: paymentRecord, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      amount: 0, // Será atualizado pelo webhook
      currency: 'BRL',
      status: 'pending',
      payment_provider: 'cakto',
      payment_type: 'subscription',
      metadata: {
        plan_name: planName,
        user_email: userEmail,
      },
    })
    .select()
    .single();

  if (error) {
    logger.error('Erro ao criar registro de pagamento', 'paymentService', error);
    // Continuar mesmo se falhar - o webhook pode criar o registro
  }

  return {
    checkoutUrl,
    paymentId: paymentRecord?.id,
  };
}

/**
 * Inicia processo de checkout para recarga
 */
export async function initiateRechargeCheckout(
  rechargeType: RechargeType,
  userId: string
): Promise<{ checkoutUrl: string; paymentId?: string }> {
  const config = RECHARGE_CONFIGS[rechargeType];
  const checkoutUrl = getCaktoRechargeLink(rechargeType);

  if (!checkoutUrl) {
    throw new Error(`Recarga ${rechargeType} não possui link de checkout configurado`);
  }

  // Criar registro de pagamento pendente no Supabase
  const supabase = getSupabaseClient();
  const { data: paymentRecord, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      amount: config.price,
      currency: 'BRL',
      status: 'pending',
      payment_provider: 'cakto',
      payment_type: 'recharge',
      metadata: {
        recharge_type: rechargeType,
        recharge_config: config,
      },
    })
    .select()
    .single();

  if (error) {
    logger.error('Erro ao criar registro de pagamento de recarga', 'paymentService', error);
    // Continuar mesmo se falhar - o webhook pode criar o registro
  }

  return {
    checkoutUrl,
    paymentId: paymentRecord?.id,
  };
}

/**
 * Processa confirmação de pagamento (chamado pelo webhook)
 */
export async function processPaymentConfirmation(
  caktoPaymentId: string,
  status: 'paid' | 'failed' | 'refunded',
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = getSupabaseClient();

  // Buscar pagamento pelo ID da Cakto
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('external_payment_id', caktoPaymentId)
    .maybeSingle();

  if (fetchError) {
    logger.error('Erro ao buscar pagamento', 'paymentService', fetchError);
    throw new Error('Erro ao buscar pagamento');
  }

  // Se não encontrou pelo external_id, tentar criar novo registro
  if (!payment) {
    logger.info('Pagamento não encontrado, criando novo registro', 'paymentService');
    
    // Extrair informações do metadata
    const userId = metadata?.user_id || metadata?.userId;
    const planName = metadata?.plan_name;
    const rechargeType = metadata?.recharge_type;

    if (!userId) {
      throw new Error('user_id não encontrado no metadata do pagamento');
    }

    // Criar novo registro
    const { data: newPayment, error: createError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        external_payment_id: caktoPaymentId,
        amount: metadata?.amount || 0,
        currency: metadata?.currency || 'BRL',
        status: status === 'paid' ? 'completed' : 'failed',
        payment_provider: 'cakto',
        payment_type: planName ? 'subscription' : rechargeType ? 'recharge' : 'unknown',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (createError) {
      logger.error('Erro ao criar registro de pagamento', 'paymentService', createError);
      throw new Error('Erro ao criar registro de pagamento');
    }

    // Processar baseado no tipo
    if (status === 'paid') {
      if (planName) {
        await activateSubscription(userId, planName, newPayment.id);
      } else if (rechargeType) {
        await activateRecharge(userId, rechargeType, newPayment.id);
      }
    }

    return;
  }

  // Atualizar status do pagamento
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: status === 'paid' ? 'completed' : status === 'refunded' ? 'refunded' : 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  if (updateError) {
    logger.error('Erro ao atualizar status do pagamento', 'paymentService', updateError);
    throw new Error('Erro ao atualizar status do pagamento');
  }

  // Se pagamento foi confirmado e ainda não foi processado
  if (status === 'paid' && payment.status !== 'completed') {
    const paymentType = payment.payment_type;
    const paymentMetadata = payment.metadata as any;

    if (paymentType === 'subscription') {
      await activateSubscription(payment.user_id, paymentMetadata?.plan_name, payment.id);
    } else if (paymentType === 'recharge') {
      await activateRecharge(payment.user_id, paymentMetadata?.recharge_type, payment.id);
    }
  }
}

/**
 * Ativa assinatura após confirmação de pagamento
 */
async function activateSubscription(
  userId: string,
  planName: string,
  paymentId: string
): Promise<void> {
  // Se for plano B2B, gerar código de ativação
  const b2bPlans = ['academy_starter', 'academy_growth', 'academy_pro', 'personal_team_5', 'personal_team_15'];
  if (b2bPlans.includes(planName)) {
    await activateB2BSubscription(userId, planName, paymentId);
    return;
  }
  const supabase = getSupabaseClient();

  // Buscar plano
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('name', planName)
    .maybeSingle();

  if (planError || !plan) {
    logger.error('Plano não encontrado', 'paymentService', planError);
    throw new Error(`Plano ${planName} não encontrado`);
  }

  // Calcular datas
  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = new Date(now);
  
  const billingCycle = planName === 'annual_vip' ? 'yearly' : 'monthly';
  if (billingCycle === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  // Criar ou atualizar assinatura
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (existingSubscription) {
    // Atualizar assinatura existente
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        plan_id: plan.id,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: periodStart,
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: 'cakto',
        updated_at: now.toISOString(),
      })
      .eq('id', existingSubscription.id);

    if (updateError) {
      logger.error('Erro ao atualizar assinatura', 'paymentService', updateError);
      throw new Error('Erro ao atualizar assinatura');
    }
  } else {
    // Criar nova assinatura
    const { error: createError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: periodStart,
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: 'cakto',
      });

    if (createError) {
      logger.error('Erro ao criar assinatura', 'paymentService', createError);
      throw new Error('Erro ao criar assinatura');
    }
  }

  // Verificar se é plano de IA individual (B2B2C)
  const isAiPlan = planName === 'ai_monthly' || planName === 'ai_annual_vip';
  
  // Atualizar usuário
  const updateData: any = {
    plan_type: planName as any,
    subscription_status: 'active',
    expiry_date: periodEnd.toISOString(),
    updated_at: now.toISOString(),
  };

  // Se for plano de IA individual (B2B2C), atualizar campos específicos de IA
  if (isAiPlan) {
    updateData.subscription_active = true; // Campo simplificado
    updateData.ai_subscription_status = 'active'; // Campo legado
    updateData.trial_active = false; // Desativar trial
    updateData.trial_expires_at = null; // Limpar expiração do trial
  }

  const { error: userUpdateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (userUpdateError) {
    logger.error('Erro ao atualizar usuário', 'paymentService', userUpdateError);
    // Não falhar - a assinatura já foi criada
  }

  logger.info(`Assinatura ${planName} ativada para usuário ${userId}`, 'paymentService');
}

/**
 * Ativa assinatura B2B e gera código de ativação
 */
async function activateB2BSubscription(
  userId: string,
  planName: string,
  paymentId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Obter informações do usuário (empresa)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, nome, username')
    .eq('id', userId)
    .single();
  
  if (userError || !userData) {
    throw new Error('Usuário não encontrado');
  }
  
  // Determinar número máximo de ativações baseado no plano
  const maxActivationsMap: Record<string, number> = {
    academy_starter: 20,
    academy_growth: 50,
    academy_pro: 100,
    personal_team_5: 5,
    personal_team_15: 15,
  };
  
  const maxActivations = maxActivationsMap[planName] || 20;
  
  // Criar código B2B
  const b2bCode = await createB2BCode(
    paymentId,
    userId, // business_id = userId da empresa
    userData.nome || userData.username || 'Empresa',
    planName,
    maxActivations
  );
  
  // Atualizar usuário com plano B2B
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 mês
  
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      plan_type: planName as any,
      subscription_status: 'active',
      expiry_date: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', userId);
  
  if (userUpdateError) {
    logger.error('Erro ao atualizar usuário B2B', 'paymentService', userUpdateError);
    // Não falhar - o código já foi criado
  }
  
  // Criar assinatura (opcional - para histórico)
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('name', planName)
    .maybeSingle();
  
  if (plan) {
    await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: 'cakto',
      });
  }
  
  logger.info(`Assinatura B2B ${planName} ativada. Código gerado: ${b2bCode.code}`, 'paymentService');
  
  // TODO: Enviar email/notificação com o código para o usuário
}

/**
 * Ativa recarga após confirmação de pagamento
 */
async function activateRecharge(
  userId: string,
  rechargeType: RechargeType,
  paymentId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const config = RECHARGE_CONFIGS[rechargeType];

  if (!config) {
    throw new Error(`Tipo de recarga ${rechargeType} não encontrado`);
  }

  const now = new Date();
  let expiresAt: Date | null = null;
  let quantity = 0;

  if (rechargeType === 'turbo') {
    // Ajuda Rápida: 20 minutos, válido por 24 horas
    quantity = config.minutes || 20;
    expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + (config.validityHours || 24));
  } else if (rechargeType === 'reserve') {
    // Minutos de Reserva: 100 minutos, não expira
    quantity = config.minutes || 100;
    expiresAt = null; // Não expira
  } else if (rechargeType === 'pass_libre') {
    // Conversa Ilimitada: 30 dias
    quantity = 0; // Ilimitado
    expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + (config.validityDays || 30));
  }

  // Criar recarga
  const { error: createError } = await supabase
    .from('recharges')
    .insert({
      user_id: userId,
      recharge_type: rechargeType,
      quantity: quantity,
      status: 'active',
      valid_until: expiresAt?.toISOString() || null,
      expires_at: expiresAt?.toISOString() || null,
      payment_id: paymentId,
    });

  if (createError) {
    logger.error('Erro ao criar recarga', 'paymentService', createError);
    throw new Error('Erro ao criar recarga');
  }

  // Se for pass_libre, não precisa atualizar boost_minutes_balance
  // Se for turbo ou reserve, atualizar boost_minutes_balance do usuário
  if (rechargeType === 'turbo' || rechargeType === 'reserve') {
    // Buscar boost atual
    const { data: userData } = await supabase
      .from('users')
      .select('boost_minutes_balance, boost_expires_at')
      .eq('id', userId)
      .single();

    const currentBoost = userData?.boost_minutes_balance || 0;
    const currentExpiresAt = userData?.boost_expires_at 
      ? new Date(userData.boost_expires_at)
      : null;

    let newBoost = currentBoost + quantity;
    let newExpiresAt = expiresAt;

    // Se já tinha boost e não expirou, manter a data de expiração mais distante
    if (currentExpiresAt && currentExpiresAt > now && expiresAt) {
      newExpiresAt = currentExpiresAt > expiresAt ? currentExpiresAt : expiresAt;
    }

    // Se reserve, não tem expiração
    if (rechargeType === 'reserve') {
      newExpiresAt = null;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        boost_minutes_balance: newBoost,
        boost_expires_at: newExpiresAt?.toISOString() || null,
      })
      .eq('id', userId);

    if (updateError) {
      logger.error('Erro ao atualizar boost do usuário', 'paymentService', updateError);
      // Não falhar - a recarga já foi criada
    }
  }

  logger.info(`Recarga ${rechargeType} ativada para usuário ${userId}`, 'paymentService');
}

/**
 * Verifica se usuário tem recarga ativa
 */
export async function hasActiveRecharge(
  userId: string,
  rechargeType: RechargeType
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('recharges')
    .select('id')
    .eq('user_id', userId)
    .eq('recharge_type', rechargeType)
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('Erro ao verificar recarga', 'paymentService', error);
    return false;
  }

  return !!data;
}
