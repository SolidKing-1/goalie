// tailwind.config.ts
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
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        surface:    "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        "surface-3": "var(--color-surface-3)",
        border:     "var(--color-border)",
        ink:        "var(--color-ink)",
        muted:      "var(--color-ink-muted)",
        accent:     "var(--color-accent)",
        "accent-dim": "var(--color-accent-dim)",
        danger:     "var(--color-danger)",
        warning:    "var(--color-warning)",
        success:    "var(--color-success)",
        info:       "var(--color-info)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
