/**
 * Hook para verificar acesso premium do usuário
 * Verifica assinaturas B2C, vínculos com academias e personal trainers
 */

import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { checkUserAccess, AccessStatus } from '../services/subscriptionService';
import { logger } from '../utils/logger';

export function useAccess() {
  const { user } = useUser();
  const [access, setAccess] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccess(null);
      setLoading(false);
      return;
    }
    loadAccess();
  }, [user?.id, user?.email]);

  async function loadAccess() {
    if (!user?.id || !user?.email) {
      setAccess(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const status = await checkUserAccess(user.id, user.email);
      setAccess(status);
    } catch (error) {
      logger.error('Erro ao verificar acesso', 'useAccess', error);
      setAccess({
        hasAccess: false,
        source: null,
        plan: null,
        features: {
          photoAnalysis: false,
          workoutAnalysis: false,
          customWorkouts: false,
          textChat: false,
          voiceChat: false,
          voiceMinutesDaily: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    access,
    loading,
    isPremium: access?.hasAccess || false,
    refresh: loadAccess,
  };
}

