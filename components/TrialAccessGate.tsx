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
  
  useEffect(() => {
    const verifyAccess = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }
      
      try {
        const result = await checkAccess(user, feature);
        setAccessResult(result);
      } catch (error) {
        logger.error('Erro ao verificar acesso de trial', 'TrialAccessGate', error);
        // Em caso de erro, permitir acesso (fail open)
        setAccessResult({ allowed: true });
      } finally {
        setIsChecking(false);
      }
    };
    
    verifyAccess();
  }, [user, feature]);
  
  if (isChecking) {
    return null; // Ou um spinner
  }
  
  if (!accessResult || !accessResult.allowed) {
    return (
      <TrialExpiredPaywall 
        feature={feature}
        message={fallbackMessage || accessResult?.message}
      />
    );
  }
  
  return <>{children}</>;
};

