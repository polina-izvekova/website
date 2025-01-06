/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      screens: {
        // Custom breakpoints
        'xs': '480px', // Extra small screens
      },
    },
  },
  plugins: [],
}
