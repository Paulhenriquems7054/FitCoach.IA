import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { PreconfiguredWorkout } from '../../types';
import { Goal } from '../../types';

interface WorkoutCardProps {
    workout: PreconfiguredWorkout;
    onSelect: (workout: PreconfiguredWorkout) => void;
    onPreview: (workout: PreconfiguredWorkout) => void;
    isFavorite?: boolean;
    onToggleFavorite?: (workout: PreconfiguredWorkout) => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
    workout,
    onSelect,
    onPreview,
    isFavorite = false,
    onToggleFavorite,
}) => {
    const getCategoryColor = (categoria: string) => {
        const colors: Record<string, string> = {
            'corpo-inteiro': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            'hipertrofia': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
            'emagrecimento': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            'definicao': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
            'forca': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
            'resistencia': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
            'funcional': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
            'cardio': 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
        };
        return colors[categoria] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    };

    const getNivelColor = (nivel: string) => {
        const colors: Record<string, string> = {
            'iniciante': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            'intermediario': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
            'avancado': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
        };
        return colors[nivel] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    };

    const getGoalLabel = (goal: Goal) => {
        const labels: Record<Goal, string> = {
            [Goal.PERDER_PESO]: 'Emagrecimento',
            [Goal.MANTER_PESO]: 'Manter Peso',
            [Goal.GANHAR_MASSA]: 'Hipertrofia',
        };
        return labels[goal] || goal;
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-xl transition-all duration-300">
            <div className="p-4 sm:p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex-1">
                            {workout.nome}
                        </h3>
                        {onToggleFavorite && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(workout);
                                }}
                                className={`text-2xl transition-transform hover:scale-110 ${
                                    isFavorite ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-400'
                                }`}
                                title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            >
                                {isFavorite ? '⭐' : '☆'}
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {workout.metadata?.descricao || `Treino ${workout.categoria} para ${workout.objetivo.map(getGoalLabel).join(', ')}`}
                    </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(workout.categoria)}`}>
                        {workout.categoria.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getNivelColor(workout.nivel)}`}>
                        {workout.nivel}
                    </span>
                    {workout.genero && workout.genero !== 'unisex' && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {workout.genero}
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4 text-sm text-slate-600 dark:text-slate-400">
                    {workout.duracao_semanas && (
                        <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span>{workout.duracao_semanas} semanas</span>
                        </div>
                    )}
                    {workout.mes && (
                        <div className="flex items-center gap-2">
                            <span>📆</span>
                            <span>Mês {workout.mes}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span>🏋️</span>
                        <span>{workout.plano.plano_treino_semanal.length} dias de treino</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPreview(workout)}
                        className="flex-1"
                    >
                        👁️ Ver Detalhes
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSelect(workout)}
                        className="flex-1"
                    >
                        ✅ Aplicar Treino
                    </Button>
                </div>
            </div>
        </Card>
    );
};
