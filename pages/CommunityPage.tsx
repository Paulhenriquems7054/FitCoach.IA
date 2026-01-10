/**
 * Página de Comunidade
 */

import React, { useState, useEffect } from 'react';
import { Feed } from '../components/Feed';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UsersIcon } from '../components/icons/UsersIcon';
import { ChatBubbleIcon } from '../components/icons/ChatBubbleIcon';
import { communityService, Group } from '../services/communityService';
import { useUser } from '../context/UserContext';
import { logger } from '../utils/logger';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { PlusIcon } from '../components/icons/PlusIcon';

const CommunityPage: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'discover'>('feed');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    if (activeTab === 'groups' && user?.username) {
      loadGroups();
    }
  }, [activeTab, user]);

  const loadGroups = async () => {
    if (!user?.username) return;

    try {
      setLoading(true);
      const userGroups = await communityService.getUserGroups(user.username);
      const publicGroups = await communityService.getPublicGroups();
      
      // Combinar grupos do usuário e grupos públicos (remover duplicatas)
      const allGroups = [...userGroups];
      publicGroups.forEach(group => {
        if (!allGroups.find(g => g.id === group.id)) {
          allGroups.push(group);
        }
      });
      
      setGroups(allGroups);
    } catch (error) {
      logger.error('Erro ao carregar grupos', 'CommunityPage', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Comunidade
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Conecte-se com outros usuários, compartilhe seu progresso e motive-se!
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('feed')}
            className={`
              px-4 py-2 font-medium border-b-2 transition-colors
              ${activeTab === 'feed'
                ? 'border-slate-600 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }
            `}
          >
            <ChatBubbleIcon className="w-5 h-5 inline mr-2" />
            Feed
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`
              px-4 py-2 font-medium border-b-2 transition-colors
              ${activeTab === 'groups'
                ? 'border-slate-600 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }
            `}
          >
            <UsersIcon className="w-5 h-5 inline mr-2" />
            Grupos
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`
              px-4 py-2 font-medium border-b-2 transition-colors
              ${activeTab === 'discover'
                ? 'border-slate-600 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }
            `}
          >
            Descobrir
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div>
        {activeTab === 'feed' && <Feed />}
        
        {activeTab === 'groups' && (
          <div className="space-y-4">
            {loading ? (
              <Card>
                <div className="p-6">
                  <p className="text-slate-600 dark:text-slate-400">Carregando grupos...</p>
                </div>
              </Card>
            ) : groups.length === 0 ? (
              <Card>
                <div className="p-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Nenhum grupo encontrado. Crie ou participe de grupos para começar!
                  </p>
                  <Button>
                    Criar Grupo
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="mb-4">
                  <Button onClick={() => setIsCreatingGroup(true)}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Criar Grupo
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map(group => (
                    <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                      // Navegar para detalhes do grupo
                      window.location.hash = `#/community/group/${group.id}`;
                    }}>
                      <div className="p-6 space-y-4">
                        {group.imageUrl && (
                          <div className="w-full h-32 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                            <img
                              src={group.imageUrl}
                              alt={group.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                            {group.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {group.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {group.members.length} membros
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!user?.username) return;
                              
                              try {
                                if (group.members.includes(user.username)) {
                                  await communityService.leaveGroup(user.username, group.id);
                                } else {
                                  await communityService.joinGroup(user.username, group.id);
                                }
                                await loadGroups();
                              } catch (error) {
                                logger.error('Erro ao atualizar grupo', 'CommunityPage', error);
                              }
                            }}
                          >
                            {group.members.includes(user?.username || '') ? 'Sair' : 'Entrar'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <Card>
            <div className="p-6 text-center">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Descobrir
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Explore grupos públicos e encontre novos usuários para seguir!
              </p>
              <Button
                onClick={() => {
                  setActiveTab('groups');
                  loadGroups();
                }}
              >
                Ver Grupos Públicos
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Modal de Criação de Grupo */}
      <CreateGroupModal
        isOpen={isCreatingGroup}
        onClose={() => setIsCreatingGroup(false)}
        onGroupCreated={(group) => {
          setGroups([group, ...groups]);
          setIsCreatingGroup(false);
        }}
      />
    </div>
  );
};

export default CommunityPage;

