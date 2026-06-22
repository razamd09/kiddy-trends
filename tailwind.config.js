/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coral:   '#E8635A',
        skyblue: '#A8D4E6',
        slate:   '#7B8FA6',
        sunny:   '#E8D96A',
        mint:    '#7EC8B8',
        cream:   '#F0EDE4',
        charcoal:'#2D2D2D',
      },
      fontFamily: {
        display: ['Fredoka One', 'cursive'],
        body:    ['Nunito', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounce2: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        float:    'float 3s ease-in-out infinite',
        'fade-up':'fade-up 0.6s ease-out forwards',
        bounce2:  'bounce2 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
