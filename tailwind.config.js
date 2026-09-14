/** @type {import('tailwindcss').Config} */

// Colors are channel-only CSS variables (e.g. `--accent: 94 106 210`) so that
// Tailwind opacity modifiers keep working: `bg-accent/10` compiles to
// `rgb(var(--accent) / 0.1)`. Values live in src/index.css.
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: rgb('--background'),
        surface: {
          DEFAULT: rgb('--surface'),
          raised: rgb('--surface-raised'),
          overlay: rgb('--surface-overlay'),
        },
        border: {
          DEFAULT: rgb('--border'),
          strong: rgb('--border-strong'),
        },
        text: {
          primary: rgb('--text-primary'),
          secondary: rgb('--text-secondary'),
          muted: rgb('--text-muted'),
          disabled: rgb('--text-disabled'),
        },
        accent: {
          DEFAULT: rgb('--accent'),
          hover: rgb('--accent-hover'),
          // `accent.muted` (#5e6ad220) removed: it baked alpha into the token,
          // which makes opacity modifiers meaningless. Use `bg-accent/10`.
        },
        success: rgb('--success'),
        warning: rgb('--warning'),
        danger: rgb('--danger'),
        income: rgb('--income'),
        expense: rgb('--expense'),

        // Modal/sheet scrims: complete colors (alpha included) that differ per
        // theme, so they are not channel vars and take no opacity modifier.
        scrim: {
          DEFAULT: 'var(--scrim)',
          soft: 'var(--scrim-soft)',
        },
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
