/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}", // Adjusted to scan all subdirectories within frontend
  ],
  theme: {
    extend: {
      colors: {
        primary: '#22c55e', // Green-500
        secondary: '#10b981', // Emerald-500
        accent: '#f97316', // Orange-500
        neutral: '#404040', // Neutral-700
        base_100: '#f3f4f6', // Gray-100
        info: '#3b82f6', // Blue-500
        success: '#16a34a', // Green-600
        warning: '#facc15', // Yellow-400
        error: '#ef4444', // Red-500
      },
    },
  },
  plugins: [],
}
