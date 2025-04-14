import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#f1512a",
        "primary-50": "#fff0ed",
        "primary-100": "#ffe1da",
        "primary-200": "#ffc2b5",
        "primary-300": "#ff9a84",
        "primary-400": "#ff6e4e",
        "primary-500": "#f1512a",
        "primary-600": "#e53817",
        "primary-700": "#bf2812",
        "primary-800": "#9c2314",
        "primary-900": "#7e2318",
      },
    },
  },
  plugins: [],
} satisfies Config;
