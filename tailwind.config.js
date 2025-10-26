/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
        display: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // --- SUAS CORES PHOENIX (INTEGRADAS COM CSS) ---
        phoenix: {
          DEFAULT: 'hsl(var(--phoenix-500))',
          50: 'hsl(var(--phoenix-50))',
          100: 'hsl(var(--phoenix-100))',
          200: 'hsl(var(--phoenix-200))',
          300: 'hsl(var(--phoenix-300))',
          400: 'hsl(var(--phoenix-400))',
          500: 'hsl(var(--phoenix-500))',
          600: 'hsl(var(--phoenix-600))',
          700: 'hsl(var(--phoenix-700))',
          800: 'hsl(var(--phoenix-800))',
          900: 'hsl(var(--phoenix-900))',
          // Mantive as antigas para compatibilidade, mas agora elas apontam para as novas
          amber: 'hsl(var(--phoenix-500))',
          gold: 'hsl(var(--phoenix-600))',
          light: 'hsl(var(--phoenix-400))',
        },
      },
      // --- SUAS CONFIGURAÇÕES FLUIDAS ---
      spacing: {
        'fluid': 'clamp(1.5rem, 4vw, 3rem)',
      },
      fontSize: {
        'fluid-h1': 'clamp(2rem, 5vw, 3.5rem)',
        'fluid-h2': 'clamp(1.5rem, 3vw, 2.5rem)',
      },
      borderRadius: {
        'fluid': 'clamp(0.75rem, 2vw, 1.5rem)',
        lg: "20px",
        md: "16px",
        sm: "12px",
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}