import React from 'react';
import { useGymBrandingContext } from './GymBrandingProvider';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

/**
 * Componente de Logo do Academia.IA
 * Utiliza o vídeo como logo principal ou logo da academia se disponível
 */
export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = false,
  className = '' 
}) => {
  const { logo, appName, colors, hasBranding } = useGymBrandingContext();
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  // Se tiver logo da academia, usar ele
  if (hasBranding && logo) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 shadow-lg flex-shrink-0 flex items-center justify-center bg-white`} style={{ borderColor: `${colors.primary}30` }}>
          <img
            src={logo}
            alt={`${appName} Logo`}
            className="w-full h-full object-contain"
            style={{
              maxWidth: '85%',
              maxHeight: '85%'
            }}
          />
        </div>
        {showText && (
          <div className="flex flex-col">
            <span className="font-extrabold leading-none" style={{ color: colors.primary }}>
              {appName.split(' ')[0]}
            </span>
            {appName.split(' ').length > 1 && (
              <span className="text-slate-800 dark:text-slate-200 font-extrabold leading-none">
                {appName.split(' ').slice(1).join(' ')}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Logo padrão (vídeo)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 shadow-lg flex-shrink-0 flex items-center justify-center bg-slate-900/30`} style={{ borderColor: `${colors.primary}30` }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain"
          style={{
            maxWidth: '85%',
            maxHeight: '85%'
          }}
        >
          <source src="/icons/Vídeo-Nutri.mp4" type="video/mp4" />
          {/* Fallback para navegadores que não suportam vídeo */}
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
            A.IA
          </div>
        </video>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold leading-none" style={{ color: colors.primary }}>
            {appName.split(' ')[0]}
          </span>
          {appName.split(' ').length > 1 && (
            <span className="text-slate-800 dark:text-slate-200 font-extrabold leading-none">
              {appName.split(' ').slice(1).join(' ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Componente de Logo apenas com texto (sem vídeo)
 * Útil para casos onde o vídeo não é necessário
 */
export const LogoText: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { appName, colors } = useGymBrandingContext();
  
  // Se o appName tiver mais de uma palavra, dividir
  const parts = appName.split(' ');
  const firstPart = parts[0];
  const restParts = parts.slice(1).join(' ');
  
  return (
    <h1 className={`text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight ${className}`}>
      <a href="#/" className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded" aria-label="Ir para página inicial">
        <span className="drop-shadow-lg" style={{ color: colors.primary }}>{firstPart}</span>
        {restParts && (
          <span className="text-slate-800 dark:text-slate-200 drop-shadow-lg"> {restParts}</span>
        )}
      </a>
    </h1>
  );
};

