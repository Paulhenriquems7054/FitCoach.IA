/**
 * Componente para verificar se o período de trial expirou
 * Verifica periodicamente e bloqueia acesso se o trial expirou
 */

import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { getUserByUsername } from '../services/databaseService';
import { useRouter } from '../hooks/useRouter';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { logger } from '../utils/logger';

export const TrialExpiredChecker: React.FC = () => {
    const { user, setUser } = useUser();
    const { push } = useRouter();
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Verificar apenas para usuários com trial
        if (!user.username || user.subscriptionStatus !== 'trial') {
            setShowModal(false);
            return;
        }

        // Verificar trial expirado
        const checkTrialExpired = async () => {
            try {
                const currentUser = await getUserByUsername(user.username || '');
                if (!currentUser) {
                    return;
                }

                // Verificar se trial expirou
                const expiryDate = currentUser.expiryDate || currentUser.trialEndDate;
                if (!expiryDate) {
                    return;
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas
                const expiry = new Date(expiryDate);
                expiry.setHours(0, 0, 0, 0);

                // Se hoje > expiryDate, trial expirou
                if (today > expiry && currentUser.subscriptionStatus === 'trial') {
                    setShowModal(true);
                } else {
                    setShowModal(false);
                }
            } catch (error) {
                logger.error('Erro ao verificar trial expirado', 'TrialExpiredChecker', error);
            }
        };

        // Verificar imediatamente
        checkTrialExpired();

        // Verificar periodicamente (a cada minuto)
        const interval = setInterval(checkTrialExpired, 60000);

        return () => clearInterval(interval);
    }, [user.username, user.subscriptionStatus, user.expiryDate, user.trialEndDate]);

    // Se o trial expirou, mostrar modal de bloqueio
    if (showModal && user.subscriptionStatus === 'trial') {
        const expiryDate = user.expiryDate || user.trialEndDate;
        const expiryDateFormatted = expiryDate 
            ? new Date(expiryDate).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            })
            : '';

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" aria-modal="true">
                <Card className="w-full max-w-md animate-fade-in-up">
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                                <svg
                                    className="h-8 w-8 text-amber-600 dark:text-amber-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Período de Teste Expirado
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                Seu período de teste acabou. Para continuar evoluindo, escolha um plano.
                            </p>
                            {expiryDateFormatted && (
                                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                                    Expirou em: {expiryDateFormatted}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => {
                                    // Redirecionar para página de planos (ajustar URL conforme necessário)
                                    window.open('https://fitcoach.ia/planos', '_blank');
                                }}
                                variant="primary"
                                className="w-full"
                            >
                                Ver Planos
                            </Button>
                            <Button
                                onClick={() => {
                                    // Fazer logout
                                    setUser({
                                        nome: '',
                                        username: undefined,
                                        password: undefined,
                                        idade: 0,
                                        genero: 'Masculino',
                                        peso: 0,
                                        altura: 0,
                                        objetivo: 'perder peso' as any,
                                        points: 0,
                                        disciplineScore: 0,
                                        completedChallengeIds: [],
                                        isAnonymized: false,
                                        weightHistory: [],
                                        role: 'user',
                                        subscription: 'free',
                                    });
                                    push('#/login');
                                }}
                                variant="secondary"
                                className="w-full"
                            >
                                Fazer Logout
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return null;
};
