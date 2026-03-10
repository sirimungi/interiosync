/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#b8860b',
          light: '#d4a84b',
          dark: '#8b6914',
        },
      },
    },
  },
  plugins: [],
}
