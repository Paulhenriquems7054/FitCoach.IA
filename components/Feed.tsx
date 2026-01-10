/**
 * Componente de Feed da Comunidade
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PostCard } from './PostCard';
import { Post } from '../services/communityService';
import { useUser } from '../context/UserContext';
import { communityService } from '../services/communityService';
import { logger } from '../utils/logger';
import { PlusIcon } from './icons/PlusIcon';
import { CreatePostModal } from './CreatePostModal';

export const Feed: React.FC = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  useEffect(() => {
    loadFeed();
  }, [user]);

  const loadFeed = async () => {
    if (!user?.username) return;

    try {
      setLoading(true);
      const feedPosts = await communityService.getFeed(user.username, 20);
      setPosts(feedPosts);
    } catch (error) {
      logger.error('Erro ao carregar feed', 'Feed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    setIsCreatingPost(true);
    // Abrir modal de criação de post (será implementado)
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400">Carregando feed...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Criar Post */}
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="O que você está pensando?"
                onClick={handleCreatePost}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                readOnly
              />
            </div>
            <Button onClick={handleCreatePost}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Criar Post
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Posts */}
      {posts.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Seu feed está vazio. Siga outros usuários para ver seus posts!
            </p>
            <Button onClick={handleCreatePost}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Criar Primeiro Post
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onComment={(postId) => {
                // Abrir modal de comentários
                console.log('Comentar no post:', postId);
              }}
              onShare={(postId) => {
                // Compartilhar post
                console.log('Compartilhar post:', postId);
              }}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação de Post */}
      <CreatePostModal
        isOpen={isCreatingPost}
        onClose={() => setIsCreatingPost(false)}
        onPostCreated={(post) => {
          setPosts([post, ...posts]);
          setIsCreatingPost(false);
        }}
      />
    </div>
  );
};

