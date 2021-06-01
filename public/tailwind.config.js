const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  mode: 'jit',
  purge: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './containers/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      gridTemplateColumns: {
        layout: '300px auto 300px',
      },
      boxShadow: {
        landing: '0px 3.99353px 7.98706px 1.99676px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  variants: {
    extend: {
      borderRadius: ['last'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
