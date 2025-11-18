import { clearLoginSession, deleteUser } from './databaseService';
import { clearActivityLogs } from './activityLogService';
import { endAllOtherSessions } from './sessionService';
import type { User } from '../types';

/**
 * Anonimiza os dados do usuário em vez de excluir completamente
 */
export const anonymizeUserData = async (user: User): Promise<void> => {
  // Criar usuário anonimizado
  const anonymizedUser: User = {
    ...user,
    nome: 'Usuário Anônimo',
    username: undefined,
    password: undefined,
    photoUrl: undefined,
    isAnonymized: true,
    weightHistory: [],
    completedChallengeIds: [],
    points: 0,
    disciplineScore: 0,
  };

  await deleteUser(user.username || '');
  
  // Limpar logs e sessões
  clearActivityLogs();
  endAllOtherSessions();
};

/**
 * Exclui completamente a conta do usuário
 */
export const deleteUserAccount = async (user: User): Promise<void> => {
  if (user.username) {
    await deleteUser(user.username);
  }
  
  // Limpar todos os dados
  await clearLoginSession();
  clearActivityLogs();
  endAllOtherSessions();
  
  // Limpar localStorage relacionado
  localStorage.removeItem('nutri_ia_activity_logs');
  localStorage.removeItem('nutri_ia_active_sessions');
  localStorage.removeItem('nutri_ia_current_session_id');
  
  // Redirecionar para página inicial
  window.location.hash = '#/presentation';
};

