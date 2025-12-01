/**
 * Componente para proteger features premium
 * Implementação conforme documentação de lógica de planos
 */

import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Button } from './ui/Button';

interface ProtectedFeatureProps {
  feature: 'photoAnalysis' | 'workoutAnalysis' | 'customWorkouts' | 'textChat' | 'voiceChat';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function ProtectedFeature({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: ProtectedFeatureProps) {
  const { canAccess, isPremium } = useSubscription();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="premium-locked">
      {showUpgradePrompt && (
        <div className="upgrade-prompt">
          <p>Esta funcionalidade requer assinatura Premium</p>
          <Button onClick={() => { window.location.hash = '#/premium'; }}>
            Ver Planos
          </Button>
        </div>
      )}
    </div>
  );
}

