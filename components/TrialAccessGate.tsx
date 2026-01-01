/**
 * Componente que bloqueia acesso a funcionalidades quando trial expira
 * Similar ao ProtectedFeature, mas específico para trial
 */

import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { checkAccess, Feature } from '../services/trialAccessService';
import { TrialExpiredPaywall } from './TrialExpiredPaywall';
import { logger } from '../utils/logger';

interface TrialAccessGateProps {
  feature: Feature;
  children: React.ReactNode;
  fallbackMessage?: string;
}

export const TrialAccessGate: React.FC<TrialAccessGateProps> = ({
  feature,
  children,
  fallbackMessage
}) => {
  const { user } = useUser();
  const [accessResult, setAccessResult] = useState<{ allowed: boolean; message?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    let mounted = true;
    
    const verifyAccess = async () => {
      if (!user) {
        if (mounted) {
          setIsChecking(false);
        }
        return;
      }
      
      try {
        const result = await checkAccess(user, feature);
        if (mounted) {
          setAccessResult(result);
          setHasError(false);
        }
      } catch (error) {
        logger.error('Erro ao verificar acesso de trial', 'TrialAccessGate', error);
        // Em caso de erro, permitir acesso (fail open) para não bloquear o usuário
        if (mounted) {
          setAccessResult({ allowed: true });
          setHasError(false);
        }
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };
    
    verifyAccess();
    
    return () => {
      mounted = false;
    };
  }, [user, feature]);
  
  if (isChecking) {
    return null; // Renderizar nada enquanto verifica (evita flash)
  }
  
  // Se houve erro ou não tem resultado, permitir acesso (fail open)
  if (hasError || !accessResult) {
    return <>{children}</>;
  }
  
  if (!accessResult.allowed) {
    return (
      <TrialExpiredPaywall 
        feature={feature}
        message={fallbackMessage || accessResult?.message}
      />
    );
  }
  
  return <>{children}</>;
};

