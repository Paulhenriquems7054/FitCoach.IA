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
    console.log('[isDeveloper] Usuário é null/undefined');
    return false;
  }

  // Verificar username
  if (user.username) {
    const usernameLower = user.username.toLowerCase().trim();
    const matches = DEVELOPER_USERNAMES.some(dev => dev.toLowerCase() === usernameLower);
    if (matches) {
      console.log(`[isDeveloper] ✅ Match por username: "${user.username}" (${usernameLower})`);
      return true;
    }
    console.log(`[isDeveloper] ❌ Username não corresponde: "${user.username}" (${usernameLower})`);
  } else {
    console.log('[isDeveloper] Username não definido');
  }

  // Verificar nome
  if (user.nome) {
    const nomeLower = user.nome.toLowerCase().trim();
    const matches = DEVELOPER_NAMES.some(dev => dev.toLowerCase() === nomeLower);
    if (matches) {
      console.log(`[isDeveloper] ✅ Match por nome: "${user.nome}" (${nomeLower})`);
      return true;
    }
    console.log(`[isDeveloper] ❌ Nome não corresponde: "${user.nome}" (${nomeLower})`);
  } else {
    console.log('[isDeveloper] Nome não definido');
  }

  // Verificar email (se existir)
  if (user.email) {
    const emailLower = user.email.toLowerCase();
    const matches = DEVELOPER_EMAILS.some(devEmail => emailLower.includes(devEmail.toLowerCase()));
    if (matches) {
      console.log(`[isDeveloper] ✅ Match por email: "${user.email}"`);
      return true;
    }
    console.log(`[isDeveloper] ❌ Email não corresponde: "${user.email}"`);
  } else {
    console.log('[isDeveloper] Email não definido');
  }

  // Verificar role (caso tenha role de desenvolvedor)
  if (user.role === 'developer' || user.role === 'admin') {
    console.log(`[isDeveloper] ✅ Match por role: "${user.role}"`);
    return true;
  }
  console.log(`[isDeveloper] ❌ Role não corresponde: "${user.role}"`);

  console.log('[isDeveloper] ❌ Nenhum critério de desenvolvedor encontrado');
  return false;
}

