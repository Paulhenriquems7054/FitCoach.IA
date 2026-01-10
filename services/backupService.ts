/**
 * Serviço de Backup e Sincronização
 * Sistema completo de backup automático e exportação de dados (LGPD)
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';
import type { User } from '../types';

export interface BackupData {
  version: string;
  timestamp: string;
  user: User;
  data: {
    wellnessPlans?: any[];
    completedWorkouts?: any[];
    mealPlans?: any[];
    mealAnalyses?: any[];
    recipes?: any[];
    chatMessages?: any[];
    weightHistory?: any[];
    appointments?: any[];
    achievements?: any[];
    ratings?: any[];
    shoppingList?: any[];
  };
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  size: number;
  version: string;
  type: 'manual' | 'automatic';
}

class BackupService {
  private backups: BackupMetadata[] = [];
  private readonly BACKUP_VERSION = '1.0.0';
  private readonly AUTO_BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadBackupMetadata();
    this.setupAutoBackup();
  }

  /**
   * Cria backup completo dos dados do usuário
   */
  async createBackup(user: User, type: 'manual' | 'automatic' = 'manual'): Promise<BackupData> {
    try {
      // Coletar todos os dados
      const data: BackupData['data'] = {};

      // Carregar dados de diferentes fontes
      try {
        data.wellnessPlans = await getAppSetting<any[]>('wellnessPlans') || [];
        data.completedWorkouts = await getAppSetting<any[]>('completedWorkouts') || [];
        data.mealPlans = await getAppSetting<any[]>('mealPlans') || [];
        data.mealAnalyses = await getAppSetting<any[]>('mealAnalyses') || [];
        data.recipes = await getAppSetting<any[]>('recipes') || [];
        data.chatMessages = await getAppSetting<any[]>('chatMessages') || [];
        data.weightHistory = user.weightHistory || [];
        data.appointments = await getAppSetting<any[]>(`appointments_${user.username}`) || [];
        data.achievements = await getAppSetting<any[]>(`achievements_${user.username}`) || [];
        data.ratings = await getAppSetting<any[]>(`ratings_${user.username}`) || [];
        data.shoppingList = await getAppSetting<any[]>('shoppingList') || [];
      } catch (error) {
        logger.warn('Erro ao coletar alguns dados para backup', 'backupService', error);
      }

      const backup: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        user: {
          ...user,
          password: undefined, // Não incluir senha no backup
        },
        data,
      };

      // Salvar backup
      const backupId = `backup_${Date.now()}`;
      await saveAppSetting(backupId, backup);

      // Adicionar metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: backup.timestamp,
        size: JSON.stringify(backup).length,
        version: backup.version,
        type,
      };

      this.backups.push(metadata);
      await this.saveBackupMetadata();

      logger.info(`Backup criado: ${backupId} (${type})`, 'backupService');
      return backup;
    } catch (error) {
      logger.error('Erro ao criar backup', 'backupService', error);
      throw error;
    }
  }

  /**
   * Restaura backup
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const backup = await getAppSetting<BackupData>(backupId);
      if (!backup) {
        throw new Error('Backup não encontrado');
      }

      // Restaurar dados
      if (backup.data.wellnessPlans) {
        await saveAppSetting('wellnessPlans', backup.data.wellnessPlans);
      }
      if (backup.data.completedWorkouts) {
        await saveAppSetting('completedWorkouts', backup.data.completedWorkouts);
      }
      if (backup.data.mealPlans) {
        await saveAppSetting('mealPlans', backup.data.mealPlans);
      }
      if (backup.data.mealAnalyses) {
        await saveAppSetting('mealAnalyses', backup.data.mealAnalyses);
      }
      if (backup.data.recipes) {
        await saveAppSetting('recipes', backup.data.recipes);
      }
      if (backup.data.chatMessages) {
        await saveAppSetting('chatMessages', backup.data.chatMessages);
      }
      if (backup.data.appointments) {
        await saveAppSetting(`appointments_${backup.user.username}`, backup.data.appointments);
      }
      if (backup.data.achievements) {
        await saveAppSetting(`achievements_${backup.user.username}`, backup.data.achievements);
      }
      if (backup.data.ratings) {
        await saveAppSetting(`ratings_${backup.user.username}`, backup.data.ratings);
      }
      if (backup.data.shoppingList) {
        await saveAppSetting('shoppingList', backup.data.shoppingList);
      }

      logger.info(`Backup restaurado: ${backupId}`, 'backupService');
      return true;
    } catch (error) {
      logger.error('Erro ao restaurar backup', 'backupService', error);
      return false;
    }
  }

  /**
   * Exporta dados em formato JSON (LGPD)
   */
  async exportData(user: User): Promise<string> {
    const backup = await this.createBackup(user, 'manual');
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Exporta dados em formato JSON e faz download
   */
  async downloadBackup(user: User): Promise<void> {
    try {
      const jsonData = await this.exportData(user);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitcoach-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info('Backup baixado com sucesso', 'backupService');
    } catch (error) {
      logger.error('Erro ao fazer download do backup', 'backupService', error);
      throw error;
    }
  }

  /**
   * Obtém lista de backups
   */
  async getBackups(): Promise<BackupMetadata[]> {
    return [...this.backups].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Deleta backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      // Remover do IndexedDB (simplificado - em produção, usar API)
      const index = this.backups.findIndex(b => b.id === backupId);
      if (index === -1) return false;

      this.backups.splice(index, 1);
      await this.saveBackupMetadata();

      logger.info(`Backup deletado: ${backupId}`, 'backupService');
      return true;
    } catch (error) {
      logger.error('Erro ao deletar backup', 'backupService', error);
      return false;
    }
  }

  /**
   * Configura backup automático
   */
  private setupAutoBackup(): void {
    // Verificar último backup automático
    const lastAutoBackup = this.backups
      .filter(b => b.type === 'automatic')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (lastAutoBackup) {
      const lastBackupTime = new Date(lastAutoBackup.timestamp).getTime();
      const timeSinceLastBackup = Date.now() - lastBackupTime;

      if (timeSinceLastBackup < this.AUTO_BACKUP_INTERVAL) {
        // Agendar próximo backup
        const timeUntilNext = this.AUTO_BACKUP_INTERVAL - timeSinceLastBackup;
        setTimeout(() => {
          this.performAutoBackup();
        }, timeUntilNext);
        return;
      }
    }

    // Fazer backup agora se necessário
    this.performAutoBackup();
  }

  /**
   * Executa backup automático
   */
  private async performAutoBackup(): Promise<void> {
    try {
      // Obter usuário atual (simplificado)
      const userData = await getAppSetting<User>('currentUser');
      if (!userData) return;

      await this.createBackup(userData, 'automatic');

      // Agendar próximo backup
      setTimeout(() => {
        this.performAutoBackup();
      }, this.AUTO_BACKUP_INTERVAL);
    } catch (error) {
      logger.warn('Erro ao executar backup automático', 'backupService', error);
    }
  }

  /**
   * Carrega metadata de backups
   */
  private async loadBackupMetadata(): Promise<void> {
    try {
      const saved = await getAppSetting<BackupMetadata[]>('backupMetadata');
      if (saved) {
        this.backups = saved;
      }
    } catch (error) {
      logger.warn('Erro ao carregar metadata de backups', 'backupService', error);
    }
  }

  /**
   * Salva metadata de backups
   */
  private async saveBackupMetadata(): Promise<void> {
    try {
      await saveAppSetting('backupMetadata', this.backups);
    } catch (error) {
      logger.error('Erro ao salvar metadata de backups', 'backupService', error);
    }
  }
}

// Instância singleton
export const backupService = new BackupService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  backupService.initialize().catch(error => {
    logger.error('Erro ao inicializar serviço de backup', 'backupService', error);
  });
}

