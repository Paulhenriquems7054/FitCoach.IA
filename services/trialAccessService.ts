/**
 * Serviço centralizado de verificação de acesso baseado em trial
 * Gerencia períodos de teste e bloqueio após expiração
 */

import type { User } from '../types';
import { getAccountType } from '../utils/accountType';
import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export type Feature = 'voice' | 'chat' | 'meal_plan' | 'photo_analysis' | 'workout' | 'dashboard' | 'admin';

export interface AccessCheckResult {
  allowed: boolean;
  reason?: 'trial_expired' | 'trial_not_started' | 'subscription_expired' | 'feature_blocked';
  message?: string;
  daysRemaining?: number;
  trialEndDate?: string;
  accountType?: 'individual' | 'academy';
}

/**
 * Verifica se o trial expirou e atualiza o status do usuário
 */
export async function updateTrialStatus(user: User): Promise<User> {
  const now = new Date();
  const trialEndDate = user.trialEndDate ? new Date(user.trialEndDate) : null;
  
  // Se não tem trial configurado, não fazer nada
  if (!trialEndDate || !user.trialStartDate) {
    return user;
  }
  
  // Se trial expirou e status ainda não está como 'expired', atualizar
  if (now > trialEndDate && user.subscriptionStatus !== 'expired' && user.subscriptionStatus !== 'active') {
    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          subscription_status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        logger.error('Erro ao atualizar status de trial expirado', 'trialAccessService', error);
      } else {
        logger.info(`Trial expirado para usuário ${user.username}, status atualizado para 'expired'`, 'trialAccessService');
        return { ...user, subscriptionStatus: 'expired' };
      }
    } catch (error) {
      logger.error('Erro ao atualizar status de trial', 'trialAccessService', error);
    }
  }
  
  return user;
}

/**
 * Calcula dias restantes do trial
 */
export function getTrialDaysRemaining(user: User): number | null {
  if (!user.trialEndDate) {
    return null;
  }
  
  const now = new Date();
  const endDate = new Date(user.trialEndDate);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Verifica se o usuário pode acessar uma funcionalidade específica
 */
export async function checkAccess(user: User, feature: Feature): Promise<AccessCheckResult> {
  // Atualizar status do trial antes de verificar
  const updatedUser = await updateTrialStatus(user);
  
  const accountType = updatedUser.accountType || (getAccountType(updatedUser) === 'USER_GYM' ? 'academy' : 'individual');
  const subscriptionStatus = updatedUser.subscriptionStatus || 'trial';
  const daysRemaining = getTrialDaysRemaining(updatedUser);
  
  // Se status é 'active', permitir tudo
  if (subscriptionStatus === 'active') {
    return {
      allowed: true,
      accountType,
      daysRemaining: daysRemaining || undefined,
      trialEndDate: updatedUser.trialEndDate
    };
  }
  
  // Se trial expirou: BLOQUEIO TOTAL (sem retorno para free)
  if (subscriptionStatus === 'expired' || (daysRemaining !== null && daysRemaining === 0)) {
    // Academia: apenas dashboard admin e pagamento acessíveis
    if (accountType === 'academy') {
      if (feature === 'admin' || feature === 'dashboard') {
        // Admin pode acessar dashboard e tela de pagamento
        return {
          allowed: true,
          reason: 'trial_expired',
          message: 'Trial expirado. Acesse o dashboard para renovar sua assinatura.',
          accountType,
          daysRemaining: 0
        };
      }
      // Bloquear TODAS as outras funcionalidades
      return {
        allowed: false,
        reason: 'trial_expired',
        message: 'Trial expirado. Renove sua assinatura para continuar usando o FitCoach.IA.',
        accountType,
        daysRemaining: 0
      };
    }
    
    // Individual: BLOQUEIO TOTAL - nenhuma funcionalidade principal disponível
    // Apenas visualização de dados históricos (opcional) e tela de pagamento
    if (accountType === 'individual') {
      // Bloquear TODAS as funcionalidades principais
      if (['voice', 'chat', 'meal_plan', 'photo_analysis', 'workout'].includes(feature)) {
        return {
          allowed: false,
          reason: 'trial_expired',
          message: 'Trial expirado. Assine um plano para continuar usando esta funcionalidade.',
          accountType,
          daysRemaining: 0
        };
      }
      
      // Dashboard pode ser acessado apenas para ver histórico e ir para pagamento
      if (feature === 'dashboard') {
        return {
          allowed: true,
          reason: 'trial_expired',
          message: 'Trial expirado. Assine um plano para continuar usando todas as funcionalidades.',
          accountType,
          daysRemaining: 0
        };
      }
    }
  }
  
  // Durante o trial: verificar limites específicos
  if (subscriptionStatus === 'trial') {
    // Academia: limitar número de alunos durante trial
    if (accountType === 'academy' && feature === 'admin') {
      // Esta verificação será feita no componente de gerenciamento de alunos
      return {
        allowed: true,
        accountType,
        daysRemaining: daysRemaining || undefined,
        trialEndDate: updatedUser.trialEndDate
      };
    }
    
    // Individual: acesso normal durante trial
    if (accountType === 'individual') {
      return {
        allowed: true,
        accountType,
        daysRemaining: daysRemaining || undefined,
        trialEndDate: updatedUser.trialEndDate
      };
    }
  }
  
  // Default: permitir acesso
  return {
    allowed: true,
    accountType,
    daysRemaining: daysRemaining || undefined,
    trialEndDate: updatedUser.trialEndDate
  };
}

/**
 * Inicializa o trial para um novo usuário
 */
export function initializeTrial(user: User, accountType: 'individual' | 'academy'): User {
  const now = new Date();
  const trialDays = accountType === 'individual' ? 7 : 14;
  const trialEndDate = new Date(now);
  trialEndDate.setDate(trialEndDate.getDate() + trialDays);
  
  return {
    ...user,
    accountType,
    subscriptionStatus: 'trial',
    trialStartDate: now.toISOString(),
    trialEndDate: trialEndDate.toISOString()
  };
}

/**
 * Verifica se o trial está próximo do fim (3 dias ou menos)
 */
export function isTrialNearExpiry(user: User): boolean {
  const daysRemaining = getTrialDaysRemaining(user);
  return daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0;
}

