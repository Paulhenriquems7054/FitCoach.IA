/**
 * Serviço de Marketplace
 * Venda de treinos/receitas, pagamentos, royalties
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface MarketplaceItem {
  id: string;
  type: 'workout' | 'recipe' | 'meal-plan';
  title: string;
  description: string;
  price: number;
  currency: string;
  authorId: string;
  authorName: string;
  thumbnailUrl?: string;
  content: any; // Treino ou receita
  sales: number;
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Purchase {
  id: string;
  userId: string;
  itemId: string;
  itemType: MarketplaceItem['type'];
  price: number;
  purchasedAt: string;
}

export interface Royalty {
  authorId: string;
  itemId: string;
  amount: number;
  percentage: number;
  date: string;
}

class MarketplaceService {
  private items: MarketplaceItem[] = [];
  private purchases: Purchase[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadData();
  }

  /**
   * Cria item no marketplace
   */
  async createItem(
    authorId: string,
    authorName: string,
    item: Omit<MarketplaceItem, 'id' | 'authorId' | 'authorName' | 'sales' | 'rating' | 'reviews' | 'createdAt' | 'updatedAt'>
  ): Promise<MarketplaceItem> {
    const newItem: MarketplaceItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorId,
      authorName,
      sales: 0,
      rating: 0,
      reviews: 0,
      createdAt: new Date().toISOString(),
    };

    this.items.push(newItem);
    await this.saveItems();

    logger.info(`Item criado no marketplace: ${newItem.id}`, 'marketplaceService');
    return newItem;
  }

  /**
   * Obtém itens do marketplace
   */
  async getItems(filters?: {
    type?: MarketplaceItem['type'];
    authorId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }): Promise<MarketplaceItem[]> {
    let filtered = [...this.items];

    if (filters?.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    if (filters?.authorId) {
      filtered = filtered.filter(item => item.authorId === filters.authorId);
    }

    if (filters?.minPrice !== undefined) {
      filtered = filtered.filter(item => item.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      filtered = filtered.filter(item => item.price <= filters.maxPrice!);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  /**
   * Compra um item
   */
  async purchaseItem(userId: string, itemId: string): Promise<Purchase | null> {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return null;

    // Verificar se já comprou
    const existingPurchase = this.purchases.find(
      p => p.userId === userId && p.itemId === itemId
    );
    if (existingPurchase) {
      return existingPurchase;
    }

    // Criar compra
    const purchase: Purchase = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      itemId,
      itemType: item.type,
      price: item.price,
      purchasedAt: new Date().toISOString(),
    };

    this.purchases.push(purchase);
    item.sales++;
    await this.savePurchases();
    await this.saveItems();

    // Calcular royalty para o autor
    const royalty: Royalty = {
      authorId: item.authorId,
      itemId: item.id,
      amount: item.price * 0.7, // 70% para o autor
      percentage: 70,
      date: new Date().toISOString(),
    };

    logger.info(`Item comprado: ${itemId} por ${userId}`, 'marketplaceService');
    return purchase;
  }

  /**
   * Obtém itens comprados pelo usuário
   */
  async getUserPurchases(userId: string): Promise<MarketplaceItem[]> {
    const userPurchases = this.purchases
      .filter(p => p.userId === userId)
      .map(p => p.itemId);

    return this.items.filter(item => userPurchases.includes(item.id));
  }

  /**
   * Obtém itens do autor
   */
  async getAuthorItems(authorId: string): Promise<MarketplaceItem[]> {
    return this.items.filter(item => item.authorId === authorId);
  }

  /**
   * Calcula royalties do autor
   */
  async getAuthorRoyalties(authorId: string): Promise<Royalty[]> {
    const authorItems = this.items.filter(item => item.authorId === authorId);
    const royalties: Royalty[] = [];

    authorItems.forEach(item => {
      const itemPurchases = this.purchases.filter(p => p.itemId === item.id);
      itemPurchases.forEach(purchase => {
        royalties.push({
          authorId,
          itemId: item.id,
          amount: purchase.price * 0.7,
          percentage: 70,
          date: purchase.purchasedAt,
        });
      });
    });

    return royalties;
  }

  /**
   * Carrega dados
   */
  private async loadData(): Promise<void> {
    try {
      const [items, purchases] = await Promise.all([
        getAppSetting<MarketplaceItem[]>('marketplace_items').catch(() => []),
        getAppSetting<Purchase[]>('marketplace_purchases').catch(() => []),
      ]);

      this.items = items || [];
      this.purchases = purchases || [];
    } catch (error) {
      logger.warn('Erro ao carregar dados do marketplace', 'marketplaceService', error);
    }
  }

  /**
   * Salva itens
   */
  private async saveItems(): Promise<void> {
    try {
      await saveAppSetting('marketplace_items', this.items);
    } catch (error) {
      logger.error('Erro ao salvar itens do marketplace', 'marketplaceService', error);
    }
  }

  /**
   * Salva compras
   */
  private async savePurchases(): Promise<void> {
    try {
      await saveAppSetting('marketplace_purchases', this.purchases);
    } catch (error) {
      logger.error('Erro ao salvar compras', 'marketplaceService', error);
    }
  }
}

// Instância singleton
export const marketplaceService = new MarketplaceService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  marketplaceService.initialize().catch(error => {
    logger.error('Erro ao inicializar marketplace', 'marketplaceService', error);
  });
}

