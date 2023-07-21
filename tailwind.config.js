module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        primary: "#34D399",
        secondary: "#111827",
        tailwind: "#06B6D4",
      },
      fontFamily: {
        body: ["Permanent Marker"],
      },
      keyframes: {
        skew: {
          "0%, 100%": { transform: "skew(-15deg)" },
          "50%": { transform: "skew(15deg)" },
        },
      },
      animation: {
        skew: "skew 2s infinite",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
