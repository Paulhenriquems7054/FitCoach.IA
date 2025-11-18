import type { User } from '../types';

/**
 * Calcula a diferença em dias entre duas datas
 */
const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verifica e reseta os limites de uso do usuário conforme necessário
 * - Relatórios: reset semanal (7 dias)
 * - Análises de foto: reset diário (1 dia)
 */
export const checkAndResetLimits = (user: User): User => {
  const now = new Date();
  const usageLimits = user.usageLimits || {};
  
  // Reset semanal de relatórios
  const lastReportDate = usageLimits.lastReportDate 
    ? new Date(usageLimits.lastReportDate) 
    : null;
  
  if (!lastReportDate || getDaysDifference(now, lastReportDate) >= 7) {
    usageLimits.reportsGeneratedThisWeek = 0;
    usageLimits.lastReportDate = now.toISOString();
  }
  
  // Reset diário de análises de foto
  const lastPhotoDate = usageLimits.lastPhotoAnalysisDate
    ? new Date(usageLimits.lastPhotoAnalysisDate)
    : null;
    
  if (!lastPhotoDate || getDaysDifference(now, lastPhotoDate) >= 1) {
    usageLimits.photosAnalyzedToday = 0;
    usageLimits.lastPhotoAnalysisDate = now.toISOString();
  }
  
  return {
    ...user,
    usageLimits
  };
};

/**
 * Incrementa o contador de relatórios gerados
 */
export const incrementReportCount = (user: User): User => {
  const usageLimits = user.usageLimits || {};
  const currentCount = usageLimits.reportsGeneratedThisWeek || 0;
  
  return {
    ...user,
    usageLimits: {
      ...usageLimits,
      reportsGeneratedThisWeek: currentCount + 1,
      lastReportDate: new Date().toISOString()
    }
  };
};

/**
 * Incrementa o contador de fotos analisadas
 */
export const incrementPhotoAnalysisCount = (user: User): User => {
  const usageLimits = user.usageLimits || {};
  const currentCount = usageLimits.photosAnalyzedToday || 0;
  
  return {
    ...user,
    usageLimits: {
      ...usageLimits,
      photosAnalyzedToday: currentCount + 1,
      lastPhotoAnalysisDate: new Date().toISOString()
    }
  };
};

/**
 * Obtém o número de relatórios gerados nesta semana
 */
export const getReportsGeneratedThisWeek = (user: User): number => {
  return user.usageLimits?.reportsGeneratedThisWeek || 0;
};

/**
 * Obtém o número de fotos analisadas hoje
 */
export const getPhotosAnalyzedToday = (user: User): number => {
  return user.usageLimits?.photosAnalyzedToday || 0;
};

