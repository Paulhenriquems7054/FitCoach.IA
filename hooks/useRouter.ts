
import { useState, useEffect } from 'react';

const PRESENTATION_SEEN_KEY = 'fitcoach.presentation.seen';

const normalizePath = (hash: string) => {
  // Se não houver hash ou hash vazio, retornar vazio para o App decidir
  if (!hash || hash === '#') {
    return '';
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
  
  // Retornar path vazio se não houver hash, para o App decidir
  return { path: path || '' };
};