/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      colors: {
        void: '#050709',
        panel: '#0a0d12',
        surface: '#0f1318',
        border: '#1a2030',
        accent: '#00d4ff',
        'accent-dim': '#0099bb',
        success: '#00ff88',
        warn: '#ffaa00',
        danger: '#ff3366',
        muted: '#3a4a5c',
        text: '#c8d8e8',
        'text-dim': '#6a7a8a',
      },
      animation: {
        'scan': 'scan 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
