/**
 * Landing Page - Tela Inicial do App
 * 
 * Como funciona:
 * - 3 estados: 'home', 'coupon', 'register'
 * - Background animado com linhas topográficas SVG
 * - Header fixo com Logo e botão "Entrar" (redireciona para LoginPage completa)
 * - Slider interativo arrastável (CTA principal - redireciona para LoginPage completa)
 * - Glassmorphism e animações
 */

import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { SunIcon } from '../components/icons/SunIcon';
import { validateCoupon } from '../services/couponService';
import { useToast } from '../components/ui/Toast';
import { useTheme } from '../context/ThemeContext';
import { logger } from '../utils/logger';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface LandingPageProps {
  onGetStarted: () => void;    // Chamado ao fazer login → inicia onboarding
  onAnalyze?: () => void;      // Opcional: abre scanner de foto
  onDevSkip?: () => void;      // Opcional: pula onboarding (dev mode)
}

type ScreenState = 'home' | 'coupon' | 'register';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  limits: Record<string, number>;
  plan_category?: string;
  checkout_url_monthly?: string;
  checkout_url_yearly?: string;
  checkout_price_monthly?: number;
  checkout_price_yearly?: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onAnalyze, onDevSkip }) => {
  const { theme, themeSetting, setThemeSetting } = useTheme();
  const [screen, setScreen] = useState<ScreenState>('home');
  const [couponCode, setCouponCode] = useState('');
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [isValidating, setIsValidating] = useState(false);
  
  const { showSuccess, showError } = useToast();

  // Funções para controle do tema
  const handleToggleTheme = () => {
    setThemeSetting(theme === 'dark' ? 'light' : 'dark');
  };

  const getThemeIcon = () => {
    return theme === 'dark' ? (
      <MoonIcon className="w-5 h-5" />
    ) : (
      <SunIcon className="w-5 h-5" />
    );
  };

  const getThemeLabel = () => {
    return theme === 'dark' ? 'Escuro' : 'Claro';
  };


  // Handler para clicar na logo e redirecionar para login
  const handleLogoClick = () => {
    // Marcar landing como vista
    const LANDING_SEEN_KEY = 'fitcoach.landing.seen';
    try {
      localStorage.setItem(LANDING_SEEN_KEY, 'true');
      // Disparar evento customizado para notificar App.tsx
      window.dispatchEvent(new Event('landing-seen'));
    } catch (error) {
      console.warn('Não foi possível salvar flag de landing vista', error);
    }
    
    // Redirecionar para Login (fluxo: Landing -> Login)
    window.location.hash = '#/login';
  };

  // Handler de validação de cupom
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      showError('Por favor, digite um código');
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateCoupon(couponCode.toUpperCase().trim());
      if (result.isValid) {
        showSuccess('Código válido! Redirecionando...');
        setScreen('register');
      } else {
        showError(result.error || 'Código inválido');
      }
    } catch (error) {
      logger.error('Erro ao validar cupom', 'LandingPage', error);
      showError('Erro ao validar código. Tente novamente.');
    } finally {
      setIsValidating(false);
    }
  };

  // Handler de registro
  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    try {
      // Marcar landing como vista e redirecionar para login (fluxo: Landing -> Login)
      const LANDING_SEEN_KEY = 'fitcoach.landing.seen';
      try {
        localStorage.setItem(LANDING_SEEN_KEY, 'true');
        window.dispatchEvent(new Event('landing-seen'));
      } catch (error) {
        console.warn('Não foi possível salvar flag de landing vista', error);
      }
      window.location.hash = '#/login';
    } catch (error) {
      logger.error('Erro ao cadastrar', 'LandingPage', error);
      showError('Erro ao cadastrar. Tente novamente.');
    }
  };

  // SVG das linhas topográficas (background animado)
  const TopographicLines = () => (
    <svg
      className="absolute inset-0 w-full h-full opacity-20"
      viewBox="0 0 1200 800"
      preserveAspectRatio="none"
      style={{
        animation: screen === 'home' ? 'breathe 4s ease-in-out infinite' : 'none',
      }}
    >
      <defs>
        <style>{`
          @keyframes breathe {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.02); }
          }
        `}</style>
      </defs>
      {/* Linhas topográficas orgânicas */}
      <path
        d="M0,400 Q300,200 600,400 T1200,400"
        stroke="#1A4D2E"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M0,500 Q250,300 500,500 T1200,500"
        stroke="#1A4D2E"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M0,300 Q350,150 700,300 T1200,300"
        stroke="#1A4D2E"
        strokeWidth="2"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M0,600 Q400,400 800,600 T1200,600"
        stroke="#1A4D2E"
        strokeWidth="2"
        fill="none"
        opacity="0.25"
      />
    </svg>
  );

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background animado (apenas na tela inicial) */}
      {screen === 'home' && <TopographicLines />}

      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 sm:px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-emerald-100 dark:border-emerald-900">
        <div className="flex-1"></div>
        <Logo size="md" />
        <div className="flex-1 flex justify-end">
          {screen === 'home' && (
            <button
              onClick={() => {
                // Marcar landing como vista antes de redirecionar
                const LANDING_SEEN_KEY = 'fitcoach.landing.seen';
                try {
                  localStorage.setItem(LANDING_SEEN_KEY, 'true');
                  window.dispatchEvent(new Event('landing-seen'));
                } catch (error) {
                  console.warn('Não foi possível salvar flag de landing vista', error);
                }
                // Redirecionar para login (fluxo: Landing -> Login)
                window.location.hash = '#/login';
              }}
              className="px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 pt-24">
        {screen === 'home' && (
          <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom duration-500">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <div className="relative inline-block p-6 sm:p-8 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border border-white/30 dark:border-slate-700/30">
                {/* Botão de modo escuro */}
                <button
                  onClick={handleToggleTheme}
                  className="absolute top-4 right-4 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-slate-700/50 transition-colors group"
                  aria-label={`Alternar tema (${getThemeLabel()})`}
                  title={`Tema: ${getThemeLabel()}`}
                >
                  {getThemeIcon()}
                  <span className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-slate-900 dark:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {getThemeLabel()}
                  </span>
                </button>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#1A4D2E] dark:text-emerald-400 mb-4">
                  Treinos e Nutrição Consciente
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
                  Planos alimentares personalizados e chefs IA para sua melhor versão
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold">
                    Saudável
                  </span>
                  <span className="px-4 py-2 bg-[#F5F1E8] dark:bg-slate-700 text-[#1A4D2E] dark:text-emerald-400 rounded-full text-sm font-semibold">
                    Premium
                  </span>
                </div>
              </div>
            </div>

            {/* Logo FitCoach */}
            <div className="w-full max-w-md mx-auto mb-4 flex justify-center">
              <button
                onClick={handleLogoClick}
                className="p-4 rounded-full hover:scale-110 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Ir para página de login"
                title="Clique para continuar"
              >
                <Logo size="xl" className="w-32 h-32 sm:w-40 sm:h-40" />
              </button>
            </div>


          </div>
        )}

        {/* Removido: Tela intermediária de login - redireciona direto para LoginPage completa */}

        {screen === 'coupon' && (
          <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="bg-white/20 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/30 text-center">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setScreen('home')}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronLeftIcon size={24} className="text-[#1A4D2E]" />
                </button>
                <h2 className="text-2xl font-serif text-[#1A4D2E] flex-1">Código de Acesso</h2>
              </div>

              {/* Ícone de ticket */}
              <div className="mb-6">
                <svg
                  className="w-24 h-24 mx-auto text-[#1A4D2E] dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-4 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl text-center text-2xl font-bold tracking-widest text-[#1A4D2E] dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
                  placeholder="CÓDIGO"
                  maxLength={10}
                />
                <button
                  onClick={handleValidateCoupon}
                  disabled={isValidating || !couponCode.trim()}
                  className="w-full py-3 bg-[#1A4D2E] dark:bg-emerald-600 text-[#F5F1E8] dark:text-white font-semibold rounded-xl hover:bg-[#4F6F52] dark:hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isValidating ? 'Validando...' : 'Validar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === 'register' && (
          <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="bg-white/20 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/30">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setScreen('coupon')}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronLeftIcon className="w-6 h-6 text-[#1A4D2E]" />
                </button>
                <h2 className="text-2xl font-serif text-[#1A4D2E]">Cadastrar</h2>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome</label>
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Senha</label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 dark:text-slate-100"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#1A4D2E] dark:bg-emerald-600 text-[#F5F1E8] dark:text-white font-semibold rounded-xl hover:bg-[#4F6F52] dark:hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Cadastrar
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LandingPage;
