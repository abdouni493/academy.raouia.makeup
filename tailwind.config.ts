import type { Config } from 'tailwindcss';

const rgb = (token: string) => `rgb(var(--${token}) / <alpha-value>)`;
const mixed = (token: string) => `color-mix(in srgb, var(--${token}) calc(100% * <alpha-value>), transparent)`;
const translucent = (token: string) => `rgb(var(--${token}) / calc(var(--${token}-alpha) * <alpha-value>))`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        system: {
          blue: rgb('system-blue'), green: rgb('system-green'), indigo: rgb('system-indigo'),
          orange: rgb('system-orange'), pink: rgb('system-pink'), purple: rgb('system-purple'),
          red: rgb('system-red'), teal: rgb('system-teal'), yellow: rgb('system-yellow'),
          cyan: rgb('system-cyan'), mint: rgb('system-mint'), brown: rgb('system-brown'),
          gray: rgb('system-gray'), 'gray-2': rgb('system-gray-2'), 'gray-3': rgb('system-gray-3'),
          'gray-4': rgb('system-gray-4'), 'gray-5': rgb('system-gray-5'), 'gray-6': rgb('system-gray-6'),
        },
        surface: {
          DEFAULT: rgb('background'), primary: rgb('background'),
          secondary: rgb('background-secondary'), tertiary: rgb('background-tertiary'),
          inverse: rgb('surface-inverse'),
        },
        grouped: rgb('grouped'), card: rgb('card'),
        label: {
          DEFAULT: rgb('label'), secondary: rgb('secondary-ink'),
          tertiary: rgb('tertiary-ink'), quaternary: rgb('tertiary-ink'),
        },
        accent: {
          DEFAULT: rgb('accent'), pressed: mixed('accent-pressed'),
          soft: mixed('accent-soft'), contrast: rgb('accent-contrast'),
        },
        separator: { DEFAULT: translucent('separator'), opaque: rgb('opaque-separator') },
        'control-border': rgb('control-border'),
        fill: {
          DEFAULT: translucent('fill'), secondary: translucent('fill-secondary'),
          tertiary: translucent('fill-tertiary'), quaternary: translucent('fill-quaternary'),
        },
        material: rgb('material'), scrim: rgb('scrim'),
        sidebar: {
          DEFAULT: rgb('sidebar'), label: rgb('sidebar-label'),
          secondary: rgb('sidebar-secondary'), fill: rgb('sidebar-fill'),
        },
        success: { DEFAULT: rgb('success'), soft: mixed('success-soft') },
        danger: { DEFAULT: rgb('danger'), soft: mixed('danger-soft') },
        warning: { DEFAULT: rgb('warning'), soft: mixed('warning-soft') },
        info: { DEFAULT: rgb('info'), soft: mixed('info-soft') },
        blush: {
          50: rgb('blush-50'), 100: rgb('blush-100'), 200: rgb('blush-200'), 300: rgb('blush-300'),
          400: rgb('blush-400'), 500: rgb('blush-500'), 600: rgb('blush-600'), 700: rgb('blush-700'),
        },
        rosegold: { DEFAULT: rgb('rosegold'), light: rgb('rosegold-light') },
        champagne: rgb('champagne'), nude: rgb('nude'),
        plum: { DEFAULT: rgb('label'), light: rgb('secondary-ink'), dark: rgb('surface-inverse') },
        ink: rgb('label'), muted: rgb('secondary-ink'),
      },
      // Foreground ink must work over grouped, tinted, and translucent surfaces.
      // Keep backgrounds on the original UIKit swatch.
      textColor: {
        accent: { DEFAULT: mixed('accent-ink'), pressed: mixed('accent-pressed-ink') },
        success: mixed('success-ink'), danger: mixed('danger-ink'),
        warning: mixed('warning-ink'), info: mixed('info-ink'),
      },
      ringColor: { accent: mixed('accent-ink'), danger: mixed('danger-ink') },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"Helvetica Neue"', 'sans-serif'],
        brand: ['"Playfair Display"', 'Georgia', 'serif'],
        arabic: ['Cairo', 'sans-serif'],
      },
      fontSize: {
        'large-title': ['2.125rem', { lineHeight: '1.18', letterSpacing: '-0.025em', fontWeight: '700' }],
        'title-1': ['1.75rem', { lineHeight: '1.22', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title-2': ['1.375rem', { lineHeight: '1.28', letterSpacing: '-0.015em', fontWeight: '600' }],
        'title-3': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.012em', fontWeight: '600' }],
        headline: ['1.0625rem', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['1.0625rem', { lineHeight: '1.5' }],
        callout: ['1rem', { lineHeight: '1.4' }],
        subhead: ['0.9375rem', { lineHeight: '1.4' }],
        footnote: ['0.8125rem', { lineHeight: '1.4' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
        base: ['1.0625rem', '1.5'], sm: ['0.9375rem', '1.4'], xs: ['0.8125rem', '1.4'],
      },
      borderRadius: { lg: '0.75rem', xl: '1rem', '2xl': '1.25rem', '3xl': '1.75rem', sheet: '1.75rem' },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--shadow) / 0.04), 0 8px 24px -6px rgb(var(--shadow) / 0.08)',
        glass: 'inset 0 1px 0 var(--glass-highlight), inset 0 -1px 0 var(--glass-sheen), inset 0 0 0 1px var(--glass-keyline), 0 2px 10px -2px rgb(var(--shadow) / 0.09)',
        glow: '0 8px 28px -8px rgb(var(--accent-glow) / 0.55)',
        elevated: '0 1px 3px rgb(var(--shadow) / 0.06), 0 12px 40px -10px rgb(var(--shadow) / 0.18)',
        sheet: 'inset 0 1px 0 var(--glass-highlight), 0 -2px 8px rgb(var(--shadow) / 0.05), 0 28px 80px -12px rgb(var(--shadow) / 0.30)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, rgb(var(--brand-start)), rgb(var(--gradient-end)))',
        'blush-gradient': 'linear-gradient(145deg, rgb(var(--blush-50)), rgb(var(--blush-100)) 52%, rgb(var(--champagne)))',
        'champagne-gradient': 'linear-gradient(135deg, rgb(var(--background-tertiary)), rgb(var(--champagne)))',
      },
      keyframes: {
        watermark: {
          '0%': { top: '8%', left: '6%' },
          '25%': { top: '70%', left: '55%' },
          '50%': { top: '35%', left: '12%' },
          '75%': { top: '80%', left: '10%' },
          '100%': { top: '8%', left: '6%' },
        },
      },
      animation: { watermark: 'watermark 40s linear infinite' },
    },
  },
  plugins: [],
} satisfies Config;
