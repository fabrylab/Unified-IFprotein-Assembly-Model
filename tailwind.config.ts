import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        paper: {
          50: '#fbf8f2',
          100: '#f5f0e6',
          200: '#ebe3d2',
          300: '#dccfb2',
        },
        ink: {
          50: '#f6f7f8',
          100: '#e5e7eb',
          200: '#cbd0d7',
          400: '#7b8794',
          600: '#3e4852',
          800: '#1c232b',
          900: '#0f141a',
        },
        accent: {
          DEFAULT: '#0f766e',
          fg: '#ccfbf1',
          50: '#f0fdfa',
          100: '#ccfbf1',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
        },
        warn: '#b45309',
      },
      boxShadow: {
        panel: '0 1px 0 rgba(15,20,26,0.04), 0 1px 3px rgba(15,20,26,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
