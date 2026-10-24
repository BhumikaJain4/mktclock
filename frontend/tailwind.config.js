/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070809',
          900: '#0C0D0F',
          850: '#121417',
          800: '#171A1E',
          700: '#21252B',
          600: '#2E333C',
          500: '#4B5260',
          400: '#7B8494',
          300: '#A6B0C0',
          200: '#D2D7E0',
          100: '#EAECEF',
        },
        parchment: {
          50: '#FAF8F5',
          100: '#F5F0E8',
          200: '#EAE1D3',
          300: '#DDD0BC',
          900: '#1C1A16',
        },
        signal: {
          DEFAULT: '#FF5722',
          light: '#FF7A47',
          glow: 'rgba(255, 87, 34, 0.22)',
          dark: '#E64A19',
        },
        emerald: {
          accent: '#10B981',
          dim: 'rgba(16, 185, 129, 0.15)',
        },
      },
      fontFamily: {
        display: ['Syne', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'signal-glow': '0 0 35px -5px rgba(255, 87, 34, 0.35)',
        'timer-dial': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.05), 0 20px 40px -15px rgba(0, 0, 0, 0.8)',
        'fine-card': '0 1px 1px 0 rgba(0,0,0,0.05), 0 8px 16px -4px rgba(0,0,0,0.04)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
