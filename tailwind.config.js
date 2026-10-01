/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original teal/night-green palette
        'night-green': '#0D1B17',
        'night-green-dark': '#08120F',
        'night-green-card': '#111814',
        'night-border': '#1A2E26',
        'teal-neon': '#00F5D4',
        'teal-neon-dim': '#00CCB0',
        'teal-glow': '#00E5C5',
        'deep-teal': '#044D3D',
        'mid-teal': '#066B55',
        
        // Medieval accents in teal palette
        'parchment': '#0F1E18',
        'parchment-dark': '#0A1510',
        'parchment-ink': '#E0FFF8',
        'parchment-ink-light': '#8FE8D8',
        
        'leather': '#0D2E26',
        'leather-dark': '#061A14',
        'leather-light': '#1A4D40',
        
        'blood-dried': '#00E5C5',
        'blood-dark': '#00B894',
        'blood-ink': '#00F5D4',
        
        'candle': '#00F5D4',
        'candle-dim': '#00CCB0',
        'ember': '#00E5C5',
        
        'bronze': '#00D4AA',
        'bronze-dark': '#00A388',
        'iron-dark': '#0A1E18',
        'iron-rust': '#008F7A',
        
        'void': '#050D0A',
        'shadow-deep': '#030806',
        
        'forest-night': '#043D30',
        'moss-dark': '#065E4A',
      },
      fontFamily: {
        'blackletter': ['UnifrakturMaguntia', 'Cinzel', 'serif'],
        'gothic': ['Cinzel', 'serif'],
        'body': ['IM Fell English', 'Georgia', 'serif'],
        'script': ['MedievalSharp', 'cursive'],
      },
      backgroundImage: {
        'parchment-texture': "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 400%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27/%3E%3C/filter%3E%3Crect width=%27400%27 height=%27400%27 filter=%27url(%23n)%27 opacity=%270.04%27/%3E%3C/svg%27')",
        'vellum-texture': "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 200 200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%271.2%27 numOctaves=%273%27/%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%270.03%27/%3E%3C/svg%27')",
        'burnt-edges': "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 400 400%27%3E%3CradialGradient id=%27burn%27 cx=%2750%25%27 cy=%270%25%27 r=%2780%25%27%3E%3Cstop offset=%270%25%27 stop-color=%27%230D2E26%27 stop-opacity=%270.3%27/%3E%3Cstop offset=%2760%25%27 stop-color=%27%230D2E26%27 stop-opacity=%270%27/%3E%3C/radialGradient%27%3E%3Crect width=%27400%27 height=%27400%27 fill=%27url(%23burn)%27/%3E%3C/svg%27')",
      },
      borderImage: {
        'medieval': 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Cpath d=%27M0 0h100v100H0z%27 fill=%27none%27 stroke=%27%230D2E26%27 stroke-width=%272%27/%3E%3Cpath d=%27M10 10h80v80H10z%27 fill=%27none%27 stroke=%27%2300F5D4%27 stroke-width=%271%27/%3E%3C/svg%27") 20',
        'ornate': 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 120 120%27%3E%3Cg fill=%27none%27 stroke=%27%2300E5C5%27 stroke-width=%271.5%27%3E%3Cpath d=%27M10 10h100v100H10z%27/%3E%3Cpath d=%27M20 20h80v80H20z%27/%3E%3Ccircle cx=%2725%27 cy=%2725%27 r=%278%27/%3E%3Ccircle cx=%2795%27 cy=%2725%27 r=%278%27/%3E%3Ccircle cx=%2725%27 cy=%2795%27 r=%278%27/%3E%3Ccircle cx=%2795%27 cy=%2795%27 r=%278%27/%3E%3C/g%3E%3C/svg%27") 25',
      },
      boxShadow: {
        'candle-glow': '0 0 30px rgba(0, 245, 212, 0.2), inset 0 0 60px rgba(0, 46, 38, 0.5)',
        'ember-glow': '0 0 20px rgba(0, 229, 197, 0.3), inset 0 -4px 20px rgba(0,0,0,0.4)',
        'deep-shadow': '0 10px 40px rgba(0,0,0,0.7), 0 0 60px rgba(5, 13, 10, 0.5)',
        'parchment-depth': 'inset 0 2px 10px rgba(0, 46, 38, 0.3), inset 0 -2px 10px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.4)',
      },
      animation: {
        'flicker-candle': 'flicker-candle 2s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'burnt-fade': 'burnt-fade 8s ease-in-out infinite',
      },
      keyframes: {
        'flicker-candle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.01)' },
        },
        'burnt-fade': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}