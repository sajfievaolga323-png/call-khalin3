import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ocean: { bg: "#0a1628", panel: "#1e3a5f", aqua: "#00d4ff", coral: "#ff6b6b" } },
    },
  },
  plugins: [],
};
export default config;
