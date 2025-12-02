import type { User } from '../types';
import { saveUser } from './databaseService';
import { logger } from '../utils/logger';

/**
 * Retorna um usuário demo pré-configurado (não autenticado no Supabase).
 * Os dados são apenas locais (IndexedDB) e marcados como `isAnonymized`.
 */
export async function getDemoUser(): Promise<User> {
  const demoUser: User = {
    id: 'demo-user',
    nome: 'Convidado Demo',
    username: 'demo',
    idade: 30,
    genero: 'Masculino',
    peso: 80,
    altura: 175,
    objetivo: 'perder peso' as any,
    points: 0,
    disciplineScore: 0,
    completedChallengeIds: [],
    isAnonymized: true,
    weightHistory: [],
    role: 'user',
    subscription: 'free',
    planType: 'free',
    subscriptionStatus: 'active',
    photoUrl: undefined,
    gymId: null as any,
    gymRole: null as any,
    usageLimits: {
      lastResetDate: new Date().toISOString(),
      photoAnalysisPerDay: 0,
      workoutAnalysisPerDay: 0,
      customWorkoutsPerMonth: 0,
      textMessagesPerDay: 0,
      voiceMinutesPerDay: 0,
      photosAnalyzedToday: 0,
      workoutsAnalyzedToday: 0,
      customWorkoutsCreatedThisMonth: 0,
      textMessagesSentToday: 0,
      voiceMinutesUsedToday: 0,
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

  try {
    await saveUser(demoUser);
  } catch (error) {
    logger.warn('Não foi possível salvar usuário demo no IndexedDB', 'demoService', error);
  }

  return demoUser;
}


