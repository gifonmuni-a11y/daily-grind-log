/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0E',
        panel: '#100E16',
        border: '#211D2C',
        'border-hover': '#3A3548',
        accent: '#7C5CFF',
        'accent-jade': '#2DD4BF',
        danger: '#E0444C',
        'text-high': '#EDEAF6',
        'text-muted': '#8B8696',
        'text-dim': '#5C5868',
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
