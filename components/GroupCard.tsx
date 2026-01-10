/**
 * Card de Grupo de Treino
 */

import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { WorkoutGroup } from '../services/groupService';
import { UsersIcon } from './icons/UsersIcon';
import { TrophyIcon } from './icons/TrophyIcon';

export interface GroupCardProps {
  group: WorkoutGroup;
  currentUserId?: string;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onClick?: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  currentUserId,
  onJoin,
  onLeave,
  onClick,
}) => {
  const isMember = currentUserId ? group.members.some(m => m.userId === currentUserId) : false;
  const isAdmin = currentUserId ? group.members.some(m => m.userId === currentUserId && m.role === 'admin') : false;
  const isFull = group.maxMembers ? group.members.length >= group.maxMembers : false;

  const topMembers = [...group.members]
    .sort((a, b) => b.stats.points - a.stats.points)
    .slice(0, 3);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="p-6 space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start gap-4">
          {group.imageUrl && (
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={group.imageUrl}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  {group.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {group.description}
                </p>
              </div>
              {!group.isPublic && (
                <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex-shrink-0">
                  Privado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400 mb-1">
              <UsersIcon className="w-4 h-4" />
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {group.members.length}
              {group.maxMembers && `/${group.maxMembers}`}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Membros
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400 mb-1">
              <TrophyIcon className="w-4 h-4" />
            </div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {group.challenges.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Desafios
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {group.workouts.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Treinos
            </div>
          </div>
        </div>

        {/* Top Membros */}
        {topMembers.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Top Membros
            </p>
            <div className="space-y-1">
              {topMembers.map((member, index) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {member.username}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {member.stats.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          {isMember ? (
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onLeave?.(group.id);
              }}
              className="w-full"
            >
              Sair do Grupo
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onJoin?.(group.id);
              }}
              disabled={isFull}
              className="w-full"
            >
              {isFull ? 'Grupo Cheio' : 'Entrar no Grupo'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

