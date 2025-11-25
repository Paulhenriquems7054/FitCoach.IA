
import { useState, useEffect } from 'react';

const PRESENTATION_SEEN_KEY = 'fitcoach.presentation.seen';

const normalizePath = (hash: string) => {
  // Se não houver hash ou hash vazio
  if (!hash || hash === '#') {
    // Verificar se já viu a apresentação
    try {
      const hasSeenPresentation = localStorage.getItem(PRESENTATION_SEEN_KEY) === 'true';
      if (hasSeenPresentation) {
        // Se já viu, ir direto para login
        return '/login';
      }
    } catch (error) {
      // Se houver erro ao acessar localStorage, mostrar apresentação por segurança
      console.warn('Erro ao verificar flag de apresentação', error);
    }
    // Se não viu, mostrar apresentação
    return '/presentation';
  }
  
  // Se hash for exatamente '#/', ir para dashboard
  if (hash === '#/') {
    return '/';
  }
  
  // Extrair path do hash
  const newPath = hash.substring(1);
  return newPath.startsWith('/') ? newPath : `/${newPath}`;
};

export const useRouter = () => {
  const [path, setPath] = useState<string>(() => normalizePath(window.location.hash));

  useEffect(() => {
    const enforceRoute = () => {
      setPath(normalizePath(window.location.hash));
    };

    enforceRoute();
    window.addEventListener('hashchange', enforceRoute);
    window.addEventListener('storage', enforceRoute);

    return () => {
      window.removeEventListener('hashchange', enforceRoute);
      window.removeEventListener('storage', enforceRoute);
    };
  }, []);
  
  return { path: path || '/presentation' };
};