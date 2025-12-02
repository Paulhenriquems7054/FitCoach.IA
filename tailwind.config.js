/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./chatbot/**/*.{js,ts,jsx,tsx}",
    "./constants/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '375px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--gym-primary, rgb(22 163 74))',
          '50': 'var(--color-primary-50, #f0fdf4)',
          '100': 'var(--color-primary-100, #dcfce7)',
          '200': 'var(--color-primary-200, #bbf7d0)',
          '300': 'var(--color-primary-300, #86efac)',
          '400': 'var(--color-primary-400, #4ade80)',
          '500': 'var(--gym-primary, #22c55e)',
          '600': 'var(--gym-secondary, #16a34a)',
          '700': 'var(--gym-secondary, #15803d)',
          '800': 'var(--gym-secondary, #166534)',
          '900': 'var(--gym-secondary, #14532d)',
          '950': '#052e16',
        },
        accent: {
          DEFAULT: 'var(--gym-accent, #34d399)',
        },
      },
      keyframes: {
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
      },
    }
  },
  plugins: [],
}
