/**
 * Serviço de Gerenciamento de Alunos
 * Permite criar, editar, excluir e gerenciar alunos e treinadores
 */

import type { User } from '../types';
import { Goal } from '../types';
import {
    registerUser,
    usernameExists,
    getUserByUsername,
    saveUser,
    deleteUser,
    getUsersByGymId,
    getStudentsByGymId,
    getTrainersByGymId,
} from './databaseService';
import { logger } from '../utils/logger';

/**
 * Cria um novo aluno
 */
export async function createStudent(
    username: string,
    password: string,
    userData: Partial<User>,
    gymId: string
): Promise<User> {
    try {
        // Verificar se username já existe
        const exists = await usernameExists(username);
        if (exists) {
            throw new Error('Nome de usuário já está em uso');
        }

        // Criar aluno com gymRole e gymId
        const student = await registerUser(username, password, {
            ...userData,
            gymId,
            gymRole: 'student',
            isGymManaged: true,
            role: 'user',
            subscription: 'free',
            dataPermissions: {
                allowWeightHistory: true,
                allowMealPlans: true,
                allowPhotoAnalysis: true,
                allowWorkoutData: true,
                allowChatHistory: true,
            },
        });

        logger.info(`Aluno criado: ${username}`, 'studentManagementService');
        return student;
    } catch (error) {
        logger.error('Erro ao criar aluno', 'studentManagementService', error);
        throw error;
    }
}

/**
 * Cria um novo treinador
 */
export async function createTrainer(
    username: string,
    password: string,
    userData: Partial<User>,
    gymId: string
): Promise<User> {
    try {
        // Verificar se username já existe
        const exists = await usernameExists(username);
        if (exists) {
            throw new Error('Nome de usuário já está em uso');
        }

        // Criar treinador com gymRole e gymId
        const trainer = await registerUser(username, password, {
            ...userData,
            gymId,
            gymRole: 'trainer',
            isGymManaged: true,
            role: 'professional',
            subscription: 'premium',
            dataPermissions: {
                allowWeightHistory: true,
                allowMealPlans: true,
                allowPhotoAnalysis: true,
                allowWorkoutData: true,
                allowChatHistory: true,
            },
        });

        logger.info(`Treinador criado: ${username}`, 'studentManagementService');
        return trainer;
    } catch (error) {
        logger.error('Erro ao criar treinador', 'studentManagementService', error);
        throw error;
    }
}

/**
 * Atualiza dados de um aluno ou treinador
 */
export async function updateStudent(
    username: string,
    updates: Partial<User>
): Promise<User> {
    try {
        const existingUser = await getUserByUsername(username);
        if (!existingUser) {
            throw new Error('Usuário não encontrado');
        }

        // Não permitir alterar gymId ou gymRole diretamente
        const { gymId, gymRole, ...safeUpdates } = updates;
        
        const updatedUser: User = {
            ...existingUser,
            ...safeUpdates,
        };

        await saveUser(updatedUser);
        logger.info(`Aluno atualizado: ${username}`, 'studentManagementService');
        return updatedUser;
    } catch (error) {
        logger.error('Erro ao atualizar aluno', 'studentManagementService', error);
        throw error;
    }
}

/**
 * Bloqueia o acesso de um aluno
 */
export async function blockStudentAccess(
    studentUsername: string,
    blockedBy: string,
    reason?: string
): Promise<User> {
    try {
        const student = await getUserByUsername(studentUsername);
        if (!student) {
            throw new Error('Aluno não encontrado');
        }

        if (student.gymRole !== 'student') {
            throw new Error('Apenas alunos podem ter acesso bloqueado');
        }

        const updatedUser = await updateStudent(studentUsername, {
            accessBlocked: true,
            blockedAt: new Date().toISOString(),
            blockedBy,
            blockedReason: reason || 'Acesso bloqueado pela administração',
        });

        logger.info(`Acesso do aluno ${studentUsername} bloqueado por ${blockedBy}`, 'studentManagementService');
        return updatedUser;
    } catch (error) {
        logger.error('Erro ao bloquear acesso do aluno', 'studentManagementService', error);
        throw error;
    }
}

/**
 * Desbloqueia o acesso de um aluno
 */
export async function unblockStudentAccess(
    studentUsername: string,
    unblockedBy: string
): Promise<User> {
    try {
        const student = await getUserByUsername(studentUsername);
        if (!student) {
            throw new Error('Aluno não encontrado');
        }

        const updatedUser = await updateStudent(studentUsername, {
            accessBlocked: false,
            blockedAt: undefined,
            blockedBy: undefined,
            blockedReason: undefined,
        });

        logger.info(`Acesso do aluno ${studentUsername} desbloqueado por ${unblockedBy}`, 'studentManagementService');
        return updatedUser;
    } catch (error) {
        logger.error('Erro ao desbloquear acesso do aluno', 'studentManagementService', error);
        throw error;
    }
}

/**
 * Exclui um aluno ou treinador
 */
export async function deleteStudent(username: string): Promise<boolean> {
    try {
        const result = await deleteUser(username);
        if (result) {
            logger.info(`Aluno excluído: ${username}`, 'studentManagementService');
        }
        return result;
    } catch (error) {
        logger.error('Erro ao excluir aluno', 'studentManagementService', error);
        throw error;
    }
}

/**
 * Lista todos os alunos de uma academia
 */
export async function getAllStudents(gymId: string): Promise<User[]> {
    try {
        return await getStudentsByGymId(gymId);
    } catch (error) {
        logger.error('Erro ao buscar alunos', 'studentManagementService', error);
        throw error;
    }
}

/**
 * Lista todos os treinadores de uma academia
 */
export async function getAllTrainers(gymId: string): Promise<User[]> {
    try {
        return await getTrainersByGymId(gymId);
    } catch (error) {
        logger.error('Erro ao buscar treinadores', 'studentManagementService', error);
        throw error;
    }
}

/**
 * Lista todos os usuários de uma academia (alunos, treinadores e admin)
 */
export async function getAllUsers(gymId: string): Promise<User[]> {
    try {
        return await getUsersByGymId(gymId);
    } catch (error) {
        logger.error('Erro ao buscar usuários', 'studentManagementService', error);
        throw error;
    }
}

/**
 * Atribui um aluno a um treinador (futuro: quando implementar relação treinador-aluno)
 */
export async function assignStudentToTrainer(
    studentUsername: string,
    trainerUsername: string
): Promise<void> {
    try {
        const student = await getUserByUsername(studentUsername);
        const trainer = await getUserByUsername(trainerUsername);

        if (!student || !trainer) {
            throw new Error('Aluno ou treinador não encontrado');
        }

        if (student.gymRole !== 'student') {
            throw new Error('Usuário não é um aluno');
        }

        if (trainer.gymRole !== 'trainer') {
            throw new Error('Usuário não é um treinador');
        }

        // Por enquanto, apenas salva uma referência (pode ser expandido no futuro)
        // Pode adicionar um campo trainerId no User se necessário
        logger.info(`Aluno ${studentUsername} atribuído ao treinador ${trainerUsername}`, 'studentManagementService');
    } catch (error) {
        logger.error('Erro ao atribuir aluno ao treinador', 'studentManagementService', error);
        throw error;
    }
}

