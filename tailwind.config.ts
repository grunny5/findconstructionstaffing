import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS Configuration
 *
 * Extended with Industrial Design System tokens for Feature 010.
 * All industrial design tokens are prefixed with 'industrial-' to avoid
 * conflicts with existing Shadcn/ui utilities during the gradual transition.
 *
 * @see docs/features/active/010-industrial-design-system.md
 * @see docs/features/active/ui-update.md
 */

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /**
       * Industrial Design System - Font Families
       * Maps to CSS variables defined in app/layout.tsx (Task 1.2)
       *
       * Usage:
       * - font-display: Bebas Neue for headlines (always uppercase)
       * - font-body: Barlow for body text
       * - font-barcode: Libre Barcode 39 Text for decorative elements
       */
      fontFamily: {
        display: ['var(--font-bebas-neue)', 'sans-serif'],
        body: ['var(--font-barlow)', 'sans-serif'],
        barcode: ['var(--font-libre-barcode)', 'cursive'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      /**
       * Industrial Design System - Border Radius
       * Sharp corners (2-3px max) per industrial brutalist aesthetic
       */
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Industrial design system values
        'industrial-sharp': 'var(--industrial-radius-sharp)',
        'industrial-base': 'var(--industrial-radius-base)',
      },
      /**
       * Industrial Design System - Border Width
       * Heavy borders for structural emphasis
       */
      borderWidth: {
        'industrial-thin': 'var(--industrial-border-thin)',
        'industrial-base': 'var(--industrial-border-base)',
        'industrial-thick': 'var(--industrial-border-thick)',
        'industrial-category': 'var(--industrial-border-category)',
      },
      /**
       * Industrial Design System - Spacing Scale
       * Consistent vertical rhythm: 4px base unit
       */
      spacing: {
        'industrial-xs': 'var(--industrial-space-xs)',
        'industrial-sm': 'var(--industrial-space-sm)',
        'industrial-md': 'var(--industrial-space-md)',
        'industrial-base': 'var(--industrial-space-base)',
        'industrial-lg': 'var(--industrial-space-lg)',
        'industrial-xl': 'var(--industrial-space-xl)',
        'industrial-2xl': 'var(--industrial-space-2xl)',
        'industrial-3xl': 'var(--industrial-space-3xl)',
        'industrial-4xl': 'var(--industrial-space-4xl)',
      },
      colors: {
        /**
         * Industrial Design System - Color Palette
         * Maps to CSS variables defined in app/globals.css (Task 1.1)
         *
         * Color coding for trade categories:
         * - Orange: Welding & Fabrication
         * - Navy: Electrical
         * - Graphite: Mechanical/Maintenance
         */
        industrial: {
          // Orange palette - Primary accent, welding/fabrication
          orange: {
            100: 'var(--industrial-orange-100)',
            200: 'var(--industrial-orange-200)',
            300: 'var(--industrial-orange-300)',
            400: 'var(--industrial-orange-400)',
            500: 'var(--industrial-orange-500)',
            600: 'var(--industrial-orange-600)',
            DEFAULT: 'var(--industrial-orange-400)',
          },
          // Graphite palette - Primary neutral, text, mechanical
          graphite: {
            100: 'var(--industrial-graphite-100)',
            200: 'var(--industrial-graphite-200)',
            300: 'var(--industrial-graphite-300)',
            400: 'var(--industrial-graphite-400)',
            500: 'var(--industrial-graphite-500)',
            600: 'var(--industrial-graphite-600)',
            DEFAULT: 'var(--industrial-graphite-600)',
          },
          // Navy palette - Secondary accent, electrical
          navy: {
            100: 'var(--industrial-navy-100)',
            200: 'var(--industrial-navy-200)',
            300: 'var(--industrial-navy-300)',
            400: 'var(--industrial-navy-400)',
            500: 'var(--industrial-navy-500)',
            600: 'var(--industrial-navy-600)',
            DEFAULT: 'var(--industrial-navy-400)',
          },
          // Background colors
          bg: {
            primary: 'var(--industrial-bg-primary)',
            card: 'var(--industrial-bg-card)',
            dark: 'var(--industrial-bg-dark)',
          },
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
