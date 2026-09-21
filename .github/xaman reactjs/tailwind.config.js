
/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        xaman: {
          blue: '#0052FF',
          blueHover: '#0040DD',
          black: '#FFFFFF',
          dark: '#FFFFFF',
          surface: '#F5F7FA',
          border: '#E2E8F0',
          borderHover: '#CBD5E1',
          text: '#0F172A',
          textMuted: '#64748B',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
