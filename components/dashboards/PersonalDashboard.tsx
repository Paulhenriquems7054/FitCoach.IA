/**
 * Dashboard específico para Personal Trainers
 * Mostra estatísticas agregadas dos clientes
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { useUser } from '../../context/UserContext';
import { getPersonalTrainerStats, getPersonalTrainerClients, type PersonalTrainerClient } from '../../services/personalTrainerService';
import { UsersIcon } from '../icons/UsersIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { Skeleton } from '../ui/Skeleton';
import { logger } from '../../utils/logger';

const PersonalDashboard: React.FC = () => {
  const { user } = useUser();
  const [stats, setStats] = useState<{
    totalClients: number;
    activeClients: number;
    totalWeightLoss: number;
    averageWeightLoss: number;
    clientsWithProgress: number;
  } | null>(null);
  const [clients, setClients] = useState<PersonalTrainerClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user.id) return;
      
      setIsLoading(true);
      try {
        const [statsData, clientsData] = await Promise.all([
          getPersonalTrainerStats(user.id),
          getPersonalTrainerClients(user.id)
        ]);
        
        setStats(statsData);
        setClients(clientsData);
      } catch (error) {
        logger.error('Erro ao carregar dados do dashboard', 'PersonalDashboard', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user.id]);

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Visão Geral dos Clientes
        </h2>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-8 h-8 text-primary-500" />
                <div>
                  <p className="text-xs text-primary-600 dark:text-primary-400 mb-1">Total de Clientes</p>
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {stats.totalClients}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-xs text-green-600 dark:text-green-400 mb-1">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {stats.activeClients}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <TrendingUpIcon className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Perda Total (kg)</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {stats.totalWeightLoss.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <SparklesIcon className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Média por Cliente</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {stats.averageWeightLoss.toFixed(1)} kg
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {clients.length === 0 ? (
          <div className="text-center py-8">
            <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              Nenhum cliente vinculado ainda.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Compartilhe seu código de equipe para que clientes possam se vincular.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Clientes Recentes
            </h3>
            <div className="space-y-2">
              {clients.slice(0, 5).map(client => {
                const hasProgress = client.weightHistory && client.weightHistory.length > 1;
                const weightChange = hasProgress ? (() => {
                  const sorted = [...client.weightHistory].sort((a, b) => 
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  );
                  return sorted[0].weight - sorted[sorted.length - 1].weight;
                })() : 0;

                return (
                  <div key={client.userId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {client.photoUrl ? (
                        <img src={client.photoUrl} alt={client.nome} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                            {client.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{client.nome}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {client.peso} kg • {client.altura} cm
                        </p>
                      </div>
                    </div>
                    {hasProgress && (
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${weightChange > 0 ? 'text-green-600 dark:text-green-400' : weightChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                          {weightChange > 0 ? '-' : weightChange < 0 ? '+' : ''}{Math.abs(weightChange).toFixed(1)} kg
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {clients.length > 5 && (
              <div className="mt-4 text-center">
                <a 
                  href="#/student-management" 
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Ver todos os {clients.length} clientes →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PersonalDashboard;

