/**
 * Componente para exibir contador de dias restantes do trial de IA (B2B2C)
 * Exibido apenas para alunos durante o período de trial
 */

import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { getAiAccessStatus } from '../services/aiAccessService';
import { Alert } from './ui/Alert';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ClockIcon } from '@heroicons/react/24/outline';

export const AiTrialCounter: React.FC = () => {
  const { user } = useUser();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkTrialStatus = async () => {
      if (!user || user.tenantRole !== 'student' || !user.academyId) {
        setIsChecking(false);
        return;
      }

      try {
        const accessStatus = await getAiAccessStatus(user);
        
        if (accessStatus.hasAccess && accessStatus.reason === 'trial') {
          setDaysRemaining(accessStatus.daysRemaining || null);
        } else {
          setDaysRemaining(null);
        }
      } catch (error) {
        console.error('Erro ao verificar status de trial de IA', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkTrialStatus();
    
    // Verificar periodicamente (a cada minuto)
    const interval = setInterval(checkTrialStatus, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Não renderizar se ainda está verificando, não é aluno ou não está em trial
  if (isChecking || !daysRemaining || daysRemaining < 0) {
    return null;
  }

  // Diferentes níveis de urgência (mais leve que o TrialCounter da plataforma)
  const isWarning = daysRemaining <= 3;
  const isNormal = daysRemaining > 3;

  const handleViewPlans = () => {
    window.location.hash = '#/student-ai-plans';
  };

  // Aviso leve - apenas informação, não bloqueante
  return (
    <div className="mb-4">
      {isWarning ? (
        <Card className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700">
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  ⏰ Trial de IA: {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Ative seu plano de IA para continuar usando após o trial
                </p>
              </div>
            </div>
            <Button
              onClick={handleViewPlans}
              size="sm"
              variant="outline"
              className="whitespace-nowrap border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Ver Planos
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700">
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <ClockIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  ⏰ Trial de IA: {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Aproveite todas as funcionalidades de IA durante o período de teste
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

