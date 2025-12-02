import { useUser } from '../context/UserContext';
import { useEffect, useState } from 'react';
import { getActiveSubscription } from '../services/supabaseService';
import { logger } from '../utils/logger';

interface PremiumCheckResult {
  allowed: boolean;
  message?: string;
  redirectTo?: string;
}

/**
 * Verifica se um planType é considerado Premium
 */
const isPremiumPlan = (planType?: string): boolean => {
  if (!planType || planType === 'free') {
    return false;
  }
  
  // Todos os planos pagos são considerados Premium
  const premiumPlans = [
    'monthly',
    'annual_vip',
    'academy_starter_mini',
    'academy_starter',
    'academy_growth',
    'academy_pro',
    'personal_team_5',
    'personal_team_15'
  ];
  
  return premiumPlans.includes(planType);
};

export const usePremiumAccess = () => {
  const { user } = useUser();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.username) {
        setIsLoading(false);
        return;
      }
      
      try {
        const subscription = await getActiveSubscription(undefined, undefined, user.username);
        setHasActiveSubscription(!!subscription);
      } catch (error) {
        logger.error('Erro ao verificar assinatura', 'usePremiumAccess', error);
        setHasActiveSubscription(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSubscription();
  }, [user?.username, user?.planType, user?.subscriptionStatus]);
  
  // Verifica se é Premium baseado no planType OU assinatura ativa
  const isPremium = isPremiumPlan(user?.planType) || 
                    (user?.subscriptionStatus === 'active' && hasActiveSubscription) ||
                    user?.subscription === 'premium';
  
  /**
   * Verifica se o usuário tem acesso a uma funcionalidade premium
   */
  const requirePremium = (feature: string, customMessage?: string): PremiumCheckResult => {
    if (isPremium) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      message: customMessage || 'Esta funcionalidade está disponível apenas para assinantes Premium.',
      redirectTo: '#/premium'
    };
  };
  
  /**
   * Verifica se o usuário pode gerar relatórios
   * Premium: ilimitado | Free: limitado
   */
  const canGenerateReport = (reportCount: number = 0): boolean => {
    if (isPremium) {
      return true; // Ilimitado para Premium
    }
    // Free: máximo 5 relatórios por semana (pode ser ajustado)
    return reportCount < 5;
  };
  
  /**
   * Verifica se o usuário pode analisar fotos
   * Premium: ilimitado | Free: limitado
   */
  const canAnalyzePhoto = (photosAnalyzedToday: number = 0): boolean => {
    if (isPremium) {
      return true; // Ilimitado para Premium
    }
    // Free: máximo 10 análises por dia (pode ser ajustado)
    return photosAnalyzedToday < 10;
  };
  
  /**
   * Retorna a mensagem de limite atingido
   */
  const getLimitMessage = (feature: string, limit: string): string => {
    if (isPremium) {
      return '';
    }
    
    const messages: Record<string, string> = {
      reports: `Limite de ${limit} relatórios atingido. Faça upgrade para Premium e tenha acesso ilimitado.`,
      photos: `Limite de ${limit} análises por dia atingido. Faça upgrade para Premium e tenha acesso ilimitado.`,
    };
    
    return messages[feature] || `Limite atingido. Faça upgrade para Premium.`;
  };
  
  return { 
    isPremium,
    isLoading,
    hasActiveSubscription,
    requirePremium, 
    canGenerateReport,
    canAnalyzePhoto,
    getLimitMessage
  };
};

