
import { useState, useEffect } from 'react';

// Usar a mesma versão da enquete que está no WelcomeSurvey
const SURVEY_VERSION = 'v2';
const SURVEY_FLAG = `nutriIA_enquete_${SURVEY_VERSION}_done`;
const FIRST_VISIT_FLAG = 'nutriIA_first_visit';

const readSurveyCompletion = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(window.localStorage.getItem(SURVEY_FLAG));
  } catch (error) {
    console.warn('Não foi possível ler o estado da enquete inicial.', error);
    return false;
  }
};

const isFirstVisit = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const hasVisited = localStorage.getItem(FIRST_VISIT_FLAG);
    if (!hasVisited) {
      // Marcar como visitado
      localStorage.setItem(FIRST_VISIT_FLAG, 'true');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Não foi possível verificar primeiro acesso.', error);
    return true; // Por segurança, tratar como primeiro acesso
  }
};

const normalizePath = (hash: string, isFirst: boolean) => {
  const isEmptyHash = !hash || hash === '#';
  
  // Se for primeiro acesso e não houver hash, mostrar apresentação
  if (isFirst && isEmptyHash) {
    return '/presentation';
  }
  
  // Se não for primeiro acesso e não houver hash, ir para home
  if (!isFirst && isEmptyHash) {
    return '/';
  }
  
  const cleanHash = isEmptyHash ? '#/' : hash;
  const newPath = cleanHash.substring(1);
  return newPath.startsWith('/') ? newPath : `/${newPath}`;
};

export const useRouter = () => {
  const [isFirst, setIsFirst] = useState<boolean>(() => isFirstVisit());
  const [path, setPath] = useState<string>(() => normalizePath(window.location.hash, isFirst));

  useEffect(() => {
    const enforceRoute = () => {
      const firstVisit = isFirstVisit();
      setIsFirst(firstVisit);
      setPath(normalizePath(window.location.hash, firstVisit));
    };

    enforceRoute();
    window.addEventListener('hashchange', enforceRoute);
    window.addEventListener('storage', enforceRoute);

    return () => {
      window.removeEventListener('hashchange', enforceRoute);
      window.removeEventListener('storage', enforceRoute);
    };
  }, []);
  
  return { path: path || '/' };
};