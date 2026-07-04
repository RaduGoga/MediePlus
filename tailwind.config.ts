import type { Config } from "tailwindcss";

// Identitatea vizuală MediePlus+ — păstrată identic (Secțiunea 10 din spec).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mint: "#6EE7C8",
        "mint-soft": "#A7F3D6",
        navy: "#0F172A",
        "navy-soft": "#1E293B",
        "soft-white": "#F8FAFC",
        slate: {
          DEFAULT: "#64748B",
          light: "#94A3B8",
        },
      },
      fontFamily: {
        // Monty Bold pentru titluri, Inter pentru corp (fallback elegant).
        display: ["var(--font-display)", "Montserrat", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04)",
        glow: "0 0 18px rgba(110,231,200,0.3)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
