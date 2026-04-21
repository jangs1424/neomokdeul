import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        "cream-2": "var(--cream-2)",
        forest: "var(--forest)",
        "forest-dark": "var(--forest-dark)",
        yellow: "var(--yellow)",
        coral: "var(--coral)",
        ink: "var(--ink)",
        sub: "var(--sub)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        hand: ["var(--font-hand-kr)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
