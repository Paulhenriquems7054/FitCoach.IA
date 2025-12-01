/**
 * Serviço de códigos de ativação para planos B2B e Personais
 * Conforme documentação de lógica de planos
 */

import { getSupabaseClient, getActiveSubscription } from './supabaseService';

export interface ActivationCode {
  id: string;
  code: string; // Ex: "ACADEMIA-X", "PERSONAL-Y"
  type: 'b2b' | 'personal';
  companyId?: string;
  personalTrainerId?: string;
  planType: string;
  licensesTotal: number;
  licensesUsed: number;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

/**
 * Valida um código de ativação
 * Conforme documentação de lógica de planos
 */
export async function validateActivationCode(
  code: string
): Promise<{ valid: boolean; code?: ActivationCode; error?: string }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('activation_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Código inválido ou expirado' };
  }

  const now = new Date();
  if (data.expires_at && new Date(data.expires_at) < now) {
    return { valid: false, error: 'Código expirado' };
  }

  if (data.licenses_used >= data.licenses_total) {
    return { valid: false, error: 'Código esgotado (todas as licenças foram usadas)' };
  }

  return { valid: true, code: data as any };
}

/**
 * Ativa um usuário com código de ativação
 * Conforme documentação de lógica de planos
 */
export async function activateUserWithCode(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  // 1. Validar código
  const validation = await validateActivationCode(code);

  if (!validation.valid || !validation.code) {
    return { success: false, error: validation.error };
  }

  const activationCode = validation.code;

  // 2. Verificar se usuário já tem assinatura ativa
  const existingSubscription = await getActiveSubscription(userId);

  if (existingSubscription) {
    return { success: false, error: 'Usuário já possui assinatura ativa' };
  }

  // 3. Buscar informações do plano vinculado ao código
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('name', activationCode.planType)
    .single();

  if (planError || !plan) {
    return { success: false, error: 'Plano vinculado ao código não encontrado' };
  }

  // 4. Criar assinatura vinculada ao código
  // Nota: O documento menciona campos activation_code_id, company_id, personal_trainer_id, is_recurring
  // mas a tabela user_subscriptions não tem esses campos. Usando payment_provider para identificar.
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1); // Assinatura mensal

  const { error: subError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: plan.id,
      status: 'active',
      billing_cycle: 'monthly',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      payment_provider: 'activation_code', // Identifica que foi via código de ativação
      // Nota: Campos do documento que não existem na tabela:
      // activation_code_id, company_id, personal_trainer_id, is_recurring
      // Esses dados podem ser armazenados em metadata se necessário
    });

  if (subError) {
    return { success: false, error: 'Erro ao criar assinatura' };
  }

  // 5. Atualizar usuário com plan_type
  await supabase
    .from('users')
    .update({
      plan_type: activationCode.planType as any,
      subscription_status: 'active',
    })
    .eq('id', userId);

  // 6. Incrementar licenças usadas
  await supabase
    .from('activation_codes')
    .update({
      licenses_used: activationCode.licensesUsed + 1,
    })
    .eq('id', activationCode.id);

  return { success: true };
}

