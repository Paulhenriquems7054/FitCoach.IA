/**
 * Utilitários de validação para formulários
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Valida dados do usuário
 */
export const validateUserData = (data: {
  nome?: string;
  idade?: number;
  genero?: string;
  peso?: number;
  altura?: number;
  objetivo?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validar nome
  if (data.nome !== undefined) {
    if (!data.nome || data.nome.trim().length === 0) {
      errors.push({ field: 'nome', message: 'Nome é obrigatório' });
    } else if (data.nome.trim().length < 2) {
      errors.push({ field: 'nome', message: 'Nome deve ter pelo menos 2 caracteres' });
    } else if (data.nome.length > 100) {
      errors.push({ field: 'nome', message: 'Nome deve ter no máximo 100 caracteres' });
    }
  }

  // Validar idade
  if (data.idade !== undefined) {
    if (data.idade < 1 || data.idade > 120) {
      errors.push({ field: 'idade', message: 'Idade deve estar entre 1 e 120 anos' });
    }
  }

  // Validar gênero
  if (data.genero !== undefined) {
    if (!data.genero || (data.genero !== 'Masculino' && data.genero !== 'Feminino')) {
      errors.push({ field: 'genero', message: 'Gênero deve ser Masculino ou Feminino' });
    }
  }

  // Validar peso
  if (data.peso !== undefined) {
    if (data.peso < 20 || data.peso > 300) {
      errors.push({ field: 'peso', message: 'Peso deve estar entre 20kg e 300kg' });
    }
  }

  // Validar altura
  if (data.altura !== undefined) {
    if (data.altura < 50 || data.altura > 250) {
      errors.push({ field: 'altura', message: 'Altura deve estar entre 50cm e 250cm' });
    }
  }

  // Validar objetivo
  if (data.objetivo !== undefined) {
    const validGoals = ['perder peso', 'manter peso', 'ganhar massa muscular'];
    if (!data.objetivo || !validGoals.includes(data.objetivo)) {
      errors.push({ field: 'objetivo', message: 'Objetivo inválido' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitiza string de entrada
 */
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags básicas
    .substring(0, maxLength);
};

/**
 * Valida email (se necessário no futuro)
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida senha (se necessário no futuro)
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: ValidationError[] = [];

  if (password.length < 6) {
    errors.push({ field: 'password', message: 'Senha deve ter pelo menos 6 caracteres' });
  }

  if (password.length > 100) {
    errors.push({ field: 'password', message: 'Senha deve ter no máximo 100 caracteres' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

