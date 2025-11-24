/**
 * Página de Apresentação - Apenas Vídeo
 * Versão otimizada sem atrasos
 */

import React, { useRef, useEffect } from 'react';

const VideoPresentationPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Configurar vídeo apenas uma vez
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Configurações iniciais - velocidade normal
    video.playbackRate = 1.0;
    video.volume = 1.0;
    video.muted = false;

    // Garantir que sempre esteja em velocidade normal
    const ensureNormalSpeed = () => {
      if (video.playbackRate !== 1.0) {
        video.playbackRate = 1.0;
      }
    };

    // Monitorar mudanças de velocidade e corrigir
    const handleRateChange = () => {
      ensureNormalSpeed();
    };

    video.addEventListener('ratechange', handleRateChange);

    return () => {
      video.removeEventListener('ratechange', handleRateChange);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 overflow-hidden flex flex-col">
      <div className="relative w-full flex-1 flex flex-col justify-center items-center overflow-hidden">
        <div className="relative w-full flex items-center justify-center flex-1">
          <video
            ref={videoRef}
            autoPlay
            loop
            playsInline
            preload="auto"
            src="/icons/FITCOACH.IA.mp4"
            className="w-full h-auto"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '100vh',
              objectFit: 'contain',
              objectPosition: 'center',
            }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/5 via-slate-950/10 to-slate-900/20 z-[1]" />
          
          <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-sky-500/20 to-blue-600/20 blur-3xl animate-pulse" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center justify-center pb-8 sm:pb-12 md:pb-16 px-4">
        <button
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.playbackRate = 1.0;
              videoRef.current.muted = false;
              videoRef.current.volume = 1.0;
            }
            window.location.hash = '/';
          }}
          className="px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base md:text-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg border-none cursor-pointer inline-flex items-center justify-center min-w-[200px] sm:min-w-[240px] md:min-w-[280px] shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:from-emerald-400 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          style={{ 
            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)',
          }}
        >
          Próximo
        </button>
      </div>

      <style>{`
        video {
          width: 100% !important;
          height: auto !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          object-fit: contain !important;
          object-position: center !important;
          display: block !important;
        }
        html, body {
          overflow-x: hidden !important;
        }
      `}</style>
    </div>
  );
};

export default VideoPresentationPage;

