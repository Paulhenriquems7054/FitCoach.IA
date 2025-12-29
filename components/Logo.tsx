import React from 'react';
import { useGymBrandingContext } from './GymBrandingProvider';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

/**
 * Componente de Logo do Academia.IA
 * Utiliza imagem estática como logo principal ou logo da academia se disponível
 */
export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = false,
  className = '' 
}) => {
  const context = useGymBrandingContext();
  const { logo, appName, hasBranding } = context;
  // Garantir que colors sempre existe com fallback
  const colors = context.colors || {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
    background: undefined,
    text: undefined,
  };
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  // Imagem do logo (sem container circular)
  // Garantir que sempre use uma imagem, nunca vídeo
  const logoUrlForImage = hasBranding && logo ? logo : '/icons/play_store_512.png';
  const isVideoUrlForImage = logoUrlForImage && (logoUrlForImage.endsWith('.mp4') || logoUrlForImage.endsWith('.webm') || logoUrlForImage.endsWith('.mov') || logoUrlForImage.includes('video'));
  const finalLogoUrlForImage = isVideoUrlForImage ? '/icons/play_store_512.png' : logoUrlForImage;
  
  const logoImage = (
    <img
      src={finalLogoUrlForImage}
      alt={`${appName} Logo`}
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={(e) => {
        // Fallback para logo padrão se a imagem principal não carregar
        const target = e.target as HTMLImageElement;
        if (target.src !== '/icons/favicon.svg' && target.src !== '/icons/play_store_512.png') {
          target.src = '/icons/play_store_512.png';
        }
      }}
    />
  );

  // Se não mostrar texto, retornar apenas a imagem do logo
  if (!showText) {
    return logoImage;
  }

  // Container do logo com círculo (apenas quando há texto)
  // Garantir que sempre use uma imagem, nunca vídeo
  const logoUrl = hasBranding && logo ? logo : '/icons/play_store_512.png';
  // Se o logo for um vídeo, usar fallback para imagem
  const isVideoUrl = logoUrl && (logoUrl.endsWith('.mp4') || logoUrl.endsWith('.webm') || logoUrl.endsWith('.mov') || logoUrl.includes('video'));
  const finalLogoUrl = isVideoUrl ? '/icons/play_store_512.png' : logoUrl;
  
  const logoContainer = (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 shadow-lg flex-shrink-0 flex items-center justify-center bg-slate-900/30`} style={{ borderColor: `${colors.primary}30` }}>
      <img
        src={finalLogoUrl}
        alt={`${appName} Logo`}
        className="w-full h-full object-contain"
        style={{
          maxWidth: '85%',
          maxHeight: '85%'
        }}
        onError={(e) => {
          // Fallback para favicon se a imagem principal não carregar
          const target = e.target as HTMLImageElement;
          if (target.src !== '/icons/favicon.svg' && target.src !== '/icons/play_store_512.png') {
            target.src = '/icons/play_store_512.png';
          }
        }}
      />
    </div>
  );

  // Se mostrar texto, retornar logo + texto
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoContainer}
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
    </div>
  );
};

/**
 * Componente de Logo apenas com texto
 * Útil para casos onde apenas o texto é necessário
 */
export const LogoText: React.FC<{ className?: string }> = ({ className = '' }) => {
  const context = useGymBrandingContext();
  const { appName } = context;
  // Garantir que colors sempre existe com fallback
  const colors = context.colors || {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
    background: undefined,
    text: undefined,
  };
  
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

