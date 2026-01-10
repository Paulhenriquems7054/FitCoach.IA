/**
 * Serviço de Animações e Transições
 * Micro-interações, transições suaves
 */

import { logger } from '../utils/logger';

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
}

export type AnimationType = 
  | 'fade' 
  | 'slide' 
  | 'zoom' 
  | 'bounce' 
  | 'shake'
  | 'pulse'
  | 'spin';

class AnimationService {
  /**
   * Aplica animação a um elemento
   */
  animate(
    element: HTMLElement,
    type: AnimationType,
    config: AnimationConfig = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const duration = config.duration || 300;
      const easing = config.easing || 'ease-in-out';
      const delay = config.delay || 0;

      const animationClasses = {
        fade: 'animate-fade',
        slide: 'animate-slide',
        zoom: 'animate-zoom',
        bounce: 'animate-bounce',
        shake: 'animate-shake',
        pulse: 'animate-pulse',
        spin: 'animate-spin',
      };

      const animationClass = animationClasses[type];
      
      element.classList.add(animationClass);
      element.style.animationDuration = `${duration}ms`;
      element.style.animationTimingFunction = easing;
      element.style.animationDelay = `${delay}ms`;

      setTimeout(() => {
        element.classList.remove(animationClass);
        resolve();
      }, duration + delay);
    });
  }

  /**
   * Transição suave entre estados
   */
  transition(
    element: HTMLElement,
    properties: Record<string, string>,
    config: AnimationConfig = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const duration = config.duration || 300;
      const easing = config.easing || 'ease-in-out';

      element.style.transition = `all ${duration}ms ${easing}`;
      
      Object.entries(properties).forEach(([key, value]) => {
        element.style.setProperty(key, value);
      });

      setTimeout(() => {
        element.style.transition = '';
        resolve();
      }, duration);
    });
  }

  /**
   * Hover effect suave
   */
  addHoverEffect(element: HTMLElement, effect: 'lift' | 'glow' | 'scale' = 'lift'): void {
    const effects = {
      lift: {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      glow: {
        boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
      },
      scale: {
        transform: 'scale(1.05)',
      },
    };

    const effectStyles = effects[effect];
    element.style.transition = 'all 0.3s ease-in-out';

    element.addEventListener('mouseenter', () => {
      Object.entries(effectStyles).forEach(([key, value]) => {
        element.style.setProperty(key, value);
      });
    });

    element.addEventListener('mouseleave', () => {
      Object.entries(effectStyles).forEach(([key]) => {
        element.style.setProperty(key, '');
      });
    });
  }

  /**
   * Loading spinner
   */
  createSpinner(size: number = 24): HTMLElement {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.width = `${size}px`;
    spinner.style.height = `${size}px`;
    spinner.style.border = `3px solid rgba(0, 0, 0, 0.1)`;
    spinner.style.borderTopColor = '#10b981';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';
    return spinner;
  }

  /**
   * Toast notification com animação
   */
  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  /**
   * Ripple effect em botões
   */
  addRippleEffect(button: HTMLElement): void {
    button.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;

      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }
}

// Instância singleton
export const animationService = new AnimationService();

// Adicionar estilos CSS para animações
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slide {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes zoom {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes ripple {
      to { transform: scale(4); opacity: 0; }
    }
    .animate-fade { animation: fade 0.3s ease-in-out; }
    .animate-slide { animation: slide 0.3s ease-in-out; }
    .animate-zoom { animation: zoom 0.3s ease-in-out; }
    .animate-shake { animation: shake 0.5s ease-in-out; }
    .animate-pulse { animation: pulse 2s ease-in-out infinite; }
    .animate-spin { animation: spin 1s linear infinite; }
  `;
  document.head.appendChild(style);
}

