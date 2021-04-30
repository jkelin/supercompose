module.exports = {
  purge: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './containers/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      gridTemplateColumns: {
        layout: '300px auto 300px',
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
