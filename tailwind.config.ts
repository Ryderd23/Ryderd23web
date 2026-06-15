import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./sections/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E8C547",
          dark: "#B8962E",
          muted: "rgba(212, 175, 55, 0.15)",
        },
        void: {
          DEFAULT: "#000000",
          950: "#050505",
          900: "#0a0a0a",
          800: "#121212",
          700: "#1a1a1a",
        },
      },
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-overlay":
          "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.3) 100%)",
        "cinematic-vignette":
          "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
      },
      boxShadow: {
        gold: "0 0 30px rgba(212, 175, 55, 0.25)",
        "gold-sm": "0 0 15px rgba(212, 175, 55, 0.15)",
        cinematic: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
      },
      animation: {
        "pulse-gold": "pulse-gold 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-gold": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
