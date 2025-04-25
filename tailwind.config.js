/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'grid-bg': '#2d3748', // Dark gray-blue
        'grid-border': '#4a5568', // Medium gray
        'stimulus-active': '#63b3ed', // Light Blue
        'feedback-correct': '#68d391', // Green
        'feedback-miss': '#f6ad55', // Orange
        'feedback-false-alarm': '#fc8181', // Red
        'button-primary': '#4299e1', // Blue
        'button-primary-hover': '#2b6cb0', // Darker Blue
        'button-secondary': '#a0aec0', // Gray
        'button-secondary-hover': '#718096', // Darker Gray
        'button-danger': '#e53e3e', // Red
        'button-danger-hover': '#c53030', // Darker Red
      },
      gridTemplateColumns: {
        '3': 'repeat(3, minmax(0, 1fr))',
      },
      gridTemplateRows: {
        '3': 'repeat(3, minmax(0, 1fr))',
      },
      width: {
        '112': '28rem', // 448px
      },
      height: {
        '112': '28rem', // 448px
      },
    },
  },
  plugins: [],
}
