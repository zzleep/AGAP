/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          primary: '#2563eb'
        },
        emergency: {
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
          green: '#22c55e',
          amber: '#f59e0b'
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
}
