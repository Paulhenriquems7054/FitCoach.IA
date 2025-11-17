
import { useState, useEffect } from 'react';

const SURVEY_FLAG = 'nutriIA_enquete_v1_done';

const readSurveyCompletion = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(window.localStorage.getItem(SURVEY_FLAG));
  } catch (error) {
    console.warn('Não foi possível ler o estado da enquete inicial.', error);
    return false;
  }
};

const normalizePath = (hash: string, hasCompletedSurvey: boolean) => {
  if (!hasCompletedSurvey) {
    return '/welcome-survey';
  }
  const isEmptyHash = !hash || hash === '#';
  const cleanHash = isEmptyHash ? '#/presentation' : hash;
  const newPath = cleanHash.substring(1);
  return newPath.startsWith('/') ? newPath : `/${newPath}`;
};

export const useRouter = () => {
  const [path, setPath] = useState<string>(() => normalizePath(window.location.hash, readSurveyCompletion()));

  useEffect(() => {
    const enforceRoute = () => {
      const hasCompletedSurvey = readSurveyCompletion();
      if (!hasCompletedSurvey) {
        if (window.location.hash !== '#/welcome-survey') {
          window.location.hash = '#/welcome-survey';
        }
        setPath('/welcome-survey');
        return;
      }
      setPath(normalizePath(window.location.hash, true));
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