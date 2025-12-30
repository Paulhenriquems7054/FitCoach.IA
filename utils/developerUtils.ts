/**
 * Utilitários para identificar desenvolvedores no sistema
 * Desenvolvedores têm acesso ilimitado a todas as funcionalidades
 */

import type { User } from '../types';

/**
 * Lista de identificadores que indicam que o usuário é desenvolvedor
 */
const DEVELOPER_USERNAMES = ['dev123', 'dev', 'developer', 'desenvolvedor'];
const DEVELOPER_NAMES = ['Desenvolvedor', 'Developer', 'DEV'];
const DEVELOPER_EMAILS = ['@fitcoach.ia', '@fitcoach.com', 'dev@', 'developer@'];

/**
 * Verifica se um usuário é desenvolvedor
 * Desenvolvedores têm acesso ilimitado a todas as funcionalidades
 * 
 * @param user - Usuário a verificar
 * @returns true se o usuário é desenvolvedor
 */
export function isDeveloper(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  // Verificar username
  if (user.username) {
    const usernameLower = user.username.toLowerCase().trim();
    if (DEVELOPER_USERNAMES.some(dev => dev.toLowerCase() === usernameLower)) {
      return true;
    }
  }

  // Verificar nome
  if (user.nome) {
    const nomeLower = user.nome.toLowerCase().trim();
    if (DEVELOPER_NAMES.some(dev => dev.toLowerCase() === nomeLower)) {
      return true;
    }
  }

  // Verificar email (se existir)
  if (user.email) {
    const emailLower = user.email.toLowerCase();
    if (DEVELOPER_EMAILS.some(devEmail => emailLower.includes(devEmail.toLowerCase()))) {
      return true;
    }
  }

  // Verificar role (caso tenha role de desenvolvedor)
  if (user.role === 'developer' || user.role === 'admin') {
    return true;
  }

  return false;
}

