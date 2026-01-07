import React from 'react';
import { ExerciseCard } from './ExerciseCard';
import type { ExerciseInfo } from '../../types/exercise';

interface ExerciseGridProps {
  exercises: ExerciseInfo[];
  onExerciseClick?: (exercise: ExerciseInfo) => void;
  className?: string;
}

/**
 * Grid responsivo de exercícios
 * - 2 colunas no mobile
 * - 3-4 colunas no desktop
 * - Otimizado para performance
 */
export const ExerciseGrid: React.FC<ExerciseGridProps> = ({
  exercises,
  onExerciseClick,
  className = '',
}) => {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Nenhum exercício encontrado</p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}
    >
      {exercises.map((exercise, index) => (
        <ExerciseCard
          key={`${exercise.name}-${index}`}
          exercise={exercise}
          onClick={() => onExerciseClick?.(exercise)}
        />
      ))}
    </div>
  );
};

