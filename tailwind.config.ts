import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        ink: {
          950: "#0a0908",
          900: "#12110f",
          800: "#1c1a17",
          700: "#2a2720",
          600: "#3d3a30",
          500: "#6b6555",
          400: "#a09880",
          300: "#c9c0a8",
          200: "#e2ddd2",
          100: "#f5f2ec",
          50:  "#faf9f6",
        },
        amber: {
          500: "#d4a017",
          400: "#e8b824",
          300: "#f5cc50",
        },
        crimson: {
          500: "#9b2335",
          400: "#c0392b",
        }
      },
    },
  },
  plugins: [],
};
export default config;
