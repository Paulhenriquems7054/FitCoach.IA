/**
 * Serviço de Treinos em Grupo
 * Sistema completo de grupos de treino, competições e chat de grupo
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface WorkoutGroup {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  createdBy: string;
  createdByName: string;
  members: GroupMember[];
  workouts: GroupWorkout[];
  challenges: GroupChallenge[];
  chatMessages: GroupChatMessage[];
  isPublic: boolean;
  maxMembers?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface GroupMember {
  userId: string;
  username: string;
  userPhotoUrl?: string;
  joinedAt: string;
  role: 'member' | 'admin';
  stats: {
    workoutsCompleted: number;
    points: number;
    streak: number;
  };
}

export interface GroupWorkout {
  id: string;
  groupId: string;
  title: string;
  description: string;
  workoutPlan: any; // WellnessPlan ou similar
  scheduledDate?: string;
  completedBy: string[]; // IDs de usuários que completaram
  createdAt: string;
  createdBy: string;
}

export interface GroupChallenge {
  id: string;
  groupId: string;
  title: string;
  description: string;
  type: 'workout_count' | 'weight_loss' | 'streak' | 'points';
  target: number;
  startDate: string;
  endDate: string;
  participants: ChallengeParticipant[];
  winner?: string;
  createdAt: string;
  createdBy: string;
}

export interface ChallengeParticipant {
  userId: string;
  username: string;
  progress: number;
  currentValue: number;
}

export interface GroupChatMessage {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  userPhotoUrl?: string;
  content: string;
  createdAt: string;
}

class GroupService {
  private groups: WorkoutGroup[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadGroups();
  }

  /**
   * Cria um novo grupo
   */
  async createGroup(
    userId: string,
    username: string,
    group: Omit<WorkoutGroup, 'id' | 'createdBy' | 'createdByName' | 'members' | 'workouts' | 'challenges' | 'chatMessages' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkoutGroup> {
    const newGroup: WorkoutGroup = {
      ...group,
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdBy: userId,
      createdByName: username,
      members: [{
        userId,
        username,
        joinedAt: new Date().toISOString(),
        role: 'admin',
        stats: {
          workoutsCompleted: 0,
          points: 0,
          streak: 0,
        },
      }],
      workouts: [],
      challenges: [],
      chatMessages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.groups.push(newGroup);
    await this.saveGroups();

    logger.info(`Grupo criado: ${newGroup.id}`, 'groupService');
    return newGroup;
  }

  /**
   * Entra em um grupo
   */
  async joinGroup(userId: string, username: string, groupId: string): Promise<boolean> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return false;

    // Verificar se já é membro
    if (group.members.some(m => m.userId === userId)) {
      return false;
    }

    // Verificar limite de membros
    if (group.maxMembers && group.members.length >= group.maxMembers) {
      return false;
    }

    group.members.push({
      userId,
      username,
      joinedAt: new Date().toISOString(),
      role: 'member',
      stats: {
        workoutsCompleted: 0,
        points: 0,
        streak: 0,
      },
    });

    group.updatedAt = new Date().toISOString();
    await this.saveGroups();

    logger.info(`Usuário ${userId} entrou no grupo ${groupId}`, 'groupService');
    return true;
  }

  /**
   * Sai de um grupo
   */
  async leaveGroup(userId: string, groupId: string): Promise<boolean> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return false;

    const index = group.members.findIndex(m => m.userId === userId);
    if (index === -1) return false;

    // Não permitir que admin saia se for o único admin
    if (group.members[index].role === 'admin') {
      const adminCount = group.members.filter(m => m.role === 'admin').length;
      if (adminCount === 1) {
        return false; // Não pode sair se for o único admin
      }
    }

    group.members.splice(index, 1);
    group.updatedAt = new Date().toISOString();
    await this.saveGroups();

    logger.info(`Usuário ${userId} saiu do grupo ${groupId}`, 'groupService');
    return true;
  }

  /**
   * Obtém grupos do usuário
   */
  async getUserGroups(userId: string): Promise<WorkoutGroup[]> {
    return this.groups.filter(g => g.members.some(m => m.userId === userId));
  }

  /**
   * Obtém grupos públicos
   */
  async getPublicGroups(): Promise<WorkoutGroup[]> {
    return this.groups.filter(g => g.isPublic);
  }

  /**
   * Obtém grupo por ID
   */
  async getGroupById(groupId: string): Promise<WorkoutGroup | null> {
    return this.groups.find(g => g.id === groupId) || null;
  }

  /**
   * Adiciona treino ao grupo
   */
  async addWorkout(
    groupId: string,
    userId: string,
    workout: Omit<GroupWorkout, 'id' | 'groupId' | 'completedBy' | 'createdAt' | 'createdBy'>
  ): Promise<GroupWorkout> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Grupo não encontrado');
    }

    const newWorkout: GroupWorkout = {
      ...workout,
      id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      completedBy: [],
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    group.workouts.push(newWorkout);
    group.updatedAt = new Date().toISOString();
    await this.saveGroups();

    logger.info(`Treino adicionado ao grupo: ${groupId}`, 'groupService');
    return newWorkout;
  }

  /**
   * Marca treino como completo
   */
  async completeWorkout(groupId: string, workoutId: string, userId: string): Promise<boolean> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return false;

    const workout = group.workouts.find(w => w.id === workoutId);
    if (!workout) return false;

    if (!workout.completedBy.includes(userId)) {
      workout.completedBy.push(userId);
      
      // Atualizar estatísticas do membro
      const member = group.members.find(m => m.userId === userId);
      if (member) {
        member.stats.workoutsCompleted++;
        member.stats.points += 10; // 10 pontos por treino
      }

      group.updatedAt = new Date().toISOString();
      await this.saveGroups();
    }

    return true;
  }

  /**
   * Cria desafio no grupo
   */
  async createChallenge(
    groupId: string,
    userId: string,
    challenge: Omit<GroupChallenge, 'id' | 'groupId' | 'participants' | 'createdAt' | 'createdBy'>
  ): Promise<GroupChallenge> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Grupo não encontrado');
    }

    const newChallenge: GroupChallenge = {
      ...challenge,
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      participants: group.members.map(m => ({
        userId: m.userId,
        username: m.username,
        progress: 0,
        currentValue: 0,
      })),
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    group.challenges.push(newChallenge);
    group.updatedAt = new Date().toISOString();
    await this.saveGroups();

    logger.info(`Desafio criado no grupo: ${groupId}`, 'groupService');
    return newChallenge;
  }

  /**
   * Adiciona mensagem ao chat do grupo
   */
  async addChatMessage(
    groupId: string,
    userId: string,
    username: string,
    content: string,
    userPhotoUrl?: string
  ): Promise<GroupChatMessage> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Grupo não encontrado');
    }

    const message: GroupChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      userId,
      username,
      userPhotoUrl,
      content,
      createdAt: new Date().toISOString(),
    };

    group.chatMessages.push(message);
    
    // Manter apenas últimas 100 mensagens
    if (group.chatMessages.length > 100) {
      group.chatMessages = group.chatMessages.slice(-100);
    }

    group.updatedAt = new Date().toISOString();
    await this.saveGroups();

    return message;
  }

  /**
   * Obtém mensagens do chat
   */
  async getChatMessages(groupId: string, limit: number = 50): Promise<GroupChatMessage[]> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return [];

    return group.chatMessages.slice(-limit);
  }

  /**
   * Obtém ranking do grupo
   */
  async getGroupRanking(groupId: string): Promise<GroupMember[]> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return [];

    return [...group.members].sort((a, b) => b.stats.points - a.stats.points);
  }

  /**
   * Carrega grupos
   */
  private async loadGroups(): Promise<void> {
    try {
      const saved = await getAppSetting<WorkoutGroup[]>('workout_groups');
      if (saved) {
        this.groups = saved;
      }
    } catch (error) {
      logger.warn('Erro ao carregar grupos', 'groupService', error);
    }
  }

  /**
   * Salva grupos
   */
  private async saveGroups(): Promise<void> {
    try {
      await saveAppSetting('workout_groups', this.groups);
    } catch (error) {
      logger.error('Erro ao salvar grupos', 'groupService', error);
    }
  }
}

// Instância singleton
export const groupService = new GroupService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  groupService.initialize().catch(error => {
    logger.error('Erro ao inicializar serviço de grupos', 'groupService', error);
  });
}

