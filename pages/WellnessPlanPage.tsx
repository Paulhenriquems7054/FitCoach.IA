import React, { useState, useEffect } from 'react';
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
    clearCompletedWorkouts 
} from '../services/databaseService';
import type { WellnessPlan, WorkoutDay } from '../types';
import { logger } from '../utils/logger';

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
 * Página principal do Plano de Bem-Estar
 * Exibe plano de treinos, suplementos e dicas inteligentes geradas pela IA
 */
const WellnessPlanPage: React.FC = () => {
    const { user } = useUser();
    const [plan, setPlan] = useState<WellnessPlan | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [completedWorkouts, setCompletedWorkouts] = useState<Set<number>>(new Set());
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

    // Carregar plano salvo e treinos concluídos do banco de dados
    useEffect(() => {
        const loadData = async () => {
            try {
                // Carregar plano salvo
                const savedPlan = await getWellnessPlan();
                if (savedPlan) {
                    setPlan(savedPlan);
                }

                // Carregar treinos concluídos
                const completed = await getCompletedWorkouts();
                setCompletedWorkouts(completed);
            } catch (e) {
                logger.warn('Erro ao carregar dados do banco de dados', 'WellnessPlanPage', e);
            }
        };

        loadData();
    }, []);

    /**
     * Gera um novo plano de bem-estar usando IA
     */
    const handleGeneratePlan = async () => {
        setIsLoading(true);
        setError(null);
        setPlan(null);
        setCompletedWorkouts(new Set()); // Resetar progresso ao gerar novo plano
        
        try {
            const result = await generateWellnessPlan(user);
            setPlan(result);
            
            // Salvar no banco de dados
            await saveWellnessPlan(result);
            await clearCompletedWorkouts(); // Resetar progresso
            setCompletedWorkouts(new Set());
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro ao gerar o plano de bem-estar. Tente novamente.';
            logger.error('Erro ao gerar plano de bem-estar', 'WellnessPlanPage', err);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
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
            console.error('Erro ao salvar plano editado:', error);
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
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Plano de Bem-Estar</h1>
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 px-2">
                    Receba recomendações personalizadas de treinos e suplementos geradas pela IA
                </p>
            </div>

            {isLoading ? (
                <WellnessPlanSkeleton />
            ) : error ? (
                <Alert type="error" title="Erro ao Gerar Plano">
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
                <div className="space-y-8">
                    {/* Cabeçalho com progresso e ações */}
                    <Card>
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        Meu Plano Semanal
                                    </h2>
                                    {plan.data_geracao && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Gerado em {new Date(plan.data_geracao).toLocaleDateString('pt-BR')}
                                        </p>
                                    )}
                                    {progress.total > 0 && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    Progresso da semana
                                                </span>
                                                <span className="font-semibold text-primary-600 dark:text-primary-400">
                                                    {progress.completed}/{progress.total} treinos
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                                <div
                                                    className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                                                    style={{ width: `${progress.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        ✏️ Editar Plano
                                    </Button>
                                    <Button
                                        onClick={handleGeneratePlan}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        <SparklesIcon className="w-4 h-4 mr-2" />
                                        Gerar Novo Plano
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Plano de Treino Semanal */}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            📅 Plano de Treino Semanal
                        </h2>
                        <div className="space-y-4">
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
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            💊 Recomendações de Suplementos
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                💡 Dicas Adicionais
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {plan.dicas_adicionais}
                            </p>
                        </div>
                    </Card>
                </div>
                )
            ) : (
                    <Card>
                        <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
                            <HeartIcon className="w-16 h-16 text-primary-500" />
                            <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
                                Pronto para o próximo nível?
                            </h2>
                            <p className="mt-2 mb-6 max-w-md text-slate-500 dark:text-slate-400">
                                Clique abaixo para que a Nutri.IA crie um plano de treino e suplementação 
                                personalizado baseado no seu perfil, objetivo e histórico.
                            </p>
                            <Button onClick={handleGeneratePlan} className="w-full max-w-xs" size="lg">
                                <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                                Gerar Meu Plano com IA
                            </Button>
                        </div>
                    </Card>
            )}
        </div>
    );
};

export default WellnessPlanPage;
