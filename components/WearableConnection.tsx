/**
 * Componente de Conexão com Wearables
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { wearableService, WearableConnection } from '../services/wearableService';
import { logger } from '../utils/logger';

export const WearableConnection: React.FC = () => {
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = () => {
    const active = wearableService.getConnections();
    setConnections(active);
  };

  const handleConnect = async (type: WearableConnection['type']) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      let connected = false;
      switch (type) {
        case 'healthkit':
          connected = await wearableService.connectHealthKit();
          break;
        case 'google-fit':
          connected = await wearableService.connectGoogleFit();
          break;
        case 'fitbit':
          connected = await wearableService.connectFitbit();
          break;
        case 'garmin':
          connected = await wearableService.connectGarmin();
          break;
      }
      if (connected) {
        loadConnections();
      }
    } catch (error) {
      logger.error('Erro ao conectar wearable', 'WearableConnection', error);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDisconnect = async (type: WearableConnection['type']) => {
    try {
      await wearableService.disconnect(type);
      loadConnections();
    } catch (error) {
      logger.error('Erro ao desconectar wearable', 'WearableConnection', error);
    }
  };

  const wearables = [
    { type: 'healthkit' as const, name: 'Apple HealthKit', icon: '🍎' },
    { type: 'google-fit' as const, name: 'Google Fit', icon: '🤖' },
    { type: 'fitbit' as const, name: 'Fitbit', icon: '⌚' },
    { type: 'garmin' as const, name: 'Garmin Connect', icon: '🏃' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Conectar Wearables
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wearables.map(wearable => {
          const connection = connections.find(c => c.type === wearable.type);
          const isConnected = connection?.connected || false;
          const isLoading = loading[wearable.type] || false;

          return (
            <Card key={wearable.type}>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{wearable.icon}</span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {wearable.name}
                    </h4>
                    {isConnected && connection?.lastSync && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sincronizado: {new Date(connection.lastSync).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                {isConnected ? (
                  <Button
                    variant="secondary"
                    onClick={() => handleDisconnect(wearable.type)}
                    size="sm"
                  >
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleConnect(wearable.type)}
                    disabled={isLoading}
                    size="sm"
                  >
                    {isLoading ? 'Conectando...' : 'Conectar'}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

