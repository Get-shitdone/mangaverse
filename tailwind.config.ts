import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0a0a0a",
          50: "#f5f5f5",
          100: "#e5e5e5",
          200: "#cfcfcf",
          300: "#a3a3a3",
          400: "#737373",
          500: "#525252",
          600: "#404040",
          700: "#262626",
          800: "#171717",
          900: "#0a0a0a",
          950: "#050505",
        },
        cream: {
          DEFAULT: "#f5f1e8",
          50: "#fdfcf7",
          100: "#f9f6ed",
          200: "#f5f1e8",
          300: "#ebe3cf",
          400: "#dcd0b0",
          500: "#c8b88a",
        },
        sumi: "#1a1a1a",
        vermillion: {
          DEFAULT: "#c1272d",
          50: "#fef2f2",
          100: "#fde6e6",
          200: "#fbcccc",
          300: "#f59999",
          400: "#ed5e5e",
          500: "#dc2626",
          600: "#c1272d",
          700: "#a01e22",
          800: "#841c1f",
          900: "#6f1c1f",
        },
        gold: {
          DEFAULT: "#d4af37",
          400: "#e0c25a",
          500: "#d4af37",
          600: "#b8951f",
          700: "#9a7c1c",
        },
        accent: {
          mint: "#7dd3a8",
          sky: "#7dbfd3",
          rose: "#e89a9a",
        },
      },
      fontFamily: {
        display: ["var(--font-bebas)", "Bebas Neue", "Impact", "sans-serif"],
        anton: ["var(--font-anton)", "Anton", "Impact", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-dm-serif)", "DM Serif Display", "Georgia", "serif"],
        jp: ["var(--font-noto-jp)", "Noto Serif JP", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        widest: "0.25em",
        manga: "0.18em",
      },
      boxShadow: {
        panel: "4px 4px 0 0 rgba(10, 10, 10, 1)",
        "panel-sm": "2px 2px 0 0 rgba(10, 10, 10, 1)",
        "panel-lg": "6px 6px 0 0 rgba(10, 10, 10, 1)",
        "panel-vermillion": "4px 4px 0 0 rgba(193, 39, 45, 1)",
        ink: "0 1px 0 0 rgba(10, 10, 10, 1)",
      },
      backgroundImage: {
        halftone:
          "radial-gradient(rgba(10, 10, 10, 0.12) 1px, transparent 1px)",
        "halftone-light":
          "radial-gradient(rgba(10, 10, 10, 0.06) 1px, transparent 1px)",
        "halftone-dark":
          "radial-gradient(rgba(245, 241, 232, 0.10) 1px, transparent 1px)",
      },
      backgroundSize: {
        halftone: "8px 8px",
        "halftone-lg": "16px 16px",
      },
      keyframes: {
        "speed-line": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        "panel-pop": {
          "0%": { transform: "scale(0.95) rotate(-1deg)", opacity: "0" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "ink-drip": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "100%": { transform: "scaleY(1)", transformOrigin: "top" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "speed-line": "speed-line 1s ease-in-out infinite",
        "panel-pop": "panel-pop 0.3s ease-out forwards",
        "ink-drip": "ink-drip 0.4s ease-out forwards",
        marquee: "marquee 40s linear infinite",
        "fade-up": "fade-up 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
