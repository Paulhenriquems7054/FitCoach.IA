/**
 * Componente para proteger features premium
 * Implementação conforme documentação de lógica de planos
 */

import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useUser } from '../context/UserContext';
import { Button } from './ui/Button';
import { redirectToSalesPage } from '../constants/salesPage';

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
  const { user } = useUser();

  // Desenvolvedor sempre tem acesso
  const isDeveloper = user?.username === 'dev123' || user?.username === 'dev' || user?.nome === 'Desenvolvedor';
  if (isDeveloper) {
    return <>{children}</>;
  }

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const handleViewPlans = () => {
    // Se for aluno, redirecionar para página de vendas externa (seção B2C)
    const isStudent = user?.tenantRole === 'student' && user?.academyId;
    if (isStudent) {
      redirectToSalesPage('B2C_PRICING');
    } else {
      // Outros usuários: redirecionar para premium interno
      window.location.hash = '#/premium';
    }
  };

  return (
    <div className="premium-locked">
      {showUpgradePrompt && (
        <div className="upgrade-prompt">
          <p>Esta funcionalidade requer assinatura Premium</p>
          <Button onClick={handleViewPlans}>
            Ver Planos
          </Button>
        </div>
      )}
    </div>
  );
}

