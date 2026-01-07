import React, { useState } from 'react';

interface SimpleGifDisplayProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Componente simples para exibir GIFs sem verificações complexas
 * Usa apenas a tag <img> padrão do HTML
 */
export const SimpleGifDisplay: React.FC<SimpleGifDisplayProps> = ({
  src,
  alt,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actualSrc, setActualSrc] = useState<string>('');
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Garantir que o caminho comece com /
  const normalizedSrc = src.startsWith('/') ? src : `/${src}`;

  // Usar o caminho diretamente - o navegador fará a codificação automática quando necessário
  React.useEffect(() => {
    // Log para debug
    if (import.meta.env.DEV) {
      console.log('[SimpleGifDisplay] 📍 Caminho recebido:', src, '→ Normalizado:', normalizedSrc);
    }
    // Não fazer verificação prévia - apenas usar o caminho diretamente
    // O navegador fará a codificação automática de espaços e acentos quando colocar no src
    setActualSrc(normalizedSrc);
  }, [normalizedSrc, src]);

  // Verificar se a imagem já está carregada (cache do navegador)
  React.useEffect(() => {
    if (!actualSrc) return; // Aguardar até encontrar o caminho correto

    const checkImageLoaded = () => {
      if (imgRef.current?.complete && imgRef.current?.naturalHeight !== 0) {
        setIsLoading(false);
        setHasError(false);
        console.log('[SimpleGifDisplay] ✅ GIF já estava em cache:', actualSrc);
        return true;
      }
      return false;
    };

    // Verificar imediatamente
    if (checkImageLoaded()) {
      return;
    }

    // Timeout de fallback: se após 5 segundos a imagem não carregou, assumir que está pronta
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[SimpleGifDisplay] ⚠️ Timeout ao carregar GIF, assumindo que está pronto:', actualSrc);
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [actualSrc, isLoading]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    console.log('[SimpleGifDisplay] ✅ GIF carregado com sucesso:', normalizedSrc);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    setHasError(true);
    const img = e.target as HTMLImageElement;
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${actualSrc || normalizedSrc}` : (actualSrc || normalizedSrc);
    
    // Log detalhado sempre (também em produção para debug no Vercel)
    console.error('[SimpleGifDisplay] ❌ Erro ao carregar GIF:', {
      src: actualSrc || normalizedSrc,
      attemptedUrl: img?.src,
      currentSrc: img?.currentSrc,
      origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      fullUrl,
      environment: import.meta.env.MODE,
    });
  };

  if (hasError) {
    return (
      <div className={`${className} bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded`}>
        <div className="text-center p-4">
          <svg 
            className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <p className="text-xs text-slate-500 dark:text-slate-400">GIF não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse rounded flex items-center justify-center z-10">
          <div className="text-xs text-slate-500 dark:text-slate-400">Carregando...</div>
        </div>
      )}
      {actualSrc && (
        <img
          ref={imgRef}
          src={actualSrc}
          alt={alt}
          className={`w-full h-full object-cover ${className} ${isLoading ? 'opacity-0 invisible' : 'opacity-100 visible'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

