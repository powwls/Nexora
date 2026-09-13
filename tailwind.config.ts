import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
      },
      colors: {
        ink: "#101820",
        canvas: "#f5f7f5",
        signal: "#d8ff64",
        cyan: "#8ee8e0",
      },
    },
  },
  plugins: [],
};

export default config;
