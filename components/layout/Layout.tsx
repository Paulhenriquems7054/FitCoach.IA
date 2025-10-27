
import React, { useState } from 'react';
import Header from '../Header';
import Sidebar from './Sidebar';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useI18n } from '../../context/I18nContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOnline = useOnlineStatus();
  const { t } = useI18n();

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {!isOnline && (
        <div className="bg-red-600 text-white text-center py-1 text-sm font-semibold">
          {t('offline.banner')}
        </div>
      )}
      <div className="flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex flex-col flex-1 w-0">
          <Header onMenuToggle={() => setSidebarOpen(true)} />
          <main className="flex-1 relative focus:outline-none">
            <div className="py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
                {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
