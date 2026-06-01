/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad Faro: noche marina (navy) + haz dorado (beam).
        // Se complementan con slate/emerald/rose/sky de Tailwind por default.
        navy: {
          50:  '#F1F4FA',
          100: '#DCE3F1',
          200: '#B6C3DF',
          300: '#869AC4',
          400: '#5772A4',
          500: '#3A5384',
          600: '#283F6A',
          700: '#1C2E50',
          800: '#152347',
          900: '#0B1733', // hero cards
          950: '#070F23',
        },
        beam: {
          50:  '#FFF8E1',
          100: '#FFEDB3',
          200: '#FCDD80',
          300: '#FBCB52',
          400: '#FBBF24',
          500: '#F59E0B', // CTA / FAB / nav activo
          600: '#D97706',
          700: '#B45309',
          800: '#78350F',
          900: '#451A03',
        },
      },
      boxShadow: {
        beam: '0 8px 20px -8px rgba(245, 158, 11, 0.55)',
      },
    },
  },
  plugins: [],
}
