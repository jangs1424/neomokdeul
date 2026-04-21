import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
        "hand-kr": ["var(--font-hand-kr)"],
        "hand-en": ["var(--font-hand-en)"],
      },
      colors: {
        cream: "var(--cream)",
        "cream-2": "var(--cream-2)",
        "cream-deep": "var(--cream-deep)",
        forest: "var(--forest)",
        "forest-dark": "var(--forest-dark)",
        "forest-deep": "var(--forest-deep)",
        yellow: "var(--yellow)",
        "yellow-bright": "var(--yellow-bright)",
        coral: "var(--coral)",
        ink: "var(--ink)",
        sub: "var(--sub)",
        line: "var(--line)",
      },
    },
  },
  plugins: [],
};

export default config;
