/**
 * Serviço de Agendamento e Calendário
 * Sistema completo de agendamento de treinos, consultas e eventos
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'workout' | 'nutrition' | 'consultation' | 'other';
  startTime: Date;
  endTime: Date;
  trainerId?: string;
  trainerName?: string;
  location?: string;
  isOnline: boolean;
  meetingLink?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  reminderSent: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: Appointment['type'];
  color?: string;
  appointment?: Appointment;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  trainerId?: string;
}

class CalendarService {
  private appointments: Map<string, Appointment[]> = new Map();

  /**
   * Cria um novo agendamento
   */
  async createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'reminderSent'>): Promise<Appointment> {
    const newAppointment: Appointment = {
      ...appointment,
      id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      reminderSent: false,
      status: 'scheduled',
    };

    const userId = appointment.userId;
    const userAppointments = await this.getUserAppointments(userId);
    userAppointments.push(newAppointment);
    
    this.appointments.set(userId, userAppointments);
    await this.saveUserAppointments(userId, userAppointments);

    logger.info(`Agendamento criado: ${newAppointment.title}`, 'calendarService');
    return newAppointment;
  }

  /**
   * Obtém agendamentos do usuário
   */
  async getUserAppointments(userId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: Appointment['type'];
    status?: Appointment['status'];
  }): Promise<Appointment[]> {
    if (this.appointments.has(userId)) {
      let appointments = this.appointments.get(userId)!;
      
      if (filters) {
        if (filters.startDate) {
          appointments = appointments.filter(a => new Date(a.startTime) >= filters.startDate!);
        }
        if (filters.endDate) {
          appointments = appointments.filter(a => new Date(a.startTime) <= filters.endDate!);
        }
        if (filters.type) {
          appointments = appointments.filter(a => a.type === filters.type);
        }
        if (filters.status) {
          appointments = appointments.filter(a => a.status === filters.status);
        }
      }
      
      return appointments;
    }

    try {
      const saved = await getAppSetting<Appointment[]>(`appointments_${userId}`);
      if (saved) {
        // Converter strings de data para Date objects
        const appointments = saved.map(a => ({
          ...a,
          startTime: new Date(a.startTime),
          endTime: new Date(a.endTime),
        }));
        this.appointments.set(userId, appointments);
        return appointments;
      }
    } catch (error) {
      logger.warn('Erro ao carregar agendamentos', 'calendarService', error);
    }

    return [];
  }

  /**
   * Atualiza um agendamento
   */
  async updateAppointment(
    userId: string,
    appointmentId: string,
    updates: Partial<Appointment>
  ): Promise<Appointment | null> {
    const appointments = await this.getUserAppointments(userId);
    const index = appointments.findIndex(a => a.id === appointmentId);
    
    if (index === -1) {
      return null;
    }

    appointments[index] = {
      ...appointments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.appointments.set(userId, appointments);
    await this.saveUserAppointments(userId, appointments);

    logger.info(`Agendamento atualizado: ${appointmentId}`, 'calendarService');
    return appointments[index];
  }

  /**
   * Cancela um agendamento
   */
  async cancelAppointment(userId: string, appointmentId: string): Promise<boolean> {
    return await this.updateAppointment(userId, appointmentId, { status: 'cancelled' }) !== null;
  }

  /**
   * Completa um agendamento
   */
  async completeAppointment(userId: string, appointmentId: string): Promise<boolean> {
    return await this.updateAppointment(userId, appointmentId, { status: 'completed' }) !== null;
  }

  /**
   * Obtém eventos do calendário para um período
   */
  async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const appointments = await this.getUserAppointments(userId, {
      startDate,
      endDate,
    });

    return appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      start: new Date(appointment.startTime),
      end: new Date(appointment.endTime),
      type: appointment.type,
      color: this.getTypeColor(appointment.type),
      appointment,
    }));
  }

  /**
   * Obtém cor baseada no tipo
   */
  private getTypeColor(type: Appointment['type']): string {
    switch (type) {
      case 'workout': return '#10b981'; // verde
      case 'nutrition': return '#f59e0b'; // amarelo
      case 'consultation': return '#3b82f6'; // azul
      default: return '#6b7280'; // cinza
    }
  }

  /**
   * Gera slots de horário disponíveis
   */
  generateTimeSlots(
    date: Date,
    startHour: number = 8,
    endHour: number = 20,
    durationMinutes: number = 60,
    existingAppointments: Appointment[] = []
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const start = new Date(date);
    start.setHours(startHour, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(endHour, 0, 0, 0);

    const current = new Date(start);
    while (current < end) {
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      // Verificar se há conflito com agendamentos existentes
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        return (
          (current >= aptStart && current < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (current <= aptStart && slotEnd >= aptEnd)
        );
      });

      slots.push({
        start: new Date(current),
        end: new Date(slotEnd),
        available: !hasConflict,
      });

      current.setMinutes(current.getMinutes() + durationMinutes);
    }

    return slots;
  }

  /**
   * Exporta agendamentos para formato iCal
   */
  exportToICal(appointments: Appointment[]): string {
    let ical = 'BEGIN:VCALENDAR\n';
    ical += 'VERSION:2.0\n';
    ical += 'PRODID:-//FitCoach.IA//Calendar//EN\n';
    ical += 'CALSCALE:GREGORIAN\n';
    ical += 'METHOD:PUBLISH\n';

    appointments.forEach(appointment => {
      ical += 'BEGIN:VEVENT\n';
      ical += `UID:${appointment.id}@fitcoach.ia\n`;
      ical += `DTSTART:${this.formatICalDate(new Date(appointment.startTime))}\n`;
      ical += `DTEND:${this.formatICalDate(new Date(appointment.endTime))}\n`;
      ical += `SUMMARY:${appointment.title}\n`;
      if (appointment.description) {
        ical += `DESCRIPTION:${appointment.description.replace(/\n/g, '\\n')}\n`;
      }
      if (appointment.location) {
        ical += `LOCATION:${appointment.location}\n`;
      }
      ical += `STATUS:${appointment.status.toUpperCase()}\n`;
      ical += 'END:VEVENT\n';
    });

    ical += 'END:VCALENDAR\n';
    return ical;
  }

  /**
   * Formata data para iCal
   */
  private formatICalDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Salva agendamentos do usuário
   */
  private async saveUserAppointments(userId: string, appointments: Appointment[]): Promise<void> {
    try {
      await saveAppSetting(`appointments_${userId}`, appointments);
    } catch (error) {
      logger.error('Erro ao salvar agendamentos', 'calendarService', error);
    }
  }

  /**
   * Obtém próximos agendamentos
   */
  async getUpcomingAppointments(userId: string, limit: number = 5): Promise<Appointment[]> {
    const appointments = await this.getUserAppointments(userId, {
      status: 'scheduled',
    });

    const now = new Date();
    return appointments
      .filter(a => new Date(a.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, limit);
  }
}

// Instância singleton
export const calendarService = new CalendarService();

