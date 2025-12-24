
import React, { useState } from 'react';
import Header from '../Header';
import Sidebar from './Sidebar.tsx';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useI18n } from '../../context/I18nContext';
import NutriAssistant from '../chatbot/NutriAssistant';
import { NutriVoiceAssistant } from '../chatbot/NutriVoiceAssistant';
import { useAutoLogout } from '../../hooks/useAutoLogout';
import { AccessBlockChecker } from '../AccessBlockChecker';
import { TrialExpiredChecker } from '../TrialExpiredChecker';
import { TrialExpiredPaywall } from '../TrialExpiredPaywall';
import { AiTrialCounter } from '../AiTrialCounter';
import { useUser } from '../../context/UserContext';
import { getAccountType } from '../../utils/accountType';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nutriVoiceOpen, setNutriVoiceOpen] = useState(false);
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
      {/* IA de Voz/Chat: desabilitada para PERSONAL (USER_PERSONAL) e quando não tem acesso à IA */}
      {!isBlocked && hasAiAccess && accountType !== 'USER_PERSONAL' && (
        <>
          <NutriAssistant />
          <NutriVoiceAssistant isOpen={nutriVoiceOpen} onClose={() => setNutriVoiceOpen(false)} />
          {/* Botão flutuante para abrir Nutri.ai */}
          {!nutriVoiceOpen && (
            <button
              onClick={() => setNutriVoiceOpen(true)}
              className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-xl transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300/60"
              aria-label="Abrir Nutri.ai - Assistente de Voz"
              title="Nutri.ai - Conversa por voz"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
};
