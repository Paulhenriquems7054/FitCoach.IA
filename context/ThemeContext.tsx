import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { saveAppSetting, getAppSetting } from '../services/databaseService';

type Theme = 'light' | 'dark';
type ThemeSetting = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeSetting: ThemeSetting;
  setThemeSetting: (setting: ThemeSetting) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>('dark');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar tema do banco de dados
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await getAppSetting<ThemeSetting>('theme_setting', 'dark');
        if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system')) {
          setThemeSetting(savedTheme);
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
        // Fallback para localStorage se o banco não estiver pronto
        if (typeof window !== 'undefined') {
          const savedThemeSetting = localStorage.getItem('theme_setting');
          if (savedThemeSetting === 'dark' || savedThemeSetting === 'light' || savedThemeSetting === 'system') {
            setThemeSetting(savedThemeSetting);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    let currentTheme: Theme;

    if (themeSetting === 'system') {
        const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        currentTheme = getSystemTheme();
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setTheme(getSystemTheme());
        mediaQuery.addEventListener('change', handleChange);

        // Set initial theme based on system
        setTheme(currentTheme);

        return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
        currentTheme = themeSetting;
        setTheme(currentTheme);
    }

  }, [themeSetting]);

   useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    
    // Salvar no banco de dados quando não estiver carregando
    if (!isLoading) {
      const saveTheme = async () => {
        try {
          await saveAppSetting('theme_setting', themeSetting);
        } catch (error) {
          console.error('Erro ao salvar tema:', error);
          // Fallback para localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('theme_setting', themeSetting);
          }
        }
      };
      saveTheme();
    }
   }, [theme, themeSetting, isLoading]);

  const handleSetThemeSetting = (setting: ThemeSetting) => {
    setThemeSetting(setting);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeSetting, setThemeSetting: handleSetThemeSetting }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};