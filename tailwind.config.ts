import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#FFF5F7',
          100: '#FDE8EE',
          200: '#F9D0DC',
          300: '#F2A7BC',
          400: '#E87D9C',
          500: '#D9577E',
          600: '#B93E64',
          700: '#962F4F',
        },
        rosegold: { DEFAULT: '#B76E79', light: '#E8C4B8' },
        champagne: '#F7E7CE',
        nude: '#E9D5C8',
        plum: { DEFAULT: '#3D1F2B', light: '#55303F', dark: '#2B1520' },
        ink: '#2A1A20',
        muted: '#8A7077',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(61, 31, 43, 0.10)',
        glow: '0 10px 30px -10px rgba(217, 87, 126, 0.45)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #D9577E 0%, #B76E79 100%)',
        'blush-gradient': 'linear-gradient(160deg, #FFF5F7 0%, #FDE8EE 45%, #F7E7CE 100%)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        watermark: {
          '0%': { top: '8%', left: '6%' },
          '25%': { top: '70%', left: '55%' },
          '50%': { top: '35%', left: '12%' },
          '75%': { top: '80%', left: '10%' },
          '100%': { top: '8%', left: '6%' },
        },
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out both',
        float: 'float 7s ease-in-out infinite',
        watermark: 'watermark 40s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
