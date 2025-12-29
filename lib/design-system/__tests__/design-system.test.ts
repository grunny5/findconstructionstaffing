/**
 * Tests for Industrial Design System
 * Feature: 010-industrial-design-system
 * Task: 1.4 - Create Design System Documentation
 */

import {
  // Colors
  INDUSTRIAL_ORANGE,
  INDUSTRIAL_GRAPHITE,
  INDUSTRIAL_NAVY,
  INDUSTRIAL_BACKGROUNDS,
  CATEGORY_COLORS,
  CSS_VARS,
  ORANGE_PRIMARY,
  ORANGE_HOVER,
  GRAPHITE_TEXT,
  NAVY_ACCENT,
  // Typography
  FONT_FAMILIES,
  FONT_CSS_VARS,
  HEADLINE_STYLES,
  BODY_STYLES,
  LABEL_STYLES,
  BARCODE_STYLE,
  FONT_WEIGHTS,
} from '../index';

describe('Industrial Design System', () => {
  describe('Color Palette - Orange', () => {
    it('should export all orange shades', () => {
      expect(INDUSTRIAL_ORANGE[100]).toBe('#FFF4E6');
      expect(INDUSTRIAL_ORANGE[200]).toBe('#FFD699');
      expect(INDUSTRIAL_ORANGE[300]).toBe('#FF9F1C');
      expect(INDUSTRIAL_ORANGE[400]).toBe('#E07B00');
      expect(INDUSTRIAL_ORANGE[500]).toBe('#B85C00');
      expect(INDUSTRIAL_ORANGE[600]).toBe('#8A4400');
    });

    it('should export primary orange constant', () => {
      expect(ORANGE_PRIMARY).toBe('#E07B00');
      expect(ORANGE_PRIMARY).toBe(INDUSTRIAL_ORANGE[400]);
    });

    it('should export hover orange constant', () => {
      expect(ORANGE_HOVER).toBe('#B85C00');
      expect(ORANGE_HOVER).toBe(INDUSTRIAL_ORANGE[500]);
    });
  });

  describe('Color Palette - Graphite', () => {
    it('should export all graphite shades', () => {
      expect(INDUSTRIAL_GRAPHITE[100]).toBe('#F5F5F5');
      expect(INDUSTRIAL_GRAPHITE[200]).toBe('#D4D4D4');
      expect(INDUSTRIAL_GRAPHITE[300]).toBe('#9A9A9A');
      expect(INDUSTRIAL_GRAPHITE[400]).toBe('#5C5C5C');
      expect(INDUSTRIAL_GRAPHITE[500]).toBe('#333333');
      expect(INDUSTRIAL_GRAPHITE[600]).toBe('#1A1A1A');
    });

    it('should export primary text constant', () => {
      expect(GRAPHITE_TEXT).toBe('#1A1A1A');
      expect(GRAPHITE_TEXT).toBe(INDUSTRIAL_GRAPHITE[600]);
    });
  });

  describe('Color Palette - Navy', () => {
    it('should export all navy shades', () => {
      expect(INDUSTRIAL_NAVY[100]).toBe('#E8EDF2');
      expect(INDUSTRIAL_NAVY[200]).toBe('#B8C9D9');
      expect(INDUSTRIAL_NAVY[300]).toBe('#4A6B8A');
      expect(INDUSTRIAL_NAVY[400]).toBe('#2D4A63');
      expect(INDUSTRIAL_NAVY[500]).toBe('#1B3A4F');
      expect(INDUSTRIAL_NAVY[600]).toBe('#0F2535');
    });

    it('should export navy accent constant', () => {
      expect(NAVY_ACCENT).toBe('#2D4A63');
      expect(NAVY_ACCENT).toBe(INDUSTRIAL_NAVY[400]);
    });
  });

  describe('Background Colors', () => {
    it('should export all background colors', () => {
      expect(INDUSTRIAL_BACKGROUNDS.primary).toBe('#FAF7F2');
      expect(INDUSTRIAL_BACKGROUNDS.card).toBe('#FFFFFF');
      expect(INDUSTRIAL_BACKGROUNDS.dark).toBe('#1A1A1A');
    });

    it('should use warm cream for primary background (not pure white)', () => {
      expect(INDUSTRIAL_BACKGROUNDS.primary).not.toBe('#FFFFFF');
      expect(INDUSTRIAL_BACKGROUNDS.primary).toBe('#FAF7F2');
    });
  });

  describe('Category Colors', () => {
    it('should map trade categories to correct colors', () => {
      expect(CATEGORY_COLORS.welding).toBe(INDUSTRIAL_ORANGE[400]);
      expect(CATEGORY_COLORS.electrical).toBe(INDUSTRIAL_NAVY[400]);
      expect(CATEGORY_COLORS.mechanical).toBe(INDUSTRIAL_GRAPHITE[400]);
    });
  });

  describe('CSS Variables', () => {
    it('should export CSS variable references for all colors', () => {
      expect(CSS_VARS['orange-400']).toBe('var(--industrial-orange-400)');
      expect(CSS_VARS['graphite-600']).toBe('var(--industrial-graphite-600)');
      expect(CSS_VARS['navy-400']).toBe('var(--industrial-navy-400)');
      expect(CSS_VARS['bg-primary']).toBe('var(--industrial-bg-primary)');
    });
  });

  describe('Font Families', () => {
    it('should export all font family definitions', () => {
      expect(FONT_FAMILIES.display).toContain('Bebas Neue');
      expect(FONT_FAMILIES.body).toContain('Barlow');
      expect(FONT_FAMILIES.barcode).toContain('Libre Barcode');
    });

    it('should include fallback fonts', () => {
      expect(FONT_FAMILIES.display).toContain('sans-serif');
      expect(FONT_FAMILIES.body).toContain('sans-serif');
      expect(FONT_FAMILIES.barcode).toContain('cursive');
    });
  });

  describe('Font CSS Variables', () => {
    it('should export CSS variable references for fonts', () => {
      expect(FONT_CSS_VARS.display).toBe('var(--font-bebas-neue)');
      expect(FONT_CSS_VARS.body).toBe('var(--font-barlow)');
      expect(FONT_CSS_VARS.barcode).toBe('var(--font-libre-barcode)');
    });
  });

  describe('Headline Styles', () => {
    it('should define all headline sizes', () => {
      expect(HEADLINE_STYLES.xl).toBeDefined();
      expect(HEADLINE_STYLES.lg).toBeDefined();
      expect(HEADLINE_STYLES.md).toBeDefined();
      expect(HEADLINE_STYLES.sm).toBeDefined();
    });

    it('should use display font for all headlines', () => {
      expect(HEADLINE_STYLES.xl.fontFamily).toBe(FONT_FAMILIES.display);
      expect(HEADLINE_STYLES.lg.fontFamily).toBe(FONT_FAMILIES.display);
      expect(HEADLINE_STYLES.md.fontFamily).toBe(FONT_FAMILIES.display);
      expect(HEADLINE_STYLES.sm.fontFamily).toBe(FONT_FAMILIES.display);
    });

    it('should set textTransform to uppercase for all headlines', () => {
      expect(HEADLINE_STYLES.xl.textTransform).toBe('uppercase');
      expect(HEADLINE_STYLES.lg.textTransform).toBe('uppercase');
      expect(HEADLINE_STYLES.md.textTransform).toBe('uppercase');
      expect(HEADLINE_STYLES.sm.textTransform).toBe('uppercase');
    });

    it('should use tight letter-spacing for headlines', () => {
      expect(HEADLINE_STYLES.xl.letterSpacing).toBe('0.02em');
      expect(HEADLINE_STYLES.lg.letterSpacing).toBe('0.02em');
    });

    it('should use tight line-height for headlines', () => {
      expect(HEADLINE_STYLES.xl.lineHeight).toBeLessThanOrEqual(1);
      expect(HEADLINE_STYLES.lg.lineHeight).toBeLessThanOrEqual(1);
    });
  });

  describe('Body Styles', () => {
    it('should define all body sizes', () => {
      expect(BODY_STYLES.lg).toBeDefined();
      expect(BODY_STYLES.base).toBeDefined();
      expect(BODY_STYLES.sm).toBeDefined();
    });

    it('should use body font for all body text', () => {
      expect(BODY_STYLES.lg.fontFamily).toBe(FONT_FAMILIES.body);
      expect(BODY_STYLES.base.fontFamily).toBe(FONT_FAMILIES.body);
      expect(BODY_STYLES.sm.fontFamily).toBe(FONT_FAMILIES.body);
    });

    it('should use relaxed line-height for body text', () => {
      expect(BODY_STYLES.base.lineHeight).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe('Label Styles', () => {
    it('should define label styles', () => {
      expect(LABEL_STYLES.base).toBeDefined();
      expect(LABEL_STYLES.nav).toBeDefined();
    });

    it('should use uppercase for labels', () => {
      expect(LABEL_STYLES.base.textTransform).toBe('uppercase');
      expect(LABEL_STYLES.nav.textTransform).toBe('uppercase');
    });

    it('should use wide letter-spacing for labels', () => {
      expect(LABEL_STYLES.base.letterSpacing).toBe('0.1em');
    });
  });

  describe('Barcode Style', () => {
    it('should use barcode font', () => {
      expect(BARCODE_STYLE.fontFamily).toBe(FONT_FAMILIES.barcode);
    });
  });

  describe('Font Weights', () => {
    it('should export all Barlow weights', () => {
      expect(FONT_WEIGHTS.regular).toBe(400);
      expect(FONT_WEIGHTS.medium).toBe(500);
      expect(FONT_WEIGHTS.semibold).toBe(600);
      expect(FONT_WEIGHTS.bold).toBe(700);
    });
  });

  describe('Type Safety', () => {
    it('should have immutable color objects', () => {
      // TypeScript ensures these are readonly, but we can verify the structure
      expect(Object.keys(INDUSTRIAL_ORANGE)).toEqual([
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
      ]);
    });

    it('should have consistent category types', () => {
      const categories = Object.keys(CATEGORY_COLORS);
      expect(categories).toContain('welding');
      expect(categories).toContain('electrical');
      expect(categories).toContain('mechanical');
    });
  });
});
