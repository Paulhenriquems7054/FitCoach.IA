/**
 * Ícone de Chevron Direita
 */

import React from 'react';

export interface ChevronRightIconProps {
  className?: string;
}

export const ChevronRightIcon: React.FC<ChevronRightIconProps> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
};

