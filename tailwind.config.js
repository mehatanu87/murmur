/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0B0B0C",
        bone: "#FFFFFF",
        acid: { DEFAULT: "#F5E400", dim: "#D9CB00" },
        magenta: { DEFAULT: "#FF3EA5", dim: "#D4348A" },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        brutal: "6px 6px 0 #0B0B0C",
        "brutal-sm": "3px 3px 0 #0B0B0C",
      },
    },
  },
  plugins: [],
};
