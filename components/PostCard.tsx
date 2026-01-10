/**
 * Card de Post da Comunidade
 */

import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Post, Comment } from '../services/communityService';
import { useUser } from '../context/UserContext';
import { HeartIcon } from './icons/HeartIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { ShareIcon } from './icons/ShareIcon';
import { Avatar } from './ui/Avatar';
import { communityService } from '../services/communityService';
import { logger } from '../utils/logger';
import { CommentModal } from './CommentModal';

export interface PostCardProps {
  post: Post;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onComment,
  onShare,
}) => {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(post.likes.includes(user?.username || ''));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [commentCount, setCommentCount] = useState(post.comments.length);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState(post.comments);

  const handleLike = async () => {
    if (!user?.username || isLiking) return;

    setIsLiking(true);
    try {
      const liked = await communityService.toggleLike(user.username, post.id);
      setIsLiked(liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
    } catch (error) {
      logger.error('Erro ao curtir post', 'PostCard', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!user?.username) return;

    try {
      await communityService.sharePost(post.id);
      onShare?.(post.id);
    } catch (error) {
      logger.error('Erro ao compartilhar post', 'PostCard', error);
    }
  };

  const getTypeIcon = (type: Post['type']) => {
    switch (type) {
      case 'progress': return '📊';
      case 'workout': return '💪';
      case 'meal': return '🍽️';
      case 'achievement': return '🏆';
      case 'motivation': return '💬';
      case 'question': return '❓';
      default: return '📝';
    }
  };

  const getTypeLabel = (type: Post['type']) => {
    switch (type) {
      case 'progress': return 'Progresso';
      case 'workout': return 'Treino';
      case 'meal': return 'Refeição';
      case 'achievement': return 'Conquista';
      case 'motivation': return 'Motivação';
      case 'question': return 'Pergunta';
      default: return 'Post';
    }
  };

  return (
    <Card>
      <div className="p-6 space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start gap-3">
          <Avatar
            photoUrl={post.userPhotoUrl}
            name={post.username}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {post.username}
              </h3>
              <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                {getTypeIcon(post.type)} {getTypeLabel(post.type)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(post.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="space-y-3">
          <p className="text-slate-900 dark:text-white whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Imagens */}
          {post.images && post.images.length > 0 && (
            <div className={`
              grid gap-2
              ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}
            `}>
              {post.images.map((image, index) => (
                <div
                  key={index}
                  className="w-full h-64 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden"
                >
                  <img
                    src={image}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
          <span>{likeCount} curtidas</span>
          <span>{commentCount} comentários</span>
          {post.shares > 0 && <span>{post.shares} compartilhamentos</span>}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="ghost"
            onClick={handleLike}
            disabled={isLiking}
            className={`
              flex-1 ${isLiked ? 'text-red-600 dark:text-red-400' : ''}
            `}
          >
            <HeartIcon className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="ml-2">Curtir</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setIsCommentModalOpen(true);
              onComment?.(post.id);
            }}
            className="flex-1"
          >
            <ChatBubbleIcon className="w-5 h-5" />
            <span className="ml-2">Comentar</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleShare}
            className="flex-1"
          >
            <ShareIcon className="w-5 h-5" />
            <span className="ml-2">Compartilhar</span>
          </Button>
        </div>

        {/* Comentários recentes */}
        {post.comments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            {post.comments.slice(0, 3).map(comment => (
              <div key={comment.id} className="flex items-start gap-2">
                <Avatar
                  photoUrl={comment.userPhotoUrl}
                  name={comment.username}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-900 dark:text-white">
                      {comment.username}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
            {post.comments.length > 3 && (
              <button
                onClick={() => {
                  setIsCommentModalOpen(true);
                  onComment?.(post.id);
                }}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:underline"
              >
                Ver todos os {post.comments.length} comentários
              </button>
            )}
          </div>
        )}

        {/* Modal de Comentários */}
        <CommentModal
          isOpen={isCommentModalOpen}
          onClose={() => setIsCommentModalOpen(false)}
          postId={post.id}
          comments={comments}
          onCommentAdded={(comment) => {
            setComments([...comments, comment]);
            setCommentCount(comments.length + 1);
          }}
          onCommentLiked={(commentId) => {
            const updatedComments = comments.map(c => {
              if (c.id === commentId) {
                const index = c.likes.indexOf(user?.username || '');
                if (index >= 0) {
                  c.likes.splice(index, 1);
                } else {
                  c.likes.push(user?.username || '');
                }
              }
              return c;
            });
            setComments(updatedComments);
          }}
        />
      </div>
    </Card>
  );
};

