import React from 'react';
import { MenuIcon } from './icons/MenuIcon';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  return (
    <header className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 -ml-2 mr-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="flex-shrink-0 lg:hidden">
              <h1 className="text-2xl font-bold">
                <span className="text-primary-600">Nutri</span>
                <span className="text-slate-800 dark:text-slate-200">.IA</span>
              </h1>
            </div>
          </div>
          {/* Theme toggle removed, now in Settings page */}
        </div>
      </div>
    </header>
  );
};

export default Header;