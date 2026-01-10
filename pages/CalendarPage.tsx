/**
 * Página de Calendário e Agendamentos
 */

import React, { useState, useEffect } from 'react';
import { CalendarView } from '../components/CalendarView';
import { AppointmentModal } from '../components/AppointmentModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { calendarService, Appointment } from '../services/calendarService';
import { useUser } from '../context/UserContext';
import { logger } from '../utils/logger';
import { PlusIcon } from '../components/icons/PlusIcon';

const CalendarPage: React.FC = () => {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadUpcomingAppointments();
  }, [user]);

  const loadUpcomingAppointments = async () => {
    if (!user?.username) return;

    try {
      const appointments = await calendarService.getUpcomingAppointments(user.username, 5);
      setUpcomingAppointments(appointments);
    } catch (error) {
      logger.error('Erro ao carregar próximos agendamentos', 'CalendarPage', error);
    }
  };

  const handleSaveAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'reminderSent'>) => {
    if (!user?.username) return;

    try {
      const appointment = await calendarService.createAppointment({
        ...appointmentData,
        userId: user.username,
      });
      
      logger.info('Agendamento criado com sucesso', 'CalendarPage');
      await loadUpcomingAppointments();
      
      // Recarregar página para atualizar calendário
      window.location.reload();
    } catch (error) {
      logger.error('Erro ao criar agendamento', 'CalendarPage', error);
      throw error;
    }
  };

  const handleOpenModal = (date?: Date) => {
    setSelectedDate(date || null);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Calendário e Agendamentos
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gerencie seus treinos, consultas e compromissos
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário Principal */}
        <div className="lg:col-span-2">
          <CalendarView />
        </div>

        {/* Próximos Agendamentos */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Próximos Agendamentos
              </h2>
              
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhum agendamento próximo.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map(appointment => (
                    <div
                      key={appointment.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {appointment.title}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                          {appointment.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(appointment.startTime).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {appointment.trainerName && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          com {appointment.trainerName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Agendamento */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
        initialDate={selectedDate || undefined}
      />
    </div>
  );
};

export default CalendarPage;

