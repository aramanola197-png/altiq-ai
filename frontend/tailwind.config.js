/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#111111',
        charcoal: '#232323',
        ash: '#A7A7A7',
        'light-ash': '#D9D9D9',
        white: '#FFFFFF',
        page: '#ECECEC',
      },
      fontFamily: {
        heading: ['Geist'],
        body: ['Montserrat'],
      },
      borderRadius: {
        card: '18px',
        panel: '22px',
      },
    },
  },
  plugins: [],
};
