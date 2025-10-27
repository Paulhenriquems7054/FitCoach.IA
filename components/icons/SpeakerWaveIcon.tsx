
import React from 'react';

export const SpeakerWaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 7.5l.415-.415a.75.75 0 00-1.06-1.06L6 7.5l1.19-1.19a.75.75 0 00-1.06-1.06l-1.72 1.72a.75.75 0 000 1.06l1.72 1.72a.75.75 0 001.06-1.06L8.25 7.5zM15.75 7.5l-.415-.415a.75.75 0 011.06-1.06L18 7.5l-1.19-1.19a.75.75 0 011.06-1.06l1.72 1.72a.75.75 0 010 1.06l-1.72 1.72a.75.75 0 01-1.06-1.06L15.75 7.5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 12h4.5m-4.5 0a.75.75 0 01.75-.75h3a.75.75 0 01.75.75m-4.5 0a.75.75 0 00-.75.75v3a.75.75 0 00.75.75h3a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75m-4.5 0H9.75v3h4.5v-3H14.25"
    />
  </svg>
);
