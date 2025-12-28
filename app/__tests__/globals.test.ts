/**
 * Tests for Industrial Design System CSS Variables
 * Feature: 010-industrial-design-system
 * Task: 1.1 - Set Up CSS Custom Properties for Color System
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Industrial Design System - CSS Custom Properties', () => {
  let globalsCss: string;

  beforeAll(() => {
    // Read the globals.css file
    const cssPath = join(process.cwd(), 'app', 'globals.css');
    globalsCss = readFileSync(cssPath, 'utf-8');
  });

  describe('Color Palette Variables', () => {
    describe('Industrial Orange Palette', () => {
      it('should define all orange palette shades', () => {
        expect(globalsCss).toContain('--industrial-orange-100: #FFF4E6');
        expect(globalsCss).toContain('--industrial-orange-200: #FFD699');
        expect(globalsCss).toContain('--industrial-orange-300: #FF9F1C');
        expect(globalsCss).toContain('--industrial-orange-400: #E07B00');
        expect(globalsCss).toContain('--industrial-orange-500: #B85C00');
        expect(globalsCss).toContain('--industrial-orange-600: #8A4400');
      });
    });

    describe('Industrial Graphite Palette', () => {
      it('should define all graphite palette shades', () => {
        expect(globalsCss).toContain('--industrial-graphite-100: #F5F5F5');
        expect(globalsCss).toContain('--industrial-graphite-200: #D4D4D4');
        expect(globalsCss).toContain('--industrial-graphite-300: #9A9A9A');
        expect(globalsCss).toContain('--industrial-graphite-400: #5C5C5C');
        expect(globalsCss).toContain('--industrial-graphite-500: #333333');
        expect(globalsCss).toContain('--industrial-graphite-600: #1A1A1A');
      });
    });

    describe('Industrial Navy Palette', () => {
      it('should define all navy palette shades', () => {
        expect(globalsCss).toContain('--industrial-navy-100: #E8EDF2');
        expect(globalsCss).toContain('--industrial-navy-200: #B8C9D9');
        expect(globalsCss).toContain('--industrial-navy-300: #4A6B8A');
        expect(globalsCss).toContain('--industrial-navy-400: #2D4A63');
        expect(globalsCss).toContain('--industrial-navy-500: #1B3A4F');
        expect(globalsCss).toContain('--industrial-navy-600: #0F2535');
      });
    });

    describe('Background Colors', () => {
      it('should define background color variables', () => {
        expect(globalsCss).toContain('--industrial-bg-primary: #FAF7F2');
        expect(globalsCss).toContain('--industrial-bg-card: #FFFFFF');
        expect(globalsCss).toContain('--industrial-bg-dark: #1A1A1A');
      });
    });
  });

  describe('Spacing Scale Variables', () => {
    it('should define consistent spacing scale', () => {
      expect(globalsCss).toContain('--industrial-space-xs: 4px');
      expect(globalsCss).toContain('--industrial-space-sm: 8px');
      expect(globalsCss).toContain('--industrial-space-md: 12px');
      expect(globalsCss).toContain('--industrial-space-base: 16px');
      expect(globalsCss).toContain('--industrial-space-lg: 24px');
      expect(globalsCss).toContain('--industrial-space-xl: 32px');
      expect(globalsCss).toContain('--industrial-space-2xl: 48px');
      expect(globalsCss).toContain('--industrial-space-3xl: 64px');
      expect(globalsCss).toContain('--industrial-space-4xl: 96px');
    });
  });

  describe('Border Radius Variables', () => {
    it('should define sharp border radius values', () => {
      expect(globalsCss).toContain('--industrial-radius-sharp: 2px');
      expect(globalsCss).toContain('--industrial-radius-base: 3px');
    });
  });

  describe('Border Width Variables', () => {
    it('should define border width values', () => {
      expect(globalsCss).toContain('--industrial-border-thin: 1px');
      expect(globalsCss).toContain('--industrial-border-base: 2px');
      expect(globalsCss).toContain('--industrial-border-thick: 3px');
      expect(globalsCss).toContain('--industrial-border-category: 4px');
    });
  });

  describe('Typography Variables', () => {
    it('should define font family variables', () => {
      expect(globalsCss).toContain("--industrial-font-display: 'Bebas Neue'");
      expect(globalsCss).toContain("--industrial-font-body: 'Barlow'");
      expect(globalsCss).toContain("--industrial-font-barcode: 'Libre Barcode 39 Text'");
    });
  });

  describe('Transition Variables', () => {
    it('should define transition timing', () => {
      expect(globalsCss).toContain('--industrial-transition-fast: 0.2s ease');
    });
  });

  describe('Variable Naming Convention', () => {
    it('should prefix all industrial variables with --industrial-', () => {
      const industrialVarPattern = /--industrial-[\w-]+:/g;
      const matches = globalsCss.match(industrialVarPattern);

      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(35); // We defined 35+ variables
    });

    it('should not conflict with existing Shadcn variables', () => {
      // Verify existing Shadcn variables still exist
      expect(globalsCss).toContain('--background:');
      expect(globalsCss).toContain('--foreground:');
      expect(globalsCss).toContain('--primary:');
      expect(globalsCss).toContain('--secondary:');
    });
  });

  describe('Documentation', () => {
    it('should include header comment with design philosophy', () => {
      expect(globalsCss).toContain('INDUSTRIAL DESIGN SYSTEM');
      expect(globalsCss).toContain('Feature: 010-industrial-design-system');
      expect(globalsCss).toContain('Industrial Brutalist');
    });

    it('should include inline comments for key colors', () => {
      expect(globalsCss).toContain('/* Primary accent */');
      expect(globalsCss).toContain('/* Primary text */');
      expect(globalsCss).toContain('/* Category accent */');
    });
  });
});
