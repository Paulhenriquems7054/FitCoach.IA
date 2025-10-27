import React from 'react';

export const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M16.5 18.75h-9a9.75 9.75 0 011.056-5.025L8.25 9.75l.443.886A9.75 9.75 0 0112 9.75"
    />
     <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9.75c2.396 0 4.583.923 6.22 2.45m-12.44 0A9.75 9.75 0 0112 9.75"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6.75a3.75 3.75 0 00-7.5 0"
    />
     <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21v-2.25"
    />
  </svg>
);