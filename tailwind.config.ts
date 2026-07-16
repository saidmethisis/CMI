import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#14314F",
          50: "#eef4fb",
          100: "#d9e6f4",
          500: "#1d4b78",
          600: "#14314f",
          700: "#0d2238",
          900: "#081625",
        },
        accent: { DEFAULT: "#C81E3A", 600: "#C81E3A", 700: "#a5122b" },
        gold: "#E0A008",
        ink: { DEFAULT: "#0a121f", surface: "#0f1a2b", raised: "#14223a" },
        up: "#16A34A",
        down: "#DC2626",
      },
      fontFamily: {
        serif: ["Georgia", "'Times New Roman'", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      maxWidth: { content: "1280px" },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "slide-up": { from: { transform: "translateY(12px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
      },
      animation: {
        shimmer: "shimmer 1.4s infinite",
        "slide-up": "slide-up .25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
