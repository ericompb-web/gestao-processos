/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4', // Light green for highlight
          100: '#dcfce7',
          500: '#22c55e', // Primary green
          600: '#16a34a', // Hover green
          700: '#15803d',
          900: '#14532d',
        },
        surface: {
          50: '#ffffff',
          100: '#f8fafc',
          200: '#f1f5f9',
          900: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}
