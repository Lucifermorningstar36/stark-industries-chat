/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        stark: {
          900: '#050508',
          800: '#0a0a12',
          700: '#0f0f1a',
          600: '#141422',
        }
      }
    },
  },
  plugins: [],
}
