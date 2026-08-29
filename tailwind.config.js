/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rail: {
          ink: 'var(--rail-ink)',
          slate: 'var(--rail-slate)',
          line: 'var(--rail-line)',
          paper: 'var(--rail-paper)',
          eng: 'var(--rail-eng)',
          snt: 'var(--rail-snt)',
          td: 'var(--rail-td)',
          combined: 'var(--rail-combined)',
          critical: 'var(--rail-critical)',
          signal: 'var(--rail-signal)',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
        condensed: ['"Barlow Condensed"', '"Archivo Narrow"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
