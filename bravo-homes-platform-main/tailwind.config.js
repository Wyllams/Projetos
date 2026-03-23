/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-2': 'var(--bg2)',
        'bg-3': 'var(--bg3)',
        'bg-4': 'var(--bg4)',
        gold: 'var(--gold)',
        'gold-2': 'var(--gold2)',
        'gold-dim': 'var(--gd)',
        text: 'var(--text)',
        't-2': 'var(--t2)',
        't-3': 'var(--t3)',
        success: 'var(--green)',
        danger: 'var(--red)',
        info: 'var(--blue)',
        warning: 'var(--orange)',
        border: 'var(--b)',
        'border-2': 'var(--b2)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 16px var(--shadow)',
        modal: '0 24px 64px rgba(0,0,0,0.6)',
        toast: '0 8px 32px rgba(0,0,0,0.4)',
      },
      borderRadius: {
        card: '10px',
        modal: '12px',
      },
    },
  },
  plugins: [],
}
