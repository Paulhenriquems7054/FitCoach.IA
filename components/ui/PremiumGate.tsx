import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { StarIcon } from '../icons/StarIcon';
import { usePremiumAccess } from '../../hooks/usePremiumAccess';

interface PremiumGateProps {
  feature: string;
  description?: string;
  limitMessage?: string;
  children: React.ReactNode;
  showUpgradeButton?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  feature, 
  description,
  limitMessage,
  children,
  showUpgradeButton = true
}) => {
  const { isPremium, requirePremium } = usePremiumAccess();
  const check = requirePremium(feature);
  
  if (check.allowed) {
    return <>{children}</>;
  }
  
  return (
    <Card className="border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
      <div className="text-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 mb-4 sm:mb-6 animate-pulse">
          <StarIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Recurso Premium
        </h3>
        <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 mb-2 max-w-md mx-auto px-2">
          {description || `Esta funcionalidade está disponível apenas para assinantes Premium.`}
        </p>
        {limitMessage && (
          <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mb-4 sm:mb-6 font-semibold px-2">
            {limitMessage}
          </p>
        )}
        {showUpgradeButton && (
          <div className="mt-6 sm:mt-8">
            <Button 
              onClick={() => window.location.hash = '#/premium'}
              className="bg-gradient-to-r from-primary-600 to-amber-500 hover:from-primary-700 hover:to-amber-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
              size="lg"
            >
              <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Fazer Upgrade para Premium</span>
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 sm:mt-4">
              Premium está grátis por tempo limitado!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

