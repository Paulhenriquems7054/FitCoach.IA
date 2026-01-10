/**
 * Serviço de Filtros Avançados
 * Filtros granulares, salvos, busca inteligente
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface Filter {
  id: string;
  name: string;
  type: 'workout' | 'recipe' | 'meal' | 'progress' | 'community';
  conditions: FilterCondition[];
  createdAt: string;
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: any;
}

export interface SearchOptions {
  query?: string;
  filters?: FilterCondition[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

class FilterService {
  private savedFilters: Filter[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadFilters();
  }

  /**
   * Cria um filtro salvo
   */
  async createFilter(
    name: string,
    type: Filter['type'],
    conditions: FilterCondition[]
  ): Promise<Filter> {
    const filter: Filter = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      conditions,
      createdAt: new Date().toISOString(),
    };

    this.savedFilters.push(filter);
    await this.saveFilters();

    logger.info(`Filtro criado: ${filter.id}`, 'filterService');
    return filter;
  }

  /**
   * Aplica filtros a uma lista
   */
  applyFilters<T>(items: T[], conditions: FilterCondition[]): T[] {
    return items.filter(item => {
      return conditions.every(condition => {
        const fieldValue = this.getFieldValue(item, condition.field);
        return this.evaluateCondition(fieldValue, condition);
      });
    });
  }

  /**
   * Busca inteligente
   */
  intelligentSearch<T>(
    items: T[],
    query: string,
    searchFields: string[]
  ): T[] {
    if (!query.trim()) return items;

    const queryLower = query.toLowerCase();
    const terms = queryLower.split(/\s+/);

    return items.filter(item => {
      const relevance = terms.reduce((score, term) => {
        let termScore = 0;

        searchFields.forEach(field => {
          const fieldValue = this.getFieldValue(item, field);
          if (fieldValue) {
            const valueStr = String(fieldValue).toLowerCase();
            if (valueStr === term) {
              termScore += 10; // Match exato
            } else if (valueStr.includes(term)) {
              termScore += 5; // Match parcial
            } else if (this.fuzzyMatch(valueStr, term)) {
              termScore += 2; // Match fuzzy
            }
          }
        });

        return score + termScore;
      }, 0);

      return relevance > 0;
    }).sort((a, b) => {
      // Ordenar por relevância (simplificado)
      return 0;
    });
  }

  /**
   * Obtém valor do campo
   */
  private getFieldValue(obj: any, field: string): any {
    const parts = field.split('.');
    let value = obj;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }
    return value;
  }

  /**
   * Avalia condição
   */
  private evaluateCondition(value: any, condition: FilterCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greaterThan':
        return Number(value) > Number(condition.value);
      case 'lessThan':
        return Number(value) < Number(condition.value);
      case 'between':
        const [min, max] = condition.value;
        return Number(value) >= Number(min) && Number(value) <= Number(max);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Match fuzzy (simplificado)
   */
  private fuzzyMatch(str: string, pattern: string): boolean {
    let patternIdx = 0;
    for (let i = 0; i < str.length && patternIdx < pattern.length; i++) {
      if (str[i] === pattern[patternIdx]) {
        patternIdx++;
      }
    }
    return patternIdx === pattern.length;
  }

  /**
   * Obtém filtros salvos
   */
  getSavedFilters(type?: Filter['type']): Filter[] {
    if (type) {
      return this.savedFilters.filter(f => f.type === type);
    }
    return [...this.savedFilters];
  }

  /**
   * Deleta filtro salvo
   */
  async deleteFilter(filterId: string): Promise<boolean> {
    const index = this.savedFilters.findIndex(f => f.id === filterId);
    if (index >= 0) {
      this.savedFilters.splice(index, 1);
      await this.saveFilters();
      return true;
    }
    return false;
  }

  /**
   * Carrega filtros
   */
  private async loadFilters(): Promise<void> {
    try {
      const saved = await getAppSetting<Filter[]>('saved_filters');
      if (saved) {
        this.savedFilters = saved;
      }
    } catch (error) {
      logger.warn('Erro ao carregar filtros', 'filterService', error);
    }
  }

  /**
   * Salva filtros
   */
  private async saveFilters(): Promise<void> {
    try {
      await saveAppSetting('saved_filters', this.savedFilters);
    } catch (error) {
      logger.error('Erro ao salvar filtros', 'filterService', error);
    }
  }
}

// Instância singleton
export const filterService = new FilterService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  filterService.initialize().catch(error => {
    logger.error('Erro ao inicializar filtros', 'filterService', error);
  });
}

