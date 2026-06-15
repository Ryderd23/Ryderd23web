/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#050505",
          950: "#030303",
          900: "#0a0a0a",
          800: "#121212",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E8C547",
          dark: "#B8962E",
          muted: "rgba(212, 175, 55, 0.14)",
        },
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        script: ["Playfair Display", "Georgia", "serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(90deg, transparent 0%, transparent 42%, rgba(5,5,5,0.1) 55%, rgba(5,5,5,0.55) 80%, rgba(5,5,5,0.72) 100%)",
        vignette:
          "radial-gradient(ellipse 45% 60% at 92% 48%, transparent 40%, rgba(5,5,5,0.35) 100%)",
        "gold-shine":
          "linear-gradient(135deg, rgba(232, 197, 87, 0.15) 0%, transparent 55%)",
      },
      boxShadow: {
        cinematic: "0 32px 64px -16px rgba(0,0,0,0.85)",
        gold: "0 0 40px rgba(212, 175, 55, 0.3)",
        "gold-sm": "0 0 20px rgba(212, 175, 55, 0.2)",
        card: "0 20px 50px rgba(0,0,0,0.6)",
      },
      animation: {
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
