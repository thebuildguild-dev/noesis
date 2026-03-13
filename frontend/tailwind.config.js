/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fdfbf7',
        ink: '#2d2d2d',
        muted: '#e5e0d8',
        accent: '#ff4d4d',
        'pen-blue': '#2d5da1'
      },
      fontFamily: {
        marker: ['Kalam', 'cursive'],
        hand: ['Patrick Hand', 'cursive']
      },
      boxShadow: {
        hard: '4px 4px 0px 0px #2d2d2d',
        'hard-sm': '2px 2px 0px 0px #2d2d2d',
        'hard-lg': '8px 8px 0px 0px #2d2d2d',
        'hard-accent': '4px 4px 0px 0px #ff4d4d',
        'hard-blue': '4px 4px 0px 0px #2d5da1',
        'hard-muted': '3px 3px 0px 0px rgba(45,45,45,0.12)'
      }
    }
  },
  plugins: []
}
