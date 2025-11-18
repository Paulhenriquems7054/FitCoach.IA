import React from 'react';

export const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818l11.54-11.54c.194-.194.447-.29.71-.29h.001a1.03 1.03 0 01.712.29l2.538 2.539c.126.126.195.293.195.46v.001c0 .168-.069.335-.195.46l-2.538 2.539a1.03 1.03 0 01-.712.29h-.001a1.03 1.03 0 01-.71-.29l-1.54-1.54c-.403-.403-.563-.97-.43-1.563A6 6 0 1121.75 8.25z"
    />
  </svg>
);

