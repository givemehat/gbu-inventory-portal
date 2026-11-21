/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14213D',
          muted: '#4B5563',
          subtle: '#6B7280',
        },
        primary: {
          DEFAULT: '#1F3A8A',
          hover: '#172554',
          light: '#EFF6FF',
        },
        gbu: {
          DEFAULT: '#1F3A8A',
          blue: '#1F3A8A',
          dark: '#172554',
          light: '#EFF6FF',
          50: '#EFF6FF',
          100: '#DBEAFE',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1F3A8A',
          950: '#172554',
        },
        paper: '#F7F8FA',
        surface: '#FFFFFF',
        line: {
          DEFAULT: '#E3E6EC',
          border: '#E3E6EC',
        },
        amber: {
          DEFAULT: '#B45309',
          light: '#FEF3C7',
          border: '#FDE68A',
        },
        green: {
          DEFAULT: '#15803D',
          light: '#DCFCE7',
          border: '#BBF7D0',
        },
        red: {
          DEFAULT: '#B91C1C',
          light: '#FEE2E2',
          border: '#FECACA',
        },
      },
      borderRadius: {
        DEFAULT: '6px',
        panel: '8px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(20, 33, 61, 0.05)',
        card: '0 1px 3px 0 rgba(20, 33, 61, 0.08), 0 1px 2px -1px rgba(20, 33, 61, 0.04)',
      },
    },
  },
  plugins: [],
}
