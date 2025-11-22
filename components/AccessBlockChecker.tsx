/**
 * Componente para verificar se o aluno está com acesso bloqueado
 * Verifica periodicamente e faz logout se o acesso foi bloqueado
 */

import React, { useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getUserByUsername } from '../services/databaseService';
import { syncBlockStatus, checkServerAvailability } from '../services/syncService';
import { useRouter } from '../hooks/useRouter';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';

export const AccessBlockChecker: React.FC = () => {
    const { user, setUser } = useUser();
    const { push } = useRouter();

    useEffect(() => {
        // Apenas verificar para alunos
        if (user.gymRole !== 'student' || !user.username) {
            return;
        }

        // Verificar bloqueio a cada 30 segundos
        const checkAccess = async () => {
            try {
                // Primeiro, tentar sincronizar com o servidor (se disponível)
                const serverAvailable = await checkServerAvailability();
                if (serverAvailable) {
                    await syncBlockStatus(user.username || '');
                }

                // Verificar status local (pode ter sido atualizado pela sincronização)
                const currentUser = await getUserByUsername(user.username || '');
                if (currentUser && currentUser.accessBlocked) {
                    // Acesso foi bloqueado, fazer logout
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
                    // Redirecionar para login
                    push('#/login');
                }
            } catch (error) {
                console.error('Erro ao verificar acesso:', error);
            }
        };

        // Verificar imediatamente
        checkAccess();

        // Verificar periodicamente
        const interval = setInterval(checkAccess, 30000); // 30 segundos

        return () => clearInterval(interval);
    }, [user.username, user.gymRole, setUser, push]);

    // Se o aluno está bloqueado, mostrar mensagem
    if (user.gymRole === 'student' && user.accessBlocked) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert type="error" title="Acesso Bloqueado">
                    <div className="space-y-4">
                        <p>
                            {user.blockedReason || 'Seu acesso ao aplicativo foi bloqueado pela administração da academia.'}
                        </p>
                        {user.blockedAt && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Bloqueado em: {new Date(user.blockedAt).toLocaleString('pt-BR')}
                            </p>
                        )}
                        {user.blockedBy && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Bloqueado por: {user.blockedBy}
                            </p>
                        )}
                        <Button
                            onClick={() => {
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
                            variant="primary"
                        >
                            Voltar para Login
                        </Button>
                    </div>
                </Alert>
            </div>
        );
    }

    return null;
};

