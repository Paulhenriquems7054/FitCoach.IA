/**
 * Modal de Detalhes do Grupo
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { WorkoutGroup } from '../services/groupService';
import { useUser } from '../context/UserContext';
import { groupService } from '../services/groupService';
import { logger } from '../utils/logger';
import { XIcon } from './icons/XIcon';
import { Avatar } from './ui/Avatar';
import { TrophyIcon } from './icons/TrophyIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PlusIcon } from './icons/PlusIcon';

export interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onJoin?: () => void;
  onLeave?: () => void;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  onClose,
  groupId,
  onJoin,
  onLeave,
}) => {
  const { user } = useUser();
  const [group, setGroup] = useState<WorkoutGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && groupId) {
      loadGroup();
    }
  }, [isOpen, groupId]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const groupData = await groupService.getGroupById(groupId);
      if (groupData) {
        setGroup(groupData);
        const rankingData = await groupService.getGroupRanking(groupId);
        setRanking(rankingData);
      }
    } catch (error) {
      logger.error('Erro ao carregar grupo', 'GroupDetailModal', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user?.username || !group) return;

    try {
      await groupService.joinGroup(user.username, user.nome, group.id);
      await loadGroup();
      onJoin?.();
    } catch (error) {
      logger.error('Erro ao entrar no grupo', 'GroupDetailModal', error);
    }
  };

  const handleLeave = async () => {
    if (!user?.username || !group) return;

    try {
      await groupService.leaveGroup(user.username, group.id);
      await loadGroup();
      onLeave?.();
    } catch (error) {
      logger.error('Erro ao sair do grupo', 'GroupDetailModal', error);
    }
  };

  if (!isOpen || !group) return null;

  const isMember = group.members.some(m => m.userId === (user?.username || ''));
  const isAdmin = group.members.some(m => m.userId === (user?.username || '') && m.role === 'admin');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate pr-2">
            {group.name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 -mr-1 flex-shrink-0"
            aria-label="Fechar"
          >
            <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Descrição */}
            <div>
              <p className="text-slate-700 dark:text-slate-300">
                {group.description}
              </p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-slate-500 dark:text-slate-400" />
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {group.members.length}
                  {group.maxMembers && `/${group.maxMembers}`}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Membros</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-slate-500 dark:text-slate-400" />
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {group.challenges.length}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Desafios</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {group.workouts.length}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Treinos</div>
              </div>
            </div>

            {/* Ranking */}
            {ranking.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                  Ranking
                </h3>
                <div className="space-y-2">
                  {ranking.slice(0, 5).map((member, index) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {member.username}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {member.stats.workoutsCompleted} treinos completos
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {member.stats.points} pts
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Streak: {member.stats.streak} dias
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              {isMember ? (
                <Button
                  variant="secondary"
                  onClick={handleLeave}
                  className="w-full"
                >
                  Sair do Grupo
                </Button>
              ) : (
                <Button
                  onClick={handleJoin}
                  disabled={group.maxMembers ? group.members.length >= group.maxMembers : false}
                  className="w-full"
                >
                  {group.maxMembers && group.members.length >= group.maxMembers ? 'Grupo Cheio' : 'Entrar no Grupo'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

