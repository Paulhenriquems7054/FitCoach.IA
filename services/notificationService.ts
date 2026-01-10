/**
 * Serviço de Notificações Push
 * Sistema completo de notificações para engajar usuários
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface NotificationPreferences {
  workoutReminders: boolean;
  mealReminders: boolean;
  progressReminders: boolean;
  weeklyCheckin: boolean;
  challengeNotifications: boolean;
  hydrationReminders: boolean;
  subscriptionReminders: boolean;
  trialExpiring: boolean;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  type: 'workout' | 'meal' | 'progress' | 'checkin' | 'challenge' | 'hydration' | 'subscription' | 'trial';
  data?: Record<string, any>;
}

class NotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private preferences: NotificationPreferences | null = null;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();

  /**
   * Inicializa o serviço de notificações
   */
  async initialize(): Promise<boolean> {
    try {
      // Verificar suporte
      if (!('Notification' in window)) {
        logger.warn('Notificações não são suportadas neste navegador', 'notificationService');
        return false;
      }

      // Verificar Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          this.serviceWorkerRegistration = registration;
          logger.info('Service Worker registrado para notificações', 'notificationService');
        } catch (error) {
          logger.warn('Service Worker não disponível, usando Notification API', 'notificationService');
        }
      }

      // Carregar preferências
      await this.loadPreferences();

      return true;
    } catch (error) {
      logger.error('Erro ao inicializar serviço de notificações', 'notificationService', error);
      return false;
    }
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      logger.info(`Permissão de notificação: ${permission}`, 'notificationService');
      return permission;
    } catch (error) {
      logger.error('Erro ao solicitar permissão de notificação', 'notificationService', error);
      return 'denied';
    }
  }

  /**
   * Verifica se tem permissão
   */
  hasPermission(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Envia notificação imediata
   */
  async sendNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<boolean> {
    if (!this.hasPermission()) {
      logger.warn('Sem permissão para enviar notificação', 'notificationService');
      return false;
    }

    try {
      const notificationOptions: NotificationOptions = {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: options.tag || 'fitcoach-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        ...options,
      };

      // Tentar usar Service Worker primeiro
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(title, notificationOptions);
      } else {
        // Fallback para Notification API
        new Notification(title, notificationOptions);
      }

      logger.info(`Notificação enviada: ${title}`, 'notificationService');
      return true;
    } catch (error) {
      logger.error('Erro ao enviar notificação', 'notificationService', error);
      return false;
    }
  }

  /**
   * Agenda notificação
   */
  scheduleNotification(notification: ScheduledNotification): string {
    const now = new Date();
    const scheduledTime = new Date(notification.scheduledTime);

    if (scheduledTime <= now) {
      // Enviar imediatamente se já passou
      this.sendNotification(notification.title, {
        body: notification.body,
        data: notification.data,
        tag: notification.type,
      });
      return notification.id;
    }

    // Calcular delay
    const delay = scheduledTime.getTime() - now.getTime();

    // Agendar
    const timeoutId = setTimeout(() => {
      this.sendNotification(notification.title, {
        body: notification.body,
        data: notification.data,
        tag: notification.type,
      });
      this.scheduledNotifications.delete(notification.id);
    }, delay);

    // Armazenar referência (usando id como chave)
    (timeoutId as any).notificationId = notification.id;
    this.scheduledNotifications.set(notification.id, notification);

    logger.info(`Notificação agendada: ${notification.title} para ${scheduledTime}`, 'notificationService');
    return notification.id;
  }

  /**
   * Cancela notificação agendada
   */
  cancelScheduledNotification(id: string): boolean {
    const notification = this.scheduledNotifications.get(id);
    if (!notification) {
      return false;
    }

    this.scheduledNotifications.delete(id);
    logger.info(`Notificação cancelada: ${id}`, 'notificationService');
    return true;
  }

  /**
   * Carrega preferências do usuário
   */
  async loadPreferences(): Promise<NotificationPreferences> {
    try {
      const saved = await getAppSetting<NotificationPreferences>('notificationPreferences');
      if (saved) {
        this.preferences = saved;
        return saved;
      }
    } catch (error) {
      logger.warn('Erro ao carregar preferências de notificação', 'notificationService', error);
    }

    // Preferências padrão
    this.preferences = {
      workoutReminders: true,
      mealReminders: true,
      progressReminders: true,
      weeklyCheckin: true,
      challengeNotifications: true,
      hydrationReminders: true,
      subscriptionReminders: true,
      trialExpiring: true,
    };

    return this.preferences;
  }

  /**
   * Salva preferências do usuário
   */
  async savePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    const current = await this.loadPreferences();
    this.preferences = { ...current, ...preferences };
    
    try {
      await saveAppSetting('notificationPreferences', this.preferences);
      logger.info('Preferências de notificação salvas', 'notificationService');
    } catch (error) {
      logger.error('Erro ao salvar preferências de notificação', 'notificationService', error);
    }
  }

  /**
   * Obtém preferências atuais
   */
  getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  /**
   * Agenda lembretes de treino
   */
  scheduleWorkoutReminder(time: Date): string {
    const id = `workout-${Date.now()}`;
    return this.scheduleNotification({
      id,
      title: '💪 Hora do Treino!',
      body: 'Não esqueça de fazer seu treino de hoje!',
      scheduledTime: time,
      type: 'workout',
    });
  }

  /**
   * Agenda lembretes de refeição
   */
  scheduleMealReminder(time: Date, mealName: string): string {
    const id = `meal-${Date.now()}`;
    return this.scheduleNotification({
      id,
      title: '🍽️ Hora da Refeição!',
      body: `Não esqueça de fazer sua ${mealName}!`,
      scheduledTime: time,
      type: 'meal',
      data: { mealName },
    });
  }

  /**
   * Agenda lembrete de check-in semanal
   */
  scheduleWeeklyCheckin(date: Date): string {
    const id = `checkin-${Date.now()}`;
    return this.scheduleNotification({
      id,
      title: '📊 Check-in Semanal',
      body: 'É hora de registrar seu peso e medidas desta semana!',
      scheduledTime: date,
      type: 'checkin',
    });
  }

  /**
   * Agenda notificação de trial expirando
   */
  scheduleTrialExpiringReminder(date: Date, daysLeft: number): string {
    const id = `trial-${Date.now()}`;
    return this.scheduleNotification({
      id,
      title: '⏰ Trial Expirando',
      body: `Seu trial expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}. Assine agora para continuar!`,
      scheduledTime: date,
      type: 'trial',
      data: { daysLeft },
    });
  }

  /**
   * Agenda notificação de novo desafio
   */
  scheduleChallengeNotification(date: Date, challengeName: string): string {
    const id = `challenge-${Date.now()}`;
    return this.scheduleNotification({
      id,
      title: '🏆 Novo Desafio Disponível!',
      body: `Um novo desafio está disponível: ${challengeName}`,
      scheduledTime: date,
      type: 'challenge',
      data: { challengeName },
    });
  }

  /**
   * Agenda lembrete de hidratação
   */
  scheduleHydrationReminder(time: Date): string {
    const id = `hydration-${Date.now()}`;
    return this.scheduleNotification({
      id,
      title: '💧 Hora de Beber Água!',
      body: 'Não esqueça de se hidratar!',
      scheduledTime: time,
      type: 'hydration',
    });
  }

  /**
   * Agenda notificação de aniversário de assinatura
   */
  scheduleSubscriptionAnniversary(date: Date): string {
    const id = `subscription-${Date.now()}`;
    return this.scheduleNotification({
      id,
      title: '🎉 Aniversário de Assinatura!',
      body: 'Parabéns! Você está conosco há um mês! Continue assim!',
      scheduledTime: date,
      type: 'subscription',
    });
  }

  /**
   * Configura lembretes recorrentes baseados nas preferências
   */
  async setupRecurringReminders(userPreferences?: Partial<NotificationPreferences>): Promise<void> {
    const preferences = userPreferences 
      ? { ...(await this.loadPreferences()), ...userPreferences }
      : await this.loadPreferences();

    // Limpar notificações anteriores
    this.scheduledNotifications.clear();

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0); // 8h da manhã

    // Lembretes de treino (diário às 8h)
    if (preferences.workoutReminders) {
      this.scheduleWorkoutReminder(tomorrow);
    }

    // Lembretes de hidratação (a cada 3 horas durante o dia)
    if (preferences.hydrationReminders) {
      for (let hour = 9; hour <= 21; hour += 3) {
        const reminderTime = new Date(now);
        reminderTime.setHours(hour, 0, 0, 0);
        if (reminderTime > now) {
          this.scheduleHydrationReminder(reminderTime);
        }
      }
    }

    // Check-in semanal (domingo às 9h)
    if (preferences.weeklyCheckin) {
      const nextSunday = new Date(now);
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(9, 0, 0, 0);
      this.scheduleWeeklyCheckin(nextSunday);
    }

    logger.info('Lembretes recorrentes configurados', 'notificationService');
  }
}

// Instância singleton
export const notificationService = new NotificationService();

// Inicializar automaticamente quando o módulo for carregado
if (typeof window !== 'undefined') {
  notificationService.initialize().catch(error => {
    logger.error('Erro ao inicializar serviço de notificações', 'notificationService', error);
  });
}

