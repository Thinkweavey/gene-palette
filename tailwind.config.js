/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        night: '#030712',
        nebula: '#0f172a',
        aurora: '#7f5af0',
        plasma: '#00ffd0',
        ion: '#46c1ff',
      },
      dropShadow: {
        glow: '0 0 20px rgba(127, 90, 240, 0.35)',
        plasma: '0 0 25px rgba(0, 255, 208, 0.35)',
      },
      backgroundImage: {
        'grid-glow':
          'linear-gradient(rgba(127, 90, 240, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(127, 90, 240, 0.08) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-sm': '32px 32px',
      },
    },
  },
  plugins: [],
}

