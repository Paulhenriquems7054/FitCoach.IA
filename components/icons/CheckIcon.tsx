import React from 'react';

interface CheckIconProps {
  className?: string;
  size?: number;
}

export const CheckIcon: React.FC<CheckIconProps> = ({ 
  className = 'w-6 h-6',
  size = 24
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
};

