import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.25rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        // Extra-small phones (iPhone SE and friends)
        xs: "380px",
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-display)",
          "var(--font-body)",
          "ui-sans-serif",
          "sans-serif",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          muted: "hsl(var(--surface-muted))",
          raised: "hsl(var(--surface-raised))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary-soft))",
          strong: "hsl(var(--primary-strong))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          soft: "hsl(var(--destructive-soft))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          soft: "hsl(var(--success-soft))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          soft: "hsl(var(--warning-soft))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          soft: "hsl(var(--info-soft))",
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
        veg: "hsl(var(--veg))",
        nonveg: "hsl(var(--nonveg))",
        acid: {
          DEFAULT: "hsl(var(--acid))",
          foreground: "hsl(var(--acid-foreground))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          foreground: "hsl(var(--ink-foreground))",
        },
        // Sage ladder. 600 is --primary; the rungs either side are for the
        // rare case something needs a fixed tint that must not flip in dark
        // mode (charts, print, the invoice template).
        brand: {
          50: "hsl(140 45% 97%)",
          100: "hsl(145 42% 93%)",
          200: "hsl(148 38% 85%)",
          300: "hsl(150 34% 73%)",
          400: "hsl(152 38% 58%)",
          500: "hsl(153 42% 44%)",
          600: "hsl(154 46% 34%)",
          700: "hsl(156 50% 26%)",
          800: "hsl(157 48% 21%)",
          900: "hsl(150 40% 16%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      fontSize: {
        // Mobile-tuned type scale. 16px minimum on inputs avoids iOS zoom-on-focus.
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        xs: ["0.75rem", { lineHeight: "1.05rem" }],
        sm: ["0.8125rem", { lineHeight: "1.15rem" }],
        base: ["0.9375rem", { lineHeight: "1.4rem" }],
        lg: ["1.0625rem", { lineHeight: "1.55rem" }],
        xl: ["1.1875rem", { lineHeight: "1.65rem" }],
        "2xl": ["1.4375rem", { lineHeight: "1.85rem" }],
        "3xl": ["1.75rem", { lineHeight: "2.1rem" }],
        "4xl": ["2.125rem", { lineHeight: "2.4rem" }],
      },
      spacing: {
        // Safe-area aware spacing for notched devices
        "safe-t": "env(safe-area-inset-top)",
        "safe-b": "env(safe-area-inset-bottom)",
        "safe-l": "env(safe-area-inset-left)",
        "safe-r": "env(safe-area-inset-right)",
        // Fixed chrome heights, referenced by scroll padding
        appbar: "3.75rem",
        tabbar: "4.25rem",

        /*
         * Layout tokens for the discovery surfaces.
         *
         * Kept here rather than scattered through components so a card is the
         * same width in every rail it appears in. A dish card that is 176px
         * in one section and 208px in another is the kind of inconsistency
         * that reads as sloppiness without anyone being able to name it.
         */
        // One full card plus most of the next on a 390px screen.
        "card-dish": "14.0625rem", // 225px
        "card-canteen": "21.875rem", // 350px
        "card-craving": "6.5rem", // 104px
        "rail-gap": "0.875rem", // 14px
        field: "3.125rem", // 50px — search and its filter button
      },
      minHeight: {
        touch: "44px",
        screen: "100dvh",
      },
      minWidth: {
        touch: "44px",
      },
      height: {
        screen: "100dvh",
      },
      boxShadow: {
        xs: "0 1px 2px 0 hsl(var(--shadow-color) / 0.06)",
        soft: "0 1px 3px 0 hsl(var(--shadow-color) / 0.08), 0 1px 2px -1px hsl(var(--shadow-color) / 0.06)",
        card: "0 2px 8px -2px hsl(var(--shadow-color) / 0.10), 0 1px 3px -1px hsl(var(--shadow-color) / 0.06)",
        lift: "0 12px 28px -12px hsl(var(--shadow-color) / 0.22), 0 4px 10px -6px hsl(var(--shadow-color) / 0.12)",
        sheet: "0 -8px 32px -8px hsl(var(--shadow-color) / 0.22)",
        brand: "0 8px 20px -8px hsl(var(--primary) / 0.55)",
        none: "none",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-strong)) 100%)",
        "surface-fade":
          "linear-gradient(180deg, hsl(var(--surface-muted)) 0%, hsl(var(--background)) 40%)",
        shimmer:
          "linear-gradient(90deg, transparent 0%, hsl(var(--foreground) / 0.06) 50%, transparent 100%)",
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "sheet-down": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.35)", opacity: "0" },
          "100%": { transform: "scale(1.35)", opacity: "0" },
        },
        // Duplicated track scrolls exactly half its width, so the loop is
        // seamless without a JS ticker.
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "blur-in": {
          from: { opacity: "0", filter: "blur(12px)", transform: "translateY(14px)" },
          to: { opacity: "1", filter: "blur(0)", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-up": "fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-up": "sheet-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-down": "sheet-down 0.2s ease-in",
        "scale-in": "scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.6s infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        marquee: "marquee 40s linear infinite",
        "marquee-fast": "marquee 22s linear infinite",
        "rise-in": "rise-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "blur-in": "blur-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
