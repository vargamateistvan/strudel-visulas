/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "neon-green": "#00ff88",
        "neon-cyan": "#00ffff",
        "neon-magenta": "#ff00ff",
        "neon-yellow": "#ffff00",
        "neon-red": "#ff0088",
      },
      backgroundImage: {
        "gradient-neon": "linear-gradient(135deg, #00ff88, #00ffff)",
        "gradient-fire": "linear-gradient(135deg, #ff0000, #ffff00)",
      },
      boxShadow: {
        neon: "0 0 10px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)",
        "neon-lg":
          "0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 255, 0.4)",
      },
    },
  },
  plugins: [],
};
