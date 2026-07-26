/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        chavin: {
          dark: '#0A192F', // Corporate dark blue
          light: '#E6F1FF', // Light blue background
          accent: '#00D4FF', // Cyan accent
          white: '#FFFFFF',
          glass: 'rgba(255, 255, 255, 0.1)',
          glassBorder: 'rgba(255, 255, 255, 0.2)'
        }
      }
    },
  },
  plugins: [],
}
