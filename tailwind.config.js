/** @type {import('tailwindcss').Config} */
module.exports = {
  // Single dark theme — no class/attribute switching.
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        // Apple palette — every value is a CSS custom property defined in
        // src/index.css under :root (light) and [data-theme="dark"] (dark).
        apple: {
          blue: 'var(--color-primary)',
          blueSolid: 'var(--color-primary-solid)',
          blueDark: 'var(--color-primary-hover)',
          blueAlt: 'var(--color-primary-on-dark)',
          blueSoft: 'var(--color-primary-soft)',
          blueMist: 'var(--color-primary-mist)',
          gray: 'var(--color-bg)',
          grayHover: 'var(--color-surface-hover)',
          ink: 'var(--color-text)',
          inkSoft: 'var(--color-text-soft)',
          sub: 'var(--color-text-sub)',
          hairline: 'var(--color-border)',
          borderSoft: 'var(--color-border-soft)',
          surface: 'var(--color-surface)',
          glass: 'var(--color-glass)',
          glassStrong: 'var(--color-glass-strong)',
          glassLine: 'var(--color-glass-line)',
          invert: 'var(--color-invert)',
          trafficRed: 'var(--color-traffic-red)',
          trafficYellow: 'var(--color-traffic-yellow)',
          trafficGreen: 'var(--color-traffic-green)',
        },
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 4px 24px -8px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 12px 40px -12px rgba(0, 0, 0, 0.16)",
        cta: "0 8px 24px -8px rgba(0, 113, 227, 0.45)",
        sticky: "0 -8px 30px rgb(0 0 0 / 0.08)",
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
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
