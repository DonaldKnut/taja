/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#10B981", // Emerald 500 (Clean, premium green)
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#ECFDF5", // Emerald 50; very light green for backgrounds
          foreground: "#065F46", // Emerald 800
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#F9FAFB", // Gray 50
          foreground: "#6B7280", // Gray 500
        },
        accent: {
          DEFAULT: "#D1FAE5", // Emerald 100
          foreground: "#065F46", // Emerald 800
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Taja.Shop premium brand colors
        taja: {
          primary: "#10B981", // Emerald 500
          secondary: "#064E3B", // Emerald 900 (Deep, premium green)
          accent: "#34D399", // Emerald 400
          light: "#F0FDF4", // Emerald 50 (Ultra light green)
          white: "#FFFFFF",
          black: "#064E3B", // Using deep green as 'black' for premium feel
          gray: {
            50: "#F9FAFB",
            100: "#F3F4F6",
            200: "#E5E7EB",
          }
        },
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(16, 185, 129, 0.1), 0 4px 6px -4px rgba(16, 185, 129, 0.05)',
        'premium-hover': '0 20px 40px -15px rgba(16, 185, 129, 0.2), 0 8px 12px -6px rgba(16, 185, 129, 0.1)',
        'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.4), 0 8px 32px 0 rgba(16, 185, 129, 0.1)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite linear",
      },
      backgroundImage: {
        "gradient-taja": "linear-gradient(135deg, #10B981 0%, #064E3B 100%)",
        "gradient-taja-light": "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};




