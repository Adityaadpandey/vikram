/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Dark Theme
        'dark-primary': '#0D1B2A',
        'dark-secondary': '#1B263B',
        'dark-accent': '#00C6A7',
        'dark-text': '#E0E1DD',
        'dark-text-secondary': '#9CA3AF',
        'dark-card': '#16243A',
        
        // Light Theme
        'light-primary': '#F8FAFC',
        'light-secondary': '#E2E8F0',
        'light-accent': '#00897B',
        'light-text': '#0D1B2A',
        'light-text-secondary': '#475569',
        'light-card': '#FFFFFF',
        
        // Legacy (kept for compatibility)
        military: {
          dark: '#1a1f2e',
          navy: '#2c3e50',
          blue: '#34495e',
          grey: '#95a5a6',
          lightGrey: '#ecf0f1',
          green: '#556B2F',
          accent: '#7f8c8d',
        },
      },
    },
  },
  plugins: [],
}
