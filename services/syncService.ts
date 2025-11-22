/**
 * Serviço de Sincronização com Servidor da Academia
 * Sincroniza status de bloqueio e dados entre desktop (servidor) e dispositivos móveis (clientes)
 */

import { getUserByUsername, saveUser } from './databaseService';
import { User } from '../types';
import { logger } from '../utils/logger';

// URL do servidor da academia (configurável)
const getGymServerUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('gymServerUrl') || null;
};

const setGymServerUrl = (url: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('gymServerUrl', url);
};

/**
 * Verifica o status de bloqueio de um aluno no servidor da academia
 */
export async function checkStudentStatus(username: string): Promise<{
    accessBlocked: boolean;
    blockedAt?: string;
    blockedBy?: string;
    blockedReason?: string;
    lastSyncAt?: string;
} | null> {
    const serverUrl = getGymServerUrl();
    
    if (!serverUrl) {
        logger.warn('URL do servidor da academia não configurada', 'syncService');
        return null;
    }

    try {
        const response = await fetch(`${serverUrl}/api/students/${encodeURIComponent(username)}/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Timeout de 5 segundos
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        logger.info(`Status do aluno ${username} verificado no servidor`, 'syncService');
        
        return {
            ...data,
            lastSyncAt: new Date().toISOString(),
        };
    } catch (error: any) {
        logger.warn(`Erro ao verificar status no servidor: ${error.message}`, 'syncService');
        // Retornar null para usar fallback local
        return null;
    }
}

/**
 * Sincroniza o status de bloqueio do aluno com o servidor
 */
export async function syncBlockStatus(username: string): Promise<boolean> {
    try {
        const serverStatus = await checkStudentStatus(username);
        
        if (!serverStatus) {
            // Servidor não disponível, usar status local
            logger.info('Servidor não disponível, usando status local', 'syncService');
            return false;
        }

        const localUser = await getUserByUsername(username);
        
        if (!localUser) {
            logger.warn(`Aluno ${username} não encontrado localmente`, 'syncService');
            return false;
        }

        // Verificar se o status mudou
        const statusChanged = localUser.accessBlocked !== serverStatus.accessBlocked;

        if (statusChanged || !localUser.lastSyncAt) {
            // Atualizar status local com dados do servidor
            const updatedUser = {
                ...localUser,
                accessBlocked: serverStatus.accessBlocked,
                blockedAt: serverStatus.blockedAt,
                blockedBy: serverStatus.blockedBy,
                blockedReason: serverStatus.blockedReason,
                lastSyncAt: serverStatus.lastSyncAt,
            };
            await saveUser(updatedUser);

            logger.info(
                `Status do aluno ${username} sincronizado: ${serverStatus.accessBlocked ? 'BLOQUEADO' : 'LIBERADO'}`,
                'syncService'
            );
            return true;
        }

        return false;
    } catch (error: any) {
        logger.error('Erro ao sincronizar status', 'syncService', error);
        return false;
    }
}

/**
 * Sincroniza todos os dados do aluno com o servidor
 */
export async function syncStudentData(username: string): Promise<boolean> {
    try {
        const serverUrl = getGymServerUrl();
        
        if (!serverUrl) {
            return false;
        }

        const response = await fetch(`${serverUrl}/api/students/${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const serverData = await response.json();
        const localUser = await getUserByUsername(username);

        if (localUser && serverData) {
            // Mesclar dados do servidor com dados locais
            const mergedUser: User = {
                ...localUser,
                ...serverData,
                // Preservar dados locais que não devem ser sobrescritos
                points: localUser.points,
                disciplineScore: localUser.disciplineScore,
                completedChallengeIds: localUser.completedChallengeIds,
                weightHistory: localUser.weightHistory,
                lastSyncAt: new Date().toISOString(),
            };

            await saveUser(mergedUser);
            logger.info(`Dados do aluno ${username} sincronizados`, 'syncService');
            return true;
        }

        return false;
    } catch (error: any) {
        logger.warn(`Erro ao sincronizar dados: ${error.message}`, 'syncService');
        return false;
    }
}

/**
 * Configura a URL do servidor da academia
 */
export function configureGymServer(url: string): void {
    // Validar URL
    try {
        new URL(url);
        setGymServerUrl(url);
        logger.info(`Servidor da academia configurado: ${url}`, 'syncService');
    } catch (error) {
        logger.error('URL inválida para servidor da academia', 'syncService', error);
        throw new Error('URL inválida');
    }
}

/**
 * Obtém a URL do servidor configurada
 */
export function getGymServerUrlConfig(): string | null {
    return getGymServerUrl();
}

/**
 * Verifica se o servidor está disponível
 */
export async function checkServerAvailability(): Promise<boolean> {
    const serverUrl = getGymServerUrl();
    
    if (!serverUrl) {
        return false;
    }

    try {
        const response = await fetch(`${serverUrl}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

