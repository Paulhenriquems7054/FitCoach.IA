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

import React, { useState, useRef, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { validateCoupon } from '../services/couponService';
import { useToast } from '../components/ui/Toast';
import { logger } from '../utils/logger';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { getSubscriptionPlans } from '../services/supabaseService';

interface LandingPageProps {
  onGetStarted: () => void;    // Chamado ao fazer login → inicia onboarding
  onAnalyze?: () => void;      // Opcional: abre scanner de foto
  onDevSkip?: () => void;      // Opcional: pula onboarding (dev mode)
}

type ScreenState = 'home' | 'coupon' | 'register' | 'pricing';
type PricingTab = 'b2c' | 'b2b' | 'personal' | 'recharge';

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
  const [screen, setScreen] = useState<ScreenState>('home');
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [textOpacity, setTextOpacity] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [isValidating, setIsValidating] = useState(false);
  const [activePricingTab, setActivePricingTab] = useState<PricingTab>('b2c');
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderBarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const maxSliderWidthRef = useRef(0);
  const { showSuccess, showError } = useToast();

  // Atualizar largura máxima do slider quando o componente montar ou a tela mudar
  useEffect(() => {
    if (sliderBarRef.current) {
      maxSliderWidthRef.current = sliderBarRef.current.offsetWidth - 56; // 56px = largura do knob
    }
  }, [screen]);

  // Carregar planos quando mostrar seção de pricing
  useEffect(() => {
    if (screen === 'pricing' && allPlans.length === 0) {
      loadPlans();
    }
  }, [screen]);

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const subscriptionPlans = await getSubscriptionPlans();
      setAllPlans(subscriptionPlans.map(p => ({
        id: p.id,
        name: p.name,
        display_name: p.display_name,
        description: p.description,
        price_monthly: p.price_monthly,
        price_yearly: p.price_yearly,
        features: (p.features as string[]) || [],
        limits: (p.limits as Record<string, number>) || {},
        plan_category: (p as any).plan_category || null,
        checkout_url_monthly: (p as any).checkout_url_monthly || null,
        checkout_url_yearly: (p as any).checkout_url_yearly || null,
        checkout_price_monthly: (p as any).checkout_price_monthly || null,
        checkout_price_yearly: (p as any).checkout_price_yearly || null,
      })));
    } catch (error) {
      logger.error('Erro ao carregar planos', 'LandingPage', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Separar planos por categoria
  const b2cPlans = allPlans.filter(p => p.plan_category === 'b2c_ai');
  const b2bPlans = allPlans.filter(p => p.plan_category === 'b2b_platform');
  const personalPlans = allPlans.filter(p => p.plan_category === 'personal_platform');
  const rechargePlans = allPlans.filter(p => p.plan_category === 'recharge');

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    const checkoutUrl = plan.checkout_url_monthly || plan.checkout_url_yearly;
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    } else {
      // Se não tem checkout URL, marcar landing como vista e redirecionar para presentation
      const LANDING_SEEN_KEY = 'fitcoach.landing.seen';
      try {
        localStorage.setItem(LANDING_SEEN_KEY, 'true');
        window.dispatchEvent(new Event('landing-seen'));
      } catch (error) {
        console.warn('Não foi possível salvar flag de landing vista', error);
      }
      window.location.hash = '#/presentation';
    }
  };

  // Handlers do slider
  const handlePointerDown = (e: React.PointerEvent) => {
    if (screen !== 'home') return;
    setIsDragging(true);
    startXRef.current = e.clientX - sliderPosition;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || screen !== 'home') return;
    
    const maxWidth = maxSliderWidthRef.current;
    const newPosition = Math.max(0, Math.min(maxWidth, e.clientX - startXRef.current));
    setSliderPosition(newPosition);
    
    // Calcular opacidade do texto (desaparece gradualmente)
    const progress = maxWidth > 0 ? newPosition / maxWidth : 0;
    setTextOpacity(Math.max(0, 1 - progress * 1.5));
    
    // Se chegou a 85%, completar automaticamente
    if (progress >= 0.85) {
      handleSliderComplete();
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Se chegou a 85%, completar
    const maxWidth = maxSliderWidthRef.current;
    const progress = maxWidth > 0 ? sliderPosition / maxWidth : 0;
    if (progress >= 0.85) {
      handleSliderComplete();
    } else {
      // Voltar à posição inicial
      setSliderPosition(0);
      setTextOpacity(1);
    }
  };

  const handlePointerLeave = () => {
    if (isDragging) {
      handlePointerUp();
    }
  };

  const handleSliderComplete = () => {
    // Vibração (se suportado)
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Marcar landing como vista
    const LANDING_SEEN_KEY = 'fitcoach.landing.seen';
    try {
      localStorage.setItem(LANDING_SEEN_KEY, 'true');
      // Disparar evento customizado para notificar App.tsx
      window.dispatchEvent(new Event('landing-seen'));
    } catch (error) {
      console.warn('Não foi possível salvar flag de landing vista', error);
    }
    
    // Redirecionar para Presentation (fluxo correto: Landing -> Presentation -> Login)
    setTimeout(() => {
      window.location.hash = '#/presentation';
      setSliderPosition(0);
      setTextOpacity(1);
    }, 200);
  };

  // Removido: handleLogin - redireciona direto para LoginPage completa

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
      // Marcar landing como vista e redirecionar para presentation (fluxo correto)
      const LANDING_SEEN_KEY = 'fitcoach.landing.seen';
      try {
        localStorage.setItem(LANDING_SEEN_KEY, 'true');
        window.dispatchEvent(new Event('landing-seen'));
      } catch (error) {
        console.warn('Não foi possível salvar flag de landing vista', error);
      }
      window.location.hash = '#/presentation';
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
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100">
      {/* Background animado (apenas na tela inicial) */}
      {screen === 'home' && <TopographicLines />}

      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-md border-b border-emerald-100">
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
                // Redirecionar para presentation (fluxo correto)
                window.location.hash = '#/presentation';
              }}
              className="px-4 py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
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
              <div className="inline-block p-6 sm:p-8 bg-white/20 backdrop-blur-md rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border border-white/30">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[#1A4D2E] mb-4">
                  Treinos e Nutrição Consciente
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto">
                  Planos alimentares personalizados e chefs IA para sua melhor versão
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                    Saudável
                  </span>
                  <span className="px-4 py-2 bg-[#F5F1E8] text-[#1A4D2E] rounded-full text-sm font-semibold">
                    Premium
                  </span>
                </div>
              </div>
            </div>

            {/* Slider Interativo */}
            <div className="w-full max-w-md mx-auto mb-4">
              <div
                ref={sliderBarRef}
                className="relative w-full h-16 bg-[#1A4D2E] rounded-full shadow-lg overflow-hidden"
                style={{
                  position: 'relative',
                }}
              >
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{
                    animation: 'shimmer 2s infinite',
                  }}
                />
                <style>{`
                  @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
                `}</style>

                {/* Texto "DESLIZE PARA ENTRAR" */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  style={{ opacity: textOpacity }}
                >
                  <span className="text-[#F5F1E8] font-semibold text-sm sm:text-base tracking-wider">
                    DESLIZE PARA ENTRAR
                  </span>
                </div>

                {/* Knob arrastável */}
                <div
                  ref={sliderRef}
                  className="absolute top-2 left-2 w-12 h-12 bg-[#F5F1E8] rounded-full shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center z-20 transition-transform hover:scale-110"
                  style={{
                    transform: `translateX(${sliderPosition}px)`,
                    touchAction: 'none',
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerLeave}
                >
                  {/* Ícone de Chef Hat */}
                  <svg
                    className="w-6 h-6 text-[#1A4D2E]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Botão "Tenho um convite" - Completamente separado do slider */}
            <div 
              className="w-full max-w-md mx-auto mt-2"
              style={{ position: 'relative', zIndex: 1000 }}
            >
              <button
                onClick={() => {
                  console.log('[LandingPage] ✅ Botão "Tenho um convite" CLICADO!');
                  logger.info('Botão "Tenho um convite" clicado', 'LandingPage');
                  setScreen('coupon');
                }}
                className="w-full text-center text-sm font-medium text-slate-600 hover:text-[#1A4D2E] transition-all py-2 underline hover:no-underline cursor-pointer active:scale-95 select-none bg-transparent border-none outline-none"
                type="button"
                tabIndex={0}
                aria-label="Tenho um convite"
                style={{
                  pointerEvents: 'auto',
                  zIndex: 10000,
                  position: 'relative',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Tenho um convite
              </button>
            </div>

            {/* Botão "Ver Planos" */}
            <div className="w-full max-w-md mx-auto mt-6">
              <button
                onClick={() => setScreen('pricing')}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Ver Planos e Preços
              </button>
            </div>
          </div>
        )}

        {/* Seção de Planos (Pricing) */}
        {screen === 'pricing' && (
          <div className="w-full max-w-7xl mx-auto py-8 space-y-8">
            {/* Header com botão voltar */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setScreen('home')}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeftIcon size={24} className="text-[#1A4D2E]" />
              </button>
              <h2 className="text-3xl font-serif text-[#1A4D2E]">Planos e Preços</h2>
            </div>

            {/* Navegação por Abas */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 border-b border-slate-200 pb-4">
              <button
                onClick={() => setActivePricingTab('b2c')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activePricingTab === 'b2c'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white/50 text-slate-700 hover:bg-white/70'
                }`}
              >
                Planos Individuais (IA)
              </button>
              <button
                onClick={() => setActivePricingTab('b2b')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activePricingTab === 'b2b'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white/50 text-slate-700 hover:bg-white/70'
                }`}
              >
                Planos para Academias
              </button>
              <button
                onClick={() => setActivePricingTab('personal')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activePricingTab === 'personal'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white/50 text-slate-700 hover:bg-white/70'
                }`}
              >
                Personal Trainers
              </button>
              <button
                onClick={() => setActivePricingTab('recharge')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activePricingTab === 'recharge'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white/50 text-slate-700 hover:bg-white/70'
                }`}
              >
                Recargas
              </button>
            </div>

            {/* Conteúdo dos Planos */}
            {loadingPlans ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="mt-4 text-slate-600">Carregando planos...</p>
              </div>
            ) : (
              <>
                {/* Planos B2C */}
                {activePricingTab === 'b2c' && b2cPlans.length > 0 && (
                  <div>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-[#1A4D2E] mb-2">
                        Planos Individuais - Uso da IA
                      </h3>
                      <p className="text-slate-600">
                        Escolha o plano ideal para continuar usando todas as funcionalidades de IA
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      {b2cPlans.map((plan) => {
                        const isPopular = plan.name === 'ai_annual_vip';
                        return (
                          <Card key={plan.id} className={`relative ${isPopular ? 'ring-2 ring-emerald-500' : ''}`}>
                            {isPopular && (
                              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                  Mais Vantajoso
                                </span>
                              </div>
                            )}
                            <div className="p-6">
                              <h4 className="text-xl font-bold text-[#1A4D2E] mb-2">{plan.display_name}</h4>
                              <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
                              <div className="mb-4">
                                {plan.price_yearly ? (
                                  <>
                                    <span className="text-4xl font-bold text-emerald-600">
                                      R$ {plan.price_yearly.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-slate-600 ml-2">/ano</span>
                                    <p className="text-sm text-slate-500 mt-1">
                                      ou 12x de R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-4xl font-bold text-emerald-600">
                                      R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-slate-600 ml-2">/mês</span>
                                  </>
                                )}
                              </div>
                              <ul className="space-y-2 mb-6">
                                {plan.features.slice(0, 5).map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-slate-700">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              <Button
                                onClick={() => handleSelectPlan(plan)}
                                className="w-full"
                                variant="primary"
                              >
                                Assinar Agora
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Planos B2B */}
                {activePricingTab === 'b2b' && b2bPlans.length > 0 && (
                  <div>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-[#1A4D2E] mb-2">
                        Planos para Academias
                      </h3>
                      <p className="text-slate-600">
                        Ofereça acesso Premium aos seus alunos sem custo adicional para eles
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {b2bPlans.map((plan) => {
                        const isPopular = plan.name === 'growth';
                        return (
                          <Card key={plan.id} className={`relative ${isPopular ? 'ring-2 ring-emerald-500' : ''}`}>
                            {isPopular && (
                              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                  Mais Vendido
                                </span>
                              </div>
                            )}
                            <div className="p-6">
                              <h4 className="text-xl font-bold text-[#1A4D2E] mb-2">{plan.display_name}</h4>
                              <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
                              <div className="mb-4">
                                <span className="text-4xl font-bold text-emerald-600">
                                  R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-slate-600 ml-2">/mês</span>
                              </div>
                              <ul className="space-y-2 mb-6">
                                {plan.features.slice(0, 4).map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-slate-700">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              <Button
                                onClick={() => handleSelectPlan(plan)}
                                className="w-full"
                                variant="primary"
                              >
                                Assinar Agora
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Planos Personal */}
                {activePricingTab === 'personal' && personalPlans.length > 0 && (
                  <div>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-[#1A4D2E] mb-2">
                        Planos para Personal Trainers
                      </h3>
                      <p className="text-slate-600">
                        Gerencie seus alunos e ofereça treinos personalizados
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      {personalPlans.map((plan) => {
                        const isPopular = plan.name === 'team_15';
                        return (
                          <Card key={plan.id} className={`relative ${isPopular ? 'ring-2 ring-emerald-500' : ''}`}>
                            {isPopular && (
                              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                  Mais Vantajoso
                                </span>
                              </div>
                            )}
                            <div className="p-6">
                              <h4 className="text-xl font-bold text-[#1A4D2E] mb-2">{plan.display_name}</h4>
                              <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
                              <div className="mb-4">
                                <span className="text-4xl font-bold text-emerald-600">
                                  R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-slate-600 ml-2">/mês</span>
                              </div>
                              <ul className="space-y-2 mb-6">
                                {plan.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-slate-700">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              <Button
                                onClick={() => handleSelectPlan(plan)}
                                className="w-full"
                                variant="primary"
                              >
                                Assinar Agora
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recargas */}
                {activePricingTab === 'recharge' && rechargePlans.length > 0 && (
                  <div>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-[#1A4D2E] mb-2">
                        Recargas Instantâneas
                      </h3>
                      <p className="text-slate-600">
                        Precisa de mais tempo de conversa? Recarregue instantaneamente
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {rechargePlans.map((plan) => {
                        const isPopular = plan.name === 'minutes_bank';
                        return (
                          <Card key={plan.id} className={`relative ${isPopular ? 'ring-2 ring-emerald-500' : ''}`}>
                            {isPopular && (
                              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                  Melhor Escolha
                                </span>
                              </div>
                            )}
                            <div className="p-6">
                              <h4 className="text-xl font-bold text-[#1A4D2E] mb-2">{plan.display_name}</h4>
                              <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
                              <div className="mb-4">
                                <span className="text-4xl font-bold text-emerald-600">
                                  R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-slate-600 ml-2">Pagamento Único</span>
                              </div>
                              <ul className="space-y-2 mb-6">
                                {plan.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-slate-700">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              <Button
                                onClick={() => handleSelectPlan(plan)}
                                className="w-full"
                                variant="primary"
                              >
                                Comprar Agora
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
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
                  className="w-24 h-24 mx-auto text-[#1A4D2E]"
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
                  className="w-full px-4 py-4 bg-white/50 border border-slate-200 rounded-xl text-center text-2xl font-bold tracking-widest text-[#1A4D2E] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
                  placeholder="CÓDIGO"
                  maxLength={10}
                />
                <button
                  onClick={handleValidateCoupon}
                  disabled={isValidating || !couponCode.trim()}
                  className="w-full py-3 bg-[#1A4D2E] text-[#F5F1E8] font-semibold rounded-xl hover:bg-[#4F6F52] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#1A4D2E] text-[#F5F1E8] font-semibold rounded-xl hover:bg-[#4F6F52] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
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
