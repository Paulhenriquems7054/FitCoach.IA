/**
 * Página de Treinos em Grupo
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GroupCard } from '../components/GroupCard';
import { groupService, WorkoutGroup } from '../services/groupService';
import { useUser } from '../context/UserContext';
import { logger } from '../utils/logger';
import { PlusIcon } from '../components/icons/PlusIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { GroupDetailModal } from '../components/GroupDetailModal';

const GroupWorkoutsPage: React.FC = () => {
  const { user } = useUser();
  const [groups, setGroups] = useState<WorkoutGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'my' | 'public' | 'all'>('my');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, [user, filter]);

  const loadGroups = async () => {
    if (!user?.username) return;

    try {
      setLoading(true);
      let allGroups: WorkoutGroup[] = [];

      if (filter === 'my' || filter === 'all') {
        const myGroups = await groupService.getUserGroups(user.username);
        allGroups = [...myGroups];
      }

      if (filter === 'public' || filter === 'all') {
        const publicGroups = await groupService.getPublicGroups();
        // Adicionar apenas grupos que o usuário não está
        publicGroups.forEach(group => {
          if (!allGroups.find(g => g.id === group.id)) {
            allGroups.push(group);
          }
        });
      }

      setGroups(allGroups);
    } catch (error) {
      logger.error('Erro ao carregar grupos', 'GroupWorkoutsPage', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    if (!user?.username) return;

    try {
      await groupService.joinGroup(user.username, user.nome, groupId);
      await loadGroups();
    } catch (error) {
      logger.error('Erro ao entrar no grupo', 'GroupWorkoutsPage', error);
    }
  };

  const handleLeave = async (groupId: string) => {
    if (!user?.username) return;

    try {
      await groupService.leaveGroup(user.username, groupId);
      await loadGroups();
    } catch (error) {
      logger.error('Erro ao sair do grupo', 'GroupWorkoutsPage', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <div className="p-6">
            <p className="text-slate-600 dark:text-slate-400">Carregando grupos...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Treinos em Grupo
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Participe de grupos, complete desafios e competa com outros usuários!
            </p>
          </div>
          <Button onClick={() => setIsCreatingGroup(true)} className="w-full sm:w-auto">
            <PlusIcon className="w-5 h-5 mr-2" />
            Criar Grupo
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('my')}
            className={`
              px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap
              ${filter === 'my'
                ? 'bg-slate-600 text-white dark:bg-slate-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }
            `}
          >
            Meus Grupos
          </button>
          <button
            onClick={() => setFilter('public')}
            className={`
              px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap
              ${filter === 'public'
                ? 'bg-slate-600 text-white dark:bg-slate-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }
            `}
          >
            Grupos Públicos
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`
              px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap
              ${filter === 'all'
                ? 'bg-slate-600 text-white dark:bg-slate-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }
            `}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Lista de Grupos */}
      {groups.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <UsersIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Nenhum grupo encontrado
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {filter === 'my'
                ? 'Você ainda não participa de nenhum grupo. Crie ou entre em um grupo público para começar!'
                : 'Não há grupos públicos disponíveis no momento.'}
            </p>
            <Button onClick={() => setIsCreatingGroup(true)}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Criar Primeiro Grupo
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              currentUserId={user?.username}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onClick={() => {
                setSelectedGroupId(group.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação de Grupo */}
      <CreateGroupModal
        isOpen={isCreatingGroup}
        onClose={() => setIsCreatingGroup(false)}
        onGroupCreated={(group) => {
          setGroups([group, ...groups]);
          setIsCreatingGroup(false);
          loadGroups();
        }}
      />

      {/* Modal de Detalhes do Grupo */}
      {selectedGroupId && (
        <GroupDetailModal
          isOpen={!!selectedGroupId}
          onClose={() => setSelectedGroupId(null)}
          groupId={selectedGroupId}
          onJoin={() => {
            loadGroups();
          }}
          onLeave={() => {
            loadGroups();
          }}
        />
      )}
    </div>
  );
};

export default GroupWorkoutsPage;

