import React, { useState, useEffect, useRef } from 'react';

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
  const [currentSrc, setCurrentSrc] = useState(src);
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  // Resetar estado quando src mudar
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(!preloaded);
    setImageLoaded(preloaded);
    retryCountRef.current = 0;
  }, [src, preloaded]);

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

  const handleError = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.target as HTMLImageElement;
    const errorInfo = {
      src,
      currentSrc: currentSrc,
      attemptedPath: currentSrc,
      resolvedSrc: imgElement?.src,
      actualSrc: imgElement?.currentSrc,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      absoluteUrl: typeof window !== 'undefined' && currentSrc.startsWith('/') 
        ? `${window.location.origin}${currentSrc}` 
        : currentSrc,
      isProduction: import.meta.env.PROD,
      environment: import.meta.env.MODE,
      retryCount: retryCountRef.current,
    };
    
    console.error('GifLoader: Erro ao carregar GIF', errorInfo);
    
    // Tentar variações do caminho em produção (Vercel)
    if (import.meta.env.PROD && currentSrc.startsWith('/') && retryCountRef.current < maxRetries) {
      try {
        // Tentar diferentes variações do caminho
        const variations = [
          // 1. Tentar com /gifs/ (minúsculas) em vez de /GIFS/
          currentSrc.replace('/GIFS/', '/gifs/'),
          // 2. Tentar decodificar e recodificar
          (() => {
            try {
              const decoded = decodeURIComponent(currentSrc);
              return decoded.split('/').map((segment, index) => {
                if (index === 0) return segment;
                return encodeURIComponent(segment);
              }).join('/');
            } catch {
              return null;
            }
          })(),
          // 3. Tentar sem codificação (caminho direto)
          (() => {
            try {
              return decodeURIComponent(currentSrc);
            } catch {
              return null;
            }
          })(),
        ].filter(Boolean) as string[];
        
        // Tentar cada variação
        for (const alternativePath of variations) {
          if (alternativePath && alternativePath !== currentSrc) {
            // Verificar se o arquivo existe antes de tentar carregar
            try {
              const testUrl = alternativePath.startsWith('/')
                ? `${window.location.origin}${alternativePath}`
                : alternativePath;
              
              const response = await fetch(testUrl, { method: 'HEAD' });
              if (response.ok) {
                console.log('[GifLoader] Caminho alternativo encontrado:', alternativePath);
                retryCountRef.current += 1;
                setCurrentSrc(alternativePath);
                setHasError(false);
                setIsLoading(true);
                return; // Tentar novamente com o novo caminho
              }
            } catch (fetchError) {
              // Continuar tentando outras variações
              continue;
            }
          }
        }
      } catch (error) {
        console.warn('[GifLoader] Erro ao tentar variações:', error);
      }
    }
    
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
          src={currentSrc}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading={preloaded ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
          // Forçar o navegador a tratar como URL absoluta
          referrerPolicy="no-referrer"
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
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-col gap-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">
            GIF não disponível
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center px-2 break-all max-w-full">
            {src}
          </p>
        </div>
      )}
    </div>
  );
};

