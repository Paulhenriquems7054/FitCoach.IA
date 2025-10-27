
import React from 'react';

export const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.239.052.484.11.73.178A10.5 10.5 0 0121 12c0 4.333-2.686 8.036-6.42 9.531a10.45 10.45 0 01-1.23-1.031L12 15.5m-2.25-12.396c.239.052.484.11.73.178m-3.41 12.016L5 14.5m2.25 2.25l-1.5 1.5m1.5-1.5l1.5 1.5"
    />
  </svg>
);
