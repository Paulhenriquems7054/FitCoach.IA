import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

/**
 * Componente de Logo do Nutri.IA
 * Utiliza o vídeo como logo principal
 */
export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = false,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-emerald-400/30 shadow-lg flex-shrink-0 flex items-center justify-center bg-slate-900/30`}>
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
            N.IA
          </div>
        </video>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-primary-600 dark:text-emerald-400 font-extrabold leading-none">
            Nutri
          </span>
          <span className="text-slate-800 dark:text-slate-200 font-extrabold leading-none">
            .IA
          </span>
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
  return (
    <h1 className={`text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight ${className}`}>
      <a href="#/" className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded" aria-label="Ir para página inicial">
        <span className="text-primary-600 drop-shadow-lg">Nutri</span>
        <span className="text-slate-800 dark:text-slate-200 drop-shadow-lg">.IA</span>
      </a>
    </h1>
  );
};

