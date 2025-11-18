import React from 'react';
import { UserCircleIcon } from '../icons/UserCircleIcon';

interface AvatarProps {
  photoUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({ photoUrl, name, size = 'md', className = '' }) => {
  const sizeClass = sizeClasses[size];
  const textSizeClass = textSizeClasses[size];
  
  // Obter iniciais do nome
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`Foto de perfil de ${name}`}
        className={`${sizeClass} rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 ${className}`}
        onError={(e) => {
          // Se a imagem falhar ao carregar, mostrar placeholder
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const placeholder = document.createElement('div');
            placeholder.className = `${sizeClass} rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold ${textSizeClass} border-2 border-slate-200 dark:border-slate-700`;
            placeholder.textContent = initials;
            parent.appendChild(placeholder);
          }
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold ${textSizeClass} border-2 border-slate-200 dark:border-slate-700 ${className}`}
      role="img"
      aria-label={`Avatar de ${name}`}
    >
      {initials}
    </div>
  );
};

