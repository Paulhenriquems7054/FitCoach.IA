/**
 * Serviço de Acessibilidade (A11y)
 * WCAG AA, leitores de tela, navegação teclado
 */

import { logger } from '../utils/logger';

export interface AccessibilityPreferences {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

class AccessibilityService {
  private preferences: AccessibilityPreferences = {
    fontSize: 'md',
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
  };

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    this.loadPreferences();
    this.applyPreferences();
    this.setupKeyboardNavigation();
    this.setupScreenReader();
  }

  /**
   * Define preferências de acessibilidade
   */
  setPreferences(preferences: Partial<AccessibilityPreferences>): void {
    Object.assign(this.preferences, preferences);
    this.applyPreferences();
    this.savePreferences();
    logger.info('Preferências de acessibilidade atualizadas', 'accessibilityService');
  }

  /**
   * Obtém preferências
   */
  getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }

  /**
   * Aplica preferências
   */
  private applyPreferences(): void {
    const root = document.documentElement;

    // Tamanho da fonte
    const fontSizeMap = { sm: '14px', md: '16px', lg: '18px', xl: '20px' };
    root.style.setProperty('--font-size-base', fontSizeMap[this.preferences.fontSize]);

    // Alto contraste
    if (this.preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Redução de movimento
    if (this.preferences.reducedMotion) {
      root.classList.add('reduce-motion');
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.classList.remove('reduce-motion');
      root.style.removeProperty('--animation-duration');
    }

    // Navegação por teclado
    if (this.preferences.keyboardNavigation) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
  }

  /**
   * Configura navegação por teclado
   */
  private setupKeyboardNavigation(): void {
    // Indicador visual para foco
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
      // Skip to main content
      if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        const main = document.querySelector('main');
        if (main) {
          main.focus();
          main.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      // Fechar modais com ESC
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach(modal => {
          const closeButton = modal.querySelector('[aria-label*="Fechar"], [aria-label*="Close"]');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          }
        });
      }
    });
  }

  /**
   * Configura leitor de tela
   */
  private setupScreenReader(): void {
    // Criar região live para leitores de tela
    let liveRegion = document.getElementById('a11y-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'a11y-live-region';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      `;
      document.body.appendChild(liveRegion);
    }
  }

  /**
   * Anuncia mensagem para leitor de tela
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const liveRegion = document.getElementById('a11y-live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Limpar após 1 segundo
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  /**
   * Adiciona labels ARIA
   */
  addAriaLabels(): void {
    // Adicionar labels a botões sem texto
    document.querySelectorAll('button:not([aria-label]):not(:has(img))').forEach(button => {
      if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
        const icon = button.querySelector('svg');
        if (icon) {
          const iconTitle = icon.querySelector('title')?.textContent;
          if (iconTitle) {
            button.setAttribute('aria-label', iconTitle);
          }
        }
      }
    });

    // Adicionar labels a links de imagem
    document.querySelectorAll('a img:not([alt])').forEach(img => {
      const link = img.closest('a');
      if (link && !link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', `Link: ${img.alt || 'Imagem'}`);
      }
    });
  }

  /**
   * Verifica contraste de cores
   */
  checkColorContrast(foreground: string, background: string): number {
    // Calcular razão de contraste WCAG
    const getLuminance = (color: string): number => {
      const rgb = this.hexToRgb(color);
      if (!rgb) return 0;

      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

    return ratio;
  }

  /**
   * Converte hex para RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Carrega preferências
   */
  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem('a11y_preferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      }

      // Detectar preferências do sistema
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.preferences.reducedMotion = true;
      }
    } catch (error) {
      logger.warn('Erro ao carregar preferências de acessibilidade', 'accessibilityService', error);
    }
  }

  /**
   * Salva preferências
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('a11y_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      logger.error('Erro ao salvar preferências de acessibilidade', 'accessibilityService', error);
    }
  }
}

// Instância singleton
export const accessibilityService = new AccessibilityService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  accessibilityService.initialize().catch(error => {
    logger.error('Erro ao inicializar acessibilidade', 'accessibilityService', error);
  });
}

