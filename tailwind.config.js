/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#AA8EA0',
          light: '#F5EEF3',
          dark: '#725265',
        },
        sage: {
          DEFAULT: '#7FA98A',
          light: '#EBF3EC',
        },
      },
    },
  },
  plugins: [],
}
