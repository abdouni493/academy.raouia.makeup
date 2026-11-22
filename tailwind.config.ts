import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
          'surface': {
            'DEFAULT': 'rgb(var(--background) / <alpha-value>)',
            'primary': 'rgb(var(--background) / <alpha-value>)',
            'secondary': 'rgb(var(--background-secondary) / <alpha-value>)',
            'tertiary': 'rgb(var(--background-tertiary) / <alpha-value>)',
            'inverse': 'rgb(var(--surface-inverse) / <alpha-value>)',
          },
          'label': {
            'DEFAULT': 'rgb(var(--label) / <alpha-value>)',
            'secondary': 'rgb(var(--label-secondary) / <alpha-value>)',
            'tertiary': 'rgb(var(--label-tertiary) / <alpha-value>)',
            'quaternary': 'rgb(var(--label-quaternary) / <alpha-value>)',
          },
          'accent': {
            'DEFAULT': 'rgb(var(--accent) / <alpha-value>)',
            'pressed': 'rgb(var(--accent-pressed) / <alpha-value>)',
            'soft': 'rgb(var(--accent-soft) / <alpha-value>)',
            'contrast': 'rgb(var(--accent-contrast) / <alpha-value>)',
          },
          'separator': 'rgb(var(--separator) / <alpha-value>)',
          'control-border': 'rgb(var(--control-border) / <alpha-value>)',
          'fill': {
            'DEFAULT': 'rgb(var(--fill) / <alpha-value>)',
            'secondary': 'rgb(var(--fill-secondary) / <alpha-value>)',
          },
          'material': 'rgb(var(--material) / <alpha-value>)',
          'scrim': 'rgb(var(--scrim) / <alpha-value>)',
          'sidebar': {
            'DEFAULT': 'rgb(var(--sidebar) / <alpha-value>)',
            'label': 'rgb(var(--sidebar-label) / <alpha-value>)',
            'secondary': 'rgb(var(--sidebar-secondary) / <alpha-value>)',
            'fill': 'rgb(var(--sidebar-fill) / <alpha-value>)',
          },
          'success': {
            'DEFAULT': 'rgb(var(--success) / <alpha-value>)',
            'soft': 'rgb(var(--success-soft) / <alpha-value>)',
          },
          'danger': {
            'DEFAULT': 'rgb(var(--danger) / <alpha-value>)',
            'soft': 'rgb(var(--danger-soft) / <alpha-value>)',
          },
          'warning': {
            'DEFAULT': 'rgb(var(--warning) / <alpha-value>)',
            'soft': 'rgb(var(--warning-soft) / <alpha-value>)',
          },
          'info': {
            'DEFAULT': 'rgb(var(--info) / <alpha-value>)',
            'soft': 'rgb(var(--info-soft) / <alpha-value>)',
          },
          'blush': {
            '50': 'rgb(var(--blush-50) / <alpha-value>)',
            '100': 'rgb(var(--blush-100) / <alpha-value>)',
            '200': 'rgb(var(--blush-200) / <alpha-value>)',
            '300': 'rgb(var(--blush-300) / <alpha-value>)',
            '400': 'rgb(var(--blush-400) / <alpha-value>)',
            '500': 'rgb(var(--blush-500) / <alpha-value>)',
            '600': 'rgb(var(--blush-600) / <alpha-value>)',
            '700': 'rgb(var(--blush-700) / <alpha-value>)',
          },
          'rosegold': {
            'DEFAULT': 'rgb(var(--rosegold) / <alpha-value>)',
            'light': 'rgb(var(--rosegold-light) / <alpha-value>)',
          },
          'champagne': 'rgb(var(--champagne) / <alpha-value>)',
          'nude': 'rgb(var(--nude) / <alpha-value>)',
          'plum': {
            'DEFAULT': 'rgb(var(--label) / <alpha-value>)',
            'light': 'rgb(var(--label-secondary) / <alpha-value>)',
            'dark': 'rgb(var(--surface-inverse) / <alpha-value>)',
          },
          'ink': 'rgb(var(--label) / <alpha-value>)',
          'muted': 'rgb(var(--label-secondary) / <alpha-value>)',
        },
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
        soft: '0 2px 8px rgb(var(--shadow) / 0.04), 0 8px 24px rgb(var(--shadow) / 0.05)',
        glow: '0 2px 8px rgb(var(--shadow) / 0.08)',
        elevated: '0 8px 32px rgb(var(--shadow) / 0.12), 0 1px 4px rgb(var(--shadow) / 0.08)',
        sheet: '0 24px 80px rgb(var(--shadow) / 0.24)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--gradient-end)))',
        'blush-gradient': 'linear-gradient(145deg, rgb(var(--blush-50)), rgb(var(--blush-100)) 55%, rgb(var(--champagne)))',
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
