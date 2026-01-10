/**
 * Serviço de Widgets Personalizáveis
 * Dashboard arrastar/soltar, layouts customizáveis
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface Widget {
  id: string;
  type: 'stats' | 'chart' | 'calendar' | 'progress' | 'workouts' | 'nutrition' | 'achievements';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: any;
  visible: boolean;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  widgets: Widget[];
  createdAt: string;
  updatedAt?: string;
}

class WidgetService {
  private layouts: DashboardLayout[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadLayouts();
  }

  /**
   * Cria layout de dashboard
   */
  async createLayout(userId: string, name: string, widgets?: Widget[]): Promise<DashboardLayout> {
    const layout: DashboardLayout = {
      id: `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      widgets: widgets || this.getDefaultWidgets(),
      createdAt: new Date().toISOString(),
    };

    this.layouts.push(layout);
    await this.saveLayouts();

    logger.info(`Layout criado: ${layout.id}`, 'widgetService');
    return layout;
  }

  /**
   * Obtém widgets padrão
   */
  private getDefaultWidgets(): Widget[] {
    return [
      {
        id: 'stats-1',
        type: 'stats',
        title: 'Estatísticas',
        position: { x: 0, y: 0 },
        size: { width: 4, height: 2 },
        visible: true,
      },
      {
        id: 'progress-1',
        type: 'progress',
        title: 'Progresso',
        position: { x: 4, y: 0 },
        size: { width: 4, height: 2 },
        visible: true,
      },
      {
        id: 'workouts-1',
        type: 'workouts',
        title: 'Treinos',
        position: { x: 0, y: 2 },
        size: { width: 6, height: 3 },
        visible: true,
      },
      {
        id: 'nutrition-1',
        type: 'nutrition',
        title: 'Nutrição',
        position: { x: 6, y: 2 },
        size: { width: 2, height: 3 },
        visible: true,
      },
    ];
  }

  /**
   * Obtém layout do usuário
   */
  async getUserLayout(userId: string): Promise<DashboardLayout | null> {
    const layout = this.layouts.find(l => l.userId === userId);
    return layout || null;
  }

  /**
   * Atualiza layout
   */
  async updateLayout(layoutId: string, updates: Partial<DashboardLayout>): Promise<boolean> {
    const layout = this.layouts.find(l => l.id === layoutId);
    if (!layout) return false;

    Object.assign(layout, updates);
    layout.updatedAt = new Date().toISOString();
    await this.saveLayouts();

    logger.info(`Layout atualizado: ${layoutId}`, 'widgetService');
    return true;
  }

  /**
   * Atualiza widget
   */
  async updateWidget(
    layoutId: string,
    widgetId: string,
    updates: Partial<Widget>
  ): Promise<boolean> {
    const layout = this.layouts.find(l => l.id === layoutId);
    if (!layout) return false;

    const widget = layout.widgets.find(w => w.id === widgetId);
    if (!widget) return false;

    Object.assign(widget, updates);
    layout.updatedAt = new Date().toISOString();
    await this.saveLayouts();

    return true;
  }

  /**
   * Move widget
   */
  async moveWidget(
    layoutId: string,
    widgetId: string,
    newPosition: { x: number; y: number }
  ): Promise<boolean> {
    return await this.updateWidget(layoutId, widgetId, { position: newPosition });
  }

  /**
   * Redimensiona widget
   */
  async resizeWidget(
    layoutId: string,
    widgetId: string,
    newSize: { width: number; height: number }
  ): Promise<boolean> {
    return await this.updateWidget(layoutId, widgetId, { size: newSize });
  }

  /**
   * Remove widget
   */
  async removeWidget(layoutId: string, widgetId: string): Promise<boolean> {
    const layout = this.layouts.find(l => l.id === layoutId);
    if (!layout) return false;

    const index = layout.widgets.findIndex(w => w.id === widgetId);
    if (index >= 0) {
      layout.widgets.splice(index, 1);
      layout.updatedAt = new Date().toISOString();
      await this.saveLayouts();
      return true;
    }

    return false;
  }

  /**
   * Adiciona widget
   */
  async addWidget(layoutId: string, widget: Omit<Widget, 'id'>): Promise<Widget | null> {
    const layout = this.layouts.find(l => l.id === layoutId);
    if (!layout) return null;

    const newWidget: Widget = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    layout.widgets.push(newWidget);
    layout.updatedAt = new Date().toISOString();
    await this.saveLayouts();

    logger.info(`Widget adicionado: ${newWidget.id}`, 'widgetService');
    return newWidget;
  }

  /**
   * Carrega layouts
   */
  private async loadLayouts(): Promise<void> {
    try {
      const saved = await getAppSetting<DashboardLayout[]>('dashboard_layouts');
      if (saved) {
        this.layouts = saved;
      }
    } catch (error) {
      logger.warn('Erro ao carregar layouts', 'widgetService', error);
    }
  }

  /**
   * Salva layouts
   */
  private async saveLayouts(): Promise<void> {
    try {
      await saveAppSetting('dashboard_layouts', this.layouts);
    } catch (error) {
      logger.error('Erro ao salvar layouts', 'widgetService', error);
    }
  }
}

// Instância singleton
export const widgetService = new WidgetService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  widgetService.initialize().catch(error => {
    logger.error('Erro ao inicializar widgets', 'widgetService', error);
  });
}

