/**
 * Utilitários de segurança e sanitização
 */

/**
 * Sanitiza string de entrada removendo caracteres perigosos
 */
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags básicas
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick, onerror, etc)
    .substring(0, maxLength);
};

/**
 * Sanitiza número, garantindo que está dentro de um range válido
 */
export const sanitizeNumber = (
  value: string | number,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER
): number | null => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return null;
  if (num < min) return min;
  if (num > max) return max;
  
  return num;
};

/**
 * Sanitiza email removendo caracteres inválidos
 */
export const sanitizeEmail = (email: string): string => {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '')
    .substring(0, 254); // Max email length
};

/**
 * Sanitiza URL removendo protocolos perigosos
 */
export const sanitizeUrl = (url: string): string => {
  const allowedProtocols = ['http:', 'https:'];
  try {
    const urlObj = new URL(url);
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
};

/**
 * Hash simples para senhas (não usar em produção - apenas para desenvolvimento)
 * Em produção, usar bcrypt ou similar
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Usar Web Crypto API se disponível
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback simples (não seguro para produção)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Verifica se uma string contém conteúdo potencialmente perigoso
 */
export const containsDangerousContent = (input: string): boolean => {
  const dangerousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitiza objeto removendo propriedades perigosas
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const sanitized = { ...obj } as Record<string, unknown>;
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key] as string);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>);
    }
  }
  
  return sanitized as T;
};

