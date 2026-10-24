/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050b16',
        panel: '#0b1728',
        card: '#0d1d31',
        cyan: '#00d4ff',
        violet: '#7047ff',
      },
      boxShadow: {
        glow: '0 0 35px rgba(0,212,255,.13)',
      },
    },
  },
  plugins: [],
}