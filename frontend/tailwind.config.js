/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1f3f",
        navy: "#16436a",
        ocean: "#2f87b7",
        mist: "#b9e2ef",
        panel: "#ddf4fa"
      }
    }
  },
  plugins: []
};
