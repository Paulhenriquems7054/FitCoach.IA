/**
 * Serviço de Onboarding Melhorado
 * Interativo, animações, tutoriais, vídeos
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'intro' | 'tutorial' | 'interactive' | 'video';
  content: string | { videoUrl?: string; interactiveElements?: string[] };
  targetElement?: string; // Seletor CSS do elemento a destacar
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  required: boolean;
  order: number;
}

export interface OnboardingProgress {
  userId: string;
  completedSteps: string[];
  currentStep?: string;
  startedAt: string;
  completedAt?: string;
  skipped: boolean;
}

class OnboardingService {
  private steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao FitCoach.IA!',
      description: 'Seu assistente pessoal de treino e nutrição inteligente',
      type: 'intro',
      content: 'Vamos começar configurando seu perfil para personalizar sua experiência.',
      position: 'center',
      required: true,
      order: 1,
    },
    {
      id: 'profile',
      title: 'Complete seu Perfil',
      description: 'Configure suas informações pessoais',
      type: 'tutorial',
      content: 'Adicione seus dados básicos para receber recomendações personalizadas.',
      targetElement: '#profile-section',
      position: 'bottom',
      required: true,
      order: 2,
    },
    {
      id: 'dashboard',
      title: 'Explore o Dashboard',
      description: 'Conheça sua área principal',
      type: 'interactive',
      content: 'Aqui você verá seu progresso, treinos do dia e recomendações.',
      targetElement: '#dashboard',
      position: 'right',
      required: false,
      order: 3,
    },
    {
      id: 'workouts',
      title: 'Treinos Personalizados',
      description: 'Acesse seus treinos recomendados',
      type: 'tutorial',
      content: 'Seus treinos são gerados com base no seu perfil e objetivos.',
      targetElement: '#workouts-section',
      position: 'left',
      required: false,
      order: 4,
    },
    {
      id: 'nutrition',
      title: 'Plano Nutricional',
      description: 'Gerencie sua alimentação',
      type: 'tutorial',
      content: 'Acompanhe suas refeições e receba recomendações nutricionais.',
      targetElement: '#nutrition-section',
      position: 'top',
      required: false,
      order: 5,
    },
  ];

  /**
   * Inicializa onboarding para usuário
   */
  async initializeOnboarding(userId: string): Promise<OnboardingProgress> {
    const progress: OnboardingProgress = {
      userId,
      completedSteps: [],
      startedAt: new Date().toISOString(),
      skipped: false,
      currentStep: this.steps.find(s => s.required && s.order === 1)?.id,
    };

    await this.saveProgress(progress);
    logger.info(`Onboarding inicializado para usuário ${userId}`, 'onboardingService');
    return progress;
  }

  /**
   * Obtém progresso do onboarding
   */
  async getProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      const saved = await getAppSetting<OnboardingProgress>(`onboarding_${userId}`);
      return saved || null;
    } catch (error) {
      logger.warn('Erro ao carregar progresso do onboarding', 'onboardingService', error);
      return null;
    }
  }

  /**
   * Completa um passo
   */
  async completeStep(userId: string, stepId: string): Promise<boolean> {
    const progress = await this.getProgress(userId);
    if (!progress) return false;

    if (!progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
      
      // Avançar para próximo passo
      const nextStep = this.getNextStep(progress.completedSteps);
      progress.currentStep = nextStep?.id;

      // Verificar se concluiu todos os passos obrigatórios
      const requiredSteps = this.steps.filter(s => s.required);
      const allRequiredCompleted = requiredSteps.every(s => 
        progress.completedSteps.includes(s.id)
      );

      if (allRequiredCompleted && !progress.completedAt) {
        progress.completedAt = new Date().toISOString();
      }

      await this.saveProgress(progress);
      logger.info(`Passo ${stepId} completado por ${userId}`, 'onboardingService');
      return true;
    }

    return false;
  }

  /**
   * Pula um passo
   */
  async skipStep(userId: string, stepId: string): Promise<boolean> {
    const progress = await this.getProgress(userId);
    if (!progress) return false;

    const step = this.steps.find(s => s.id === stepId);
    if (step?.required) return false; // Não pode pular passos obrigatórios

    return await this.completeStep(userId, stepId);
  }

  /**
   * Pula todo o onboarding
   */
  async skipOnboarding(userId: string): Promise<boolean> {
    const progress = await this.getProgress(userId);
    if (!progress) return false;

    progress.skipped = true;
    progress.completedAt = new Date().toISOString();
    await this.saveProgress(progress);
    logger.info(`Onboarding pulado por ${userId}`, 'onboardingService');
    return true;
  }

  /**
   * Obtém passo atual
   */
  getCurrentStep(progress: OnboardingProgress): OnboardingStep | null {
    if (!progress.currentStep) return null;
    return this.steps.find(s => s.id === progress.currentStep) || null;
  }

  /**
   * Obtém próximo passo
   */
  getNextStep(completedSteps: string[]): OnboardingStep | null {
    const remainingSteps = this.steps.filter(s => !completedSteps.includes(s.id));
    return remainingSteps.length > 0 ? remainingSteps[0] : null;
  }

  /**
   * Obtém todos os passos
   */
  getSteps(): OnboardingStep[] {
    return [...this.steps];
  }

  /**
   * Verifica se onboarding está completo
   */
  isCompleted(progress: OnboardingProgress): boolean {
    const requiredSteps = this.steps.filter(s => s.required);
    return requiredSteps.every(s => progress.completedSteps.includes(s.id)) || !!progress.completedAt;
  }

  /**
   * Calcula progresso percentual
   */
  getProgressPercentage(progress: OnboardingProgress): number {
    const requiredSteps = this.steps.filter(s => s.required);
    const completedRequired = requiredSteps.filter(s => 
      progress.completedSteps.includes(s.id)
    ).length;
    return (completedRequired / requiredSteps.length) * 100;
  }

  /**
   * Salva progresso
   */
  private async saveProgress(progress: OnboardingProgress): Promise<void> {
    try {
      await saveAppSetting(`onboarding_${progress.userId}`, progress);
    } catch (error) {
      logger.error('Erro ao salvar progresso do onboarding', 'onboardingService', error);
    }
  }
}

// Instância singleton
export const onboardingService = new OnboardingService();

