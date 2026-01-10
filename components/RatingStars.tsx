/**
 * Componente de Avaliação com Estrelas
 */

import React, { useState } from 'react';
import { StarIcon } from './icons/StarIcon';

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onRatingChange?: (rating: number) => void;
  showLabel?: boolean;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  interactive = false,
  size = 'md',
  onRatingChange,
  showLabel = false,
  className = '',
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [currentRating, setCurrentRating] = useState(rating);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (value: number) => {
    if (!interactive) return;
    setCurrentRating(value);
    onRatingChange?.(value);
  };

  const handleMouseEnter = (value: number) => {
    if (!interactive) return;
    setHoveredRating(value);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoveredRating(null);
  };

  const displayRating = hoveredRating ?? currentRating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => {
          const value = i + 1;
          const isFilled = value <= displayRating;
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={`
                ${sizeClasses[size]}
                transition-colors
                ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                ${isFilled
                  ? 'text-yellow-400 dark:text-yellow-500'
                  : 'text-slate-300 dark:text-slate-600'
                }
                disabled:opacity-50
              `}
              aria-label={`Avaliar ${value} de ${maxRating} estrelas`}
              aria-pressed={value === currentRating}
            >
              <StarIcon className="w-full h-full fill-current" />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          {displayRating.toFixed(1)} / {maxRating}
        </span>
      )}
    </div>
  );
};

