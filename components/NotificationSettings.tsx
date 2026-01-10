/**
 * Componente de Configurações de Notificações
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPreferences } from '../services/notificationService';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

export const NotificationSettings: React.FC = () => {
  const {
    hasPermission,
    permission,
    preferences,
    requestPermission,
    updatePreferences,
    setupRecurringReminders,
    isInitialized,
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!localPreferences) return;
    
    setLocalPreferences({
      ...localPreferences,
      [key]: !localPreferences[key],
    });
  };

  const handleSave = async () => {
    if (!localPreferences) return;

    setIsSaving(true);
    try {
      await updatePreferences(localPreferences);
      await setupRecurringReminders();
      
      // Feedback visual
      const button = document.activeElement as HTMLElement;
      if (button) {
        button.textContent = 'Salvo! ✓';
        setTimeout(() => {
          button.textContent = 'Salvar Preferências';
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      await setupRecurringReminders();
    }
  };

  if (!isInitialized) {
    return (
      <Card>
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400">
            Carregando configurações de notificação...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Notificações
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Configure quando você deseja receber notificações
          </p>
        </div>

        {/* Status de Permissão */}
        {!hasPermission && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                  Permissão Necessária
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                  {permission === 'denied'
                    ? 'As notificações foram bloqueadas. Por favor, habilite nas configurações do navegador.'
                    : 'Permita notificações para receber lembretes importantes sobre seus treinos e refeições.'}
                </p>
                {permission !== 'denied' && (
                  <Button
                    onClick={handleRequestPermission}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Permitir Notificações
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {hasPermission && localPreferences && (
          <>
            {/* Preferências */}
            <div className="space-y-4">
              <NotificationToggle
                label="Lembretes de Treino"
                description="Notificações diárias para lembrá-lo de fazer seu treino"
                enabled={localPreferences.workoutReminders}
                onChange={() => handleToggle('workoutReminders')}
              />

              <NotificationToggle
                label="Lembretes de Refeição"
                description="Notificações para lembrá-lo das refeições"
                enabled={localPreferences.mealReminders}
                onChange={() => handleToggle('mealReminders')}
              />

              <NotificationToggle
                label="Notificações de Progresso"
                description="Alertas quando você atinge marcos importantes"
                enabled={localPreferences.progressReminders}
                onChange={() => handleToggle('progressReminders')}
              />

              <NotificationToggle
                label="Check-in Semanal"
                description="Lembrete semanal para registrar peso e medidas"
                enabled={localPreferences.weeklyCheckin}
                onChange={() => handleToggle('weeklyCheckin')}
              />

              <NotificationToggle
                label="Novos Desafios"
                description="Notificações quando novos desafios estiverem disponíveis"
                enabled={localPreferences.challengeNotifications}
                onChange={() => handleToggle('challengeNotifications')}
              />

              <NotificationToggle
                label="Lembretes de Hidratação"
                description="Lembretes periódicos para beber água"
                enabled={localPreferences.hydrationReminders}
                onChange={() => handleToggle('hydrationReminders')}
              />

              <NotificationToggle
                label="Lembretes de Assinatura"
                description="Notificações sobre renovação e aniversários"
                enabled={localPreferences.subscriptionReminders}
                onChange={() => handleToggle('subscriptionReminders')}
              />

              <NotificationToggle
                label="Trial Expirando"
                description="Alertas quando seu trial estiver próximo do fim"
                enabled={localPreferences.trialExpiring}
                onChange={() => handleToggle('trialExpiring')}
              />
            </div>

            {/* Botão Salvar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

interface NotificationToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  label,
  description,
  enabled,
  onChange,
}) => {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex-1">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
          {label}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
      <button
        onClick={onChange}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        `}
        role="switch"
        aria-checked={enabled}
        aria-label={`${label} ${enabled ? 'habilitado' : 'desabilitado'}`}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        >
          {enabled ? (
            <CheckIcon className="h-3 w-3 text-primary-600 m-0.5" />
          ) : (
            <XIcon className="h-3 w-3 text-slate-400 m-0.5" />
          )}
        </span>
      </button>
    </div>
  );
};

