/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: "#000000",
        bgCard: "#0b0b0b",
        bgCardHover: "#141414",
        borderGray: "#222222",
        textWhite: "#ffffff",
        textGray: "#999999",
        accentRed: "#E50914",      // Rojo intenso premium
        accentRedHover: "#b20710", // Rojo oscuro al pasar el cursor
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
      boxShadow: {
        premium: "0 10px 40px -10px rgba(0,0,0,0.9)",
        glow: "0 0 20px rgba(229, 9, 20, 0.2)",
        glowActive: "0 0 25px rgba(229, 9, 20, 0.55)",
      }
    },
  },
  plugins: [],
}
