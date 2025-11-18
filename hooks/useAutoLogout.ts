import { useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { clearLoginSession } from '../services/databaseService';
import { useToast } from '../components/ui/Toast';
import { Goal } from '../types';

/**
 * Hook para logout automático após período de inatividade
 */
export const useAutoLogout = (timeoutMinutes: number = 30) => {
  const { setUser } = useUser();
  const { showWarning, showInfo } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Limpar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - 60000; // Avisar 1 minuto antes

    // Timer de aviso
    warningTimeoutRef.current = setTimeout(() => {
      showWarning('Você será desconectado em 1 minuto por inatividade.');
    }, warningMs);

    // Timer de logout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  };

  const handleLogout = async () => {
    showInfo('Sessão expirada por inatividade. Faça login novamente.');
    
    await clearLoginSession();
    setUser({
      nome: '',
      idade: 0,
      genero: 'Masculino',
      peso: 0,
      altura: 0,
      objetivo: Goal.PERDER_PESO,
      points: 0,
      disciplineScore: 0,
      completedChallengeIds: [],
      isAnonymized: false,
      weightHistory: [],
      role: 'user',
      subscription: 'free',
    });
    
    window.location.hash = '#/login';
  };

  useEffect(() => {
    // Eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimer();
    };

    // Adicionar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [timeoutMinutes, setUser, showWarning, showInfo]);

  return { resetTimer };
};

