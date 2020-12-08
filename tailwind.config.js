module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: '#FF6363',
        secondary: {
          100: '#E2E2D5',
          200: '#888883'
        },
        tailwind: '#06B6D4'
      },
      fontFamily: {
        body: ['Permanent Marker']
      },
      keyframes: {
        'skew': {
          '0%, 100%': { transform: 'skew(-45deg)' },
          '50%': { transform: 'skew(45deg)' },
        },
      },
      animation: {
        'skew': 'skew 2s infinite',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
