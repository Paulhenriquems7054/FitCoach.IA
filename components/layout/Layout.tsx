
import React, { useState } from 'react';
import Header from '../Header';
import Sidebar from './Sidebar';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useI18n } from '../../context/I18nContext';
import NutriAssistant from '../chatbot/NutriAssistant';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOnline = useOnlineStatus();
  const { t } = useI18n();

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {!isOnline && (
        <div className="bg-amber-500 dark:bg-amber-600 text-white text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <span>Modo Offline Ativo - Funcionalidades básicas disponíveis</span>
        </div>
      )}
      <div className="flex flex-col w-full">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex flex-col flex-1 w-full">
          <Header onMenuToggle={() => setSidebarOpen(true)} />
          <main className="flex-1 relative focus:outline-none">
            <div className="py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
                {children}
            </div>
          </main>
        </div>
      </div>
      <NutriAssistant />
    </div>
  );
};
