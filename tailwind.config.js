/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f5f1',
          100: '#dce8e1',
          200: '#bbd1c4',
          300: '#8fb39e',
          400: '#5f8f72',
          500: '#3d6f52',
          600: '#2a5640',
          700: '#1f4533',
          800: '#1a3c2e',
          900: '#142e23',
          950: '#0a1a14',
        },
        sage: {
          50: '#f5f7f4',
          100: '#e8ede5',
          200: '#d1dbcc',
          300: '#b0c1a8',
          400: '#8ba888',
          500: '#6f8e6b',
          600: '#567354',
          700: '#445e43',
          800: '#384d38',
          900: '#2e3e2e',
        },
        earth: {
          50: '#f8f5f2',
          100: '#ede4dc',
          200: '#dac8b9',
          300: '#c2a78e',
          400: '#a8856a',
          500: '#8f6a52',
          600: '#765544',
          700: '#6b5444',
          800: '#5a4639',
          900: '#4a3a30',
        },
        cream: {
          50: '#fdfcf9',
          100: '#f9f6ef',
          200: '#f5f1e8',
          300: '#ede7d8',
          400: '#e0d6c2',
          500: '#ccbfa3',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'widest-2': '0.3em',
      },
      animation: {
        'fade-in': 'fadeIn 1.2s ease forwards',
        'fade-up': 'fadeUp 1s ease forwards',
        'ken-burns': 'kenBurns 20s ease-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        kenBurns: {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.15) translate(-2%, -2%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
