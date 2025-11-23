/**
 * Serviço de Migração de Dados
 * Atualiza alunos antigos que não têm gymId ou gymRole definidos
 */

import { getUserByUsername, saveUser, getDB } from './databaseService';
import type { User } from '../types';
import { logger } from '../utils/logger';

/**
 * Busca todos os usuários do banco (função auxiliar)
 */
async function getAllUsersFromDB(): Promise<any[]> {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.getAll();
        
        request.onsuccess = () => {
            const users = request.result;
            console.log('migrateOldStudents - Todos os usuários no banco:', {
                total: users.length,
                usuarios: users.map((u: any) => ({
                    username: u.username,
                    gymId: u.gymId,
                    gymRole: u.gymRole
                }))
            });
            resolve(users);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Migra alunos antigos que não têm gymId ou gymRole
 * Atribui gymId padrão e gymRole 'student' para alunos sem esses campos
 */
export async function migrateOldStudents(defaultGymId: string = 'default-gym'): Promise<number> {
    try {
        const allUsers = await getAllUsersFromDB();
        let migratedCount = 0;
        
        for (const dbUser of allUsers) {
            // Se não tem gymId ou gymRole, mas tem username (não é admin padrão)
            if ((!dbUser.gymId || !dbUser.gymRole) && dbUser.username) {
                const isDefaultAdmin = dbUser.username === 'Administrador' || dbUser.username === 'Desenvolvedor';
                
                if (!isDefaultAdmin) {
                    try {
                        // Atribuir gymId padrão e gymRole student
                        const user = await getUserByUsername(dbUser.username);
                        if (user) {
                            await saveUser({
                                ...user,
                                gymId: user.gymId || defaultGymId,
                                gymRole: user.gymRole || 'student',
                                isGymManaged: user.isGymManaged !== undefined ? user.isGymManaged : true,
                            });
                            migratedCount++;
                            logger.info(`Aluno migrado: ${dbUser.username}`, 'migrationService');
                        }
                    } catch (error) {
                        logger.error(`Erro ao migrar aluno ${dbUser.username}`, 'migrationService', error);
                    }
                }
            }
        }
        
        return migratedCount;
    } catch (error) {
        logger.error('Erro na migração de alunos', 'migrationService', error);
        throw error;
    }
}

