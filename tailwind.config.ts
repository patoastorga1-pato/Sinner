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
        sinner: {
          black: "#070609",
          coal: "#111014",
          panel: "#17141b",
          gold: "#d6aa58",
          goldSoft: "#e4c47d",
          violet: "#8a3fa5",
          plum: "#2a1038",
          purple: "#541b70",
          mist: "#a7a1aa",
          ivory: "#f4f0e8",
        },
      },
      boxShadow: {
        glow: "0 28px 80px rgba(84, 27, 112, 0.16)",
        gold: "0 20px 50px rgba(214, 170, 88, 0.12)",
        card: "0 18px 48px rgba(0, 0, 0, 0.3)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
