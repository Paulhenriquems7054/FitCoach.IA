import React, { useState, useEffect, useMemo } from 'react';
import { normalizeGifPath } from '../../services/exerciseGifService';

interface GifLoaderProps {
  src: string;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  preloaded?: boolean;
}

/**
 * Componente simplificado e robusto para carregar e exibir GIFs
 * 
 * Estratégia:
 * - Normaliza caminhos de forma consistente usando normalizeGifPath
 * - Usa caminhos absolutos simples que o Vite serve automaticamente
 * - Sem variações complexas ou fallbacks frágeis
 * - Placeholder confiável durante carregamento
 * - Fallback visual consistente em caso de erro
 * - Validação de arquivo sem chamadas de API
 * - Logs apenas em desenvolvimento
 * 
 * IMPORTANTE: Exibição de GIF é totalmente independente de chamadas para /api/ai/*
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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Normalizar caminho - garantir que está no formato correto
  // IMPORTANTE: O caminho já vem normalizado de getExerciseGif, mas vamos garantir
  const normalizedSrc = useMemo(() => {
    if (!src) return '';
    
    // Garantir que comece com /
    let path = src.startsWith('/') ? src : `/${src}`;
    
    // Se já começar com /gifs/ ou /GIFS/, apenas garantir minúsculas
    if (path.toLowerCase().startsWith('/gifs/')) {
      path = path.replace(/^\/GIFS\//i, '/gifs/');
      return path;
    }
    
    // Se não começar com /gifs/, normalizar completamente
    path = normalizeGifPath(path);
    
    return path;
  }, [src]);

  // Resetar estado quando src mudar
  useEffect(() => {
    if (import.meta.env.DEV && src) {
      const fullUrl = typeof window !== 'undefined' && normalizedSrc.startsWith('/')
        ? `${window.location.origin}${normalizedSrc}`
        : normalizedSrc;
      console.log('[GifLoader] 🔄 Carregando GIF:', {
        src,
        normalizedSrc,
        fullUrl,
      });
    }
    setHasError(false);
    setIsLoading(!preloaded);
    setImageLoaded(preloaded);
    setRetryCount(0); // Resetar contador de tentativas quando src mudar
  }, [src, preloaded, normalizedSrc]);

  useEffect(() => {
    if (preloaded) {
      setIsLoading(false);
      setImageLoaded(true);
    }
  }, [preloaded]);

  const handleLoad = () => {
    if (import.meta.env.DEV) {
      console.log('[GifLoader] ✅ GIF carregado:', src);
    }
    setIsLoading(false);
    setImageLoaded(true);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.target as HTMLImageElement;
    const fullUrl = typeof window !== 'undefined' && normalizedSrc.startsWith('/')
      ? `${window.location.origin}${normalizedSrc}`
      : normalizedSrc;
    
    const errorDetails = {
      src,
      normalizedSrc,
      attemptedUrl: imgElement?.src,
      resolvedUrl: imgElement?.currentSrc,
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      fullUrl,
      retryCount,
    };
    
    if (import.meta.env.DEV) {
      console.error('[GifLoader] ❌ Erro ao carregar GIF:', errorDetails);
      
      // IMPORTANTE: Validar arquivo SEM fazer chamadas de API
      // Usar apenas fetch HEAD para verificar se arquivo existe
      // NENHUMA chamada para /api/ai/* deve ser feita aqui
      if (typeof window !== 'undefined' && normalizedSrc.startsWith('/')) {
        // Usar AbortController para evitar promises penduradas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5s
        
        fetch(fullUrl, { 
          method: 'HEAD', 
          cache: 'no-cache',
          signal: controller.signal
        })
          .then(response => {
            clearTimeout(timeoutId);
            console.log('[GifLoader] 🔍 Teste de acesso ao arquivo:', {
              url: fullUrl,
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
            });
            
            // Se o arquivo existe mas a imagem não carregou, tentar recarregar
            if (response.ok && retryCount < maxRetries) {
              console.log(`[GifLoader] 🔄 Tentando recarregar (tentativa ${retryCount + 1}/${maxRetries})...`);
              setRetryCount(prev => prev + 1);
              setTimeout(() => {
                setHasError(false);
                setIsLoading(true);
              }, 500);
              return;
            } else if (!response.ok) {
              console.error(`[GifLoader] ❌ Arquivo não encontrado no servidor (${response.status})`);
            }
          })
          .catch(err => {
            clearTimeout(timeoutId);
            // Ignorar erros de abort (timeout) silenciosamente
            if (err.name !== 'AbortError') {
              console.error('[GifLoader] 🔍 Erro ao testar acesso:', err);
            }
          });
      }
    }
    
    // Se não conseguiu recarregar após todas as tentativas, marcar como erro
    if (retryCount >= maxRetries) {
      setIsLoading(false);
      setHasError(true);
      
      if (onError) {
        onError(e);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Placeholder/Skeleton enquanto carrega */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse flex items-center justify-center rounded">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Carregando GIF...</p>
          </div>
        </div>
      )}

      {/* Imagem GIF */}
      {!hasError && (
        <img
          src={normalizedSrc + (import.meta.env.DEV && retryCount > 0 ? `?retry=${retryCount}&t=${Date.now()}` : '')}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          loading={preloaded ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
          // Forçar re-render quando src mudar ou quando houver retry
          key={`${normalizedSrc}-${retryCount}`}
        />
      )}

      {/* Mensagem de erro */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-col gap-1 rounded">
          <svg 
            className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" 
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
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">
            GIF não disponível
          </p>
          {import.meta.env.DEV && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center px-2 break-all max-w-full">
              {normalizedSrc}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
