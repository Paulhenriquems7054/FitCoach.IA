/**
 * Modal de Agendamento
 */

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Appointment } from '../services/calendarService';
import { XIcon } from './icons/XIcon';

export interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'reminderSent'>) => Promise<void>;
  initialDate?: Date;
  initialType?: Appointment['type'];
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialType = 'workout',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Appointment['type']>(initialType);
  const [startDate, setStartDate] = useState(
    initialDate ? initialDate.toISOString().slice(0, 16) : ''
  );
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !startDate || !endDate) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        userId: '', // Será preenchido pelo serviço
        title,
        description,
        type,
        startTime: new Date(startDate),
        endTime: new Date(endDate),
        location: location || undefined,
        isOnline,
        meetingLink: isOnline ? meetingLink : undefined,
        trainerName: trainerName || undefined,
        status: 'scheduled',
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setStartDate(initialDate ? initialDate.toISOString().slice(0, 16) : '');
      setEndDate('');
      setLocation('');
      setIsOnline(false);
      setMeetingLink('');
      setTrainerName('');
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Novo Agendamento
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Ex: Treino com Personal Trainer"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tipo *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Appointment['type'])}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="workout">Treino</option>
              <option value="nutrition">Nutrição</option>
              <option value="consultation">Consulta</option>
              <option value="other">Outro</option>
            </select>
          </div>

          {/* Data e Hora de Início */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Data e Hora de Início *
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (!endDate) {
                  // Auto-preencher fim com 1 hora depois
                  const start = new Date(e.target.value);
                  start.setHours(start.getHours() + 1);
                  setEndDate(start.toISOString().slice(0, 16));
                }
              }}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Data e Hora de Fim */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Data e Hora de Fim *
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              min={startDate}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
              placeholder="Detalhes do agendamento..."
            />
          </div>

          {/* Personal Trainer */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Personal Trainer (opcional)
            </label>
            <input
              type="text"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Nome do personal trainer"
            />
          </div>

          {/* Localização */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Agendamento Online
              </span>
            </label>
            
            {isOnline ? (
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Link da reunião (Zoom, Meet, etc.)"
              />
            ) : (
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Local do agendamento"
              />
            )}
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
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Salvando...' : 'Agendar'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

