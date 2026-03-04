/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#CD2FE2",
          foreground: "#FFFFFF",
          light: "#D95DEA",
        },
        background: {
          DEFAULT: "#F2EDE7",
          dark: "#161A1F",
        },
        foreground: {
          DEFAULT: "#272D36",
          dark: "#E6E8EB",
        },
        card: {
          DEFAULT: "#FDFCFB",
          dark: "#1C2028",
        },
        border: {
          DEFAULT: "#E3E5E9",
          dark: "#2F3540",
        },
        muted: {
          DEFAULT: "#EEEFF1",
          foreground: "#64697A",
          "foreground-dark": "#9CA3B4",
          dark: "#282D35",
        },
        destructive: {
          DEFAULT: "#E02424",
          foreground: "#FAFAFA",
        },
        urgent: {
          DEFAULT: "#E02424",
          foreground: "#FAFAFA",
        },
        "brand-accent": {
          DEFAULT: "#E87422",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#2E9058",
          foreground: "#1A5434",
        },
        warning: {
          DEFAULT: "#F0A30A",
          foreground: "#5C4107",
        },
        info: {
          DEFAULT: "#1670B8",
          foreground: "#0E4573",
        },
        sage: {
          DEFAULT: "#4D8A6E",
          foreground: "#F5FAF8",
        },
        secondary: {
          DEFAULT: "#EEEFF1",
          foreground: "#2C3038",
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#2c2c2c",
          900: "#1c1c1c",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
