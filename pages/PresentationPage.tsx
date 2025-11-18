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
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
          {/* Logo Section - Centered and Prominent with Video */}
          <div className={`mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative inline-block">
              {/* Glowing effect behind logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 via-sky-400/30 to-blue-500/30 rounded-full blur-3xl scale-150 animate-pulse" />
              <div className="relative rounded-full overflow-hidden shadow-2xl border-4 border-emerald-400/20 animate-float w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 flex items-center justify-center bg-white">
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
          <div className={`space-y-8 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div>
              <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-6 py-2 text-sm md:text-base tracking-wide text-emerald-200 mb-6 backdrop-blur-sm">
                🍎 Nutrição + Inteligência Artificial 🤖
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              Nutri.IA
            </h1>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-200">
              Seu Coach Nutricional Inteligente
            </h2>
            
            <p className="text-lg md:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Transforme hábitos alimentares com planos personalizados, análise de refeições, 
              relatórios inteligentes e desafios gamificados. Tudo em um único ambiente, guiado por IA.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
              <button
                onClick={() => (window.location.hash = '/login')}
                className="rounded-xl border-2 border-slate-200/40 bg-slate-900/40 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-slate-100 transition-all hover:bg-slate-200/10 hover:border-slate-200/60 hover:scale-105"
              >
                Fazer login
              </button>
            </div>
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
      <div className="relative py-24 bg-gradient-to-b from-slate-950/50 to-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Recursos Inteligentes
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Tudo que você precisa para uma jornada nutricional completa e personalizada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="relative py-24 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-3xl rounded-3xl" />
            <div className="relative bg-slate-900/60 backdrop-blur-sm border border-slate-700/60 rounded-3xl p-12 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Construa uma rotina mais saudável
              </h2>
              <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                Nutri.IA acompanha a sua jornada diariamente. Planos flexíveis, recomendações personalizadas 
                e um assistente disponível 24/7 para responder dúvidas sobre alimentação, suplementação e bem-estar.
              </p>
              <button
                onClick={() => (window.location.hash = '/login')}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:from-emerald-400 hover:to-emerald-500 hover:scale-105 shadow-lg shadow-emerald-500/50"
              >
                Comece sua jornada agora
              </button>
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
      `}</style>
    </div>
  );
};

export default PresentationPage;

