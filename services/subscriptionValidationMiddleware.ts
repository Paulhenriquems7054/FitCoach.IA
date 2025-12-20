/**
 * Middleware de Validação de Assinatura
 * 
 * Valida se academias e usuários têm assinaturas ativas antes de permitir acesso
 * 
 * Prioridade: CRÍTICA
 * Data: 2025-01-27
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export interface SubscriptionValidationResult {
  hasAccess: boolean;
  reason?: string;
  subscription?: any;
  company?: any;
}

/**
 * Valida se uma academia tem assinatura ativa
 */
export async function validateGymSubscription(
  gymId: string
): Promise<SubscriptionValidationResult> {
  const supabase = getSupabaseClient();

  try {
    // 1. Buscar company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*, subscription_id')
      .eq('id', gymId)
      .single();

    if (companyError || !company) {
      logger.warn(`Company não encontrada: ${gymId}`, 'subscriptionValidation');
      return {
        hasAccess: false,
        reason: 'Academia não encontrada',
      };
    }

    // 2. Verificar status da company
    if (company.status !== 'active') {
      logger.warn(
        `Company ${gymId} com status inativo: ${company.status}`,
        'subscriptionValidation'
      );
      return {
        hasAccess: false,
        reason: `Academia com status: ${company.status}`,
        company,
      };
    }

    // 3. Verificar pagamento
    if (company.payment_status !== 'paid') {
      logger.warn(
        `Company ${gymId} com pagamento não pago: ${company.payment_status}`,
        'subscriptionValidation'
      );
      return {
        hasAccess: false,
        reason: `Pagamento com status: ${company.payment_status}`,
        company,
      };
    }

    // 4. Verificar assinatura (se existir)
    if (company.subscription_id) {
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', company.subscription_id)
        .single();

      if (subError || !subscription) {
        logger.warn(
          `Assinatura não encontrada para company ${gymId}`,
          'subscriptionValidation'
        );
      } else if (subscription.status !== 'active') {
        logger.warn(
          `Assinatura inativa para company ${gymId}: ${subscription.status}`,
          'subscriptionValidation'
        );
        return {
          hasAccess: false,
          reason: `Assinatura com status: ${subscription.status}`,
          company,
          subscription,
        };
      }
    }

    // 5. Verificar expiração
    if (company.expires_at && new Date(company.expires_at) < new Date()) {
      logger.warn(
        `Company ${gymId} com assinatura expirada`,
        'subscriptionValidation'
      );
      return {
        hasAccess: false,
        reason: 'Assinatura expirada',
        company,
      };
    }

    return {
      hasAccess: true,
      company,
    };
  } catch (error) {
    logger.error('Erro ao validar assinatura', 'subscriptionValidation', error);
    return {
      hasAccess: false,
      reason: 'Erro ao validar assinatura',
    };
  }
}

/**
 * Valida se um usuário tem acesso (individual ou via academia)
 */
export async function validateUserAccess(
  userId: string
): Promise<SubscriptionValidationResult> {
  const supabase = getSupabaseClient();

  try {
    // 1. Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('gym_id, subscription_status, expiry_date, access_blocked')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.warn(`Usuário não encontrado: ${userId}`, 'subscriptionValidation');
      return {
        hasAccess: false,
        reason: 'Usuário não encontrado',
      };
    }

    // 2. Verificar se está bloqueado
    if (user.access_blocked) {
      return {
        hasAccess: false,
        reason: 'Acesso bloqueado',
      };
    }

    // 3. Se for aluno de academia, validar academia
    if (user.gym_id) {
      return await validateGymSubscription(user.gym_id);
    }

    // 4. Se for usuário individual, validar assinatura individual
    if (user.subscription_status !== 'active') {
      logger.warn(
        `Usuário ${userId} com status inativo: ${user.subscription_status}`,
        'subscriptionValidation'
      );
      return {
        hasAccess: false,
        reason: `Status de assinatura: ${user.subscription_status}`,
      };
    }

    if (user.expiry_date && new Date(user.expiry_date) < new Date()) {
      logger.warn(`Usuário ${userId} com assinatura expirada`, 'subscriptionValidation');
      return {
        hasAccess: false,
        reason: 'Assinatura expirada',
      };
    }

    return {
      hasAccess: true,
    };
  } catch (error) {
    logger.error('Erro ao validar acesso', 'subscriptionValidation', error);
    return {
      hasAccess: false,
      reason: 'Erro ao validar acesso',
    };
  }
}

/**
 * Middleware para usar em Edge Functions ou API routes
 * Lança erro se acesso for negado
 */
export async function requireActiveSubscription(
  gymId?: string,
  userId?: string
): Promise<void> {
  let result: SubscriptionValidationResult;

  if (gymId) {
    result = await validateGymSubscription(gymId);
  } else if (userId) {
    result = await validateUserAccess(userId);
  } else {
    throw new Error('gymId ou userId deve ser fornecido');
  }

  if (!result.hasAccess) {
    const error = new Error(result.reason || 'Acesso negado: assinatura inativa');
    (error as any).code = 'SUBSCRIPTION_INACTIVE';
    (error as any).validationResult = result;
    throw error;
  }
}

/**
 * Hook para usar em componentes React
 * Retorna se o usuário atual tem acesso
 */
export async function useSubscriptionAccess(): Promise<{
  hasAccess: boolean;
  isLoading: boolean;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      hasAccess: false,
      isLoading: false,
      error: 'Usuário não autenticado',
    };
  }

  try {
    const result = await validateUserAccess(user.id);
    return {
      hasAccess: result.hasAccess,
      isLoading: false,
      error: result.reason,
    };
  } catch (error: any) {
    logger.error('Erro ao verificar acesso', 'useSubscriptionAccess', error);
    return {
      hasAccess: false,
      isLoading: false,
      error: error.message || 'Erro ao verificar acesso',
    };
  }
}

