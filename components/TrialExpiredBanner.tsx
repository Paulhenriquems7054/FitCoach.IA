/**
 * Banner destacado exibido quando o trial expira
 * Aparece na tela inicial e bloqueia acesso às funcionalidades
 */

import React from 'react';
import { useUser } from '../context/UserContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { redirectToSalesPage } from '../constants/salesPage';

export const TrialExpiredBanner: React.FC = () => {
  const { user } = useUser();
  
  // Só mostrar se trial expirou
  if (!user || user.subscriptionStatus !== 'expired') {
    return null;
  }
  
  const accountType = user.accountType || 'individual';
  const isAcademy = accountType === 'academy';
  const isStudent = user.tenantRole === 'student' && user.academyId;
  
  const handleGoToPlans = () => {
    // Se for aluno, redirecionar para página de vendas externa (seção B2C)
    if (isStudent) {
      redirectToSalesPage('B2C_PRICING');
    } else if (isAcademy) {
      // Se for academia, redirecionar para seção B2B
      redirectToSalesPage('B2B');
    } else {
      // Individual B2C, redirecionar para seção B2C
      redirectToSalesPage('B2C_PRICING');
    }
  };
  
  return (
    <Card className="border-2 border-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 mb-6">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="rounded-full bg-red-500 p-3">
              <LockClosedIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6" />
              Seu trial expirou
            </h2>
            <p className="text-red-800 dark:text-red-200 mb-4">
              {isAcademy 
                ? 'O período de teste da sua academia expirou. Renove sua assinatura para continuar usando todas as funcionalidades do FitCoach.IA.'
                : 'Seu período de teste de 7 dias expirou. Assine um plano para continuar usando todas as funcionalidades do FitCoach.IA.'}
            </p>
            <Button
              onClick={handleGoToPlans}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isAcademy ? 'Renovar Assinatura' : 'Ver Planos e Assinar'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

