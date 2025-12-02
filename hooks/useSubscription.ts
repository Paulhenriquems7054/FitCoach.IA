/**
 * Hook completo de assinatura
 * Conforme documentação de lógica de planos
 */

import { useState, useEffect, useCallback } from 'react';
import { checkSubscriptionStatus, SubscriptionStatus } from '../services/subscriptionService';
import { useUser } from '../context/UserContext';

export function useSubscription() {
  const { user } = useUser();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setStatus(null);
      setLoading(false);
      return;
    }

    // Usuário desenvolvedor prioritário: sempre Premium, sem limites
    if (user.username === 'dev123' || user.username === 'dev' || user.nome === 'Desenvolvedor') {
      const devStatus: SubscriptionStatus = {
        isActive: true,
        planType: 'developer',
        features: {
          photoAnalysis: true,
          workoutAnalysis: true,
          customWorkouts: true,
          textChat: true,
          voiceChat: true,
          voiceMinutesDaily: Infinity,
          voiceMinutesTotal: Infinity,
          voiceUnlimitedUntil: undefined,
        },
        expiresAt: null,
        canUpgrade: false,
      };
      setStatus(devStatus);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const subscriptionStatus = await checkSubscriptionStatus(user.id);
      setStatus(subscriptionStatus);
    } catch (err) {
      setError('Erro ao carregar assinatura');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.username]);

  useEffect(() => {
    refresh();
    // Atualizar a cada 5 minutos
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const canAccess = useCallback((feature: string): boolean => {
    if (!status || !status.isActive) return false;
    return status.features[feature as keyof typeof status.features] === true;
  }, [status]);

  const getRemainingMinutes = useCallback((): number => {
    if (!status || !status.isActive) return 0;
    if (status.features.voiceUnlimitedUntil) return Infinity;
    return status.features.voiceMinutesDaily;
  }, [status]);

  return {
    status,
    loading,
    error,
    isPremium: status?.isActive || false,
    planType: status?.planType || null,
    canAccess,
    getRemainingMinutes,
    refresh,
  };
}
