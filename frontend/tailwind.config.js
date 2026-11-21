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
        paper: '#F7F8FA',
        surface: '#FFFFFF',
        line: '#E3E6EC',
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
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
