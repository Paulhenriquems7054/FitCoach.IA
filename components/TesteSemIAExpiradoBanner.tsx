/**
 * Banner destacado exibido quando o teste SEM IA expira (após 3 dias)
 * Aparece na tela inicial e bloqueia acesso às funcionalidades
 */

import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { redirectToSalesPage } from '../constants/salesPage';
import { verificarTesteSemIAExpirado } from '../services/academiaLimitsService';
import { logger } from '../utils/logger';

export const TesteSemIAExpiradoBanner: React.FC = () => {
  const { user } = useUser();
  const [testeExpirado, setTesteExpirado] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTesteStatus = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Só verificar para usuários não vinculados a academias
      const isStudent = user.tenantRole === 'student' || user.gymRole === 'student';
      if (isStudent) {
        setLoading(false);
        return;
      }

      try {
        const status = await verificarTesteSemIAExpirado(user.id as string);
        setTesteExpirado(status.expirado);
        setDiasRestantes(status.diasRestantes);
      } catch (error) {
        logger.error('Erro ao verificar teste SEM IA', 'TesteSemIAExpiradoBanner', error);
      } finally {
        setLoading(false);
      }
    };

    checkTesteStatus();
    
    // Verificar periodicamente (a cada minuto)
    const interval = setInterval(checkTesteStatus, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (loading || !testeExpirado) {
    return null;
  }

  const accountType = user?.accountType || 'individual';
  const isAcademy = accountType === 'academy';

  const handleGoToPlans = () => {
    // Redirecionar para página de vendas externa
    if (isAcademy) {
      redirectToSalesPage('B2B');
    } else {
      redirectToSalesPage('B2C_PRICING');
    }
  };

  return (
    <Card className="border-2 border-red-500 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 mb-6">
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
              <LockClosedIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
              ⏰ Seu Período de Teste SEM IA Expirou
            </h3>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 mb-4">
              Você testou o app por 3 dias sem IA. Para continuar usando, escolha um plano que melhor se adapta à sua academia.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleGoToPlans}
                variant="primary"
                className="flex-1"
              >
                Ver Planos e Preços →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
