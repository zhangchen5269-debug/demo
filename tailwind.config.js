/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b3c2f4',
        'primary-deep': '#9aa8d9',
        'primary-press': '#7f8bbf',
        'primary-bg-subdued': '#e8ecf8',
        'brand-dark': '#1c1e54',
        ink: '#0d253d',
        'ink-secondary': '#273951',
        'ink-mute': '#64748d',
        canvas: '#ffffff',
        'canvas-soft': '#f6f9fc',
        'canvas-cream': '#f5e9d4',
        hairline: '#e3e8ee',
        'hairline-input': '#a8c3de',
        ruby: '#ea2261',
        magenta: '#f96bee',
        lemon: '#9b6829',
        'shadow-blue': '#003770',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #b3c2f4 0%, #9aa8d9 100%)',
        'gradient-soft': 'linear-gradient(180deg, #ffffff 0%, #f6f9fc 100%)',
      },
      boxShadow: {
        'soft': '0 4px 20px 0 rgba(0, 55, 112, 0.08)',
        'soft-lg': '0 8px 30px 0 rgba(0, 55, 112, 0.12)',
      },
    },
  },
  plugins: [],
}
