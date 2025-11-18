import type { User } from '../types';
import { getUser, getWellnessPlan, getCompletedWorkouts } from './databaseService';

export interface ExportedData {
  exportDate: string;
  user: {
    nome: string;
    idade: number;
    genero: string;
    peso: number;
    altura: number;
    objetivo: string;
    points: number;
    disciplineScore: number;
    subscription: string;
    createdAt?: string;
    updatedAt?: string;
  };
  weightHistory: Array<{ date: string; weight: number }>;
  wellnessPlan?: any;
  completedWorkouts?: number[];
  metadata: {
    version: string;
    exportFormat: 'json';
  };
}

/**
 * Exporta todos os dados do usuário em formato JSON (LGPD/GDPR)
 */
export const exportUserData = async (): Promise<ExportedData> => {
  const user = await getUser();
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Carregar dados adicionais
  const wellnessPlan = await getWellnessPlan().catch(() => null);
  const completedWorkouts = await getCompletedWorkouts().catch(() => null);

  const exportedData: ExportedData = {
    exportDate: new Date().toISOString(),
    user: {
      nome: user.nome,
      idade: user.idade,
      genero: user.genero,
      peso: user.peso,
      altura: user.altura,
      objetivo: user.objetivo,
      points: user.points,
      disciplineScore: user.disciplineScore,
      subscription: user.subscription,
    },
    weightHistory: user.weightHistory || [],
    wellnessPlan: wellnessPlan || undefined,
    completedWorkouts: completedWorkouts ? Array.from(completedWorkouts) : undefined,
    metadata: {
      version: '1.0',
      exportFormat: 'json',
    },
  };

  return exportedData;
};

/**
 * Faz download do arquivo JSON com os dados exportados
 */
export const downloadExportedData = async (): Promise<void> => {
  try {
    const data = await exportUserData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nutri-ia-dados-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    throw error;
  }
};

