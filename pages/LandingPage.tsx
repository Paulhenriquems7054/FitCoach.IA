/**
 * Página Inicial - Logo do App
 * Primeira página exibida ao acessar o app
 */

import React, { useEffect, useState } from 'react';
import { Logo } from '../components/Logo';

const LANDING_SEEN_KEY = 'fitcoach.landing.seen';

const LandingPage: React.FC = () => {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Animação de fade in
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const handleNext = () => {
    // Marcar landing como vista
    try {
      localStorage.setItem(LANDING_SEEN_KEY, 'true');
      // Disparar evento customizado
      window.dispatchEvent(new Event('landing-seen'));
    } catch (error) {
      console.warn('Não foi possível salvar flag de landing vista', error);
    }

    // Redirecionar para apresentação (vídeo)
    window.location.hash = '/presentation';
  };

  // Auto-avançar após 3 segundos (opcional)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleNext();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-600 via-slate-900 to-slate-900 flex flex-col items-center justify-center px-4">
      <div
        className={`flex flex-col items-center justify-center space-y-8 transition-opacity duration-1000 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Logo */}
        <div className="transform transition-transform duration-500 hover:scale-105">
          <Logo size="xl" />
        </div>

        {/* Nome do App */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
            <span className="text-emerald-400 drop-shadow-lg">FitCoach</span>
            <span className="text-white drop-shadow-lg">.IA</span>
          </h1>
          <p className="text-emerald-200 text-lg md:text-xl lg:text-2xl mt-2">
            Seu Coach de Treino Inteligente
          </p>
        </div>

        {/* Indicador de loading/animação */}
        <div className="flex items-center justify-center space-x-2 mt-8">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      {/* Botão para avançar manualmente (opcional) */}
      <button
        onClick={handleNext}
        className="absolute bottom-8 px-6 py-3 text-sm font-semibold text-white bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg border border-emerald-400/50 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        Avançar
      </button>
    </div>
  );
};

export default LandingPage;

