import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(() => {
    if (typeof window !== 'undefined') {
        const savedThemeSetting = localStorage.getItem('theme_setting');
        if (savedThemeSetting === 'dark' || savedThemeSetting === 'light' || savedThemeSetting === 'system') {
            return savedThemeSetting;
        }
    }
    return 'dark';
  });

  const [theme, setTheme] = useState<Theme>('dark');

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
    // Save setting to localStorage whenever it changes
    localStorage.setItem('theme_setting', themeSetting);
   }, [theme, themeSetting]);

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