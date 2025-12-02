import type { User } from '../types';

export type AccountType = 'USER_B2C' | 'USER_GYM' | 'USER_PERSONAL';

/**
 * Determina o tipo lógico de conta a partir do usuário
 * - USER_B2C: usuário comum, paga a própria assinatura
 * - USER_GYM: aluno vinculado a academia (gymRole === 'student')
 * - USER_PERSONAL: profissional / personal trainer
 */
export function getAccountType(user: User): AccountType {
  // Aluno de academia
  if (user.gymRole === 'student') {
    return 'USER_GYM';
  }

  // Profissional / personal trainer
  if (user.role === 'professional' || user.gymRole === 'trainer') {
    return 'USER_PERSONAL';
  }

  // Usuário comum (B2C)
  return 'USER_B2C';
}


