import React from 'react';
import { WorkoutCard } from './WorkoutCard';
import type { PreconfiguredWorkout } from '../../types';

interface WorkoutGridProps {
    workouts: PreconfiguredWorkout[];
    onSelect: (workout: PreconfiguredWorkout) => void;
    onPreview: (workout: PreconfiguredWorkout) => void;
    favoriteIds?: Set<string>;
    onToggleFavorite?: (workout: PreconfiguredWorkout) => void;
}

export const WorkoutGrid: React.FC<WorkoutGridProps> = ({
    workouts,
    onSelect,
    onPreview,
    favoriteIds = new Set(),
    onToggleFavorite,
}) => {
    if (workouts.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                    Nenhum treino encontrado com os filtros selecionados.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                    Tente ajustar os filtros ou buscar por outro termo.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {workouts.map((workout) => (
                <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onSelect={onSelect}
                    onPreview={onPreview}
                    isFavorite={favoriteIds.has(workout.id)}
                    onToggleFavorite={onToggleFavorite}
                />
            ))}
        </div>
    );
};
