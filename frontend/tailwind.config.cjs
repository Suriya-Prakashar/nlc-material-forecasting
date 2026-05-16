/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nlcBlue: '#0F4C81',
        nlcGold: '#D4AF37',
      }
    },
  },
  plugins: [],
}
