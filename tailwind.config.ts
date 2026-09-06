import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
