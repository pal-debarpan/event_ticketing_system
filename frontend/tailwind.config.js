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
        slate: {
          850: '#141c2e',
        },
        brand: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#9af5df',
          500: '#14b898',
          700: '#0f766e',
          800: '#115e59',
          900: '#114b3f',
          950: '#072b24',
        }
      }
    },
  },
  plugins: [],
}
