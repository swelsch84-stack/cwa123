import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm ink-on-paper palette — deliberately not the default zinc/slate.
        paper: "#f6f3ec",
        "paper-raised": "#fffdf7",
        ink: "#1c1a17",
        "ink-soft": "#4b463e",
        "ink-faint": "#8c857a",
        line: "#e3ddd1",
        "line-strong": "#d3cbbb",
        // Single sharp accent: a confident terracotta/signal-coral.
        accent: "#d6492f",
        "accent-soft": "#f0d8cf",
        "accent-ink": "#8f2c19",
        // Score semantics
        good: "#3f7d54",
        "good-soft": "#dcebdf",
        warn: "#b07b1e",
        "warn-soft": "#f3e7cc",
        bad: "#b23b2e",
        "bad-soft": "#f1d9d4",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-hanken)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,26,23,0.04), 0 8px 24px -12px rgba(28,26,23,0.18)",
        lift: "0 2px 4px rgba(28,26,23,0.06), 0 18px 40px -18px rgba(28,26,23,0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
