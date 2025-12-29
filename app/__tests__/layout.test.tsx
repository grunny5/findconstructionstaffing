/**
 * Tests for Root Layout and Font Configuration
 * Feature: 010-industrial-design-system
 * Task: 1.2 - Configure Google Fonts with Next.js Font Optimization
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Root Layout - Font Configuration', () => {
  let layoutContent: string;

  beforeAll(() => {
    const layoutPath = join(process.cwd(), 'app', 'layout.tsx');
    layoutContent = readFileSync(layoutPath, 'utf-8');
  });

  describe('Font Imports', () => {
    it('should import all required fonts from next/font/google', () => {
      expect(layoutContent).toContain('Bebas_Neue');
      expect(layoutContent).toContain('Barlow');
      expect(layoutContent).toContain('Libre_Barcode_39_Text');
    });

    it('should maintain Inter font for backward compatibility', () => {
      expect(layoutContent).toContain('Inter');
    });
  });

  describe('Bebas Neue Configuration', () => {
    it('should configure Bebas Neue with weight 400', () => {
      expect(layoutContent).toMatch(
        /Bebas_Neue\(\{[\s\S]*?weight:\s*['"]400['"]/
      );
    });

    it('should configure Bebas Neue with display swap', () => {
      expect(layoutContent).toMatch(
        /Bebas_Neue\(\{[\s\S]*?display:\s*['"]swap['"]/
      );
    });

    it('should configure Bebas Neue with latin subset', () => {
      expect(layoutContent).toMatch(
        /Bebas_Neue\(\{[\s\S]*?subsets:\s*\[['"]latin['"]\]/
      );
    });

    it('should create CSS variable --font-bebas-neue', () => {
      expect(layoutContent).toMatch(
        /Bebas_Neue\(\{[\s\S]*?variable:\s*['"]--font-bebas-neue['"]/
      );
    });
  });

  describe('Barlow Configuration', () => {
    it('should configure Barlow with multiple weights', () => {
      expect(layoutContent).toMatch(
        /Barlow\(\{[\s\S]*?weight:\s*\[['"]400['"],\s*['"]500['"],\s*['"]600['"],\s*['"]700['"]\]/
      );
    });

    it('should configure Barlow with display swap', () => {
      expect(layoutContent).toMatch(
        /Barlow\(\{[\s\S]*?display:\s*['"]swap['"]/
      );
    });

    it('should configure Barlow with latin subset', () => {
      expect(layoutContent).toMatch(
        /Barlow\(\{[\s\S]*?subsets:\s*\[['"]latin['"]\]/
      );
    });

    it('should create CSS variable --font-barlow', () => {
      expect(layoutContent).toMatch(
        /Barlow\(\{[\s\S]*?variable:\s*['"]--font-barlow['"]/
      );
    });
  });

  describe('Libre Barcode 39 Text Configuration', () => {
    it('should configure Libre Barcode with weight 400', () => {
      expect(layoutContent).toMatch(
        /Libre_Barcode_39_Text\(\{[\s\S]*?weight:\s*['"]400['"]/
      );
    });

    it('should configure Libre Barcode with display swap', () => {
      expect(layoutContent).toMatch(
        /Libre_Barcode_39_Text\(\{[\s\S]*?display:\s*['"]swap['"]/
      );
    });

    it('should configure Libre Barcode with latin subset', () => {
      expect(layoutContent).toMatch(
        /Libre_Barcode_39_Text\(\{[\s\S]*?subsets:\s*\[['"]latin['"]\]/
      );
    });

    it('should create CSS variable --font-libre-barcode', () => {
      expect(layoutContent).toMatch(
        /Libre_Barcode_39_Text\(\{[\s\S]*?variable:\s*['"]--font-libre-barcode['"]/
      );
    });
  });

  describe('Body Element Configuration', () => {
    it('should apply all font CSS variables to body', () => {
      expect(layoutContent).toContain('bebasNeue.variable');
      expect(layoutContent).toContain('barlow.variable');
      expect(layoutContent).toContain('libreBarcode.variable');
    });

    it('should maintain Inter className on body', () => {
      expect(layoutContent).toContain('inter.className');
    });
  });

  describe('Documentation', () => {
    it('should include feature reference in comments', () => {
      expect(layoutContent).toContain('010-industrial-design-system');
    });

    it('should include task reference in comments', () => {
      expect(layoutContent).toContain('Task: 1.2');
    });

    it('should document FOUT prevention strategy', () => {
      expect(layoutContent).toContain('FOUT');
    });
  });
});
