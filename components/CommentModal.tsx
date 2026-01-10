/**
 * Modal de Comentários
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Comment } from '../services/communityService';
import { useUser } from '../context/UserContext';
import { communityService } from '../services/communityService';
import { logger } from '../utils/logger';
import { XIcon } from './icons/XIcon';
import { Avatar } from './ui/Avatar';
import { HeartIcon } from './icons/HeartIcon';

export interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  comments: Comment[];
  onCommentAdded?: (comment: Comment) => void;
  onCommentLiked?: (commentId: string) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  postId,
  comments: initialComments,
  onCommentAdded,
  onCommentLiked,
}) => {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.username || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await communityService.addComment(
        user.username,
        user.nome,
        postId,
        newComment.trim()
      );
      setComments([...comments, comment]);
      setNewComment('');
      onCommentAdded?.(comment);
    } catch (error) {
      logger.error('Erro ao adicionar comentário', 'CommentModal', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user?.username) return;

    try {
      // Toggle like no comentário
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        const index = comment.likes.indexOf(user.username);
        if (index >= 0) {
          comment.likes.splice(index, 1);
        } else {
          comment.likes.push(user.username);
        }
        setComments([...comments]);
        onCommentLiked?.(commentId);
      }
    } catch (error) {
      logger.error('Erro ao curtir comentário', 'CommentModal', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Comentários ({comments.length})
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Lista de Comentários */}
        <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
          {comments.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <Avatar
                  photoUrl={comment.userPhotoUrl}
                  name={comment.username}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {comment.username}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    {comment.content}
                  </p>
                  <button
                    onClick={() => handleLike(comment.id)}
                    className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <HeartIcon
                      className={`w-4 h-4 ${
                        comment.likes.includes(user?.username || '') ? 'fill-current' : ''
                      }`}
                    />
                    <span>{comment.likes.length}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formulário de Novo Comentário */}
        {user && (
          <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Avatar
              photoUrl={user.photoUrl}
              name={user.nome}
              size="sm"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                size="sm"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

