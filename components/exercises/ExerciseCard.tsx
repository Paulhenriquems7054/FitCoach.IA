import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { SimpleGifDisplay } from '../ui/SimpleGifDisplay';
import type { ExerciseInfo } from '../../types/exercise';

interface ExerciseCardProps {
  exercise: ExerciseInfo;
  onClick?: () => void;
}

/**
 * Componente de card de exercício otimizado
 * - Lazy loading de GIFs usando IntersectionObserver
 * - Pausa GIF quando não está visível
 * - Placeholder estático antes do carregamento
 */
export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onClick }) => {
  const [shouldLoadGif, setShouldLoadGif] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver para lazy loading
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Carregar GIF apenas quando estiver visível
            setShouldLoadGif(true);
            // Desconectar após carregar para melhorar performance
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Começar a carregar 50px antes de entrar no viewport
        threshold: 0.1,
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={cardRef}>
      <Card
        className="flex flex-col h-full cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        onClick={onClick}
      >
        <div className="flex flex-col h-full">
        {/* GIF ou Placeholder */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden rounded-t-lg">
          {shouldLoadGif && exercise.gifPath ? (
            <SimpleGifDisplay
              src={exercise.gifPath}
              alt={`Demonstração de ${exercise.name}`}
              className=""
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Carregando...</p>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo do Card */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Nome do Exercício */}
          <h3 className="text-base sm:text-lg font-bold text-primary-700 dark:text-primary-400 mb-2 line-clamp-2">
            {exercise.name}
          </h3>

          {/* Grupo Muscular */}
          <div className="mt-auto">
            <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              {exercise.muscleGroup}
            </span>
          </div>
        </div>
      </div>
    </Card>
    </div>
  );
};

