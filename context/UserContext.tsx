import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '../types';
import { Goal } from '../types';
import { saveUser, getUser, getCurrentUsername, loginUser } from '../services/databaseService';
import { checkAndResetLimits } from '../services/usageLimitsService';

interface UserContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  addPoints: (amount: number) => void;
  completeChallenge: (challengeId: string, points: number) => void;
  updateWeightHistory: (date: string, weight: number) => void;
  toggleAnonymization: () => void;
  toggleRole: () => void;
  upgradeToPremium: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialUser: User = {
  nome: 'Usuário Padrão',
  idade: 30,
  genero: 'Masculino',
  peso: 75,
  altura: 180,
  objetivo: Goal.MANTER_PESO,
  points: 0,
  disciplineScore: 80,
  completedChallengeIds: [],
  isAnonymized: false,
  weightHistory: [
    { date: '2023-10-01', weight: 75 },
    { date: '2023-10-08', weight: 74.5 },
    { date: '2023-10-15', weight: 74 },
  ],
  role: 'user',
  subscription: 'free',
  usageLimits: {
    reportsGeneratedThisWeek: 0,
    photosAnalyzedToday: 0,
  },
  dataPermissions: {
    allowWeightHistory: true,
    allowMealPlans: true,
    allowPhotoAnalysis: true,
    allowWorkoutData: true,
    allowChatHistory: true,
  },
  securitySettings: {
    biometricEnabled: false,
    securityNotifications: true,
  },
};

const loadStoredUser = async (): Promise<User | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const user = await getUser();
    if (!user) return null;

    return {
      ...initialUser,
      ...user,
      weightHistory: Array.isArray(user.weightHistory) ? user.weightHistory : initialUser.weightHistory,
      completedChallengeIds: Array.isArray(user.completedChallengeIds)
        ? user.completedChallengeIds
        : initialUser.completedChallengeIds,
    };
  } catch (error) {
    console.warn('Não foi possível carregar os dados do usuário do banco de dados.', error);
    return null;
  }
};

type UserProviderProps = {
  children: ReactNode;
}

// FIX: Explicitly type the component as React.FC for better type inference and consistency.
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário do banco de dados na inicialização
  useEffect(() => {
    const loadUser = async () => {
      try {
        const loadedUser = await loadStoredUser();
        if (loadedUser) {
          setUser(loadedUser);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Verificar e resetar limites periodicamente (a cada minuto) e ao carregar
  useEffect(() => {
    if (isLoading) return; // Não processar durante o carregamento inicial
    
    const resetLimits = () => {
      setUser(prevUser => {
        const updatedUser = checkAndResetLimits(prevUser);
        // Só atualizar se realmente mudou
        if (JSON.stringify(updatedUser.usageLimits) !== JSON.stringify(prevUser.usageLimits)) {
          return updatedUser;
        }
        return prevUser;
      });
    };
    
    // Resetar imediatamente ao carregar
    resetLimits();
    
    // Resetar a cada minuto para verificar se passou o dia/semana
    const interval = setInterval(resetLimits, 60000);
    
    return () => clearInterval(interval);
  }, [isLoading]); // Apenas quando terminar de carregar

  // Salvar usuário no banco de dados quando houver mudanças
  useEffect(() => {
    if (isLoading) return; // Não salvar durante o carregamento inicial
    
    const saveUserData = async () => {
      try {
        await saveUser(user);
      } catch (error) {
        console.error('Erro ao salvar dados do usuário no banco de dados:', error);
      }
    };

    saveUserData();
  }, [user, isLoading]);

  const addPoints = (amount: number) => {
    setUser(prevUser => ({
        ...prevUser,
        points: prevUser.points + amount,
        disciplineScore: Math.min(100, prevUser.disciplineScore + 1),
    }));
  };

  const completeChallenge = (challengeId: string, points: number) => {
    setUser(prevUser => {
        if (prevUser.completedChallengeIds.includes(challengeId)) {
            return prevUser;
        }
        return {
            ...prevUser,
            points: prevUser.points + points,
            disciplineScore: Math.min(100, prevUser.disciplineScore + 5),
            completedChallengeIds: [...prevUser.completedChallengeIds, challengeId]
        }
    });
  };

  const updateWeightHistory = (date: string, weight: number) => {
    setUser(prevUser => {
        const newHistory = [...prevUser.weightHistory];
        const existingIndex = newHistory.findIndex(entry => entry.date === date);
        if(existingIndex > -1) {
            newHistory[existingIndex] = { date, weight };
        } else {
            newHistory.push({ date, weight });
        }
        newHistory.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return { ...prevUser, weightHistory: newHistory, peso: weight };
    });
  };

  const toggleAnonymization = () => {
      setUser(prevUser => ({...prevUser, isAnonymized: !prevUser.isAnonymized }));
  };
  
  const toggleRole = () => {
      setUser(prevUser => ({...prevUser, role: prevUser.role === 'user' ? 'professional' : 'user' }));
  };

  const upgradeToPremium = () => {
      // Função mantida para compatibilidade, mas Premium foi removido
      // Todas as funcionalidades já estão disponíveis
  };

  return (
    <UserContext.Provider value={{ user, setUser, addPoints, completeChallenge, updateWeightHistory, toggleAnonymization, toggleRole, upgradeToPremium }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};