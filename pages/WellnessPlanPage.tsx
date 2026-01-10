import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { generateWellnessPlan } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { HeartIcon } from '../components/icons/HeartIcon';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';
import { WorkoutDayCard } from '../components/wellness/WorkoutDayCard';
import { SupplementCard } from '../components/wellness/SupplementCard';
import { WellnessTipsCard } from '../components/wellness/WellnessTipsCard';
import { WellnessPlanEditor } from '../components/wellness/WellnessPlanEditor';
import { WorkoutDayEditor } from '../components/wellness/WorkoutDayEditor';
import { 
    saveWellnessPlan, 
    getWellnessPlan, 
    saveCompletedWorkout, 
    getCompletedWorkouts,
    clearCompletedWorkouts,
    saveUser 
} from '../services/databaseService';
import { logger } from '../utils/logger';
import type { WellnessPlan, WorkoutDay } from '../types';
import { Goal } from '../types';
import { useToast } from '../components/ui/Toast';

const WellnessPlanSkeleton = () => (
    <div className="space-y-8">
        <Card>
            <div className="p-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                             <Skeleton className="h-5 w-1/4" />
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-5/6" />
                        </div>
                    ))}
                </div>
            </div>
        </Card>
         <Card>
            <div className="p-6">
                <Skeleton className="h-6 w-1/2 mb-4" />
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="space-y-2">
                             <Skeleton className="h-5 w-1/3" />
                             <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    </div>
);

/**
 * Página principal do Plano de Treino
 * Exibe plano de treinos personalizado, suplementos e dicas inteligentes geradas pela IA
 */
const WellnessPlanPage: React.FC = () => {
    const { user, setUser } = useUser();
    const { showSuccess, showError, showWarning } = useToast();
    const [plan, setPlan] = useState<WellnessPlan | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [completedWorkouts, setCompletedWorkouts] = useState<Set<number>>(new Set());
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
    const [selectedGoal, setSelectedGoal] = useState<Goal>(user.objetivo);
    const [goalChanged, setGoalChanged] = useState<boolean>(false);
    const mountedRef = useRef(true);

    // Carregar plano salvo e treinos concluídos do banco de dados
    useEffect(() => {
        mountedRef.current = true;
        setSelectedGoal(user.objetivo);
        setGoalChanged(false);
        
        const loadData = async () => {
            try {
                // Carregar plano salvo
                const savedPlan = await getWellnessPlan();
                if (savedPlan && mountedRef.current) {
                    setPlan(savedPlan);
                }

                // Carregar treinos concluídos
                const completed = await getCompletedWorkouts();
                if (mountedRef.current) {
                setCompletedWorkouts(completed);
                }
            } catch (e) {
                logger.warn('Erro ao carregar dados do banco de dados', 'WellnessPlanPage', e);
            }
        };

        loadData();
        
        return () => {
            mountedRef.current = false;
        };
    }, [user.objetivo]);

    /**
     * Atualiza o objetivo do usuário
     */
    const handleGoalChange = async (newGoal: Goal) => {
        if (!mountedRef.current || !user) return;
        
        if (newGoal === user.objetivo) {
            setSelectedGoal(newGoal);
            setGoalChanged(false);
            return;
        }
        
        try {
            const updatedUser = {
                ...user,
                objetivo: newGoal
            };
            
            setSelectedGoal(newGoal);
            setUser(updatedUser);
            setGoalChanged(true);
            
            // Salvar no banco de dados
            try {
                await saveUser(updatedUser);
                logger.info(`Objetivo alterado para: ${newGoal}`, 'WellnessPlanPage');
            } catch (saveError) {
                logger.warn('Erro ao salvar objetivo atualizado', 'WellnessPlanPage', saveError);
            }
            
            if (mountedRef.current) {
                showSuccess(`Objetivo alterado para: ${getGoalLabel(newGoal)}`);
                showWarning('Recomendamos gerar um novo plano de treino para refletir a mudança de objetivo.');
            }
        } catch (error) {
            logger.error('Erro ao alterar objetivo', 'WellnessPlanPage', error);
            if (mountedRef.current) {
                showError('Erro ao alterar objetivo. Tente novamente.');
            }
        }
    };

    /**
     * Retorna o label do objetivo
     */
    const getGoalLabel = (goal: Goal): string => {
        switch (goal) {
            case Goal.PERDER_PESO:
                return 'Perder Peso';
            case Goal.GANHAR_MASSA:
                return 'Ganhar Massa Muscular';
            case Goal.MANTER_PESO:
                return 'Manter Peso';
            default:
                return goal;
        }
    };

    /**
     * Gera um novo plano de treino usando IA
     */
    const handleGeneratePlan = async () => {
        // Verificar se o usuário está definido
        if (!user) {
            const errorMsg = 'É necessário estar logado para gerar um plano de treino.';
            setError(errorMsg);
            showError(errorMsg);
            return;
        }

        // Usar o objetivo atualizado se houver mudança
        const userToUse = selectedGoal !== user.objetivo 
            ? { ...user, objetivo: selectedGoal }
            : user;

        setIsLoading(true);
        setError(null);
        setPlan(null);
        setCompletedWorkouts(new Set()); // Resetar progresso ao gerar novo plano
        setGoalChanged(false); // Resetar flag de mudança
        
        try {
            logger.info(`Iniciando geração de plano de treino (userId: ${user.id}, objetivo: ${userToUse.objetivo})`, 'WellnessPlanPage');
            
            const result = await generateWellnessPlan(userToUse);
            
            // Se o objetivo foi alterado, atualizar o usuário também
            if (selectedGoal !== user.objetivo) {
                const updatedUser = {
                    ...user,
                    objetivo: selectedGoal
                };
                setUser(updatedUser);
                try {
                    await saveUser(updatedUser);
                } catch (saveError) {
                    logger.warn('Erro ao salvar objetivo atualizado durante geração', 'WellnessPlanPage', saveError);
                }
            }
            
            // Verificar se o componente ainda está montado antes de atualizar estado
            if (!mountedRef.current) return;
            
            // Validar se o resultado é válido
            if (!result) {
                throw new Error('O resultado da geração do plano está vazio.');
            }

            // Validar estrutura básica do plano
            if (!result.plano_treino_semanal || !Array.isArray(result.plano_treino_semanal) || result.plano_treino_semanal.length === 0) {
                throw new Error('O plano gerado não possui treinos válidos.');
            }

            logger.info(`Plano gerado com sucesso (${result.plano_treino_semanal.length} dias, ${result.recomendacoes_suplementos?.length || 0} suplementos)`, 'WellnessPlanPage');
            
            if (mountedRef.current) {
            setPlan(result);
            }
            
            // Salvar no banco de dados
            try {
            await saveWellnessPlan(result);
                if (mountedRef.current) {
                    logger.info('Plano salvo no banco de dados', 'WellnessPlanPage');
                }
            } catch (saveError) {
                logger.warn('Erro ao salvar plano no banco de dados, mas plano foi gerado', 'WellnessPlanPage', saveError);
                // Não bloquear se o salvamento falhar, o plano ainda é exibido
            }

            // Resetar progresso
            try {
                await clearCompletedWorkouts();
                if (mountedRef.current) {
            setCompletedWorkouts(new Set());
                }
            } catch (clearError) {
                logger.warn('Erro ao limpar progresso, mas plano foi gerado', 'WellnessPlanPage', clearError);
                // Não bloquear se limpar progresso falhar
            }

            // Mostrar feedback de sucesso
            if (mountedRef.current) {
                showSuccess('Plano de treino gerado com sucesso! 🎉');
            }
            
        } catch (err: unknown) {
            if (!mountedRef.current) return;
            
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro ao gerar o plano de treino. Tente novamente.';
            logger.error('Erro ao gerar plano de treino', 'WellnessPlanPage', err);
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            if (mountedRef.current) {
            setIsLoading(false);
            }
        }
    };

    /**
     * Marca um treino como concluído
     */
    const handleCompleteWorkout = async (dayIndex: number) => {
        const newCompleted = new Set(completedWorkouts);
        newCompleted.add(dayIndex);
        setCompletedWorkouts(newCompleted);
        
        // Salvar no banco de dados
        try {
            await saveCompletedWorkout(dayIndex);
        } catch (error) {
            logger.error('Erro ao salvar treino concluído', 'WellnessPlanPage', error);
        }
    };

    /**
     * Salva o plano editado
     */
    const handleSaveEditedPlan = async (editedPlan: WellnessPlan) => {
        setPlan(editedPlan);
        setIsEditing(false);
        
        // Salvar no banco de dados
        try {
            await saveWellnessPlan(editedPlan);
        } catch (error) {
            logger.error('Erro ao salvar plano editado', 'WellnessPlanPage', error);
        }
    };

    /**
     * Cancela a edição
     */
    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    /**
     * Abre o editor de um dia específico
     */
    const handleEditDay = (dayIndex: number) => {
        setEditingDayIndex(dayIndex);
    };

    /**
     * Salva as alterações de um dia específico
     */
    const handleSaveDay = async (dayIndex: number, updatedDay: WorkoutDay) => {
        if (!plan) return;
        
        const updatedPlan = {
            ...plan,
            plano_treino_semanal: plan.plano_treino_semanal.map((day, idx) =>
                idx === dayIndex ? updatedDay : day
            ),
        };
        
        setPlan(updatedPlan);
        setEditingDayIndex(null);
        
        // Salvar no banco de dados
        try {
            await saveWellnessPlan(updatedPlan);
        } catch (error) {
            logger.error('Erro ao salvar plano editado', 'WellnessPlanPage', error);
        }
    };

    /**
     * Cancela a edição de um dia
     */
    const handleCancelDayEdit = () => {
        setEditingDayIndex(null);
    };

    /**
     * Calcula progresso semanal
     */
    const calculateProgress = () => {
        if (!plan) return { completed: 0, total: 0, percentage: 0 };
        
        const total = plan.plano_treino_semanal.filter(day => 
            !day.foco_treino.toLowerCase().includes('descanso')
        ).length;
        const completed = completedWorkouts.size;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { completed, total, percentage };
    };

    const progress = calculateProgress();

    return (
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
            <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">💪 Meu Plano de Treino</h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">
                    Plano de treino personalizado com exercícios, séries, repetições e dicas geradas pela IA
                </p>
            </div>

            {isLoading ? (
                <WellnessPlanSkeleton />
            ) : error ? (
                <Alert type="error" title="Erro ao Gerar Plano de Treino">
                    <p>{error}</p>
                    <Button onClick={handleGeneratePlan} className="mt-4">
                        Tentar Novamente
                    </Button>
                </Alert>
            ) : plan ? (
                isEditing ? (
                    <WellnessPlanEditor
                        plan={plan}
                        onSave={handleSaveEditedPlan}
                        onCancel={handleCancelEdit}
                    />
                ) : (
                <div className="space-y-6 sm:space-y-8">
                    {/* Cabeçalho com progresso e ações */}
                    <Card>
                        <div className="p-4 sm:p-6">
                            <div className="flex flex-col gap-4">
                                {/* Seleção de Objetivo */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex-1 min-w-0">
                                        <label htmlFor="goal-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Meu Objetivo
                                        </label>
                                        <select
                                            id="goal-select"
                                            value={selectedGoal}
                                            onChange={(e) => handleGoalChange(e.target.value as Goal)}
                                            className="block w-full sm:w-auto min-w-[200px] px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-slate-100"
                                        >
                                            <option value={Goal.PERDER_PESO}>Perder Peso</option>
                                            <option value={Goal.GANHAR_MASSA}>Ganhar Massa Muscular</option>
                                            <option value={Goal.MANTER_PESO}>Manter Peso</option>
                                        </select>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Alterar o objetivo permite gerar planos de treino personalizados
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Alerta quando objetivo é alterado */}
                                {goalChanged && (
                                    <Alert type="info" className="mb-0">
                                        <p className="text-sm">
                                            <strong>Objetivo alterado!</strong> Recomendamos gerar um novo plano de treino para refletir sua nova meta.
                                        </p>
                                    </Alert>
                                )}
                                
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        Meu Plano Semanal
                                    </h2>
                                    {plan.data_geracao && (
                                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                                Gerado em {new Date(plan.data_geracao).toLocaleDateString('pt-BR')} • Objetivo: <strong>{getGoalLabel(user.objetivo)}</strong>
                                        </p>
                                    )}
                                    {progress.total > 0 && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    Progresso da semana
                                                </span>
                                                <span className="font-semibold text-primary-600 dark:text-primary-400 whitespace-nowrap ml-2">
                                                    {progress.completed}/{progress.total} treinos
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 sm:h-3">
                                                <div
                                                    className="bg-primary-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                                                    style={{ width: `${progress.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        variant="secondary"
                                        size="sm"
                                        className="w-full sm:w-auto text-xs sm:text-sm"
                                    >
                                        ✏️ Editar Plano
                                    </Button>
                                    <Button
                                        onClick={handleGeneratePlan}
                                        variant="secondary"
                                        size="sm"
                                        className="w-full sm:w-auto text-xs sm:text-sm"
                                            disabled={isLoading}
                                    >
                                        <SparklesIcon className="w-4 h-4 mr-2" />
                                            {isLoading ? 'Gerando...' : 'Gerar Novo Plano'}
                                    </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Plano de Treino Semanal */}
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                            📅 Plano de Treino Semanal
                        </h2>
                        <div className="space-y-3 sm:space-y-4">
                            {plan.plano_treino_semanal.map((workoutDay, index) => (
                                <WorkoutDayCard
                                    key={workoutDay.dia_semana}
                                    workoutDay={workoutDay}
                                    dayIndex={index}
                                    onComplete={handleCompleteWorkout}
                                    isCompleted={completedWorkouts.has(index)}
                                    onEdit={handleEditDay}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Modal de edição de dia */}
                    {editingDayIndex !== null && plan && (
                        <WorkoutDayEditor
                            workoutDay={plan.plano_treino_semanal[editingDayIndex]}
                            dayIndex={editingDayIndex}
                            onSave={handleSaveDay}
                            onCancel={handleCancelDayEdit}
                        />
                    )}

                    {/* Recomendações de Suplementos */}
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                            💊 Recomendações de Suplementos
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {plan.recomendacoes_suplementos.map((supplement, index) => (
                                <SupplementCard
                                    key={supplement.nome}
                                    supplement={supplement}
                                    index={index}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Dicas Inteligentes */}
                    {plan.dicas_inteligentes && (
                        <WellnessTipsCard tips={plan.dicas_inteligentes} />
                    )}

                    {/* Dicas Adicionais */}
                    <Card>
                        <div className="p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                                💡 Dicas Adicionais
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed break-words">
                                {plan.dicas_adicionais}
                            </p>
                        </div>
                    </Card>
                </div>
                )
            ) : (
                    <Card>
                        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
                            <HeartIcon className="w-16 h-16 text-primary-500 mb-4" />
                            <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
                                Pronto para começar seus treinos?
                            </h2>
                            <p className="mt-2 mb-6 max-w-md text-slate-500 dark:text-slate-400">
                                Clique abaixo para que a IA crie um plano de treino personalizado 
                                baseado no seu perfil, objetivo e histórico de treinos.
                            </p>
                            
                            {/* Seleção de Objetivo */}
                            <div className="w-full max-w-md mb-6">
                                <label htmlFor="goal-select-initial" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 text-left">
                                    Selecione seu objetivo:
                                </label>
                                <select
                                    id="goal-select-initial"
                                    value={selectedGoal}
                                    onChange={(e) => handleGoalChange(e.target.value as Goal)}
                                    className="block w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-slate-100 mb-4"
                                >
                                    <option value={Goal.PERDER_PESO}>Perder Peso</option>
                                    <option value={Goal.GANHAR_MASSA}>Ganhar Massa Muscular</option>
                                    <option value={Goal.MANTER_PESO}>Manter Peso</option>
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-left mb-4">
                                    O plano será gerado com base no objetivo selecionado acima.
                                </p>
                            </div>
                            
                            {goalChanged && (
                                <Alert type="info" className="max-w-md mb-4">
                                    <p className="text-sm">
                                        <strong>Objetivo alterado!</strong> O novo plano será gerado com base no objetivo: <strong>{getGoalLabel(selectedGoal)}</strong>
                                    </p>
                                </Alert>
                            )}
                            
                            <Button 
                                onClick={handleGeneratePlan} 
                                className="w-full max-w-xs" 
                                size="lg"
                                disabled={isLoading}
                            >
                                <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                                {isLoading ? 'Gerando Plano...' : 'Gerar Meu Plano de Treino'}
                            </Button>
                        </div>
                    </Card>
            )}
        </div>
    );
};

export default WellnessPlanPage;
