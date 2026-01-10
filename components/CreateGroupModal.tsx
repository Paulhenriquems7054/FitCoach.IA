/**
 * Modal de Criação de Grupo
 */

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useUser } from '../context/UserContext';
import { communityService, Group } from '../services/communityService';
import { logger } from '../utils/logger';
import { XIcon } from './icons/XIcon';

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (group: Group) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Group['category']>('general');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !user?.username) return;

    setIsCreating(true);
    try {
      const group = await communityService.createGroup(user.username, {
        name: name.trim(),
        description: description.trim(),
        category,
        isPublic,
      });

      // Reset form
      setName('');
      setDescription('');
      setCategory('general');
      setIsPublic(true);
      
      onGroupCreated?.(group);
      onClose();
    } catch (error) {
      logger.error('Erro ao criar grupo', 'CreateGroupModal', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Criar Grupo de Treino
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nome do Grupo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Ex: Grupo de Corrida Matinal"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Descreva o objetivo do grupo..."
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Group['category'])}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="general">Geral</option>
              <option value="weight-loss">Perda de Peso</option>
              <option value="muscle-gain">Ganho de Massa</option>
              <option value="fitness">Fitness</option>
              <option value="nutrition">Nutrição</option>
            </select>
          </div>

          {/* Público/Privado */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-slate-600 rounded"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Grupo Público (qualquer um pode entrar)
              </span>
            </label>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="flex-1"
            >
              {isCreating ? 'Criando...' : 'Criar Grupo'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

