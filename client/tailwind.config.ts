import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        surface: "#f7f9fb",
        accent: "#0f766e"
      }
    }
  },
  plugins: []
} satisfies Config;
