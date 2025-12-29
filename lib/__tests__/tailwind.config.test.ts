/**
 * Tests for Tailwind CSS Configuration
 * Feature: 010-industrial-design-system
 * Task: 1.3 - Extend Tailwind Config with Industrial Design Tokens
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Tailwind CSS Configuration - Industrial Design Tokens', () => {
  let configContent: string;

  beforeAll(() => {
    const configPath = join(process.cwd(), 'tailwind.config.ts');
    configContent = readFileSync(configPath, 'utf-8');
  });

  describe('Font Family Extensions', () => {
    it('should define font-display for Bebas Neue', () => {
      expect(configContent).toContain("display: ['var(--font-bebas-neue)'");
    });

    it('should define font-body for Barlow', () => {
      expect(configContent).toContain("body: ['var(--font-barlow)'");
    });

    it('should define font-barcode for Libre Barcode', () => {
      expect(configContent).toContain("barcode: ['var(--font-libre-barcode)'");
    });

    it('should include fallback fonts', () => {
      expect(configContent).toContain("'sans-serif']");
      expect(configContent).toContain("'cursive']");
    });
  });

  describe('Industrial Color Palette', () => {
    describe('Orange Palette', () => {
      it('should define all orange shades', () => {
        expect(configContent).toContain("100: 'var(--industrial-orange-100)'");
        expect(configContent).toContain("200: 'var(--industrial-orange-200)'");
        expect(configContent).toContain("300: 'var(--industrial-orange-300)'");
        expect(configContent).toContain("400: 'var(--industrial-orange-400)'");
        expect(configContent).toContain("500: 'var(--industrial-orange-500)'");
        expect(configContent).toContain("600: 'var(--industrial-orange-600)'");
      });

      it('should set orange-400 as DEFAULT', () => {
        expect(configContent).toMatch(
          /orange:\s*{[\s\S]*?DEFAULT:\s*'var\(--industrial-orange-400\)'/
        );
      });
    });

    describe('Graphite Palette', () => {
      it('should define all graphite shades', () => {
        expect(configContent).toContain(
          "100: 'var(--industrial-graphite-100)'"
        );
        expect(configContent).toContain(
          "200: 'var(--industrial-graphite-200)'"
        );
        expect(configContent).toContain(
          "300: 'var(--industrial-graphite-300)'"
        );
        expect(configContent).toContain(
          "400: 'var(--industrial-graphite-400)'"
        );
        expect(configContent).toContain(
          "500: 'var(--industrial-graphite-500)'"
        );
        expect(configContent).toContain(
          "600: 'var(--industrial-graphite-600)'"
        );
      });

      it('should set graphite-600 as DEFAULT', () => {
        expect(configContent).toMatch(
          /graphite:\s*{[\s\S]*?DEFAULT:\s*'var\(--industrial-graphite-600\)'/
        );
      });
    });

    describe('Navy Palette', () => {
      it('should define all navy shades', () => {
        expect(configContent).toContain("100: 'var(--industrial-navy-100)'");
        expect(configContent).toContain("200: 'var(--industrial-navy-200)'");
        expect(configContent).toContain("300: 'var(--industrial-navy-300)'");
        expect(configContent).toContain("400: 'var(--industrial-navy-400)'");
        expect(configContent).toContain("500: 'var(--industrial-navy-500)'");
        expect(configContent).toContain("600: 'var(--industrial-navy-600)'");
      });

      it('should set navy-400 as DEFAULT', () => {
        expect(configContent).toMatch(
          /navy:\s*{[\s\S]*?DEFAULT:\s*'var\(--industrial-navy-400\)'/
        );
      });
    });

    describe('Background Colors', () => {
      it('should define industrial background colors', () => {
        expect(configContent).toContain(
          "primary: 'var(--industrial-bg-primary)'"
        );
        expect(configContent).toContain("card: 'var(--industrial-bg-card)'");
        expect(configContent).toContain("dark: 'var(--industrial-bg-dark)'");
      });
    });
  });

  describe('Border Radius Extensions', () => {
    it('should define industrial-sharp border radius', () => {
      expect(configContent).toContain(
        "'industrial-sharp': 'var(--industrial-radius-sharp)'"
      );
    });

    it('should define industrial-base border radius', () => {
      expect(configContent).toContain(
        "'industrial-base': 'var(--industrial-radius-base)'"
      );
    });

    it('should preserve existing Shadcn border radius values', () => {
      expect(configContent).toContain("lg: 'var(--radius)'");
      expect(configContent).toContain("md: 'calc(var(--radius) - 2px)'");
      expect(configContent).toContain("sm: 'calc(var(--radius) - 4px)'");
    });
  });

  describe('Border Width Extensions', () => {
    it('should define industrial border widths', () => {
      expect(configContent).toContain(
        "'industrial-thin': 'var(--industrial-border-thin)'"
      );
      expect(configContent).toContain(
        "'industrial-base': 'var(--industrial-border-base)'"
      );
      expect(configContent).toContain(
        "'industrial-thick': 'var(--industrial-border-thick)'"
      );
      expect(configContent).toContain(
        "'industrial-category': 'var(--industrial-border-category)'"
      );
    });
  });

  describe('Spacing Scale Extensions', () => {
    it('should define all industrial spacing values', () => {
      expect(configContent).toContain(
        "'industrial-xs': 'var(--industrial-space-xs)'"
      );
      expect(configContent).toContain(
        "'industrial-sm': 'var(--industrial-space-sm)'"
      );
      expect(configContent).toContain(
        "'industrial-md': 'var(--industrial-space-md)'"
      );
      expect(configContent).toContain(
        "'industrial-base': 'var(--industrial-space-base)'"
      );
      expect(configContent).toContain(
        "'industrial-lg': 'var(--industrial-space-lg)'"
      );
      expect(configContent).toContain(
        "'industrial-xl': 'var(--industrial-space-xl)'"
      );
      expect(configContent).toContain(
        "'industrial-2xl': 'var(--industrial-space-2xl)'"
      );
      expect(configContent).toContain(
        "'industrial-3xl': 'var(--industrial-space-3xl)'"
      );
      expect(configContent).toContain(
        "'industrial-4xl': 'var(--industrial-space-4xl)'"
      );
    });
  });

  describe('Existing Configuration Preservation', () => {
    it('should preserve Shadcn/ui color tokens', () => {
      expect(configContent).toContain("background: 'hsl(var(--background))'");
      expect(configContent).toContain("foreground: 'hsl(var(--foreground))'");
      expect(configContent).toContain('primary:');
      expect(configContent).toContain('secondary:');
      expect(configContent).toContain('muted:');
      expect(configContent).toContain('accent:');
      expect(configContent).toContain('destructive:');
    });

    it('should preserve chart colors', () => {
      expect(configContent).toContain('chart:');
    });

    it('should preserve accordion animations', () => {
      expect(configContent).toContain("'accordion-down':");
      expect(configContent).toContain("'accordion-up':");
    });

    it('should preserve tailwindcss-animate plugin', () => {
      expect(configContent).toContain("require('tailwindcss-animate')");
    });
  });

  describe('Documentation', () => {
    it('should include feature reference', () => {
      expect(configContent).toContain('010-industrial-design-system');
    });

    it('should document color coding for trade categories', () => {
      expect(configContent).toContain('Welding & Fabrication');
      expect(configContent).toContain('Electrical');
      expect(configContent).toContain('Mechanical/Maintenance');
    });

    it('should document font usage', () => {
      expect(configContent).toContain('Bebas Neue for headlines');
      expect(configContent).toContain('Barlow for body text');
      expect(configContent).toContain('Libre Barcode');
    });
  });

  describe('TypeScript Compliance', () => {
    it('should import Config type from tailwindcss', () => {
      expect(configContent).toContain(
        "import type { Config } from 'tailwindcss'"
      );
    });

    it('should export config as default', () => {
      expect(configContent).toContain('export default config');
    });
  });
});
