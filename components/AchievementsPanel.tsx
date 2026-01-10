/**
 * Painel de Conquistas
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { TrophyIcon } from './icons/TrophyIcon';
import { gamificationService, Achievement, UserAchievement } from '../services/gamificationService';
import { useUser } from '../context/UserContext';
import { logger } from '../utils/logger';

export const AchievementsPanel: React.FC = () => {
  const { user } = useUser();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const allAchievements = gamificationService.getAllAchievements();
      const userId = user?.username || 'anonymous';
      const userAchs = await gamificationService.getUserAchievements(userId);
      
      setAchievements(allAchievements);
      setUserAchievements(userAchs);
    } catch (error) {
      logger.error('Erro ao carregar conquistas', 'AchievementsPanel', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-slate-200 dark:bg-slate-700';
      case 'rare': return 'bg-blue-200 dark:bg-blue-800';
      case 'epic': return 'bg-purple-200 dark:bg-purple-800';
      case 'legendary': return 'bg-yellow-200 dark:bg-yellow-800';
      default: return 'bg-slate-200 dark:bg-slate-700';
    }
  };

  const isUnlocked = (achievementId: string): boolean => {
    return userAchievements.some(ua => ua.achievementId === achievementId && ua.completed);
  };

  const getProgress = (achievementId: string): number => {
    const userAch = userAchievements.find(ua => ua.achievementId === achievementId);
    if (!userAch) return 0;
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return 0;
    return (userAch.progress / achievement.requirement.target) * 100;
  };

  const filteredAchievements = achievements.filter(ach => {
    if (filter === 'unlocked') return isUnlocked(ach.id);
    if (filter === 'locked') return !isUnlocked(ach.id);
    return true;
  });

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400">Carregando conquistas...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrophyIcon className="w-6 h-6" />
              Conquistas
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {userAchievements.filter(ua => ua.completed).length} de {achievements.length} desbloqueadas
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unlocked'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Desbloqueadas
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'locked'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Bloqueadas
          </button>
        </div>

        {/* Lista de Conquistas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => {
            const unlocked = isUnlocked(achievement.id);
            const progress = getProgress(achievement.id);

            return (
              <div
                key={achievement.id}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${unlocked
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    text-4xl p-2 rounded-lg
                    ${getRarityColor(achievement.rarity)}
                  `}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {achievement.name}
                      </h3>
                      {unlocked && (
                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {achievement.points} pontos
                      </span>
                      <span className={`
                        text-xs px-2 py-1 rounded
                        ${getRarityColor(achievement.rarity)}
                        text-slate-700 dark:text-slate-300
                      `}>
                        {achievement.rarity}
                      </span>
                    </div>
                    {!unlocked && progress > 0 && (
                      <div className="mt-2">
                        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {Math.round(progress)}% completo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

