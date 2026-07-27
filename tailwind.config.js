/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sr: {
          brandy: {
            DEFAULT: '#902715',
            hover: '#781f11',
            light: '#ad2f1a',
            container: '#f9ebe8',
            tint: '#f3d3cd'
          },
          canary: {
            DEFAULT: '#F7FB41',
            hover: '#e2e626',
            light: '#fbfd88',
            container: '#fefee8',
            text: '#616400'
          },
          copper: {
            DEFAULT: '#D14D3E',
            hover: '#b83b2d',
            container: '#f9ecea',
            tint: '#f3d8d4'
          },
          smoke: {
            DEFAULT: '#F5F5F5',
            card: '#FFFFFF',
            subtle: '#EBEBEB',
            darker: '#E0E0E0'
          },
          onyx: {
            DEFAULT: '#0A0A0A',
            muted: '#4A4A4A',
            subtle: '#717171',
            surface: '#181818'
          },
          olive: {
            DEFAULT: '#556B2F',
            hover: '#425324',
            container: '#EEF2E6',
            tint: '#D8E2C7'
          }
        },
        brand: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          primary: '#902715'
        },
        emergency: {
          red: '#902715',
          orange: '#D14D3E',
          yellow: '#F7FB41',
          green: '#556B2F',
          amber: '#d97706'
        }
      },
      fontFamily: {
        expressive: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        outfit: ['"Outfit"', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
        '5xl': '2.75rem',
        'full-pill': '9999px'
      },
      boxShadow: {
        'm3-sm': '0 2px 6px 0 rgba(10, 10, 10, 0.04), 0 1px 2px -1px rgba(10, 10, 10, 0.04)',
        'm3-md': '0 8px 24px -4px rgba(10, 10, 10, 0.08), 0 2px 8px -2px rgba(10, 10, 10, 0.04)',
        'm3-lg': '0 16px 36px -6px rgba(144, 39, 21, 0.12), 0 4px 12px -2px rgba(10, 10, 10, 0.04)',
        'glow-canary': '0 0 20px 2px rgba(247, 251, 65, 0.5)',
        'glow-brandy': '0 0 24px 4px rgba(144, 39, 21, 0.3)'
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-subtle': 'float 3s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      }
    }
  },
  plugins: []
}
