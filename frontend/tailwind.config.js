/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          // Charcoal scale
          950: '#0F0F10',
          900: '#1C1C1E',
          800: '#2C2C2E',
          700: '#3A3A3C',
          600: '#48484A',
          500: '#636366',
          400: '#8E8E93',
          300: '#AEAEB2',
          200: '#C7C7CC',
          100: '#E5E5EA',
          50:  '#F2F2F7',
        },
        gold: {
          // Warm gold scale
          900: '#7A5C1E',
          800: '#9B7328',
          700: '#B8882F',
          600: '#C9973A',
          DEFAULT: '#C9A84C',  // primary gold accent
          400: '#D4B86A',
          300: '#DECA8E',
          200: '#EAD9B4',
          100: '#F5EDDA',
          50:  '#FAF6EE',
        },
        surface: {
          DEFAULT: '#FAF9F6',   // warm off-white background
          card:    '#F2F0EB',   // card / panel surface
          border:  '#E8E5DE',   // subtle border
        },
        status: {
          draft:    '#8E8E93',
          sent:     '#D4A017',
          accepted: '#3D7A5F',
          rejected: '#C0392B',
          scheduled:'#2D6A9F',
          completed:'#3D7A5F',
          cancelled:'#C0392B',
          todo:     '#8E8E93',
          in_progress: '#D4A017',
          done:     '#3D7A5F',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(28,28,30,0.08), 0 1px 2px -1px rgba(28,28,30,0.06)',
        'card-hover': '0 4px 12px 0 rgba(28,28,30,0.12), 0 2px 4px -1px rgba(28,28,30,0.08)',
        'gold-glow': '0 0 0 2px rgba(201,168,76,0.25)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
