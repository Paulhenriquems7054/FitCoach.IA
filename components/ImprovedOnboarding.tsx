/**
 * Componente de Onboarding Melhorado
 * Interativo com animações e tutoriais
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { onboardingService, OnboardingStep, OnboardingProgress } from '../services/onboardingService';
import { useUser } from '../context/UserContext';
import { logger } from '../utils/logger';
import { XIcon } from './icons/XIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

export interface ImprovedOnboardingProps {
  isOpen: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export const ImprovedOnboarding: React.FC<ImprovedOnboardingProps> = ({
  isOpen,
  onComplete,
  onSkip,
}) => {
  const { user } = useUser();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen && user?.username) {
      initializeOnboarding();
    }
  }, [isOpen, user]);

  const initializeOnboarding = async () => {
    if (!user?.username) return;

    try {
      let userProgress = await onboardingService.getProgress(user.username);
      
      if (!userProgress) {
        userProgress = await onboardingService.initializeOnboarding(user.username);
      }

      setProgress(userProgress);
      const step = onboardingService.getCurrentStep(userProgress);
      setCurrentStep(step);
    } catch (error) {
      logger.error('Erro ao inicializar onboarding', 'ImprovedOnboarding', error);
    }
  };

  const handleNext = async () => {
    if (!progress || !currentStep || !user?.username) return;

    setIsAnimating(true);
    
    try {
      await onboardingService.completeStep(user.username, currentStep.id);
      const updatedProgress = await onboardingService.getProgress(user.username);
      
      if (updatedProgress) {
        setProgress(updatedProgress);
        
        if (onboardingService.isCompleted(updatedProgress)) {
          setTimeout(() => {
            onComplete?.();
          }, 300);
        } else {
          const nextStep = onboardingService.getCurrentStep(updatedProgress);
          setCurrentStep(nextStep);
        }
      }
    } catch (error) {
      logger.error('Erro ao avançar passo', 'ImprovedOnboarding', error);
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleSkip = async () => {
    if (!progress || !user?.username) return;

    try {
      if (currentStep && !currentStep.required) {
        await onboardingService.skipStep(user.username, currentStep.id);
        const updatedProgress = await onboardingService.getProgress(user.username);
        if (updatedProgress) {
          setProgress(updatedProgress);
          const nextStep = onboardingService.getCurrentStep(updatedProgress);
          setCurrentStep(nextStep);
        }
      } else {
        await onboardingService.skipOnboarding(user.username);
        onSkip?.();
      }
    } catch (error) {
      logger.error('Erro ao pular passo', 'ImprovedOnboarding', error);
    }
  };

  if (!isOpen || !currentStep || !progress) return null;

  const progressPercentage = onboardingService.getProgressPercentage(progress);
  const isLastStep = !onboardingService.getNextStep(progress.completedSteps);
  const canSkip = !currentStep.required;

  return (
    <Modal isOpen={isOpen} onClose={() => {}} size="lg" closeOnOverlayClick={false}>
      <div className="relative">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {progressPercentage.toFixed(0)}% Completo
            </span>
            {canSkip && (
              <button
                onClick={handleSkip}
                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Pular
              </button>
            )}
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className={`space-y-6 transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {currentStep.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {currentStep.description}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
            {currentStep.type === 'video' && typeof currentStep.content === 'object' && currentStep.content.videoUrl ? (
              <video
                src={currentStep.content.videoUrl}
                controls
                className="max-w-full max-h-[400px] rounded"
              />
            ) : (
              <p className="text-slate-700 dark:text-slate-300 text-center">
                {typeof currentStep.content === 'string' ? currentStep.content : currentStep.description}
              </p>
            )}
          </div>

          {/* Interactive Elements */}
          {currentStep.type === 'interactive' && typeof currentStep.content === 'object' && currentStep.content.interactiveElements && (
            <div className="flex flex-wrap gap-2 justify-center">
              {currentStep.content.interactiveElements.map((element, index) => (
                <button
                  key={index}
                  className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                >
                  {element}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {canSkip && (
              <Button
                variant="secondary"
                onClick={handleSkip}
                className="flex-1"
              >
                Pular
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              {isLastStep ? 'Finalizar' : 'Próximo'}
              {!isLastStep && <ChevronRightIcon className="w-5 h-5 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

