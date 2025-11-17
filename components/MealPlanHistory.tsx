import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { getMealPlansWithMetadata } from '../services/databaseService';
import type { MealPlan } from '../types';
import MealPlanDisplay from './MealPlanDisplay';
import { XIcon } from './icons/XIcon';

interface MealPlanHistoryProps {
    userId: string;
    onClose: () => void;
    onSelectPlan?: (plan: MealPlan) => void;
}

interface SavedMealPlan {
    id: number | undefined;
    plan: MealPlan;
    createdAt: string;
}

/**
 * Componente para exibir histórico de planos alimentares gerados
 */
export const MealPlanHistory: React.FC<MealPlanHistoryProps> = ({
    userId,
    onClose,
    onSelectPlan,
}) => {
    const [plans, setPlans] = useState<SavedMealPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
    const [selectedPlanDate, setSelectedPlanDate] = useState<string>('');

    useEffect(() => {
        const loadHistory = async () => {
            try {
                setIsLoading(true);
                // Buscar planos do banco de dados com metadados
                const mealPlansWithMetadata = await getMealPlansWithMetadata(userId, 20);
                
                const plansWithMetadata: SavedMealPlan[] = mealPlansWithMetadata.map((mp) => ({
                    id: mp.id,
                    plan: mp.plan,
                    createdAt: mp.createdAt,
                }));
                
                setPlans(plansWithMetadata);
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
    }, [userId]);

    const handleSelectPlan = (plan: MealPlan, date: string) => {
        setSelectedPlan(plan);
        setSelectedPlanDate(date);
        if (onSelectPlan) {
            onSelectPlan(plan);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Data não disponível';
        }
    };

    const calculateTotalCalories = (plan: MealPlan): number => {
        return plan.reduce((total, meal) => total + meal.calorias, 0);
    };

    if (selectedPlan) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Plano Alimentar
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Gerado em: {formatDate(selectedPlanDate)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setSelectedPlan(null)}
                                variant="secondary"
                                size="sm"
                            >
                                ← Voltar
                            </Button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            >
                                <XIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <MealPlanDisplay plan={selectedPlan} observations="" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Histórico de Planos Alimentares
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                        <XIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>
                <div className="p-6">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">Carregando histórico...</p>
                        </div>
                    ) : plans.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📋</div>
                            <p className="text-slate-600 dark:text-slate-400">
                                Nenhum plano alimentar salvo ainda.
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                                Gere um plano para que ele apareça aqui.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {plans.map((savedPlan) => (
                                <Card key={savedPlan.id} className="hover:shadow-md transition">
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                                        Plano #{savedPlan.id || 'N/A'}
                                                    </h3>
                                                    <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                                        {formatDate(savedPlan.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                    <span>
                                                        <strong>{savedPlan.plan.length}</strong> refeições
                                                    </span>
                                                    <span>
                                                        <strong>{calculateTotalCalories(savedPlan.plan)}</strong> kcal total
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {savedPlan.plan.slice(0, 3).map((meal, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-xs px-2 py-1 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                                                        >
                                                            {meal.refeicao}
                                                        </span>
                                                    ))}
                                                    {savedPlan.plan.length > 3 && (
                                                        <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                                            +{savedPlan.plan.length - 3} mais
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleSelectPlan(savedPlan.plan, savedPlan.createdAt)}
                                                variant="primary"
                                                size="sm"
                                            >
                                                Ver Detalhes
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

