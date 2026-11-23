/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        unior: {
          50:  '#fdf4f3',
          100: '#fbe7e5',
          200: '#f7d1ce',
          300: '#f0aca7',
          400: '#e57a73',
          500: '#d64b45',
          600: '#bd2f2b',
          700: '#9e2422',
          800: '#822220',
          900: '#6b211f',
          950: '#3d0f10',
        },
        brand: {
          50:  '#fdf4f3',
          100: '#fbe7e5',
          200: '#fbe9e7',
          300: '#f5c0bc',
          400: '#e1252b',
          500: '#c01f26',
          600: '#9e2422',
          700: '#822220',
        },
        gold: {
          50:  '#fef9ec',
          100: '#fdf0cd',
          200: '#fae09b',
          300: '#f6c95e',
          400: '#f2a900',
          500: '#e09200',
          600: '#c27700',
          700: '#9e5800',
          800: '#7d4400',
          900: '#633700',
        },
        paper: {
          DEFAULT: '#f7f3eb',
          50:  '#fcfaf5',
          100: '#f2ecdf',
          200: '#e6dccb',
        },
        ink: {
          DEFAULT: '#241316',
          soft:    '#5c4b4d',
        },
      },
      opacity: {
        8: '0.08',
      },
      fontFamily: {
        sans:    ['Montserrat', 'Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
      },
      boxShadow: {
        sm:   '0 1px 2px rgba(61,15,16,.06)',
        card: '0 1px 3px rgba(61,15,16,.05), 0 8px 24px -12px rgba(61,15,16,.12)',
        'card-hover': '0 4px 16px -4px rgba(61,15,16,.14), 0 1px 3px rgba(61,15,16,.06)',
        'card-xl': '0 8px 32px -8px rgba(61,15,16,.18), 0 2px 6px rgba(61,15,16,.06)',
        lift: '0 24px 60px -28px rgba(61,15,16,.4)',
        'lift-lg': '0 32px 72px -24px rgba(61,15,16,.55)',
        nav:  '0 10px 40px -24px rgba(61,15,16,.5)',
        brand: '0 8px 24px -10px rgba(225,37,43,.30)',
        'brand-sm': '0 4px 12px -4px rgba(225,37,43,.20)',
        'brand-lg': '0 12px 32px -8px rgba(225,37,43,.38)',
        gold: '0 8px 24px -10px rgba(242,169,0,.28)',
        'gold-sm': '0 4px 12px -4px rgba(242,169,0,.18)',
        'inner-sm': 'inset 0 1px 2px rgba(61,15,16,.06)',
        'inner-brand': 'inset 0 1px 0 rgba(255,255,255,.12)',
        glow: '0 0 0 3px rgba(225,37,43,.12)',
      },
      backgroundImage: {
        'unior-hero': 'linear-gradient(135deg, #3d0f10 0%, #6b211f 55%, #9e2422 100%)',
        'dot-pattern': 'radial-gradient(rgba(61,15,16,0.07) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-sm': '20px 20px',
        'dot-md': '28px 28px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(242,169,0,0)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(242,169,0,0.12)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(242,169,0,0.25)' },
          '50%':      { borderColor: 'rgba(242,169,0,0.55)' },
        },
      },
      animation: {
        'fade-up':     'fade-up .5s cubic-bezier(.22,1,.36,1) both',
        'fade-in':     'fade-in .35s ease both',
        'scale-in':    'scale-in .3s cubic-bezier(.22,1,.36,1) both',
        'slide-down':  'slide-down .3s cubic-bezier(.22,1,.36,1) both',
        'slide-left':  'slide-left .4s cubic-bezier(.22,1,.36,1) both',
        float:         'float 9s ease-in-out infinite',
        shimmer:       'shimmer 2s linear infinite',
        'pulse-soft':  'pulse-soft 2.5s ease-in-out infinite',
        'glow-pulse':  'glow-pulse 3s ease-in-out infinite',
        'border-glow': 'border-glow 3s ease-in-out infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
};
