/**
 * Serviço de Banco de Dados Local usando IndexedDB
 * Substitui o uso de localStorage por um banco de dados estruturado
 * 
 * Estrutura do banco:
 * - users: Dados do usuário
 * - wellnessPlans: Planos de bem-estar
 * - completedWorkouts: Treinos concluídos
 * - mealPlans: Planos alimentares gerados
 * - mealAnalyses: Análises de refeições
 * - recipes: Receitas salvas
 * - chatMessages: Mensagens do chat
 * - weightHistory: Histórico de peso
 * - appSettings: Configurações do app
 */

import type { User, WellnessPlan, MealPlan, MealAnalysisResponse, Recipe, ChatMessage, LoginCredentials } from '../types';
import { Goal } from '../types';
import { logger } from '../utils/logger';

const DB_NAME = 'NutriIA_DB';
const DB_VERSION = 3; // Incrementado para adicionar índices de gymId e gymRole

// Interfaces para os objetos do banco
interface DBUser extends User {
    id?: number;
    updatedAt?: string;
}

interface DBWellnessPlan {
    id?: number;
    plan: WellnessPlan;
    createdAt: string;
    updatedAt: string;
}

interface DBCompletedWorkout {
    id?: number;
    dayIndex: number;
    completedAt: string;
    planId?: number;
}

interface DBMealPlan {
    id?: number;
    plan: MealPlan;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

interface DBMealAnalysis {
    id?: number;
    analysis: MealAnalysisResponse;
    imageData?: string;
    createdAt: string;
}

interface DBRecipe {
    id?: number;
    recipe: Recipe;
    createdAt: string;
    favorited: boolean;
}

interface DBChatMessage {
    id?: number;
    message: ChatMessage;
    createdAt: string;
}

interface DBWeightEntry {
    id?: number;
    date: string;
    weight: number;
    createdAt: string;
}

interface DBAppSetting {
    key: string;
    value: unknown;
    updatedAt: string;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Inicializa o banco de dados IndexedDB
 */
export async function initDatabase(): Promise<IDBDatabase> {
    if (dbInstance) {
        return dbInstance;
    }

    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB não está disponível neste ambiente'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            logger.error('Erro ao abrir banco de dados', 'databaseService', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            logger.info('Banco de dados inicializado com sucesso', 'databaseService');
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Object Store: Users
            let userStore: IDBObjectStore;
            if (!db.objectStoreNames.contains('users')) {
                userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                userStore.createIndex('nome', 'nome', { unique: false });
                // Tentar criar índice de username (pode falhar se já existir em upgrade)
                try {
                    userStore.createIndex('username', 'username', { unique: true });
                } catch (e) {
                    // Índice pode já existir, ignorar
                    logger.debug('Índice username já existe', 'databaseService');
                }
            } else {
                // Em upgrade, precisamos usar a transação existente
                const transaction = (event.target as IDBOpenDBRequest).transaction;
                if (transaction) {
                    userStore = transaction.objectStore('users');
                } else {
                    // Fallback: criar nova transação (pode não funcionar em todos os casos)
                    userStore = db.transaction(['users'], 'readwrite').objectStore('users');
                }
            }
            
            // Adicionar novos índices em upgrade (se não existirem)
            if (userStore) {
                try {
                    if (!userStore.indexNames.contains('gymId')) {
                        userStore.createIndex('gymId', 'gymId', { unique: false });
                    }
                } catch (e) {
                    logger.debug('Índice gymId pode já existir ou erro ao criar', 'databaseService');
                }
                try {
                    if (!userStore.indexNames.contains('gymRole')) {
                        userStore.createIndex('gymRole', 'gymRole', { unique: false });
                    }
                } catch (e) {
                    logger.debug('Índice gymRole pode já existir ou erro ao criar', 'databaseService');
                }
            }

            // Object Store: Wellness Plans
            if (!db.objectStoreNames.contains('wellnessPlans')) {
                const planStore = db.createObjectStore('wellnessPlans', { keyPath: 'id', autoIncrement: true });
                planStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Object Store: Completed Workouts
            if (!db.objectStoreNames.contains('completedWorkouts')) {
                const workoutStore = db.createObjectStore('completedWorkouts', { keyPath: 'id', autoIncrement: true });
                workoutStore.createIndex('dayIndex', 'dayIndex', { unique: false });
                workoutStore.createIndex('completedAt', 'completedAt', { unique: false });
            }

            // Object Store: Meal Plans
            if (!db.objectStoreNames.contains('mealPlans')) {
                const mealPlanStore = db.createObjectStore('mealPlans', { keyPath: 'id', autoIncrement: true });
                mealPlanStore.createIndex('userId', 'userId', { unique: false });
                mealPlanStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Object Store: Meal Analyses
            if (!db.objectStoreNames.contains('mealAnalyses')) {
                const analysisStore = db.createObjectStore('mealAnalyses', { keyPath: 'id', autoIncrement: true });
                analysisStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Object Store: Recipes
            if (!db.objectStoreNames.contains('recipes')) {
                const recipeStore = db.createObjectStore('recipes', { keyPath: 'id', autoIncrement: true });
                recipeStore.createIndex('createdAt', 'createdAt', { unique: false });
                recipeStore.createIndex('favorited', 'favorited', { unique: false });
            }

            // Object Store: Chat Messages
            if (!db.objectStoreNames.contains('chatMessages')) {
                const chatStore = db.createObjectStore('chatMessages', { keyPath: 'id', autoIncrement: true });
                chatStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Object Store: Weight History
            if (!db.objectStoreNames.contains('weightHistory')) {
                const weightStore = db.createObjectStore('weightHistory', { keyPath: 'id', autoIncrement: true });
                weightStore.createIndex('date', 'date', { unique: true });
                weightStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Object Store: App Settings
            if (!db.objectStoreNames.contains('appSettings')) {
                const settingsStore = db.createObjectStore('appSettings', { keyPath: 'key' });
                settingsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }

            logger.info('Estrutura do banco de dados criada', 'databaseService');
        };
    });
}

/**
 * Obtém instância do banco de dados (inicializa se necessário)
 */
async function getDB(): Promise<IDBDatabase> {
    if (!dbInstance) {
        return await initDatabase();
    }
    return dbInstance;
}

// ==================== USERS ====================

/**
 * Salva ou atualiza dados do usuário
 * IMPORTANTE: Preserva a senha existente se não for fornecida
 */
export async function saveUser(user: User): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        // Buscar usuário existente - tentar por username primeiro, depois por ID, depois primeiro usuário
        const findUser = async (): Promise<DBUser | null> => {
            return new Promise((resolveFind, rejectFind) => {
                // Se o usuário tem username, tentar buscar por username
                if (user.username) {
                    if (store.indexNames.contains('username')) {
                        const index = store.index('username');
                        const request = index.get(user.username);
                        request.onsuccess = () => {
                            if (request.result) {
                                resolveFind(request.result);
                                return;
                            }
                            // Se não encontrou por username, continuar para buscar geral
                            const getAllRequest = store.getAll();
                            getAllRequest.onsuccess = () => {
                                const users = getAllRequest.result;
                                resolveFind(users.length > 0 ? users[0] : null);
                            };
                            getAllRequest.onerror = () => rejectFind(getAllRequest.error);
                        };
                        request.onerror = () => {
                            // Se índice falhar, buscar geral
                            const getAllRequest = store.getAll();
                            getAllRequest.onsuccess = () => {
                                const users = getAllRequest.result;
                                resolveFind(users.length > 0 ? users[0] : null);
                            };
                            getAllRequest.onerror = () => rejectFind(getAllRequest.error);
                        };
                        return;
                    }
                }
                
                // Buscar todos os usuários
                const getAllRequest = store.getAll();
                getAllRequest.onsuccess = () => {
                    const users = getAllRequest.result;
                    resolveFind(users.length > 0 ? users[0] : null);
                };
                getAllRequest.onerror = () => rejectFind(getAllRequest.error);
            });
        };
        
        findUser().then((existingUser) => {
            if (existingUser) {
                // Atualizar usuário existente - preservar senha se não fornecida
                const dbUser: DBUser = {
                    ...existingUser, // Preservar dados existentes (incluindo senha)
                    ...user, // Sobrescrever com novos dados
                    id: existingUser.id, // Manter ID
                    updatedAt: new Date().toISOString(),
                };
                
                // Se o user não tem password, preservar a senha existente
                if (!user.password && existingUser.password) {
                    dbUser.password = existingUser.password;
                }
                
                // Se o user não tem username, preservar o username existente para evitar violação de constraint
                if (!user.username && existingUser.username) {
                    dbUser.username = existingUser.username;
                }
                
                // Se username foi fornecido e é diferente do existente, verificar se já existe outro usuário com esse username
                if (user.username && user.username !== existingUser.username) {
                    // Verificar se outro usuário já tem esse username
                    if (store.indexNames.contains('username')) {
                        const index = store.index('username');
                        const checkRequest = index.get(user.username);
                        checkRequest.onsuccess = () => {
                            if (checkRequest.result && checkRequest.result.id !== existingUser.id) {
                                // Outro usuário já tem esse username, manter o username existente
                                dbUser.username = existingUser.username;
                            }
                            // Atualizar usuário
                            const updateRequest = store.put(dbUser);
                            updateRequest.onsuccess = () => {
                                logger.debug('Usuário atualizado no banco de dados', 'databaseService');
                                resolve();
                            };
                            updateRequest.onerror = () => reject(updateRequest.error);
                        };
                        checkRequest.onerror = () => {
                            // Se verificação falhar, tentar atualizar mesmo assim
                            const updateRequest = store.put(dbUser);
                            updateRequest.onsuccess = () => {
                                logger.debug('Usuário atualizado no banco de dados', 'databaseService');
                                resolve();
                            };
                            updateRequest.onerror = () => reject(updateRequest.error);
                        };
                        return;
                    }
                }
                
                const updateRequest = store.put(dbUser);
                updateRequest.onsuccess = () => {
                    logger.debug('Usuário atualizado no banco de dados', 'databaseService');
                    resolve();
                };
                updateRequest.onerror = () => reject(updateRequest.error);
            } else {
                // Criar novo usuário
                const dbUser: DBUser = {
                    ...user,
                    updatedAt: new Date().toISOString(),
                };
                
                // Se username não foi fornecido, gerar um único baseado no timestamp
                if (!dbUser.username) {
                    dbUser.username = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                }
                
                const addRequest = store.add(dbUser);
                addRequest.onsuccess = () => {
                    logger.debug('Usuário criado no banco de dados', 'databaseService');
                    resolve();
                };
                addRequest.onerror = () => reject(addRequest.error);
            }
        }).catch((error) => {
            reject(error);
        });
    });
}

/**
 * Carrega dados do usuário pelo username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        
        // Tentar usar índice se disponível, senão buscar em todos
        if (store.indexNames.contains('username')) {
            const index = store.index('username');
            const request = index.get(username);
            request.onsuccess = () => {
                const dbUser = request.result;
                if (dbUser) {
                    // Remover campos internos do banco
                    const { id, updatedAt, password: _, ...user } = dbUser;
                    resolve(user as User);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        } else {
            // Fallback: buscar todos e filtrar
            const request = store.getAll();
            request.onsuccess = () => {
                const users = request.result;
                const dbUser = users.find((u: DBUser) => u.username === username);
                if (dbUser) {
                    // Remover campos internos do banco
                    const { id, updatedAt, password: _, ...user } = dbUser;
                    resolve(user as User);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        }
    });
}

/**
 * Carrega dados do usuário (compatibilidade - retorna primeiro usuário ou usuário da sessão)
 */
export async function getUser(): Promise<User | null> {
    // Primeiro, tentar carregar pela sessão
    const currentUsername = await getCurrentUsername();
    if (currentUsername) {
        const user = await getUserByUsername(currentUsername);
        if (user) {
            return user;
        }
    }

    // Fallback: retornar primeiro usuário (compatibilidade)
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.getAll();

        request.onsuccess = () => {
            const users = request.result;
            if (users.length > 0) {
                const dbUser = users[0];
                // Remover campos internos do banco
                const { id, updatedAt, password: _, ...user } = dbUser;
                resolve(user as User);
            } else {
                resolve(null);
            }
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Inicializa os usuários padrão (Administrador e Desenvolvedor) se não existirem
 */
export async function initializeDefaultUsers(): Promise<void> {
    try {
        const defaultGymId = 'default-gym';
        
        // Verificar se Administrador existe
        const adminExists = await usernameExists('Administrador');
        if (!adminExists) {
            await registerUser('Administrador', 'admin123', {
                nome: 'Administrador',
                role: 'professional',
                subscription: 'premium',
                gymRole: 'admin',
                gymId: defaultGymId,
            });
            logger.info('Usuário Administrador criado', 'databaseService');
        } else {
            // Atualizar Administrador existente para garantir que tem gymId e gymRole
            const admin = await getUserByUsername('Administrador');
            if (admin && (!admin.gymId || !admin.gymRole)) {
                await saveUser({
                    ...admin,
                    gymId: admin.gymId || defaultGymId,
                    gymRole: admin.gymRole || 'admin',
                });
            }
        }

        // Verificar se Desenvolvedor existe
        const devExists = await usernameExists('Desenvolvedor');
        if (!devExists) {
            await registerUser('Desenvolvedor', 'dev123', {
                nome: 'Desenvolvedor',
                role: 'professional',
                subscription: 'premium',
                gymRole: 'admin',
                gymId: defaultGymId,
            });
            logger.info('Usuário Desenvolvedor criado', 'databaseService');
        } else {
            // Atualizar Desenvolvedor existente para garantir que tem gymId e gymRole
            const dev = await getUserByUsername('Desenvolvedor');
            if (dev && (!dev.gymId || !dev.gymRole)) {
                await saveUser({
                    ...dev,
                    gymId: dev.gymId || defaultGymId,
                    gymRole: dev.gymRole || 'admin',
                });
            }
        }
    } catch (error) {
        logger.error('Erro ao inicializar usuários padrão', 'databaseService', error);
        // Não lançar erro para não bloquear a inicialização do app
    }
}

/**
 * Função simples de hash para senha (SHA-256)
 */
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se um username já existe
 */
export async function usernameExists(username: string): Promise<boolean> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        
        // Tentar usar índice se disponível, senão buscar em todos
        if (store.indexNames.contains('username')) {
            const index = store.index('username');
            const request = index.get(username);
            request.onsuccess = () => {
                resolve(request.result !== undefined);
            };
            request.onerror = () => reject(request.error);
        } else {
            // Fallback: buscar todos e filtrar
            const request = store.getAll();
            request.onsuccess = () => {
                const users = request.result;
                const exists = users.some((u: DBUser) => u.username === username);
                resolve(exists);
            };
            request.onerror = () => reject(request.error);
        }
    });
}

/**
 * Registra um novo usuário com username e senha
 */
export async function registerUser(username: string, password: string, userData: Partial<User>): Promise<User> {
    const db = await getDB();
    
    // Verificar se username já existe
    const exists = await usernameExists(username);
    if (exists) {
        throw new Error('Nome de usuário já está em uso');
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        const newUser: DBUser = {
            nome: userData.nome || username,
            username,
            password: hashedPassword,
            idade: userData.idade || 0,
            genero: userData.genero || 'Masculino',
            peso: userData.peso || 0,
            altura: userData.altura || 0,
            objetivo: (userData.objetivo || Goal.PERDER_PESO) as Goal,
            points: 0,
            disciplineScore: 0,
            completedChallengeIds: [],
            isAnonymized: false,
            weightHistory: [],
            role: 'user',
            subscription: 'free',
            updatedAt: new Date().toISOString(),
        };

        const addRequest = store.add(newUser);
        addRequest.onsuccess = () => {
            const { id, updatedAt, password: _, ...user } = newUser;
            resolve(user as User);
        };
        addRequest.onerror = () => reject(addRequest.error);
    });
}

/**
 * Autentica um usuário com username e senha
 */
export async function loginUser(credentials: LoginCredentials): Promise<User | null> {
    const db = await getDB();
    
    // Hash da senha fornecida
    const hashedPassword = await hashPassword(credentials.password);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        
        // Tentar usar índice se disponível, senão buscar em todos
        if (store.indexNames.contains('username')) {
            const index = store.index('username');
            const request = index.get(credentials.username);
            request.onsuccess = () => {
                const dbUser = request.result;
                if (!dbUser) {
                    resolve(null); // Username não encontrado
                    return;
                }

                // Verificar senha
                if (dbUser.password === hashedPassword) {
                    // Remover campos internos e senha
                    const { id, updatedAt, password: _, ...user } = dbUser;
                    resolve(user as User);
                } else {
                    resolve(null); // Senha incorreta
                }
            };
            request.onerror = () => reject(request.error);
        } else {
            // Fallback: buscar todos e filtrar
            const request = store.getAll();
            request.onsuccess = () => {
                const users = request.result;
                const dbUser = users.find((u: DBUser) => u.username === credentials.username);
                if (!dbUser) {
                    resolve(null); // Username não encontrado
                    return;
                }

                // Verificar senha
                if (dbUser.password === hashedPassword) {
                    // Remover campos internos e senha
                    const { id, updatedAt, password: _, ...user } = dbUser;
                    resolve(user as User);
                } else {
                    resolve(null); // Senha incorreta
                }
            };
            request.onerror = () => reject(request.error);
        }
    });
}

/**
 * Salva o estado de login (username) no appSettings
 */
export async function saveLoginSession(username: string): Promise<void> {
    await saveAppSetting('current_username', username);
}

/**
 * Obtém o username da sessão atual
 */
export async function getCurrentUsername(): Promise<string | null> {
    return await getAppSetting<string>('current_username');
}

/**
 * Remove a sessão de login
 */
export async function clearLoginSession(): Promise<void> {
    await saveAppSetting('current_username', '');
}

/**
 * Exclui um usuário do banco de dados
 */
export async function deleteUser(username: string): Promise<boolean> {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        // Tentar usar índice se disponível
        if (store.indexNames.contains('username')) {
            const index = store.index('username');
            const request = index.get(username);
            request.onsuccess = () => {
                const dbUser = request.result;
                if (!dbUser) {
                    resolve(false);
                    return;
                }
                
                const deleteRequest = store.delete(dbUser.id);
                deleteRequest.onsuccess = () => {
                    logger.debug('Usuário excluído do banco de dados', 'databaseService');
                    resolve(true);
                };
                deleteRequest.onerror = () => reject(deleteRequest.error);
            };
            request.onerror = () => reject(request.error);
        } else {
            // Buscar em todos os usuários
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => {
                const users = getAllRequest.result;
                const userToDelete = users.find((u: DBUser) => u.username === username);
                
                if (!userToDelete) {
                    resolve(false);
                    return;
                }
                
                const deleteRequest = store.delete(userToDelete.id);
                deleteRequest.onsuccess = () => {
                    logger.debug('Usuário excluído do banco de dados', 'databaseService');
                    resolve(true);
                };
                deleteRequest.onerror = () => reject(deleteRequest.error);
            };
            getAllRequest.onerror = () => reject(getAllRequest.error);
        }
    });
}

/**
 * Busca todos os usuários de uma academia
 */
export async function getUsersByGymId(gymId: string): Promise<User[]> {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        
        // Tentar usar índice se disponível
        if (store.indexNames.contains('gymId')) {
            const index = store.index('gymId');
            const request = index.getAll(gymId);
            request.onsuccess = () => {
                const dbUsers = request.result as DBUser[];
                const users = dbUsers.map(({ id, updatedAt, password: _, ...user }) => user as User);
                resolve(users);
            };
            request.onerror = () => reject(request.error);
        } else {
            // Buscar em todos os usuários
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => {
                const allUsers = getAllRequest.result as DBUser[];
                const filteredUsers = allUsers.filter((u: DBUser) => u.gymId === gymId);
                const users = filteredUsers.map(({ id, updatedAt, password: _, ...user }) => user as User);
                resolve(users);
            };
            getAllRequest.onerror = () => reject(getAllRequest.error);
        }
    });
}

/**
 * Busca usuários por gymRole em uma academia
 */
export async function getUsersByGymRole(gymId: string, gymRole: 'student' | 'admin' | 'trainer'): Promise<User[]> {
    const db = await getDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        
        // Buscar todos os usuários da academia e filtrar por role
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
            const allUsers = getAllRequest.result as DBUser[];
            const filteredUsers = allUsers.filter(
                (u: DBUser) => u.gymId === gymId && u.gymRole === gymRole
            );
            const users = filteredUsers.map(({ id, updatedAt, password: _, ...user }) => user as User);
            resolve(users);
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
    });
}

/**
 * Busca todos os alunos (students) de uma academia
 */
export async function getStudentsByGymId(gymId: string): Promise<User[]> {
    return getUsersByGymRole(gymId, 'student');
}

/**
 * Busca todos os treinadores (trainers) de uma academia
 */
export async function getTrainersByGymId(gymId: string): Promise<User[]> {
    return getUsersByGymRole(gymId, 'trainer');
}

/**
 * Busca um usuário por ID (username)
 */
export async function getUserById(username: string): Promise<User | null> {
    return getUserByUsername(username);
}

/**
 * Redefine a senha de um usuário pelo username
 */
export async function resetPassword(username: string, newPassword: string): Promise<boolean> {
    const db = await getDB();
    
    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        // Tentar usar índice se disponível, senão buscar em todos
        if (store.indexNames.contains('username')) {
            const index = store.index('username');
            const request = index.get(username);
            request.onsuccess = () => {
                const dbUser = request.result;
                if (!dbUser) {
                    resolve(false); // Username não encontrado
                    return;
                }

                // Atualizar senha
                dbUser.password = hashedPassword;
                dbUser.updatedAt = new Date().toISOString();
                
                const updateRequest = store.put(dbUser);
                updateRequest.onsuccess = () => {
                    logger.info('Senha redefinida com sucesso', 'databaseService');
                    resolve(true);
                };
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            request.onerror = () => reject(request.error);
        } else {
            // Fallback: buscar todos e filtrar
            const request = store.getAll();
            request.onsuccess = () => {
                const users = request.result;
                const dbUser = users.find((u: DBUser) => u.username === username);
                if (!dbUser) {
                    resolve(false); // Username não encontrado
                    return;
                }

                // Atualizar senha
                dbUser.password = hashedPassword;
                dbUser.updatedAt = new Date().toISOString();
                
                const updateRequest = store.put(dbUser);
                updateRequest.onsuccess = () => {
                    logger.info('Senha redefinida com sucesso', 'databaseService');
                    resolve(true);
                };
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            request.onerror = () => reject(request.error);
        }
    });
}

// ==================== WELLNESS PLANS ====================

/**
 * Salva plano de bem-estar
 */
export async function saveWellnessPlan(plan: WellnessPlan): Promise<number> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['wellnessPlans'], 'readwrite');
        const store = transaction.objectStore('wellnessPlans');
        
        const dbPlan: DBWellnessPlan = {
            plan,
            createdAt: plan.data_geracao || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Buscar plano existente
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
            const plans = getAllRequest.result;
            if (plans.length > 0) {
                // Atualizar plano existente
                dbPlan.id = plans[0].id;
                const updateRequest = store.put(dbPlan);
                updateRequest.onsuccess = () => resolve(dbPlan.id!);
                updateRequest.onerror = () => reject(updateRequest.error);
            } else {
                // Criar novo plano
                const addRequest = store.add(dbPlan);
                addRequest.onsuccess = () => resolve(addRequest.result as number);
                addRequest.onerror = () => reject(addRequest.error);
            }
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
    });
}

/**
 * Carrega plano de bem-estar
 */
export async function getWellnessPlan(): Promise<WellnessPlan | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['wellnessPlans'], 'readonly');
        const store = transaction.objectStore('wellnessPlans');
        const request = store.getAll();

        request.onsuccess = () => {
            const plans = request.result;
            if (plans.length > 0) {
                // Retornar o plano mais recente
                const sortedPlans = plans.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                resolve(sortedPlans[0].plan);
            } else {
                resolve(null);
            }
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Deleta plano de bem-estar
 */
export async function deleteWellnessPlan(): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['wellnessPlans'], 'readwrite');
        const store = transaction.objectStore('wellnessPlans');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ==================== COMPLETED WORKOUTS ====================

/**
 * Salva treino concluído
 */
export async function saveCompletedWorkout(dayIndex: number): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['completedWorkouts'], 'readwrite');
        const store = transaction.objectStore('completedWorkouts');
        
        const workout: DBCompletedWorkout = {
            dayIndex,
            completedAt: new Date().toISOString(),
        };

        const request = store.add(workout);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Carrega todos os treinos concluídos
 */
export async function getCompletedWorkouts(): Promise<Set<number>> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['completedWorkouts'], 'readonly');
        const store = transaction.objectStore('completedWorkouts');
        const request = store.getAll();

        request.onsuccess = () => {
            const workouts = request.result;
            const completedSet = new Set<number>();
            workouts.forEach((w: DBCompletedWorkout) => {
                completedSet.add(w.dayIndex);
            });
            resolve(completedSet);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Remove treino concluído
 */
export async function removeCompletedWorkout(dayIndex: number): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['completedWorkouts'], 'readwrite');
        const store = transaction.objectStore('completedWorkouts');
        const index = store.index('dayIndex');
        const request = index.getAll(dayIndex);

        request.onsuccess = () => {
            const workouts = request.result;
            if (workouts.length > 0) {
                const deleteRequest = store.delete(workouts[0].id!);
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => reject(deleteRequest.error);
            } else {
                resolve();
            }
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Limpa todos os treinos concluídos
 */
export async function clearCompletedWorkouts(): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['completedWorkouts'], 'readwrite');
        const store = transaction.objectStore('completedWorkouts');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ==================== MEAL PLANS ====================

/**
 * Salva plano alimentar
 */
export async function saveMealPlan(plan: MealPlan, userId: string): Promise<number> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['mealPlans'], 'readwrite');
        const store = transaction.objectStore('mealPlans');
        
        const dbMealPlan: DBMealPlan = {
            plan,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const request = store.add(dbMealPlan);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Carrega planos alimentares do usuário
 */
export async function getMealPlans(userId: string, limit: number = 10): Promise<MealPlan[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['mealPlans'], 'readonly');
        const store = transaction.objectStore('mealPlans');
        const index = store.index('userId');
        const request = index.getAll(userId);

        request.onsuccess = () => {
            const mealPlans = request.result as DBMealPlan[];
            const sorted = mealPlans.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            resolve(sorted.slice(0, limit).map(mp => mp.plan));
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Carrega planos alimentares do usuário com metadados completos
 */
export async function getMealPlansWithMetadata(userId: string, limit: number = 20): Promise<DBMealPlan[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['mealPlans'], 'readonly');
        const store = transaction.objectStore('mealPlans');
        const index = store.index('userId');
        const request = index.getAll(userId);

        request.onsuccess = () => {
            const mealPlans = request.result as DBMealPlan[];
            const sorted = mealPlans.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            resolve(sorted.slice(0, limit));
        };

        request.onerror = () => reject(request.error);
    });
}

// ==================== MEAL ANALYSES ====================

/**
 * Salva análise de refeição
 */
export async function saveMealAnalysis(analysis: MealAnalysisResponse, imageData?: string): Promise<number> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['mealAnalyses'], 'readwrite');
        const store = transaction.objectStore('mealAnalyses');
        
        const dbAnalysis: DBMealAnalysis = {
            analysis,
            imageData,
            createdAt: new Date().toISOString(),
        };

        const request = store.add(dbAnalysis);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Carrega análises de refeições
 */
export async function getMealAnalyses(limit: number = 20): Promise<DBMealAnalysis[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['mealAnalyses'], 'readonly');
        const store = transaction.objectStore('mealAnalyses');
        const index = store.index('createdAt');
        const request = index.getAll();

        request.onsuccess = () => {
            const analyses = request.result as DBMealAnalysis[];
            const sorted = analyses.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            resolve(sorted.slice(0, limit));
        };

        request.onerror = () => reject(request.error);
    });
}

// ==================== RECIPES ====================

/**
 * Salva receita
 */
export async function saveRecipe(recipe: Recipe): Promise<number> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recipes'], 'readwrite');
        const store = transaction.objectStore('recipes');
        
        const dbRecipe: DBRecipe = {
            id: 0, // Será gerado automaticamente
            recipe,
            createdAt: new Date().toISOString(),
            favorited: false,
        };

        const request = store.add(dbRecipe);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Carrega receitas salvas
 */
export async function getRecipes(favoritedOnly: boolean = false): Promise<Recipe[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recipes'], 'readonly');
        const store = transaction.objectStore('recipes');
        const request = favoritedOnly 
            ? store.index('favorited').getAll(IDBKeyRange.only(true))
            : store.getAll();

        request.onsuccess = () => {
            const recipes = request.result as DBRecipe[];
            const sorted = recipes.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            resolve(sorted.map(r => r.recipe));
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Marca receita como favorita
 */
export async function toggleRecipeFavorite(recipeName: string, favorited: boolean): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recipes'], 'readwrite');
        const store = transaction.objectStore('recipes');
        const request = store.getAll();

        request.onsuccess = () => {
            const recipes = request.result as DBRecipe[];
            const recipe = recipes.find(r => r.recipe.nome_receita === recipeName);
            if (recipe) {
                recipe.favorited = favorited;
                const updateRequest = store.put(recipe);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
            } else {
                resolve();
            }
        };

        request.onerror = () => reject(request.error);
    });
}

// ==================== CHAT MESSAGES ====================

/**
 * Salva mensagem do chat
 */
export async function saveChatMessage(message: ChatMessage): Promise<number> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['chatMessages'], 'readwrite');
        const store = transaction.objectStore('chatMessages');
        
        const dbMessage: DBChatMessage = {
            message,
            createdAt: new Date().toISOString(),
        };

        const request = store.add(dbMessage);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Carrega mensagens do chat
 */
export async function getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['chatMessages'], 'readonly');
        const store = transaction.objectStore('chatMessages');
        const index = store.index('createdAt');
        const request = index.getAll();

        request.onsuccess = () => {
            const messages = request.result as DBChatMessage[];
            const sorted = messages.sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            resolve(sorted.slice(-limit).map(m => m.message));
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Limpa mensagens do chat
 */
export async function clearChatMessages(): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['chatMessages'], 'readwrite');
        const store = transaction.objectStore('chatMessages');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ==================== WEIGHT HISTORY ====================

/**
 * Salva entrada de peso
 */
export async function saveWeightEntry(date: string, weight: number): Promise<number> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['weightHistory'], 'readwrite');
        const store = transaction.objectStore('weightHistory');
        const index = store.index('date');
        
        // Verificar se já existe entrada para esta data
        const getRequest = index.get(date);
        getRequest.onsuccess = () => {
            const existing = getRequest.result as DBWeightEntry | undefined;
            const dbEntry: DBWeightEntry = {
                id: existing?.id,
                date,
                weight,
                createdAt: existing?.createdAt || new Date().toISOString(),
            };

            const request = existing 
                ? store.put(dbEntry)
                : store.add(dbEntry);

            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(request.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Carrega histórico de peso
 */
export async function getWeightHistory(): Promise<{ date: string; weight: number }[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['weightHistory'], 'readonly');
        const store = transaction.objectStore('weightHistory');
        const request = store.getAll();

        request.onsuccess = () => {
            const entries = request.result as DBWeightEntry[];
            const sorted = entries.sort((a, b) => 
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            resolve(sorted.map(e => ({ date: e.date, weight: e.weight })));
        };

        request.onerror = () => reject(request.error);
    });
}

// ==================== APP SETTINGS ====================

/**
 * Salva configuração do app
 */
export async function saveAppSetting(key: string, value: unknown): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['appSettings'], 'readwrite');
        const store = transaction.objectStore('appSettings');
        
        const setting: DBAppSetting = {
            key,
            value,
            updatedAt: new Date().toISOString(),
        };

        const request = store.put(setting);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Carrega configuração do app
 */
export async function getAppSetting<T>(key: string, defaultValue?: T): Promise<T | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['appSettings'], 'readonly');
        const store = transaction.objectStore('appSettings');
        const request = store.get(key);

        request.onsuccess = () => {
            const setting = request.result as DBAppSetting | undefined;
            resolve(setting ? setting.value as T : (defaultValue ?? null));
        };

        request.onerror = () => reject(request.error);
    });
}

// ==================== MIGRATION ====================

/**
 * Migra dados do localStorage para IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        // Migrar usuário
        const userData = localStorage.getItem('nutri.user');
        if (userData) {
            const user = JSON.parse(userData) as User;
            await saveUser(user);
            logger.info('Usuário migrado do localStorage', 'databaseService');
        }

        // Migrar plano de bem-estar
        const wellnessPlanData = localStorage.getItem('nutria.wellness.plan');
        if (wellnessPlanData) {
            const plan = JSON.parse(wellnessPlanData) as WellnessPlan;
            await saveWellnessPlan(plan);
            logger.info('Plano de bem-estar migrado do localStorage', 'databaseService');
        }

        // Migrar treinos concluídos
        const completedWorkoutsData = localStorage.getItem('nutria.wellness.completed');
        if (completedWorkoutsData) {
            const completed = JSON.parse(completedWorkoutsData) as number[];
            for (const dayIndex of completed) {
                await saveCompletedWorkout(dayIndex);
            }
            logger.info('Treinos concluídos migrados do localStorage', 'databaseService');
        }

        // Migrar configurações
        const language = localStorage.getItem('language');
        if (language) {
            await saveAppSetting('language', language);
        }

        const theme = localStorage.getItem('theme');
        if (theme) {
            await saveAppSetting('theme', theme);
        }

        const themeSetting = localStorage.getItem('theme_setting');
        if (themeSetting) {
            await saveAppSetting('theme_setting', themeSetting);
        }

        const lastWeightCheckin = localStorage.getItem('lastWeightCheckin');
        if (lastWeightCheckin) {
            await saveAppSetting('lastWeightCheckin', lastWeightCheckin);
        }

        // Migrar configurações de API
        const apiMode = localStorage.getItem('nutria.api.mode');
        if (apiMode) {
            await saveAppSetting('nutria.api.mode', apiMode);
        }

        const paidApiKey = localStorage.getItem('nutria.api.paidKey');
        if (paidApiKey) {
            await saveAppSetting('nutria.api.paidKey', paidApiKey);
        }

        const freeApiKey = localStorage.getItem('nutria.api.freeKey');
        if (freeApiKey) {
            await saveAppSetting('nutria.api.freeKey', freeApiKey);
        }

        const providerLink = localStorage.getItem('nutria.api.providerLink');
        if (providerLink) {
            await saveAppSetting('nutria.api.providerLink', providerLink);
        }

        logger.info('Migração do localStorage concluída', 'databaseService');
    } catch (error) {
        logger.error('Erro ao migrar dados do localStorage', 'databaseService', error);
    }
}

/**
 * Limpa todos os dados do banco (use com cuidado!)
 */
export async function clearAllData(): Promise<void> {
    const db = await getDB();
    const stores = [
        'users', 'wellnessPlans', 'completedWorkouts', 'mealPlans',
        'mealAnalyses', 'recipes', 'chatMessages', 'weightHistory', 'appSettings'
    ];

    for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise<void>((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    logger.info('Todos os dados foram limpos', 'databaseService');
}

