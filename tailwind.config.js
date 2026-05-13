/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0e0e10',
        surface: {
          DEFAULT: '#131316',
          raised: '#1c1c21',
          overlay: '#222228',
        },
        border: {
          DEFAULT: '#26262c',
          strong: '#363640',
        },
        text: {
          primary: '#e2e2e9',
          secondary: '#b4b4c0',
          muted: '#8a8a9a',
          disabled: '#55555f',
        },
        accent: {
          DEFAULT: '#5e6ad2',
          hover: '#6b78e5',
          muted: '#5e6ad220',
        },
        success: '#4caf7d',
        warning: '#f5a623',
        danger: '#e05c5c',
        income: '#4caf7d',
        expense: '#e05c5c',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
