/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        'primary-light': '#FF9F7D',
        'primary-dark': '#E55A2B',
        secondary: '#00B4D8',
        'secondary-light': '#4CC9F0',
        'secondary-dark': '#0096C7',
        accent: '#FFD166',
        neutral: {
          100: '#F8FAFC',
          200: '#F1F5F9',
          300: '#E2E8F0',
          400: '#CBD5E1',
          500: '#94A3B8',
          600: '#64748B',
          700: '#475569',
          800: '#334155',
          900: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF6B35 0%, #00B4D8 100%)',
        'gradient-soft': 'linear-gradient(180deg, #FFF5F0 0%, #F0F9FF 100%)',
      },
      boxShadow: {
        'soft': '0 4px 20px 0 rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 30px 0 rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
