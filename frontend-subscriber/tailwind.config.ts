import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00D4AA",
          dark: "#00B894",
        },
        secondary: "#6C5CE7",
        background: "#F8F9FA",
        surface: "#FFFFFF",
        "text-primary": "#2D3436",
        "text-secondary": "#636E72",
        "text-muted": "#B2BEC3",
        success: "#00B894",
        warning: "#FDCB6E",
        danger: "#E17055",
        info: "#0984E3",
        border: "#DFE6E9",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
