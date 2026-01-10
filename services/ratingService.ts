/**
 * Serviço de Avaliações e Feedback
 * Sistema para avaliar treinos, receitas, personal trainers e o app
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface Rating {
  id: string;
  userId: string;
  itemType: 'workout' | 'recipe' | 'trainer' | 'app';
  itemId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RatingSummary {
  itemId: string;
  itemType: 'workout' | 'recipe' | 'trainer' | 'app';
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

class RatingService {
  private ratings: Map<string, Rating[]> = new Map();

  /**
   * Salva uma avaliação
   */
  async saveRating(rating: Omit<Rating, 'id' | 'createdAt'>): Promise<Rating> {
    const newRating: Rating = {
      ...rating,
      id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    const key = `${rating.itemType}_${rating.itemId}`;
    const existingRatings = await this.getRatings(rating.itemType, rating.itemId);
    
    // Verificar se usuário já avaliou
    const existingIndex = existingRatings.findIndex(r => r.userId === rating.userId);
    if (existingIndex >= 0) {
      // Atualizar avaliação existente
      existingRatings[existingIndex] = {
        ...newRating,
        id: existingRatings[existingIndex].id,
        createdAt: existingRatings[existingIndex].createdAt,
        updatedAt: new Date().toISOString(),
      };
    } else {
      existingRatings.push(newRating);
    }

    this.ratings.set(key, existingRatings);
    await saveAppSetting(key, existingRatings);

    logger.info(`Avaliação salva: ${rating.itemType} ${rating.itemId}`, 'ratingService');
    return newRating;
  }

  /**
   * Obtém avaliações de um item
   */
  async getRatings(itemType: Rating['itemType'], itemId: string): Promise<Rating[]> {
    const key = `${itemType}_${itemId}`;
    
    if (this.ratings.has(key)) {
      return this.ratings.get(key)!;
    }

    try {
      const saved = await getAppSetting<Rating[]>(key);
      if (saved) {
        this.ratings.set(key, saved);
        return saved;
      }
    } catch (error) {
      logger.warn('Erro ao carregar avaliações', 'ratingService', error);
    }

    return [];
  }

  /**
   * Obtém avaliação do usuário para um item
   */
  async getUserRating(
    userId: string,
    itemType: Rating['itemType'],
    itemId: string
  ): Promise<Rating | null> {
    const ratings = await this.getRatings(itemType, itemId);
    return ratings.find(r => r.userId === userId) || null;
  }

  /**
   * Calcula resumo de avaliações
   */
  async getRatingSummary(itemType: Rating['itemType'], itemId: string): Promise<RatingSummary> {
    const ratings = await this.getRatings(itemType, itemId);
    
    if (ratings.length === 0) {
      return {
        itemId,
        itemType,
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++;
    });

    return {
      itemId,
      itemType,
      averageRating: Math.round(average * 10) / 10,
      totalRatings: ratings.length,
      ratingDistribution: distribution,
    };
  }

  /**
   * Obtém avaliações recentes
   */
  async getRecentRatings(itemType?: Rating['itemType'], limit: number = 10): Promise<Rating[]> {
    const allRatings: Rating[] = [];
    
    // Carregar todas as avaliações (em produção, isso seria feito no backend)
    // Por enquanto, retornamos apenas as do tipo especificado
    if (itemType) {
      // Implementação simplificada - em produção, buscar do backend
      return [];
    }

    return allRatings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Deleta uma avaliação
   */
  async deleteRating(userId: string, itemType: Rating['itemType'], itemId: string): Promise<boolean> {
    const ratings = await this.getRatings(itemType, itemId);
    const filtered = ratings.filter(r => r.userId !== userId);
    
    if (filtered.length === ratings.length) {
      return false; // Não encontrada
    }

    const key = `${itemType}_${itemId}`;
    this.ratings.set(key, filtered);
    await saveAppSetting(key, filtered);

    logger.info(`Avaliação deletada: ${itemType} ${itemId}`, 'ratingService');
    return true;
  }
}

// Instância singleton
export const ratingService = new RatingService();

