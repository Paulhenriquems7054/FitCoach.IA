import React, { useEffect, useState } from 'react';

const features = [
  {
    icon: '🎯',
    title: 'Planos Personalizados',
    description: 'Geração automática de planos alimentares adaptados ao seu objetivo e rotina com inteligência artificial.'
  },
  {
    icon: '📸',
    title: 'Análise Inteligente',
    description: 'Envie fotos das refeições, receba feedback nutricional instantâneo e sugestões de troca em tempo real.'
  },
  {
    icon: '📊',
    title: 'Acompanhamento Completo',
    description: 'Dashboards interativos, relatórios em PDF e desafios gamificados para manter o foco todos os dias.'
  },
  {
    icon: '🤖',
    title: 'Assistente IA 24/7',
    description: 'Chat inteligente disponível a qualquer momento para responder suas dúvidas sobre nutrição e bem-estar.'
  },
  {
    icon: '🏆',
    title: 'Gamificação',
    description: 'Complete desafios, ganhe pontos e conquiste conquistas enquanto transforma seus hábitos alimentares.'
  },
  {
    icon: '📚',
    title: 'Biblioteca Nutricional',
    description: 'Acesse receitas personalizadas, dicas de nutrição e conteúdo educativo para sua jornada saudável.'
  }
];

const PresentationPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 overflow-hidden">
      {/* Hero Section with Logo */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-blue-600/20 blur-3xl animate-pulse" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
          {/* Logo Section - Centered and Prominent with Video */}
          <div className={`mb-8 sm:mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative inline-block">
              {/* Glowing effect behind logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 via-sky-400/30 to-blue-500/30 rounded-full blur-3xl scale-150 animate-pulse" />
              <div className="relative rounded-full overflow-hidden shadow-2xl border-4 border-emerald-400/20 animate-float w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 flex items-center justify-center bg-white">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                  style={{
                    animation: 'float 6s ease-in-out infinite',
                    maxWidth: '90%',
                    maxHeight: '90%'
                  }}
                  onError={(e) => {
                    // Fallback se o vídeo não carregar
                    const target = e.target as HTMLVideoElement;
                    if (target) {
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }
                  }}
                >
                  <source src="/icons/Vídeo-Nutri.mp4" type="video/mp4" />
                </video>
                {/* Fallback para navegadores que não suportam vídeo */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold rounded-full"
                  style={{ display: 'none' }}
                >
                  Nutri.IA
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className={`space-y-4 sm:space-y-6 md:space-y-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div>
              <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base tracking-wide text-emerald-200 mb-4 sm:mb-6 backdrop-blur-sm text-center">
                🍎 Nutrição + Treinos + Inteligência Artificial 🤖
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500 bg-clip-text text-transparent px-2">
              Nutri.IA
            </h1>
            
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-200 px-2">
              Seu Coach Nutricional Inteligente
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-2">
              Transforme hábitos alimentares com planos personalizados, análise de refeições, 
              relatórios inteligentes e desafios gamificados. Tudo em um único ambiente, guiado por IA.
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-400/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400/50 rounded-full mt-2" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-12 sm:py-16 md:py-24 bg-gradient-to-b from-slate-950/50 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Recursos Inteligentes
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto px-2">
              Tudo que você precisa para uma jornada nutricional completa e personalizada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl shadow-emerald-500/5 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/20 hover:scale-105"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-emerald-300 mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{feature.description}</p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/5 group-hover:to-blue-500/5 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-12 sm:py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-950" style={{ overflow: 'visible' }}>
        <div className="mx-auto px-4 sm:px-6 text-center" style={{ overflow: 'visible', maxWidth: 'none', width: '100%' }}>
          <div className="relative" style={{ overflow: 'visible' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-3xl rounded-3xl" />
            <div className="relative bg-slate-900/60 backdrop-blur-sm border border-slate-700/60 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl mx-auto" style={{ overflow: 'visible', maxWidth: '56rem', width: '100%' }}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                Construa uma rotina mais saudável
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 leading-relaxed">
                Nutri.IA acompanha a sua jornada diariamente. Planos flexíveis, recomendações personalizadas 
                e um assistente disponível 24/7 para responder dúvidas sobre alimentação, suplementação e bem-estar.
              </p>
              <div id="presentation-cta-container">
                <button
                  id="presentation-cta-button"
                  onClick={() => (window.location.hash = '/welcome-survey')}
                  style={{ 
                    padding: '0.875rem 2.5rem',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    background: 'linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: '350px',
                    width: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'visible',
                    textOverflow: 'clip',
                    whiteSpace: 'nowrap',
                    maxWidth: 'none',
                    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)',
                    transition: 'all 0.2s ease-in-out',
                    lineHeight: '1.5',
                    position: 'relative',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(52, 211, 153), rgb(16, 185, 129))';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span style={{ 
                    display: 'inline-block', 
                    width: 'auto', 
                    textAlign: 'center', 
                    overflow: 'visible', 
                    textOverflow: 'clip', 
                    whiteSpace: 'nowrap',
                    maxWidth: 'none',
                    position: 'relative'
                  }}>
                    Comece sua Jornada Agora
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        /* FORÇAR EXIBIÇÃO COMPLETA DO BOTÃO - CSS COM MÁXIMA PRIORIDADE */
        #presentation-cta-button {
          min-width: 320px !important;
          width: auto !important;
          max-width: none !important;
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
          display: inline-flex !important;
          padding: 0.875rem 2.5rem !important;
          box-sizing: border-box !important;
        }
        #presentation-cta-button span {
          display: inline-block !important;
          width: 100% !important;
          text-align: center !important;
          overflow: visible !important;
          text-overflow: clip !important;
          white-space: nowrap !important;
          max-width: none !important;
        }
        #presentation-cta-container {
          overflow: visible !important;
          width: 100% !important;
          min-width: 100% !important;
          max-width: none !important;
          display: flex !important;
          justify-content: center !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        /* Garantir que containers pais não cortem */
        #presentation-cta-container *,
        #presentation-cta-container *::before,
        #presentation-cta-container *::after {
          overflow: visible !important;
          text-overflow: clip !important;
          max-width: none !important;
        }
        /* Remover qualquer limitação do container pai */
        div[class*="max-w"]:has(#presentation-cta-container) {
          max-width: none !important;
        }
      `}</style>
    </div>
  );
};

export default PresentationPage;

