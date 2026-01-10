/**
 * Hook para gerenciar notificações
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationPreferences } from '../services/notificationService';
import { logger } from '../utils/logger';

export interface UseNotificationsReturn {
  hasPermission: boolean;
  permission: NotificationPermission;
  preferences: NotificationPreferences | null;
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, body?: string) => Promise<boolean>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  setupRecurringReminders: () => Promise<void>;
  isInitialized: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const [hasPermission, setHasPermission] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Verificar permissão atual
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const initialized = await notificationService.initialize();
        setIsInitialized(initialized);

        if (initialized) {
          const hasPerm = notificationService.hasPermission();
          const currentPermission = 'Notification' in window 
            ? Notification.permission 
            : 'denied';
          
          setHasPermission(hasPerm);
          setPermission(currentPermission);

          // Carregar preferências
          const prefs = await notificationService.loadPreferences();
          setPreferences(prefs);
        }
      } catch (error) {
        logger.error('Erro ao verificar permissão de notificação', 'useNotifications', error);
      }
    };

    checkPermission();
  }, []);

  // Solicitar permissão
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await notificationService.requestPermission();
      const hasPerm = result === 'granted';
      setHasPermission(hasPerm);
      setPermission(result);
      return hasPerm;
    } catch (error) {
      logger.error('Erro ao solicitar permissão', 'useNotifications', error);
      return false;
    }
  }, []);

  // Enviar notificação
  const sendNotification = useCallback(async (title: string, body?: string): Promise<boolean> => {
    try {
      return await notificationService.sendNotification(title, { body });
    } catch (error) {
      logger.error('Erro ao enviar notificação', 'useNotifications', error);
      return false;
    }
  }, []);

  // Atualizar preferências
  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    try {
      await notificationService.savePreferences(prefs);
      const updated = await notificationService.loadPreferences();
      setPreferences(updated);
    } catch (error) {
      logger.error('Erro ao atualizar preferências', 'useNotifications', error);
    }
  }, []);

  // Configurar lembretes recorrentes
  const setupRecurringReminders = useCallback(async () => {
    try {
      await notificationService.setupRecurringReminders();
    } catch (error) {
      logger.error('Erro ao configurar lembretes recorrentes', 'useNotifications', error);
    }
  }, []);

  return {
    hasPermission,
    permission,
    preferences,
    requestPermission,
    sendNotification,
    updatePreferences,
    setupRecurringReminders,
    isInitialized,
  };
}

