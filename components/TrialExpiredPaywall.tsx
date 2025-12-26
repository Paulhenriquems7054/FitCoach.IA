/**
 * Paywall obrigatório para alunos quando o trial de IA expira
 * MODELO B2B2C: Exibe apenas planos individuais de IA, sem mencionar planos de plataforma
 */

import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { getAiAccessStatus } from '../services/aiAccessService';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { SparklesIcon } from './icons/SparklesIcon';
import { logger } from '../utils/logger';

export const TrialExpiredPaywall: React.FC = () => {
  const { user } = useUser();
    const [showPaywall, setShowPaywall] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkTrialStatus = async () => {
            if (!user || !user.id) {
                setIsChecking(false);
                return;
            }

            // Apenas para alunos (tenantRole === 'student')
            if (user.tenantRole !== 'student') {
                setIsChecking(false);
                return;
            }

            try {
                const accessStatus = await getAiAccessStatus(user);
                
                // Mostrar paywall se trial expirou ou não tem acesso
                if (!accessStatus.hasAccess && (accessStatus.reason === 'trial_expired' || accessStatus.reason === 'none')) {
                    setShowPaywall(true);
    } else {
                    setShowPaywall(false);
                }
            } catch (error) {
                logger.error('Erro ao verificar status de acesso à IA', 'TrialExpiredPaywall', error);
            } finally {
                setIsChecking(false);
            }
        };

        checkTrialStatus();
        
        // Verificar periodicamente (a cada minuto)
        const interval = setInterval(checkTrialStatus, 60000);
        
        return () => clearInterval(interval);
    }, [user]);

    // Não renderizar se ainda está verificando ou se não deve mostrar
    if (isChecking || !showPaywall) {
        return null;
    }

    // Renderizar paywall modal obrigatório
  return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" aria-modal="true">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 mb-4">
                            <SparklesIcon className="h-8 w-8 text-white" />
            </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            Seu período de teste da IA acabou
            </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
                            A plataforma é oferecida pela sua academia. A ativação da IA é individual.
            </p>
          </div>
          
                    {/* Benefícios da IA */}
                    <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                            O que você ganha com a IA:
                        </h3>
                        <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 dark:text-primary-400 mt-1">✓</span>
                                <span>Chat inteligente para tirar dúvidas sobre nutrição e treino</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 dark:text-primary-400 mt-1">✓</span>
                                <span>Análise de pratos por foto</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 dark:text-primary-400 mt-1">✓</span>
                                <span>Planos alimentares personalizados</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-600 dark:text-primary-400 mt-1">✓</span>
                                <span>Conversa por voz com assistente nutricional</span>
                            </li>
                        </ul>
            </div>
          
                    {/* Call to Action */}
                    <div className="flex flex-col gap-3">
            <Button
                            onClick={() => {
                                // Redirecionar para página de planos de IA (aluno)
                                window.location.hash = '#/student-ai-plans';
                            }}
                            variant="primary"
                            className="w-full text-base sm:text-lg py-3"
              size="lg"
            >
                            Ver Planos de IA
            </Button>
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                            Você continuará tendo acesso à plataforma básica da sua academia
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
