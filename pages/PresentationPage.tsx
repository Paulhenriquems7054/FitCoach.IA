import React, { useEffect, useState } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Caminho do vídeo - usando encodeURI para lidar com espaços e caracteres especiais
  const videoPath = encodeURI("/icons/grok-video-d45d92f1-5d9b-4760-a5c1-40b9eebeb978 (2).mp4");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 overflow-x-hidden">
      {/* Hero Section with Video Background */}
      <div className="relative min-h-screen flex flex-col justify-end overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          {!videoError && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                zIndex: 0
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
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-slate-950/20 to-slate-900/40 z-0" />
          {/* Animated Background Effects */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-blue-600/20 blur-3xl animate-pulse" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-12 sm:py-16 md:py-24 bg-gradient-to-b from-slate-950/50 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="mb-4 sm:mb-6">
              <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base tracking-wide text-emerald-200 backdrop-blur-sm">
                Nutrição + Treinos + Inteligência Artificial 🤖
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              FitCoach.IA
            </h2>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-200 mb-4 sm:mb-6">
              Seu Coach de Treino Inteligente
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-2">
              Transforme seus treinos com planos personalizados, análise de exercícios, 
              relatórios inteligentes e desafios gamificados. Tudo em um único ambiente, guiado por IA.
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
                FitCoach.IA acompanha a sua jornada diariamente. Planos flexíveis, recomendações personalizadas 
                e um assistente disponível 24/7 para responder dúvidas sobre treinos, exercícios, suplementação e bem-estar.
              </p>
              <div id="presentation-cta-container">
                <button
                  id="presentation-cta-button"
                  onClick={() => (window.location.hash = '/login')}
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

