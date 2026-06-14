/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#08070d',
          900: '#0d0b16',
          800: '#15121f',
          700: '#1f1b2e',
        },
        panel: '#16131f',
        pop: {
          DEFAULT: '#ff3d7f',
          soft: '#ff6fa3',
        },
        electric: {
          DEFAULT: '#6c5ce7',
          soft: '#a29bfe',
        },
        gold: '#ffd23f',
      },
      fontFamily: {
        display: ['"Bangers"', 'system-ui', 'cursive'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '6px 6px 0 0 rgba(0,0,0,0.85)',
        pop: '0 0 0 3px #08070d, 6px 6px 0 0 #ff3d7f',
      },
      backgroundImage: {
        'halftone':
          'radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseRing: 'pulseRing 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
}
