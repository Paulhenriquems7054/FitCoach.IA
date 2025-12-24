/**
 * Componente para exibir contador de dias restantes do trial
 */

import React from 'react';
import { useUser } from '../context/UserContext';
import { getTrialDaysRemaining, isTrialNearExpiry } from '../services/trialAccessService';
import { Alert } from './ui/Alert';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { redirectToSalesPage } from '../constants/salesPage';

export const TrialCounter: React.FC = () => {
  const { user } = useUser();
  
  if (!user || !user.trialEndDate) {
    return null;
  }
  
  const daysRemaining = getTrialDaysRemaining(user);
  const nearExpiry = isTrialNearExpiry(user);
  const isStudent = user.tenantRole === 'student' && user.academyId;
  
  if (daysRemaining === null || daysRemaining < 0) {
    return null;
  }
  
  // Se trial expirou, não mostrar contador (mostrar banner de expirado em vez disso)
  if (user.subscriptionStatus === 'expired' || daysRemaining === 0) {
    return null;
  }
  
  // Diferentes níveis de urgência
  const isUrgent = daysRemaining === 1;
  const isWarning = daysRemaining <= 3;
  const isNormal = daysRemaining > 3;
  
  const handleSubscribe = () => {
    // Se for aluno, redirecionar para página de vendas externa (seção B2C)
    if (isStudent) {
      redirectToSalesPage('B2C_PRICING');
    } else {
      // Outros usuários: redirecionar para premium interno
      window.location.hash = '#/premium';
    }
  };
  
  return (
    <div className="mb-4">
      {isUrgent ? (
        <Alert type="error" title="⚠️ Trial expira hoje!" className="mb-2 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <span className="font-semibold">
                Seu período de teste expira <strong>hoje</strong>! Assine agora para não perder o acesso.
              </span>
            </div>
            <Button
              onClick={handleSubscribe}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
            >
              Assinar Agora
            </Button>
          </div>
        </Alert>
      ) : isWarning ? (
        <Alert type="warning" title="⏰ Trial expirando em breve!" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span>
                Seu período de teste expira em <strong>{daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</strong>.
                Assine agora para continuar usando todas as funcionalidades!
              </span>
            </div>
            <Button
              onClick={handleSubscribe}
              size="sm"
              variant="primary"
              className="whitespace-nowrap"
            >
              Assinar Agora
            </Button>
          </div>
        </Alert>
      ) : (
        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700">
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <ClockIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  ⏰ Trial Premium: {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Aproveite todas as funcionalidades durante o período de teste
                </p>
              </div>
            </div>
            <Button
              onClick={handleSubscribe}
              size="sm"
              variant="outline"
              className="whitespace-nowrap border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              Assinar agora
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

