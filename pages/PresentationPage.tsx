import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';

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
  const { t } = useI18n();
  const [videoError, setVideoError] = useState(false);

  // Caminho do vídeo - usando encodeURI para lidar com espaços e caracteres especiais
  const videoPath = encodeURI("/icons/grok-video-d45d92f1-5d9b-4760-a5c1-40b9eebeb978 (2).mp4");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 overflow-x-hidden">
      {/* Hero Section with Video Background */}
      <div className="relative h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-[85vh] w-full flex flex-col justify-center items-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {!videoError && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-contain object-center"
              style={{
                zIndex: 0,
                width: '100%',
                height: '100%'
              }}
              onError={(e) => {
                // Fallback se o vídeo não carregar
                console.warn('Erro ao carregar vídeo de apresentação:', e);
                setVideoError(true);
                const target = e.target as HTMLVideoElement;
                if (target) {
                  target.style.display = 'none';
                }
              }}
              onLoadedData={() => {
                console.log('Vídeo de apresentação carregado com sucesso');
              }}
            >
              <source src={videoPath} type="video/mp4" />
            </video>
          )}
          {/* Overlay muito leve para clarear o vídeo */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-slate-950/20 to-slate-900/40 z-[1]" />
          {/* Animated Background Effects */}
          <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-blue-600/20 blur-3xl animate-pulse will-change-transform" style={{ transform: 'translateZ(0)' }} />
            <div className="absolute top-1/4 left-1/4 w-32 h-32 xs:w-48 xs:h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse will-change-transform" style={{ animationDelay: '1s', transform: 'translateZ(0)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 xs:w-48 xs:h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse will-change-transform" style={{ animationDelay: '2s', transform: 'translateZ(0)' }} />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative w-full py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-slate-950/50 to-slate-900 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-16">
            <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6">
              <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 xs:px-3 sm:px-4 md:px-5 lg:px-6 py-1 xs:py-1.5 sm:py-2 text-[10px] xs:text-xs sm:text-sm md:text-base tracking-wide text-emerald-200 backdrop-blur-sm break-words">
                Nutrição + Treinos + Inteligência Artificial 🤖
              </span>
            </div>
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500 bg-clip-text text-transparent px-2 break-words">
              FitCoach.IA
            </h2>
            <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-slate-200 mb-3 sm:mb-4 md:mb-5 lg:mb-6 px-2 break-words">
              Seu Coach de Treino Inteligente
            </h3>
            <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-2 break-words">
              Transforme seus treinos com planos personalizados, análise de exercícios, 
              relatórios inteligentes e desafios gamificados. Tudo em um único ambiente, guiado por IA.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-5 md:gap-6 w-full">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-xl sm:rounded-2xl border border-slate-700/60 bg-slate-900/60 p-3 xs:p-4 sm:p-5 md:p-6 shadow-xl shadow-emerald-500/5 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:shadow-emerald-500/20 hover:scale-[1.02] sm:hover:scale-105 w-full"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="text-2xl xs:text-3xl sm:text-4xl mb-2 sm:mb-3 md:mb-4">{feature.icon}</div>
                <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-emerald-300 mb-1.5 sm:mb-2 md:mb-3 break-words">{feature.title}</h3>
                <p className="text-[11px] xs:text-xs sm:text-sm text-slate-300 leading-relaxed break-words">{feature.description}</p>
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/5 group-hover:to-blue-500/5 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative w-full py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-slate-900 to-slate-950 overflow-x-hidden">
        <div className="mx-auto px-4 xs:px-5 sm:px-6 lg:px-8 text-center w-full">
          <div className="relative w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-3xl rounded-3xl overflow-hidden" />
            <div className="relative bg-slate-900/60 backdrop-blur-sm border border-slate-700/60 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 xs:p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12 shadow-2xl mx-auto w-full max-w-4xl">
              <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 md:mb-5 lg:mb-6 break-words px-2">
                Construa uma rotina mais saudável
              </h2>
              <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-slate-300 mb-4 sm:mb-5 md:mb-6 lg:mb-8 leading-relaxed break-words px-2">
                FitCoach.IA acompanha a sua jornada diariamente. Planos flexíveis, recomendações personalizadas 
                e um assistente disponível 24/7 para responder dúvidas sobre treinos, exercícios, suplementação e bem-estar.
              </p>
              <div id="presentation-cta-container" className="w-full flex justify-center px-2">
                <button
                  id="presentation-cta-button"
                  onClick={() => (window.location.hash = '/login')}
                  className="px-3 xs:px-4 sm:px-6 md:px-8 lg:px-10 py-2.5 xs:py-3 sm:py-3.5 text-xs xs:text-sm sm:text-base md:text-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg border-none cursor-pointer inline-flex items-center justify-center w-full sm:w-auto min-w-[200px] xs:min-w-[240px] sm:min-w-[280px] md:min-w-[350px] max-w-full shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:from-emerald-400 hover:to-emerald-500"
                  style={{ 
                    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)',
                  }}
                >
                  {t('presentation.cta_button')}
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
        /* Responsivo para o botão CTA - Mobile First */
        #presentation-cta-button {
          min-width: 200px !important;
          width: 100% !important;
          max-width: 100% !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          display: inline-flex !important;
          padding: 0.625rem 1rem !important;
          box-sizing: border-box !important;
        }
        @media (min-width: 375px) {
          #presentation-cta-button {
            min-width: 240px !important;
            padding: 0.75rem 1.25rem !important;
          }
        }
        @media (min-width: 640px) {
          #presentation-cta-button {
            min-width: 280px !important;
            width: auto !important;
            max-width: none !important;
            padding: 0.875rem 1.5rem !important;
          }
        }
        @media (min-width: 768px) {
          #presentation-cta-button {
            min-width: 350px !important;
            padding: 0.875rem 2rem !important;
          }
        }
        @media (min-width: 1024px) {
          #presentation-cta-button {
            padding: 0.875rem 2.5rem !important;
          }
        }
        #presentation-cta-container {
          overflow: hidden !important;
          width: 100% !important;
          max-width: 100% !important;
          display: flex !important;
          justify-content: center !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        /* Garantir que o vídeo seja exibido completo sem cortes */
        video {
          object-fit: contain !important;
          object-position: center !important;
        }
        /* Prevenir overflow horizontal */
        * {
          max-width: 100%;
        }
      `}</style>
    </div>
  );
};

export default PresentationPage;

