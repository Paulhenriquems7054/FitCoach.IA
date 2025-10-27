import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '../types';
import { Goal } from '../types';

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
};

type UserProviderProps = {
  children: ReactNode;
}

// FIX: Explicitly type the component as React.FC for better type inference and consistency.
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>(initialUser);

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
      setUser(prevUser => ({...prevUser, subscription: 'premium' }));
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