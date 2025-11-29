import React, { useState, useEffect } from 'react';

interface GifLoaderProps {
  src: string;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  preloaded?: boolean;
}

/**
 * Componente otimizado para carregar e exibir GIFs
 * - Mostra placeholder enquanto carrega
 * - Usa preload quando disponível
 * - Feedback visual de carregamento
 */
export const GifLoader: React.FC<GifLoaderProps> = ({
  src,
  alt,
  className = '',
  onError,
  preloaded = false,
}) => {
  const [isLoading, setIsLoading] = useState(!preloaded);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(preloaded);

  useEffect(() => {
    if (preloaded) {
      setIsLoading(false);
      setImageLoaded(true);
    }
  }, [preloaded]);

  const handleLoad = () => {
    setIsLoading(false);
    setImageLoaded(true);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Placeholder/Skeleton enquanto carrega */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Carregando GIF...</p>
          </div>
        </div>
      )}

      {/* Imagem GIF */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading={preloaded ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
          // Otimizações de performance para animação suave
          style={{
            imageRendering: 'auto',
            willChange: 'transform',
            transform: 'translateZ(0)', // Força aceleração de hardware
            backfaceVisibility: 'hidden', // Melhora performance de animação
            WebkitBackfaceVisibility: 'hidden',
            perspective: 1000, // Ativa aceleração 3D
            WebkitPerspective: 1000,
            // Otimizações de renderização
            contain: 'layout style paint', // Isola o elemento para melhor performance
            isolation: 'isolate', // Cria novo contexto de empilhamento
          }}
        />
      )}

      {/* Mensagem de erro */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">
            GIF não disponível
          </p>
        </div>
      )}
    </div>
  );
};

