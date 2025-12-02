/**
 * Serviço de códigos de ativação para planos B2B e Personais
 * Conforme documentação de lógica de planos
 * 
 * ATUALIZADO: Agora integra com companies para modelo B2B completo
 */

import { getSupabaseClient, getActiveSubscription } from './supabaseService';
import { getCompanyByMasterCode, addCompanyLicense } from './companyService';
import { logger } from '../utils/logger';

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
 * Ativa um usuário com código mestre de empresa (B2B)
 * NOVO: Usa companies ao invés de activation_codes
 */
export async function activateUserWithCompanyCode(
  userId: string,
  masterCode: string
): Promise<{ success: boolean; error?: string; companyName?: string }> {
  try {
    // 1. Buscar empresa pelo código mestre
    const companyResult = await getCompanyByMasterCode(masterCode);

    if (!companyResult.success || !companyResult.company) {
      return { success: false, error: 'Código mestre inválido ou empresa não encontrada' };
    }

    const company = companyResult.company;

    // 2. Verificar se usuário já tem assinatura ativa
    const existingSubscription = await getActiveSubscription(userId);

    if (existingSubscription) {
      return { success: false, error: 'Usuário já possui assinatura ativa' };
    }

    // 3. Buscar informações do plano da empresa
    const supabase = getSupabaseClient();
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', company.planType)
      .single();

    if (planError || !plan) {
      return { success: false, error: 'Plano da empresa não encontrado' };
    }

    // 4. Criar assinatura para o aluno
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // Assinatura mensal (renovada pela empresa)

    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        billing_cycle: 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        payment_provider: 'company_b2b', // Identifica que foi via empresa B2B
      })
      .select()
      .single();

    if (subError || !subscription) {
      return { success: false, error: 'Erro ao criar assinatura' };
    }

    // 5. Adicionar licença na empresa
    const licenseResult = await addCompanyLicense({
      companyId: company.id,
      userId: userId,
      subscriptionId: subscription.id,
      activatedBy: 'student_self', // Aluno ativou sozinho
      notes: `Ativado via código mestre: ${masterCode}`,
    });

    if (!licenseResult.success) {
      // Reverter assinatura se não conseguir adicionar licença
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscription.id);
      
      return { success: false, error: licenseResult.error || 'Erro ao adicionar licença' };
    }

    // 6. Atualizar usuário com plan_type e vincular à empresa
    await supabase
      .from('users')
      .update({
        plan_type: company.planType as any,
        subscription_status: 'active',
        gym_id: company.id, // Vincular à empresa
        gym_role: 'student',
        is_gym_managed: true,
      })
      .eq('id', userId);

    logger.info(`Aluno ${userId} ativado com código mestre ${masterCode} da empresa ${company.name}`, 'activationCodeService');

    return { success: true, companyName: company.name };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro ao ativar usuário com código mestre', 'activationCodeService', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Ativa um usuário com código de ativação (legado - mantido para compatibilidade)
 * Conforme documentação de lógica de planos
 * 
 * NOTA: Para planos B2B, prefira usar activateUserWithCompanyCode()
 */
export async function activateUserWithCode(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  // 1. Primeiro tentar como código mestre de empresa (B2B)
  const companyResult = await activateUserWithCompanyCode(userId, code);
  if (companyResult.success) {
    return companyResult;
  }

  // 2. Se falhar, tentar como activation_code (legado)
  const validation = await validateActivationCode(code);

  if (!validation.valid || !validation.code) {
    return { success: false, error: validation.error || companyResult.error };
  }

  const activationCode = validation.code;

  // 3. Verificar se usuário já tem assinatura ativa
  const existingSubscription = await getActiveSubscription(userId);

  if (existingSubscription) {
    return { success: false, error: 'Usuário já possui assinatura ativa' };
  }

  // 4. Buscar informações do plano vinculado ao código
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('name', activationCode.planType)
    .single();

  if (planError || !plan) {
    return { success: false, error: 'Plano vinculado ao código não encontrado' };
  }

  // 5. Criar assinatura vinculada ao código
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
    });

  if (subError) {
    return { success: false, error: 'Erro ao criar assinatura' };
  }

  // 6. Atualizar usuário com plan_type
  await supabase
    .from('users')
    .update({
      plan_type: activationCode.planType as any,
      subscription_status: 'active',
    })
    .eq('id', userId);

  // 7. Incrementar licenças usadas
  await supabase
    .from('activation_codes')
    .update({
      licenses_used: activationCode.licensesUsed + 1,
    })
    .eq('id', activationCode.id);

  // 8. Criar chave de API automaticamente se for admin de academia
  try {
    const { autoSetupGymApiKey } = await import('./gymApiKeyService');
    await autoSetupGymApiKey(userId, 'active');
  } catch (apiKeyError) {
    // Não bloquear ativação se falhar ao criar chave
    logger.warn('Erro ao criar chave de API automaticamente (não crítico)', 'activationCodeService', apiKeyError);
  }

  return { success: true };
}

