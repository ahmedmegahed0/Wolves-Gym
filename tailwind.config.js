/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        dark: {
          950: '#090A0F',
          900: '#0D0F17',
          850: '#121520',
          800: '#181C2A',
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
        tajawal: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(245, 158, 11, 0.2)',
        'gold-glow-lg': '0 0 35px rgba(245, 158, 11, 0.35)',
        'wolf-card': '0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(245, 158, 11, 0.15)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #D97706 100%)',
        'gold-gradient-hover': 'linear-gradient(135deg, #FBBF24 0%, #FDE68A 50%, #F59E0B 100%)',
      }
    },
  },
  plugins: [],
}
