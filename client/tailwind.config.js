/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-base': '#0B0E14',
        'navy-surface': '#161B22',
        'navy-elevated': '#1C2128',
        'cyber-green': '#00FF41',
        'alert-red': '#FF4B4B',
        'text-primary': '#E6EDF3',
        'text-secondary': '#8B949E'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
