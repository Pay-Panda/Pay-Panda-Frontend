/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        'panel-inset': 'var(--panel-inset)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-contrast': 'var(--accent-contrast)',
        green: 'var(--green)',
        amber: 'var(--amber)',
        red: 'var(--red)',
        line: 'var(--line)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        panel: 'var(--shadow)',
        elevated: 'var(--shadow-lg)',
      },
      fontSize: {
        micro: 'var(--font-micro)',
        small: 'var(--font-small)',
        body: 'var(--font-body)',
      },
      letterSpacing: {
        tight: 'var(--tracking-tight)',
        wide: 'var(--tracking-wide)',
      },
    },
  },
  plugins: [],
};
