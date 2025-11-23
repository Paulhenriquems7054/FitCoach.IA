/**
 * Página de Apresentação - Apenas Vídeo
 * Página minimalista que exibe apenas o vídeo de apresentação
 */

import React, { useState } from 'react';

const VideoPresentationPage: React.FC = () => {
  const [videoError, setVideoError] = useState(false);

  // Caminho do vídeo - usando encodeURI para lidar com espaços e caracteres especiais
  const videoPath = encodeURI("/icons/grok-video-d45d92f1-5d9b-4760-a5c1-40b9eebeb978 (4).mp4");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 overflow-hidden flex flex-col">
      {/* Video Container */}
      <div className="relative w-full flex-1 flex flex-col justify-center items-center overflow-hidden">
        {/* Video Background */}
        <div className="relative w-full flex items-center justify-center flex-1">
          {!videoError && (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-auto"
              style={{
                zIndex: 0,
                width: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '100vh',
                objectFit: 'contain',
                objectPosition: 'center',
                filter: 'brightness(1.2) contrast(1.1) saturate(1.1)',
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
              Seu navegador não suporta vídeos HTML5.
            </video>
          )}
          
          {/* Overlay muito leve para clarear o vídeo */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/5 via-slate-950/10 to-slate-900/20 z-[1]" />
          
          {/* Animated Background Effects */}
          <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-blue-600/20 blur-3xl animate-pulse will-change-transform" style={{ transform: 'translateZ(0)' }} />
            <div className="absolute top-1/4 left-1/4 w-32 h-32 xs:w-48 xs:h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse will-change-transform" style={{ animationDelay: '1s', transform: 'translateZ(0)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 xs:w-48 xs:h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse will-change-transform" style={{ animationDelay: '2s', transform: 'translateZ(0)' }} />
          </div>
        </div>
      </div>

      {/* Botão - Posicionado abaixo do vídeo */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center pb-8 sm:pb-12 md:pb-16 px-4">
        <button
          onClick={() => (window.location.hash = '/features')}
          className="px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg border-none cursor-pointer inline-flex items-center justify-center min-w-[200px] sm:min-w-[240px] md:min-w-[280px] shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:from-emerald-400 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          style={{ 
            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)',
          }}
        >
          Próximo
        </button>
      </div>

      <style>{`
        /* Garantir que o vídeo ocupe toda a largura e mantenha proporção */
        video {
          width: 100% !important;
          height: auto !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          object-fit: contain !important;
          object-position: center !important;
          display: block !important;
        }

        /* Container do vídeo */
        .relative.w-full {
          width: 100% !important;
          max-width: 100vw !important;
        }

        /* Prevenir overflow horizontal */
        * {
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Garantir que o body e html não tenham overflow */
        html, body {
          overflow-x: hidden !important;
          width: 100% !important;
          max-width: 100vw !important;
        }

        /* Responsivo para telas muito pequenas */
        @media (max-width: 375px) {
          video {
            min-height: auto !important;
          }
        }

        /* Responsivo para tablets */
        @media (min-width: 768px) {
          video {
            max-height: 100vh !important;
          }
        }

        /* Desktop */
        @media (min-width: 1024px) {
          video {
            max-height: 100vh !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoPresentationPage;

