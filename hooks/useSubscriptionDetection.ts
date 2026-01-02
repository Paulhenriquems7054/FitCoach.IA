import { useEffect, useState, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { getActiveSubscription } from '../services/supabaseService';
import { authService } from '../services/supabaseService';
import { saveUser } from '../services/databaseService';
import { logger } from '../utils/logger';

/**
 * Hook para detectar atualização de assinatura individual (B2C)
 * Verifica se a assinatura foi ativada após checkout
 */
export function useSubscriptionDetection(enabled: boolean = true) {
  const { user, setUser } = useUser();
  const [subscriptionUpdated, setSubscriptionUpdated] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopPollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSubscriptionStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !enabled) return;

    // Guardar status inicial da assinatura
    initialSubscriptionStatusRef.current = user.subscriptionStatus || 'inactive';

    const reloadUserFromSupabase = async () => {
      try {
        // Recarregar perfil do usuário do Supabase
        const updatedUser = await authService.getCurrentUserProfile();
        
        if (updatedUser) {
          // Salvar no IndexedDB local
          await saveUser(updatedUser);
          
          // Atualizar contexto
          setUser(prevUser => ({
            ...prevUser,
            ...updatedUser,
            // Preservar dados locais que não devem ser sobrescritos
            points: prevUser.points,
            disciplineScore: prevUser.disciplineScore,
            completedChallengeIds: prevUser.completedChallengeIds,
            weightHistory: prevUser.weightHistory,
          }));
          
          logger.info('Dados do usuário atualizados do Supabase', 'useSubscriptionDetection');
          return updatedUser;
        }
      } catch (error) {
        logger.error('Erro ao recarregar usuário do Supabase', 'useSubscriptionDetection', error);
      }
      return null;
    };

    // Polling: verificar a cada 3 segundos por até 2 minutos
    let attempts = 0;
    const maxAttempts = 40; // 2 minutos = 40 x 3 segundos

    const checkForSubscriptionUpdate = async () => {
      attempts++;
      
      try {
        // Verificar assinatura ativa
        const subscription = await getActiveSubscription(undefined, undefined, user.username);
        
        // Se encontrou assinatura ativa e não tinha antes, atualizar usuário
        if (subscription && subscription.status === 'active') {
          const currentStatus = user.subscriptionStatus || 'inactive';
          
          if (currentStatus !== 'active') {
            // Assinatura foi ativada! Recarregar usuário
            const updatedUser = await reloadUserFromSupabase();
            
            if (updatedUser) {
              setSubscriptionUpdated(true);
              stopPolling(); // Parar polling quando encontrar
              return;
            }
          }
        }
        
        // Também verificar diretamente no banco se subscription_status mudou
        const updatedUser = await reloadUserFromSupabase();
        if (updatedUser) {
          const newStatus = updatedUser.subscriptionStatus || 'inactive';
          if (newStatus === 'active' && initialSubscriptionStatusRef.current !== 'active') {
            setSubscriptionUpdated(true);
            stopPolling();
            return;
          }
        }
      } catch (error) {
        logger.error('Erro ao verificar assinatura', 'useSubscriptionDetection', error);
      }

      // Parar após maxAttempts
      if (attempts >= maxAttempts) {
        stopPolling();
      }
    };

    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (stopPollingTimeoutRef.current) {
        clearTimeout(stopPollingTimeoutRef.current);
        stopPollingTimeoutRef.current = null;
      }
    };

    // Primeira verificação após 2 segundos
    setTimeout(checkForSubscriptionUpdate, 2000);

    // Polling a cada 3 segundos
    pollingIntervalRef.current = setInterval(checkForSubscriptionUpdate, 3000);

    // Timeout de segurança: parar após 2 minutos
    stopPollingTimeoutRef.current = setTimeout(() => {
      stopPolling();
    }, 120000);

    return () => {
      stopPolling();
    };
  }, [user?.id, user?.username, enabled, setUser]);

  const clearSubscriptionUpdated = () => {
    setSubscriptionUpdated(false);
  };

  return { subscriptionUpdated, clearSubscriptionUpdated };
}
