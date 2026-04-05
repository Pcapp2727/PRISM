/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        prism: {
          bg: '#07090D',
          card: 'rgba(255,255,255,0.02)',
          border: 'rgba(255,255,255,0.06)',
          blue: '#5B9DF5',
          green: '#3DD68C',
          yellow: '#EAB308',
          red: '#EF4444',
          purple: '#A78BFA',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
