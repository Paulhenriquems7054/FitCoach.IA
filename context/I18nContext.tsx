import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import pt from '../locales/pt.json';
import en from '../locales/en.json';
import es from '../locales/es.json';

type Language = 'pt' | 'en' | 'es';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const translations: Record<Language, any> = { pt, en, es };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

type I18nProviderProps = {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
        const savedLang = localStorage.getItem('language');
        if (savedLang === 'pt' || savedLang === 'en' || savedLang === 'es') {
            return savedLang;
        }
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'en' || browserLang === 'es') {
            return browserLang;
        }
    }
    return 'pt';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('language', language);
    }
  }, [language]);

  const t = (key: string, values: Record<string, any> = {}): string => {
    const keys = key.split('.');
    let text = translations[language];

    for (const k of keys) {
      if (text && typeof text === 'object' && k in text) {
        text = text[k];
      } else {
        return key; // Return key if not found
      }
    }

    if (typeof text !== 'string') return key;

    return text.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
        return values[varName] !== undefined ? String(values[varName]) : `{{${varName}}}`;
    });
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
