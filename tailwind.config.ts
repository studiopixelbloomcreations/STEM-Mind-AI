import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-base': '#0B0D12',
        'bg-surface': '#14171F',
        'bg-surface-alt': '#1C202B',
        'bg-light': '#FAFAF7',
        'text-primary': '#F5F6F8',
        'text-secondary': '#A0A6B4',
        'text-inverse': '#0B0D12',
        'accent-primary': '#FF6B4A',
        'accent-primary-hover': '#FF8161',
        'accent-secondary': '#5B7CFA',
        'success': '#3DD9A4',
        'warning': '#FFC15E',
        'danger': '#FF5C6C',
        'border-custom': '#262B38',
      },
      fontFamily: {
        display: ['"Cabinet Grotesk"', 'sans-serif'],
        body: ['"General Sans"', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        full: '999px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
        '24': '96px',
        '32': '128px',
        '48': '192px',
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0,0,0,0.24)',
        md: '0 8px 24px rgba(0,0,0,0.32)',
        lg: '0 16px 48px rgba(0,0,0,0.4)',
        'glow-accent': '0 0 32px rgba(255,107,74,0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
