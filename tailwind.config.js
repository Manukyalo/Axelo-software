/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Luxury Safari Aesthetic - Light Mode
        'safari-bg': '#FAFAF7',
        'safari-primary': '#1A1A2E',
        'safari-gold': '#C9A84C',
        'safari-earthy': '#8B5E3C',
        'safari-success': '#2D6A4F',
        'safari-warning': '#E76F51',
        
        // Dark Mode
        'dark-bg': '#0D0D14',
        'dark-surface': '#16162A',
        'dark-card': '#1E1E35',
        'dark-text': '#F0EDE8',
        'dark-border': 'rgba(201, 168, 76, 0.15)',
      },
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'dm-sans': ['"DM Sans"', 'sans-serif'],
        'jetbrains': ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'button': '10px',
        'input': '10px',
      },
      boxShadow: {
        'premium-light': '0 4px 24px rgba(0,0,0,0.06)',
        'premium-dark': '0 4px 24px rgba(0,0,0,0.4)',
      },
      transitionProperty: {
        'all': 'all',
      },
      transitionDuration: {
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
