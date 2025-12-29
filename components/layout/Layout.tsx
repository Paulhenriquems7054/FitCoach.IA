
import React, { useState } from 'react';
import Header from '../Header';
import Sidebar from './Sidebar.tsx';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useI18n } from '../../context/I18nContext';
import { NutriAssistantUnified } from '../chatbot/NutriAssistantUnified';
import { useAutoLogout } from '../../hooks/useAutoLogout';
import { AccessBlockChecker } from '../AccessBlockChecker';
import { TrialExpiredChecker } from '../TrialExpiredChecker';
import { TrialExpiredPaywall } from '../TrialExpiredPaywall';
import { AiTrialCounter } from '../AiTrialCounter';
import { useUser } from '../../context/UserContext';
import { getAccountType } from '../../utils/accountType';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nutriAssistantOpen, setNutriAssistantOpen] = useState(false);
  const isOnline = useOnlineStatus();
  const { t } = useI18n();
  const { user } = useUser();
  
  // Logout automático após 30 minutos de inatividade
  useAutoLogout(30);

  // Se o aluno está bloqueado, não renderizar o layout normal
  const isBlocked = user.gymRole === 'student' && user.accessBlocked;
  const accountType = getAccountType(user);
  
  // Verificar se trial de IA expirou (para alunos) ou trial de plataforma (para outros)
  const [hasAiAccess, setHasAiAccess] = React.useState(true);
  
  React.useEffect(() => {
    const checkAiAccess = async () => {
      if (!user || !user.id) {
        setHasAiAccess(true);
        return;
      }

      // Para alunos, verificar acesso à IA usando aiAccessService
      if (user.tenantRole === 'student') {
        try {
          const { getAiAccessStatus } = await import('../../services/aiAccessService');
          const accessStatus = await getAiAccessStatus(user);
          setHasAiAccess(accessStatus.hasAccess);
        } catch (error) {
          console.error('Erro ao verificar acesso à IA', error);
          setHasAiAccess(false);
        }
      } else {
        // Para outros usuários, verificar trial de plataforma
        if (user.subscriptionStatus !== 'trial') {
          setHasAiAccess(true);
          return;
        }
        const expiryDate = user.expiryDate || user.trialEndDate;
        if (!expiryDate) {
          setHasAiAccess(true);
          return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        setHasAiAccess(today <= expiry);
      }
    };

    checkAiAccess();
    // Verificar periodicamente
    const interval = setInterval(checkAiAccess, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Skip link para acessibilidade */}
      <a href="#main-content" className="skip-link">
        Pular para conteúdo principal
      </a>
      
      {!isOnline && !isBlocked && (
        <div className="bg-amber-500 dark:bg-amber-600 text-white text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2" role="alert" aria-live="polite">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <span>Modo Offline Ativo - Funcionalidades básicas disponíveis</span>
        </div>
      )}
      <AccessBlockChecker />
      <TrialExpiredChecker />
      {/* Paywall obrigatório para alunos quando trial de IA expira */}
      <TrialExpiredPaywall />
      {!isBlocked && (
        <div className="flex flex-col w-full">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <div className="flex flex-col flex-1 w-full">
            <Header onMenuToggle={() => setSidebarOpen(true)} sidebarOpen={sidebarOpen} />
            <main id="main-content" className="flex-1 relative focus:outline-none" tabIndex={-1}>
              <div className="py-4 px-2 sm:py-6 sm:px-4 md:py-8 md:px-6 lg:px-8 animate-fade-in animate-slide-up max-w-full overflow-x-hidden">
                  {/* Contador de trial de IA (apenas para alunos) */}
                  {user.tenantRole === 'student' && <AiTrialCounter />}
                  {children}
              </div>
            </main>
          </div>
        </div>
      )}
      {/* IA Unificada: desabilitada para PERSONAL (USER_PERSONAL) e quando não tem acesso à IA */}
      {!isBlocked && hasAiAccess && accountType !== 'USER_PERSONAL' && (
        <NutriAssistantUnified 
          isOpen={nutriAssistantOpen}
          onOpen={() => setNutriAssistantOpen(true)}
          onClose={() => setNutriAssistantOpen(false)}
        />
      )}
    </div>
  );
};
