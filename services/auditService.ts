/**
 * Serviço de Auditoria
 * 
 * Registra eventos importantes para rastreamento e compliance
 */

import { getSupabaseClient } from './supabaseService';
import { logger } from '../utils/logger';

export type AuditEventType =
  | 'user_login'
  | 'user_logout'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'subscription_renewed'
  | 'payment_processed'
  | 'gym_created'
  | 'gym_updated'
  | 'gym_cancelled'
  | 'student_created'
  | 'student_blocked'
  | 'student_unblocked'
  | 'data_exported'
  | 'data_deleted'
  | 'access_revoked'
  | 'webhook_received'
  | 'webhook_processed'
  | 'webhook_error'
  | 'api_call'
  | 'security_violation';

export interface AuditLogDetails {
  [key: string]: any;
}

/**
 * Registra um evento de auditoria
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  details: AuditLogDetails,
  userId?: string,
  gymId?: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Obter informações do request (se disponível)
    const ipAddress = typeof window !== 'undefined' 
      ? undefined // No frontend, não temos IP direto
      : undefined;
    
    const userAgent = typeof navigator !== 'undefined'
      ? navigator.userAgent
      : undefined;

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        event_type: eventType,
        details: details,
        user_id: userId || null,
        gym_id: gymId || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      });

    if (error) {
      // Se tabela não existir, apenas logar no console
      logger.warn('Erro ao registrar auditoria (tabela pode não existir):', 'auditService', error);
      console.log(`[AUDIT] ${eventType}:`, details);
    } else {
      logger.debug(`Evento de auditoria registrado: ${eventType}`, 'auditService');
    }
  } catch (error) {
    // Fallback: sempre logar no console
    logger.error('Erro ao registrar auditoria', 'auditService', error);
    console.log(`[AUDIT] ${eventType}:`, details);
  }
}

/**
 * Busca logs de auditoria (apenas para admins)
 */
export async function getAuditLogs(
  filters?: {
    eventType?: AuditEventType;
    userId?: string;
    gymId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.gymId) {
      query = query.eq('gym_id', filters.gymId);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100); // Limite padrão
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar logs de auditoria', 'auditService', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar logs de auditoria', 'auditService', error);
    return [];
  }
}

/**
 * Registra login de usuário
 */
export async function logUserLogin(userId: string, username?: string): Promise<void> {
  await logAuditEvent('user_login', {
    username,
    timestamp: new Date().toISOString(),
  }, userId);
}

/**
 * Registra criação de assinatura
 */
export async function logSubscriptionCreated(
  subscriptionId: string,
  planId: string,
  userId?: string,
  gymId?: string
): Promise<void> {
  await logAuditEvent('subscription_created', {
    subscriptionId,
    planId,
    timestamp: new Date().toISOString(),
  }, userId, gymId);
}

/**
 * Registra cancelamento de assinatura
 */
export async function logSubscriptionCancelled(
  subscriptionId: string,
  reason?: string,
  userId?: string,
  gymId?: string
): Promise<void> {
  await logAuditEvent('subscription_cancelled', {
    subscriptionId,
    reason,
    timestamp: new Date().toISOString(),
  }, userId, gymId);
}

/**
 * Registra bloqueio de aluno
 */
export async function logStudentBlocked(
  studentId: string,
  blockedBy: string,
  reason?: string,
  gymId?: string
): Promise<void> {
  await logAuditEvent('student_blocked', {
    studentId,
    blockedBy,
    reason,
    timestamp: new Date().toISOString(),
  }, studentId, gymId);
}

