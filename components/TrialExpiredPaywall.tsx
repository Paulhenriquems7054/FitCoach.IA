/**
 * Componente de paywall exibido quando o trial expira
 */

import React from 'react';
import { useUser } from '../context/UserContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { redirectToSalesPage, SALES_PAGE_SECTIONS } from '../constants/salesPage';

interface TrialExpiredPaywallProps {
  feature?: string;
  message?: string;
}

export const TrialExpiredPaywall: React.FC<TrialExpiredPaywallProps> = ({ 
  feature,
  message 
}) => {
  const { user } = useUser();
  
  const accountType = user?.accountType || 'individual';
  const isAcademy = accountType === 'academy';
  const isStudent = user?.tenantRole === 'student' && user?.academyId;
  
  const handleUpgrade = () => {
    // Se for aluno (B2B2C), redirecionar para seção B2C da página de vendas externa
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
              <LockClosedIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Trial Expirado
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {message || (
                isAcademy 
                  ? 'O período de teste da sua academia expirou. Renove sua assinatura para continuar usando o FitCoach.IA.'
                  : 'Seu período de teste de 7 dias expirou. Assine um plano para continuar usando todas as funcionalidades.'
              )}
            </p>
          </div>
          
          {feature && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong>Funcionalidade bloqueada:</strong> {feature}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button
              onClick={handleUpgrade}
              className="w-full"
              size="lg"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {isAcademy ? 'Renovar Assinatura' : 'Assinar Agora'}
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Escolha o plano ideal para você e continue aproveitando todas as funcionalidades
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

