/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#cde2fb',
          500: '#2a78d6',
          600: '#256abf',
          700: '#184f95',
        },
      },
    },
  },
  plugins: [],
};
