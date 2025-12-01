/**
 * Utilitários para validação de acesso a features
 * Conforme documentação de lógica de planos
 */

import { SubscriptionStatus } from '../services/subscriptionService';

/**
 * Valida acesso a uma feature específica
 * Conforme documentação de lógica de planos
 */
export function validateFeatureAccess(
  feature: string,
  subscriptionStatus: SubscriptionStatus
): { allowed: boolean; reason?: string } {
  if (!subscriptionStatus.isActive) {
    return {
      allowed: false,
      reason: 'Assinatura inativa. Renove ou assine um plano.',
    };
  }

  switch (feature) {
    case 'photoAnalysis':
    case 'workoutAnalysis':
    case 'customWorkouts':
    case 'textChat':
      // Todos os planos premium têm acesso
      return { allowed: true };

    case 'voiceChat':
      if (!subscriptionStatus.features.voiceChat) {
        return {
          allowed: false,
          reason: 'Chat de voz não disponível no seu plano.',
        };
      }

      const remaining = subscriptionStatus.features.voiceMinutesDaily;
      if (remaining <= 0 && !subscriptionStatus.features.voiceUnlimitedUntil) {
        return {
          allowed: false,
          reason: 'Limite diário de voz atingido. Compre uma recarga para continuar.',
        };
      }

      return { allowed: true };

    default:
      return { allowed: false, reason: 'Recurso desconhecido' };
  }
}

/**
 * Obtém mensagem de acesso baseado no status da assinatura
 * Conforme tabela de regras de acesso do documento
 */
export function getAccessMessage(
  subscriptionStatus: SubscriptionStatus | null,
  subscriptionRawStatus?: 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing'
): { message: string; action?: string; actionUrl?: string } {
  // Sem assinatura - Modo trial/demo
  if (!subscriptionStatus) {
    return {
      message: 'Modo trial/demo com recursos limitados',
      action: 'Assinar Agora',
      actionUrl: '#/premium',
    };
  }

  // Assinatura Ativa - Acesso completo
  if (subscriptionStatus.isActive && subscriptionRawStatus === 'active') {
    return {
      message: 'Acesso completo a todos os recursos do plano',
    };
  }

  // Assinatura Expirada - Acesso bloqueado, mostrar prompt de renovação
  if (subscriptionStatus.expiresAt && new Date(subscriptionStatus.expiresAt) < new Date()) {
    return {
      message: 'Assinatura expirada. Renove para continuar usando todos os recursos.',
      action: 'Renovar Assinatura',
      actionUrl: '#/premium',
    };
  }

  // Assinatura Cancelada - Acesso bloqueado, mostrar opções de reativação
  if (subscriptionRawStatus === 'canceled') {
    return {
      message: 'Assinatura cancelada. Reative sua assinatura para continuar usando todos os recursos.',
      action: 'Reativar Assinatura',
      actionUrl: '#/premium',
    };
  }

  // Assinatura Suspensa (past_due) - Acesso bloqueado, mostrar problema de pagamento
  if (subscriptionRawStatus === 'past_due') {
    return {
      message: 'Pagamento pendente. Regularize seu pagamento para continuar usando todos os recursos.',
      action: 'Regularizar Pagamento',
      actionUrl: '#/premium',
    };
  }

  // Assinatura Inativa (outros casos)
  return {
    message: 'Assinatura inativa. Renove ou assine um plano para continuar.',
    action: 'Assinar Agora',
    actionUrl: '#/premium',
  };
}

