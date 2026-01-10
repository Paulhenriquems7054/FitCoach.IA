/**
 * Componente de Visualização de Calendário
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { calendarService, CalendarEvent, Appointment } from '../services/calendarService';
import { useUser } from '../context/UserContext';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

export const CalendarView: React.FC = () => {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate, user]);

  const loadEvents = async () => {
    if (!user?.username) return;

    try {
      setLoading(true);
      const start = new Date(currentDate);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(currentDate);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 59);

      const calendarEvents = await calendarService.getCalendarEvents(
        user.username,
        start,
        end
      );
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Dias vazios do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400">Carregando calendário...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigateMonth('prev')}
              className="p-2"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCurrentDate(new Date())}
              className="px-4"
            >
              Hoje
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigateMonth('next')}
              className="p-2"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Calendário */}
        <div className="grid grid-cols-7 gap-1">
          {/* Dias da semana */}
          {weekDays.map(day => (
            <div
              key={day}
              className="p-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-400"
            >
              {day}
            </div>
          ))}

          {/* Dias do mês */}
          {getDaysInMonth().map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="p-2" />;
            }

            const dayEvents = getEventsForDate(date);
            const today = isToday(date);
            const selected = isSelected(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`
                  p-2 min-h-[60px] border rounded-lg transition-colors
                  ${today
                    ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500'
                    : selected
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-400'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${today
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-slate-700 dark:text-slate-300'
                  }
                `}>
                  {date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="text-xs px-1 py-0.5 rounded truncate"
                      style={{ backgroundColor: event.color + '40' }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      +{dayEvents.length - 2} mais
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Eventos do dia selecionado */}
        {selectedDate && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
              Eventos em {selectedDate.toLocaleDateString('pt-BR')}
            </h3>
            <div className="space-y-2">
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhum evento agendado para este dia.
                </p>
              ) : (
                getEventsForDate(selectedDate).map(event => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700"
                    style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {event.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {event.start.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })} - {event.end.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {event.appointment?.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {event.appointment.description}
                          </p>
                        )}
                      </div>
                      <span
                        className="px-2 py-1 text-xs font-medium rounded"
                        style={{ backgroundColor: event.color + '20', color: event.color }}
                      >
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

