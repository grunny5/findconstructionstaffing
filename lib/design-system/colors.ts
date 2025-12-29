/**
 * Industrial Design System - Color Palette
 * Feature: 010-industrial-design-system
 *
 * This module exports TypeScript constants for the industrial color palette.
 * Use these constants for programmatic color access in components.
 *
 * For CSS usage, prefer the CSS custom properties (--industrial-*) or
 * Tailwind utilities (bg-industrial-orange-400, text-industrial-graphite-600, etc.)
 *
 * @see docs/features/active/ui-update.md for complete design specifications
 */

// =============================================================================
// ORANGE PALETTE
// Primary accent color for CTAs, welding/fabrication category indicators
// =============================================================================

export const INDUSTRIAL_ORANGE = {
  100: '#FFF4E6',
  200: '#FFD699',
  300: '#FF9F1C',
  400: '#E07B00', // Primary accent - use for CTAs and primary actions
  500: '#B85C00', // Hover states
  600: '#8A4400',
} as const;

/** Default orange shade for primary accents */
export const ORANGE_PRIMARY = INDUSTRIAL_ORANGE[400];
/** Orange shade for hover states */
export const ORANGE_HOVER = INDUSTRIAL_ORANGE[500];

// =============================================================================
// GRAPHITE PALETTE
// Primary neutral for text, borders, mechanical/maintenance category
// =============================================================================

export const INDUSTRIAL_GRAPHITE = {
  100: '#F5F5F5',
  200: '#D4D4D4',
  300: '#9A9A9A',
  400: '#5C5C5C',
  500: '#333333',
  600: '#1A1A1A', // Primary text color
} as const;

/** Default graphite shade for primary text */
export const GRAPHITE_TEXT = INDUSTRIAL_GRAPHITE[600];
/** Graphite shade for secondary/muted text */
export const GRAPHITE_MUTED = INDUSTRIAL_GRAPHITE[400];
/** Graphite shade for borders */
export const GRAPHITE_BORDER = INDUSTRIAL_GRAPHITE[200];

// =============================================================================
// NAVY PALETTE
// Secondary accent for electrical category indicators
// =============================================================================

export const INDUSTRIAL_NAVY = {
  100: '#E8EDF2',
  200: '#B8C9D9',
  300: '#4A6B8A',
  400: '#2D4A63', // Category accent - electrical trades
  500: '#1B3A4F',
  600: '#0F2535',
} as const;

/** Default navy shade for electrical category */
export const NAVY_ACCENT = INDUSTRIAL_NAVY[400];

// =============================================================================
// BACKGROUND COLORS
// =============================================================================

export const INDUSTRIAL_BACKGROUNDS = {
  /** Warm cream - main page background (NOT pure white) */
  primary: '#FAF7F2',
  /** White - cards only */
  card: '#FFFFFF',
  /** Dark graphite - footer, inverse sections */
  dark: '#1A1A1A',
} as const;

// =============================================================================
// CATEGORY COLOR CODING
// Apply as 4px left border on listing cards to indicate trade category
// =============================================================================

export const CATEGORY_COLORS = {
  /** Welding & Fabrication */
  welding: INDUSTRIAL_ORANGE[400],
  /** Electrical trades */
  electrical: INDUSTRIAL_NAVY[400],
  /** Mechanical/Maintenance */
  mechanical: INDUSTRIAL_GRAPHITE[400],
} as const;

// =============================================================================
// CSS VARIABLE NAMES
// Use these to reference the CSS custom properties
// =============================================================================

export const CSS_VARS = {
  // Orange
  'orange-100': 'var(--industrial-orange-100)',
  'orange-200': 'var(--industrial-orange-200)',
  'orange-300': 'var(--industrial-orange-300)',
  'orange-400': 'var(--industrial-orange-400)',
  'orange-500': 'var(--industrial-orange-500)',
  'orange-600': 'var(--industrial-orange-600)',
  // Graphite
  'graphite-100': 'var(--industrial-graphite-100)',
  'graphite-200': 'var(--industrial-graphite-200)',
  'graphite-300': 'var(--industrial-graphite-300)',
  'graphite-400': 'var(--industrial-graphite-400)',
  'graphite-500': 'var(--industrial-graphite-500)',
  'graphite-600': 'var(--industrial-graphite-600)',
  // Navy
  'navy-100': 'var(--industrial-navy-100)',
  'navy-200': 'var(--industrial-navy-200)',
  'navy-300': 'var(--industrial-navy-300)',
  'navy-400': 'var(--industrial-navy-400)',
  'navy-500': 'var(--industrial-navy-500)',
  'navy-600': 'var(--industrial-navy-600)',
  // Backgrounds
  'bg-primary': 'var(--industrial-bg-primary)',
  'bg-card': 'var(--industrial-bg-card)',
  'bg-dark': 'var(--industrial-bg-dark)',
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type OrangeShade = keyof typeof INDUSTRIAL_ORANGE;
export type GraphiteShade = keyof typeof INDUSTRIAL_GRAPHITE;
export type NavyShade = keyof typeof INDUSTRIAL_NAVY;
export type CategoryType = keyof typeof CATEGORY_COLORS;
