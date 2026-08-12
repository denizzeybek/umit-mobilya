import { colors } from './src/constants/colors';
/** @type {import('tailwindcss').Config} */

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1800px',
      },
      borderColor: colors,
      textColor: colors,
      colors,
      fontFamily: {
        /* LiraSign yalnizca U+20BA'yi kapsar; gerekcesi styles/index.scss'te. */
        sans: [
          'LiraSign',
          'Schibsted Grotesk',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 7vw, 6.5rem)', { lineHeight: '1.02' }],
        'display-lg': ['clamp(2.25rem, 5vw, 4.5rem)', { lineHeight: '1.06' }],
        'display-md': ['clamp(1.75rem, 3.4vw, 3rem)', { lineHeight: '1.12' }],
        'display-sm': ['clamp(1.375rem, 2.2vw, 2rem)', { lineHeight: '1.2' }],
      },
      maxWidth: {
        prose: '62ch',
        editorial: '1440px',
      },
      spacing: {
        section: 'clamp(4.5rem, 10vw, 9rem)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'shake-x': {
          '0%, 100%': { marginLeft: '0' },
          '25%': { marginLeft: '0.25rem' },
          '75%': { marginLeft: '-0.25rem' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1) translate3d(0, 0, 0)' },
          '100%': { transform: 'scale(1.07) translate3d(0, -1%, 0)' },
        },
      },
      animation: {
        'shake-x': 'shake-x .2s ease-in-out 0s 2',
        'ken-burns': 'ken-burns 18s ease-out forwards',
      },
      gridTemplateColumns: {
        36: 'repeat(36, minmax(0, 1fr))',
      },
      gridColumn: {
        'span-14': 'span 14 / span 14',
      },
      height: {
        'full-offcanvas': '91%',
      },
      scale: {
        104: '1.04',
        115: '1.15',
      },
    },
  },
};
