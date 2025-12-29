/**
 * Industrial Design System - Typography
 * Feature: 010-industrial-design-system
 *
 * This module exports TypeScript constants for typography specifications.
 * Use these for programmatic access to font configurations.
 *
 * For CSS usage, prefer:
 * - Tailwind utilities: font-display, font-body, font-barcode
 * - CSS custom properties: var(--font-bebas-neue), var(--font-barlow), var(--font-libre-barcode)
 *
 * @see docs/features/active/ui-update.md for complete design specifications
 */

// =============================================================================
// FONT FAMILIES
// =============================================================================

export const FONT_FAMILIES = {
  /**
   * Bebas Neue - Display/Headlines
   * - Always use UPPERCASE
   * - Letter-spacing: 0.02em
   * - Line-height: 0.85-1.0
   */
  display: "'Bebas Neue', sans-serif",

  /**
   * Barlow - Body text
   * - Available weights: 400, 500, 600, 700
   * - Line-height: 1.6 for body text
   */
  body: "'Barlow', sans-serif",

  /**
   * Libre Barcode 39 Text - Decorative elements
   * - Use sparingly for industrial aesthetic
   * - Decorative barcodes on cards and sections
   */
  barcode: "'Libre Barcode 39 Text', cursive",
} as const;

// =============================================================================
// CSS VARIABLE NAMES
// =============================================================================

export const FONT_CSS_VARS = {
  display: 'var(--font-bebas-neue)',
  body: 'var(--font-barlow)',
  barcode: 'var(--font-libre-barcode)',
} as const;

// =============================================================================
// HEADLINE STYLES
// Use Bebas Neue - always uppercase, tight line-height
// =============================================================================

export const HEADLINE_STYLES = {
  /**
   * Extra large headlines - Hero sections
   * font-size: clamp(3.5rem, 10vw, 7rem)
   */
  xl: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 'clamp(3.5rem, 10vw, 7rem)',
    letterSpacing: '0.02em',
    lineHeight: 0.85,
    textTransform: 'uppercase' as const,
  },

  /**
   * Large headlines - Section titles
   * font-size: clamp(2rem, 5vw, 2.5rem)
   */
  lg: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: 'clamp(2rem, 5vw, 2.5rem)',
    letterSpacing: '0.02em',
    lineHeight: 0.95,
    textTransform: 'uppercase' as const,
  },

  /**
   * Medium headlines - Card titles, subsections
   * font-size: 1.5rem (24px)
   */
  md: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: '1.5rem',
    letterSpacing: '0.02em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
  },

  /**
   * Small headlines - Component headers
   * font-size: 1.25rem (20px)
   */
  sm: {
    fontFamily: FONT_FAMILIES.display,
    fontSize: '1.25rem',
    letterSpacing: '0.02em',
    lineHeight: 1,
    textTransform: 'uppercase' as const,
  },
} as const;

// =============================================================================
// BODY TEXT STYLES
// Use Barlow - normal case, relaxed line-height
// =============================================================================

export const BODY_STYLES = {
  /**
   * Large body text - Lead paragraphs
   * font-size: 1.125rem (18px)
   */
  lg: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: '1.125rem',
    lineHeight: 1.6,
    fontWeight: 400,
  },

  /**
   * Base body text - Default paragraphs
   * font-size: 1rem (16px)
   */
  base: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: '1rem',
    lineHeight: 1.6,
    fontWeight: 400,
  },

  /**
   * Small body text - Captions, metadata
   * font-size: 0.875rem (14px)
   */
  sm: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontWeight: 400,
  },
} as const;

// =============================================================================
// LABEL STYLES
// Use Barlow - uppercase, wide letter-spacing
// =============================================================================

export const LABEL_STYLES = {
  /**
   * Standard label - Form labels, section labels
   */
  base: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
  },

  /**
   * Navigation label - Nav links
   */
  nav: {
    fontFamily: FONT_FAMILIES.body,
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
} as const;

// =============================================================================
// BARCODE STYLE
// Decorative element
// =============================================================================

export const BARCODE_STYLE = {
  fontFamily: FONT_FAMILIES.barcode,
  fontSize: '1.5rem',
} as const;

// =============================================================================
// FONT WEIGHTS
// Available weights for Barlow
// =============================================================================

export const FONT_WEIGHTS = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type HeadlineSize = keyof typeof HEADLINE_STYLES;
export type BodySize = keyof typeof BODY_STYLES;
export type FontWeight = keyof typeof FONT_WEIGHTS;
