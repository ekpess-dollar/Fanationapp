import type { Config } from "tailwindcss";

/**
 * The landing route keeps its colour list separate from the product design system.
 * Tailwind Preflight is disabled because the existing client CSS already owns the
 * document reset; only the landing route uses the generated utility classes.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        brand: "#2599F6",
        "brand-d": "#1A80D8",
        "brand-l": "#60B8FA",
        navy: "#07091A",
        surface: "#0C1121",
        card: "#111830",
        card2: "#18223C",
        surface2: "#111827",
        muted: "#7A8FB8",
        gold: "#F5A623",
        green: "#22C55E",
      },
      fontFamily: {
        sans: ["Inter Variable", "Inter", "Inter Fallback", "system-ui", "sans-serif"],
      },
    },
  },
};

export default config;
