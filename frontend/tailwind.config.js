/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vision: {
          bg: "#05070B",
          surface: "#080D16",
          card: "#0C1421",
          elevated: "#101D2E",
          border: "#1A2B40",
          accent: "#1769D2",
          electric: "#268BFF",
          light: "#80BCFF",
          text: "#F5F8FC",
          secondary: "#98A9BD",
          muted: "#64758A",
          success: "#25C98A",
          warning: "#F0B44C",
          error: "#F06464",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shine': 'shine 4s linear infinite',
      },
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        }
      }
    },
  },
  plugins: [],
}

