/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090D16',
        surface: {
          50: '#1A2338',
          100: '#141C2E',
          200: '#0F172A',
          300: '#0B1120',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.04)'
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          glow: 'rgba(99, 102, 241, 0.25)',
          muted: 'rgba(99, 102, 241, 0.12)'
        },
        violet: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          glow: 'rgba(139, 92, 246, 0.25)'
        },
        cyan: {
          DEFAULT: '#06B6D4',
          glow: 'rgba(6, 182, 212, 0.25)'
        },
        emerald: {
          DEFAULT: '#10B981',
          glow: 'rgba(16, 185, 129, 0.25)'
        },
        amber: {
          DEFAULT: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.25)'
        },
        rose: {
          DEFAULT: '#F43F5E',
          glow: 'rgba(244, 63, 94, 0.25)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-primary': '0 0 24px -4px rgba(99, 102, 241, 0.35)',
        'glow-violet': '0 0 24px -4px rgba(139, 92, 246, 0.35)',
        'glow-cyan': '0 0 24px -4px rgba(6, 182, 212, 0.35)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)'
      }
    },
  },
  plugins: [],
};
