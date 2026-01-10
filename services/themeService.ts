/**
 * Serviço de Personalização Visual
 * Temas, cores, fontes, layouts customizáveis
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  spacing: 'compact' | 'normal' | 'comfortable';
}

export interface UserPreferences {
  theme: Theme;
  darkMode: 'light' | 'dark' | 'auto';
  fontSize: 'sm' | 'md' | 'lg';
  layout: 'default' | 'compact' | 'spacious';
}

class ThemeService {
  private currentTheme: Theme | null = null;
  private userPreferences: UserPreferences | null = null;

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadPreferences();
    this.applyTheme();
  }

  /**
   * Obtém temas disponíveis
   */
  getAvailableThemes(): Theme[] {
    return [
      {
        id: 'default',
        name: 'Padrão',
        colors: {
          primary: '#10b981',
          secondary: '#3b82f6',
          accent: '#f59e0b',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        borderRadius: 'md',
        spacing: 'normal',
      },
      {
        id: 'ocean',
        name: 'Oceano',
        colors: {
          primary: '#0ea5e9',
          secondary: '#06b6d4',
          accent: '#14b8a6',
          background: '#ffffff',
          surface: '#f0f9ff',
          text: '#0c4a6e',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        borderRadius: 'lg',
        spacing: 'normal',
      },
      {
        id: 'sunset',
        name: 'Pôr do Sol',
        colors: {
          primary: '#f97316',
          secondary: '#fb923c',
          accent: '#f59e0b',
          background: '#ffffff',
          surface: '#fff7ed',
          text: '#7c2d12',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        borderRadius: 'md',
        spacing: 'normal',
      },
    ];
  }

  /**
   * Aplica tema
   */
  async setTheme(themeId: string): Promise<void> {
    const themes = this.getAvailableThemes();
    const theme = themes.find(t => t.id === themeId) || themes[0];
    
    this.currentTheme = theme;
    
    if (this.userPreferences) {
      this.userPreferences.theme = theme;
      await this.savePreferences();
    }
    
    this.applyTheme();
    logger.info(`Tema aplicado: ${theme.name}`, 'themeService');
  }

  /**
   * Aplica tema no DOM
   */
  private applyTheme(): void {
    if (!this.currentTheme) return;

    const root = document.documentElement;
    const colors = this.currentTheme.colors;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text', colors.text);
  }

  /**
   * Define modo escuro
   */
  async setDarkMode(mode: 'light' | 'dark' | 'auto'): Promise<void> {
    if (!this.userPreferences) {
      this.userPreferences = this.getDefaultPreferences();
    }

    this.userPreferences.darkMode = mode;
    await this.savePreferences();
    this.applyDarkMode();
  }

  /**
   * Aplica modo escuro
   */
  private applyDarkMode(): void {
    if (!this.userPreferences) return;

    const root = document.documentElement;
    let shouldBeDark = false;

    if (this.userPreferences.darkMode === 'dark') {
      shouldBeDark = true;
    } else if (this.userPreferences.darkMode === 'auto') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  /**
   * Define tamanho da fonte
   */
  async setFontSize(size: 'sm' | 'md' | 'lg'): Promise<void> {
    if (!this.userPreferences) {
      this.userPreferences = this.getDefaultPreferences();
    }

    this.userPreferences.fontSize = size;
    await this.savePreferences();
    this.applyFontSize();
  }

  /**
   * Aplica tamanho da fonte
   */
  private applyFontSize(): void {
    if (!this.userPreferences) return;

    const root = document.documentElement;
    const sizes = {
      sm: '14px',
      md: '16px',
      lg: '18px',
    };

    root.style.setProperty('--font-size-base', sizes[this.userPreferences.fontSize]);
  }

  /**
   * Obtém preferências padrão
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      theme: this.getAvailableThemes()[0],
      darkMode: 'auto',
      fontSize: 'md',
      layout: 'default',
    };
  }

  /**
   * Carrega preferências
   */
  private async loadPreferences(): Promise<void> {
    try {
      const saved = await getAppSetting<UserPreferences>('user_preferences');
      if (saved) {
        this.userPreferences = saved;
        this.currentTheme = saved.theme;
      } else {
        this.userPreferences = this.getDefaultPreferences();
        this.currentTheme = this.userPreferences.theme;
      }
    } catch (error) {
      logger.warn('Erro ao carregar preferências', 'themeService', error);
      this.userPreferences = this.getDefaultPreferences();
      this.currentTheme = this.userPreferences.theme;
    }
  }

  /**
   * Salva preferências
   */
  private async savePreferences(): Promise<void> {
    try {
      if (this.userPreferences) {
        await saveAppSetting('user_preferences', this.userPreferences);
      }
    } catch (error) {
      logger.error('Erro ao salvar preferências', 'themeService', error);
    }
  }

  /**
   * Obtém preferências atuais
   */
  getPreferences(): UserPreferences | null {
    return this.userPreferences;
  }
}

// Instância singleton
export const themeService = new ThemeService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  themeService.initialize().catch(error => {
    logger.error('Erro ao inicializar tema', 'themeService', error);
  });
}

