/**
 * Serviço de Gamificação Avançado
 * Sistema completo de conquistas, rankings, streaks e missões
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';
import type { User } from '../types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'workout' | 'nutrition' | 'progress' | 'social' | 'streak' | 'special';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: AchievementRequirement;
}

export interface AchievementRequirement {
  type: 'workout_count' | 'meal_count' | 'weight_loss' | 'streak_days' | 'points' | 'challenge_complete' | 'custom';
  target: number;
  current?: number;
  metadata?: Record<string, any>;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
  progress: number;
  completed: boolean;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: 'workout' | 'meal' | 'checkin' | 'challenge' | 'social';
  xpReward: number;
  pointsReward: number;
  completed: boolean;
  completedAt?: string;
}

export interface WeeklyMission extends DailyMission {
  daysRequired: number;
  currentDays: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  photoUrl?: string;
  points: number;
  xp: number;
  level: number;
  rank: number;
  achievements: number;
  streak: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  streakType: 'workout' | 'checkin' | 'login';
}

class GamificationService {
  private achievements: Achievement[] = [];
  private userAchievements: Map<string, UserAchievement[]> = new Map();
  private dailyMissions: DailyMission[] = [];
  private weeklyMissions: WeeklyMission[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadAchievements();
    await this.loadDailyMissions();
    await this.loadWeeklyMissions();
  }

  /**
   * Carrega conquistas disponíveis
   */
  private async loadAchievements(): Promise<void> {
    // Conquistas pré-definidas
    this.achievements = [
      // Conquistas de Treino
      {
        id: 'first-workout',
        name: 'Primeiro Passo',
        description: 'Complete seu primeiro treino',
        icon: '🏋️',
        category: 'workout',
        points: 50,
        rarity: 'common',
        requirement: { type: 'workout_count', target: 1 },
      },
      {
        id: 'workout-warrior',
        name: 'Guerreiro do Treino',
        description: 'Complete 10 treinos',
        icon: '💪',
        category: 'workout',
        points: 200,
        rarity: 'rare',
        requirement: { type: 'workout_count', target: 10 },
      },
      {
        id: 'workout-master',
        name: 'Mestre do Treino',
        description: 'Complete 50 treinos',
        icon: '👑',
        category: 'workout',
        points: 500,
        rarity: 'epic',
        requirement: { type: 'workout_count', target: 50 },
      },
      {
        id: 'workout-legend',
        name: 'Lenda do Treino',
        description: 'Complete 100 treinos',
        icon: '🌟',
        category: 'workout',
        points: 1000,
        rarity: 'legendary',
        requirement: { type: 'workout_count', target: 100 },
      },
      
      // Conquistas de Nutrição
      {
        id: 'first-meal',
        name: 'Primeira Refeição',
        description: 'Registre sua primeira refeição',
        icon: '🍽️',
        category: 'nutrition',
        points: 30,
        rarity: 'common',
        requirement: { type: 'meal_count', target: 1 },
      },
      {
        id: 'meal-tracker',
        name: 'Rastreador de Refeições',
        description: 'Registre 30 refeições',
        icon: '📊',
        category: 'nutrition',
        points: 150,
        rarity: 'rare',
        requirement: { type: 'meal_count', target: 30 },
      },
      
      // Conquistas de Progresso
      {
        id: 'first-weight-loss',
        name: 'Primeira Vitória',
        description: 'Perda 1kg',
        icon: '🎯',
        category: 'progress',
        points: 100,
        rarity: 'common',
        requirement: { type: 'weight_loss', target: 1 },
      },
      {
        id: 'weight-loss-champion',
        name: 'Campeão da Perda de Peso',
        description: 'Perda 5kg',
        icon: '🏆',
        category: 'progress',
        points: 500,
        rarity: 'epic',
        requirement: { type: 'weight_loss', target: 5 },
      },
      
      // Conquistas de Streak
      {
        id: 'streak-3',
        name: 'Em Construção',
        description: 'Mantenha um streak de 3 dias',
        icon: '🔥',
        category: 'streak',
        points: 100,
        rarity: 'common',
        requirement: { type: 'streak_days', target: 3 },
      },
      {
        id: 'streak-7',
        name: 'Semana de Fogo',
        description: 'Mantenha um streak de 7 dias',
        icon: '🔥🔥',
        category: 'streak',
        points: 300,
        rarity: 'rare',
        requirement: { type: 'streak_days', target: 7 },
      },
      {
        id: 'streak-30',
        name: 'Mês de Disciplina',
        description: 'Mantenha um streak de 30 dias',
        icon: '🔥🔥🔥',
        category: 'streak',
        points: 1000,
        rarity: 'legendary',
        requirement: { type: 'streak_days', target: 30 },
      },
      
      // Conquistas Especiais
      {
        id: 'early-bird',
        name: 'Madrugador',
        description: 'Complete um treino antes das 6h',
        icon: '🌅',
        category: 'special',
        points: 200,
        rarity: 'rare',
        requirement: { type: 'custom', target: 1, metadata: { time: 'before-6am' } },
      },
      {
        id: 'night-owl',
        name: 'Coruja Noturna',
        description: 'Complete um treino após as 22h',
        icon: '🦉',
        category: 'special',
        points: 200,
        rarity: 'rare',
        requirement: { type: 'custom', target: 1, metadata: { time: 'after-10pm' } },
      },
    ];
  }

  /**
   * Carrega missões diárias
   */
  private async loadDailyMissions(): Promise<void> {
    const today = new Date().toDateString();
    const saved = await getAppSetting<DailyMission[]>('dailyMissions');
    
    if (saved && saved[0]?.completedAt?.startsWith(today)) {
      this.dailyMissions = saved;
      return;
    }

    // Gerar novas missões diárias
    this.dailyMissions = [
      {
        id: 'daily-workout',
        title: 'Treino Diário',
        description: 'Complete um treino hoje',
        type: 'workout',
        xpReward: 50,
        pointsReward: 25,
        completed: false,
      },
      {
        id: 'daily-meal',
        title: 'Registre Refeições',
        description: 'Registre pelo menos 3 refeições hoje',
        type: 'meal',
        xpReward: 30,
        pointsReward: 15,
        completed: false,
      },
      {
        id: 'daily-checkin',
        title: 'Check-in Diário',
        description: 'Registre seu peso hoje',
        type: 'checkin',
        xpReward: 20,
        pointsReward: 10,
        completed: false,
      },
    ];

    await saveAppSetting('dailyMissions', this.dailyMissions);
  }

  /**
   * Carrega missões semanais
   */
  private async loadWeeklyMissions(): Promise<void> {
    const weekStart = this.getWeekStart();
    const saved = await getAppSetting<WeeklyMission[]>('weeklyMissions');
    
    if (saved && saved[0]?.completedAt && new Date(saved[0].completedAt) >= weekStart) {
      this.weeklyMissions = saved;
      return;
    }

    // Gerar novas missões semanais
    this.weeklyMissions = [
      {
        id: 'weekly-workout',
        title: 'Semana Ativa',
        description: 'Complete 5 treinos esta semana',
        type: 'workout',
        xpReward: 200,
        pointsReward: 100,
        daysRequired: 5,
        currentDays: 0,
        completed: false,
      },
      {
        id: 'weekly-streak',
        title: 'Disciplina Semanal',
        description: 'Mantenha um streak de 7 dias',
        type: 'streak',
        xpReward: 300,
        pointsReward: 150,
        daysRequired: 7,
        currentDays: 0,
        completed: false,
      },
    ];

    await saveAppSetting('weeklyMissions', this.weeklyMissions);
  }

  /**
   * Calcula nível baseado em XP
   */
  calculateLevel(xp: number): number {
    // Fórmula: nível = sqrt(XP / 100)
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  /**
   * Calcula XP necessário para próximo nível
   */
  xpForNextLevel(currentLevel: number): number {
    return Math.pow(currentLevel, 2) * 100;
  }

  /**
   * Verifica e desbloqueia conquistas
   */
  async checkAchievements(user: User, userData: {
    workoutCount?: number;
    mealCount?: number;
    weightLoss?: number;
    streak?: number;
    points?: number;
  }): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];
    const userId = user.username || 'anonymous';
    const userAchievements = await this.getUserAchievements(userId);

    for (const achievement of this.achievements) {
      // Verificar se já foi desbloqueada
      if (userAchievements.some(ua => ua.achievementId === achievement.id && ua.completed)) {
        continue;
      }

      let progress = 0;
      let completed = false;

      switch (achievement.requirement.type) {
        case 'workout_count':
          progress = userData.workoutCount || 0;
          completed = progress >= achievement.requirement.target;
          break;
        case 'meal_count':
          progress = userData.mealCount || 0;
          completed = progress >= achievement.requirement.target;
          break;
        case 'weight_loss':
          progress = userData.weightLoss || 0;
          completed = progress >= achievement.requirement.target;
          break;
        case 'streak_days':
          progress = userData.streak || 0;
          completed = progress >= achievement.requirement.target;
          break;
        case 'points':
          progress = userData.points || 0;
          completed = progress >= achievement.requirement.target;
          break;
      }

      if (completed) {
        // Desbloquear conquista
        const userAchievement: UserAchievement = {
          achievementId: achievement.id,
          unlockedAt: new Date().toISOString(),
          progress: achievement.requirement.target,
          completed: true,
        };

        userAchievements.push(userAchievement);
        await this.saveUserAchievements(userId, userAchievements);
        unlocked.push(achievement);

        logger.info(`Conquista desbloqueada: ${achievement.name}`, 'gamificationService');
      } else {
        // Atualizar progresso
        const existing = userAchievements.find(ua => ua.achievementId === achievement.id);
        if (existing) {
          existing.progress = progress;
        } else {
          userAchievements.push({
            achievementId: achievement.id,
            unlockedAt: new Date().toISOString(),
            progress,
            completed: false,
          });
        }
        await this.saveUserAchievements(userId, userAchievements);
      }
    }

    return unlocked;
  }

  /**
   * Obtém conquistas do usuário
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    if (this.userAchievements.has(userId)) {
      return this.userAchievements.get(userId)!;
    }

    try {
      const saved = await getAppSetting<UserAchievement[]>(`achievements_${userId}`);
      if (saved) {
        this.userAchievements.set(userId, saved);
        return saved;
      }
    } catch (error) {
      logger.warn('Erro ao carregar conquistas do usuário', 'gamificationService', error);
    }

    return [];
  }

  /**
   * Salva conquistas do usuário
   */
  private async saveUserAchievements(userId: string, achievements: UserAchievement[]): Promise<void> {
    this.userAchievements.set(userId, achievements);
    try {
      await saveAppSetting(`achievements_${userId}`, achievements);
    } catch (error) {
      logger.error('Erro ao salvar conquistas', 'gamificationService', error);
    }
  }

  /**
   * Obtém missões diárias
   */
  getDailyMissions(): DailyMission[] {
    return this.dailyMissions;
  }

  /**
   * Obtém missões semanais
   */
  getWeeklyMissions(): WeeklyMission[] {
    return this.weeklyMissions;
  }

  /**
   * Completa uma missão diária
   */
  async completeDailyMission(missionId: string): Promise<{ xp: number; points: number } | null> {
    const mission = this.dailyMissions.find(m => m.id === missionId);
    if (!mission || mission.completed) {
      return null;
    }

    mission.completed = true;
    mission.completedAt = new Date().toISOString();
    await saveAppSetting('dailyMissions', this.dailyMissions);

    return {
      xp: mission.xpReward,
      points: mission.pointsReward,
    };
  }

  /**
   * Calcula streak
   */
  async calculateStreak(user: User, type: 'workout' | 'checkin' | 'login' = 'login'): Promise<StreakData> {
    const today = new Date().toDateString();
    const lastActiveDate = user.lastActiveDate || today;
    const lastActive = new Date(lastActiveDate).toDateString();
    
    let currentStreak = user.streak || 0;
    const longestStreak = user.longestStreak || currentStreak;

    if (lastActive === today) {
      // Já ativo hoje, manter streak
    } else if (lastActive === this.getYesterday()) {
      // Ativo ontem, incrementar streak
      currentStreak += 1;
    } else {
      // Quebrou o streak
      currentStreak = 1;
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      lastActiveDate: today,
      streakType: type,
    };
  }

  /**
   * Obtém início da semana
   */
  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day; // Domingo = 0
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * Obtém data de ontem
   */
  private getYesterday(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toDateString();
  }

  /**
   * Obtém todas as conquistas
   */
  getAllAchievements(): Achievement[] {
    return this.achievements;
  }
}

// Instância singleton
export const gamificationService = new GamificationService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  gamificationService.initialize().catch(error => {
    logger.error('Erro ao inicializar serviço de gamificação', 'gamificationService', error);
  });
}

