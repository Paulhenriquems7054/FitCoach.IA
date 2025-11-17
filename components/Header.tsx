import React from 'react';
import { MenuIcon } from './icons/MenuIcon';
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { Goal } from '../types';
import { clearLoginSession } from '../services/databaseService';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { theme, themeSetting, setThemeSetting } = useTheme();
  const { setUser } = useUser();

  const handleToggleTheme = () => {
    if (themeSetting === 'dark') {
      setThemeSetting('light');
    } else if (themeSetting === 'light') {
      setThemeSetting('system');
    } else {
      setThemeSetting('dark');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair do sistema? Todos os dados locais serão mantidos.')) {
      // Limpar sessão de login
      await clearLoginSession();
      
      // Limpar dados do usuário (resetar para usuário padrão)
      setUser({
        nome: '',
        idade: 0,
        genero: 'Masculino',
        peso: 0,
        altura: 0,
        objetivo: Goal.PERDER_PESO,
        points: 0,
        disciplineScore: 0,
        completedChallengeIds: [],
        isAnonymized: false,
        weightHistory: [],
        role: 'user',
        subscription: 'free',
      });
      
      // Redirecionar para a página de apresentação
      window.location.hash = '#/presentation';
    }
  };

  const getThemeIcon = () => {
    if (themeSetting === 'system') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
          />
        </svg>
      );
    }
    return theme === 'dark' ? (
      <MoonIcon className="w-5 h-5" />
    ) : (
      <SunIcon className="w-5 h-5" />
    );
  };

  const getThemeLabel = () => {
    if (themeSetting === 'system') return 'Sistema';
    return theme === 'dark' ? 'Escuro' : 'Claro';
  };

  return (
    <header className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16 relative">
          {/* Menu button - left side */}
          <button
            onClick={onMenuToggle}
            className="absolute left-0 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          
          {/* Centered logo */}
          <div className="flex-shrink-0">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              <span className="text-primary-600 drop-shadow-lg">Nutri</span>
              <span className="text-slate-800 dark:text-slate-200 drop-shadow-lg">.IA</span>
            </h1>
          </div>

          {/* Right side buttons */}
          <div className="absolute right-0 flex items-center gap-2">
            {/* Theme toggle button */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative group"
              aria-label={`Alternar tema (${getThemeLabel()})`}
              title={`Tema: ${getThemeLabel()}`}
            >
              {getThemeIcon()}
              <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-slate-900 dark:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {getThemeLabel()}
              </span>
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors relative group"
              aria-label="Sair do sistema"
              title="Sair do sistema"
            >
              <LogoutIcon className="w-5 h-5" />
              <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-slate-900 dark:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Sair
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;