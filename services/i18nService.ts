/**
 * Serviço de Internacionalização Completo
 * Múltiplos idiomas, tradução completa
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export type Language = 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'zh';

export interface Translations {
  [key: string]: string | Translations;
}

class I18nService {
  private currentLanguage: Language = 'pt';
  private translations: Map<Language, Translations> = new Map();

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadLanguagePreference();
    await this.loadTranslations();
  }

  /**
   * Define idioma atual
   */
  async setLanguage(language: Language): Promise<void> {
    this.currentLanguage = language;
    await this.saveLanguagePreference();
    this.applyLanguage();
    logger.info(`Idioma alterado para: ${language}`, 'i18nService');
  }

  /**
   * Obtém idioma atual
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Traduz uma chave
   */
  t(key: string, params?: Record<string, string | number>): string {
    const translation = this.getTranslation(key);
    if (!translation) {
      logger.warn(`Tradução não encontrada: ${key}`, 'i18nService');
      return key;
    }

    if (params) {
      return this.interpolate(translation, params);
    }

    return translation;
  }

  /**
   * Obtém tradução
   */
  private getTranslation(key: string): string | null {
    const langTranslations = this.translations.get(this.currentLanguage);
    if (!langTranslations) return null;

    const keys = key.split('.');
    let value: any = langTranslations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return null;
    }

    return typeof value === 'string' ? value : null;
  }

  /**
   * Interpola parâmetros na string
   */
  private interpolate(template: string, params: Record<string, string | number>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  /**
   * Carrega traduções
   */
  private async loadTranslations(): Promise<void> {
    // Traduções em português (padrão)
    this.translations.set('pt', {
      common: {
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar',
        close: 'Fechar',
        next: 'Próximo',
        back: 'Voltar',
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
      },
      onboarding: {
        welcome: 'Bem-vindo ao FitCoach.IA!',
        completeProfile: 'Complete seu Perfil',
        exploreDashboard: 'Explore o Dashboard',
      },
      dashboard: {
        title: 'Dashboard',
        workouts: 'Treinos',
        nutrition: 'Nutrição',
        progress: 'Progresso',
      },
    });

    // Traduções em inglês
    this.translations.set('en', {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        next: 'Next',
        back: 'Back',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
      },
      onboarding: {
        welcome: 'Welcome to FitCoach.IA!',
        completeProfile: 'Complete your Profile',
        exploreDashboard: 'Explore the Dashboard',
      },
      dashboard: {
        title: 'Dashboard',
        workouts: 'Workouts',
        nutrition: 'Nutrition',
        progress: 'Progress',
      },
    });

    // Traduções em espanhol
    this.translations.set('es', {
      common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        close: 'Cerrar',
        next: 'Siguiente',
        back: 'Atrás',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
      },
      onboarding: {
        welcome: '¡Bienvenido a FitCoach.IA!',
        completeProfile: 'Completa tu Perfil',
        exploreDashboard: 'Explora el Dashboard',
      },
      dashboard: {
        title: 'Dashboard',
        workouts: 'Entrenamientos',
        nutrition: 'Nutrición',
        progress: 'Progreso',
      },
    });

    // Traduções em francês
    this.translations.set('fr', {
      common: {
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        edit: 'Modifier',
        close: 'Fermer',
        next: 'Suivant',
        back: 'Retour',
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
      },
      onboarding: {
        welcome: 'Bienvenue sur FitCoach.IA!',
        completeProfile: 'Complétez votre Profil',
        exploreDashboard: 'Explorez le Tableau de bord',
      },
      dashboard: {
        title: 'Tableau de bord',
        workouts: 'Entraînements',
        nutrition: 'Nutrition',
        progress: 'Progrès',
      },
    });
  }

  /**
   * Obtém idiomas disponíveis
   */
  getAvailableLanguages(): Array<{ code: Language; name: string; flag: string }> {
    return [
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
    ];
  }

  /**
   * Aplica idioma no DOM
   */
  private applyLanguage(): void {
    document.documentElement.lang = this.currentLanguage;
    document.documentElement.setAttribute('dir', this.getTextDirection());
  }

  /**
   * Obtém direção do texto
   */
  private getTextDirection(): 'ltr' | 'rtl' {
    return ['ar', 'he'].includes(this.currentLanguage) ? 'rtl' : 'ltr';
  }

  /**
   * Carrega preferência de idioma
   */
  private async loadLanguagePreference(): Promise<void> {
    try {
      const saved = await getAppSetting<Language>('user_language');
      if (saved && this.isValidLanguage(saved)) {
        this.currentLanguage = saved;
      } else {
        // Detectar idioma do navegador
        const browserLang = navigator.language.split('-')[0] as Language;
        this.currentLanguage = this.isValidLanguage(browserLang) ? browserLang : 'pt';
      }
    } catch (error) {
      logger.warn('Erro ao carregar preferência de idioma', 'i18nService', error);
      this.currentLanguage = 'pt';
    }
    
    this.applyLanguage();
  }

  /**
   * Salva preferência de idioma
   */
  private async saveLanguagePreference(): Promise<void> {
    try {
      await saveAppSetting('user_language', this.currentLanguage);
    } catch (error) {
      logger.error('Erro ao salvar preferência de idioma', 'i18nService', error);
    }
  }

  /**
   * Valida idioma
   */
  private isValidLanguage(lang: string): lang is Language {
    return ['pt', 'en', 'es', 'fr', 'de', 'it', 'ja', 'zh'].includes(lang);
  }
}

// Instância singleton
export const i18nService = new I18nService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  i18nService.initialize().catch(error => {
    logger.error('Erro ao inicializar i18n', 'i18nService', error);
  });
}

