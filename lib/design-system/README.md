# Industrial Design System

> **Feature:** 010-industrial-design-system
> **Design Philosophy:** Industrial Brutalist / Swiss Modernism

A bold, confident design system for the construction industry. Inspired by 1970s industrial equipment manuals and Swiss Brutalist design. This is NOT a typical SaaS or startup aesthetic — it's designed to resonate with operations directors, HR managers at manufacturing plants, and construction project managers who respect clarity and confidence.

## Quick Start

### Using Tailwind Utilities

```tsx
// Headlines - Use font-display (Bebas Neue)
<h1 className="font-display text-4xl uppercase tracking-wide text-industrial-graphite">
  FIND YOUR WORKFORCE
</h1>

// Body text - Use font-body (Barlow)
<p className="font-body text-base text-industrial-graphite-500">
  Connect with top construction staffing agencies.
</p>

// Primary button
<button className="bg-industrial-orange text-white px-6 py-3 rounded-industrial-sharp">
  Get Started
</button>

// Card with category border
<div className="bg-industrial-bg-card border-l-industrial-category border-industrial-orange rounded-industrial-base">
  Welding & Fabrication
</div>
```

### Using TypeScript Constants

```tsx
import { INDUSTRIAL_ORANGE, CATEGORY_COLORS } from '@/lib/design-system/colors';
import { FONT_FAMILIES, HEADLINE_STYLES } from '@/lib/design-system/typography';

// Access color values programmatically
const primaryAccent = INDUSTRIAL_ORANGE[400]; // '#E07B00'

// Get category color for trade type
const borderColor = CATEGORY_COLORS.welding; // '#E07B00'
```

---

## Color Palette

### Primary: Industrial Orange

Use for primary CTAs, accent text, and welding/fabrication category indicators.

| Shade   | Hex       | CSS Variable              | Tailwind                   | Usage              |
| ------- | --------- | ------------------------- | -------------------------- | ------------------ |
| 100     | `#FFF4E6` | `--industrial-orange-100` | `bg-industrial-orange-100` | Light backgrounds  |
| 200     | `#FFD699` | `--industrial-orange-200` | `bg-industrial-orange-200` | Subtle accents     |
| 300     | `#FF9F1C` | `--industrial-orange-300` | `bg-industrial-orange-300` | Bright accent      |
| **400** | `#E07B00` | `--industrial-orange-400` | `bg-industrial-orange`     | **Primary accent** |
| 500     | `#B85C00` | `--industrial-orange-500` | `bg-industrial-orange-500` | Hover states       |
| 600     | `#8A4400` | `--industrial-orange-600` | `bg-industrial-orange-600` | Dark accent        |

### Secondary: Graphite

The workhorse neutral. Use for text, borders, and mechanical/general trade category indicators.

| Shade   | Hex       | CSS Variable                | Tailwind                         | Usage            |
| ------- | --------- | --------------------------- | -------------------------------- | ---------------- |
| 100     | `#F5F5F5` | `--industrial-graphite-100` | `bg-industrial-graphite-100`     | Card footers     |
| 200     | `#D4D4D4` | `--industrial-graphite-200` | `border-industrial-graphite-200` | Borders          |
| 300     | `#9A9A9A` | `--industrial-graphite-300` | `text-industrial-graphite-300`   | Decorative       |
| 400     | `#5C5C5C` | `--industrial-graphite-400` | `text-industrial-graphite-400`   | Muted text       |
| 500     | `#333333` | `--industrial-graphite-500` | `text-industrial-graphite-500`   | Secondary text   |
| **600** | `#1A1A1A` | `--industrial-graphite-600` | `text-industrial-graphite`       | **Primary text** |

### Accent: Deep Navy

Use sparingly for electrical trade category indicators and secondary emphasis.

| Shade   | Hex       | CSS Variable            | Tailwind                 | Usage               |
| ------- | --------- | ----------------------- | ------------------------ | ------------------- |
| 100     | `#E8EDF2` | `--industrial-navy-100` | `bg-industrial-navy-100` | Light backgrounds   |
| 200     | `#B8C9D9` | `--industrial-navy-200` | `bg-industrial-navy-200` | Subtle accents      |
| 300     | `#4A6B8A` | `--industrial-navy-300` | `bg-industrial-navy-300` | Mid-tone            |
| **400** | `#2D4A63` | `--industrial-navy-400` | `bg-industrial-navy`     | **Category accent** |
| 500     | `#1B3A4F` | `--industrial-navy-500` | `bg-industrial-navy-500` | Dark accent         |
| 600     | `#0F2535` | `--industrial-navy-600` | `bg-industrial-navy-600` | Darkest             |

### Background Colors

| Name    | Hex       | CSS Variable              | Tailwind                   | Usage                                   |
| ------- | --------- | ------------------------- | -------------------------- | --------------------------------------- |
| Primary | `#FAF7F2` | `--industrial-bg-primary` | `bg-industrial-bg-primary` | Page background (warm cream, NOT white) |
| Card    | `#FFFFFF` | `--industrial-bg-card`    | `bg-industrial-bg-card`    | Cards only                              |
| Dark    | `#1A1A1A` | `--industrial-bg-dark`    | `bg-industrial-bg-dark`    | Footer, inverse sections                |

### Category Color Coding

Apply as a 4px left border on listing cards:

| Category               | Color                       | Example                                                       |
| ---------------------- | --------------------------- | ------------------------------------------------------------- |
| Welding & Fabrication  | `--industrial-orange-400`   | `border-l-industrial-category border-industrial-orange`       |
| Electrical             | `--industrial-navy-400`     | `border-l-industrial-category border-industrial-navy`         |
| Mechanical/Maintenance | `--industrial-graphite-400` | `border-l-industrial-category border-industrial-graphite-400` |

---

## Typography

### Font Families

| Font                  | Variable               | Tailwind       | Usage                        |
| --------------------- | ---------------------- | -------------- | ---------------------------- |
| Bebas Neue            | `--font-bebas-neue`    | `font-display` | Headlines (always uppercase) |
| Barlow                | `--font-barlow`        | `font-body`    | Body text                    |
| Libre Barcode 39 Text | `--font-libre-barcode` | `font-barcode` | Decorative elements          |

### Headlines (Bebas Neue)

Always use uppercase. Tight letter-spacing (0.02em) and line-height (0.85-1.0).

```tsx
// Hero headline
<h1 className="font-display text-[clamp(3.5rem,10vw,7rem)] uppercase tracking-wide leading-[0.85]">
  FIND YOUR WORKFORCE
</h1>

// Section title
<h2 className="font-display text-[clamp(2rem,5vw,2.5rem)] uppercase tracking-wide leading-[0.95]">
  FEATURED AGENCIES
</h2>

// Card title
<h3 className="font-display text-2xl uppercase tracking-wide leading-none">
  COMPANY NAME
</h3>
```

### Body Text (Barlow)

Normal case, relaxed line-height (1.6).

```tsx
// Lead paragraph
<p className="font-body text-lg leading-relaxed">
  Connect with premium staffing agencies...
</p>

// Standard paragraph
<p className="font-body text-base leading-relaxed">
  We help construction companies find...
</p>

// Small text / captions
<span className="font-body text-sm text-industrial-graphite-400">
  Last updated: Dec 2025
</span>
```

### Labels

Uppercase, wide letter-spacing.

```tsx
// Form label
<label className="font-body text-xs font-semibold uppercase tracking-widest text-industrial-graphite-400">
  Email Address
</label>

// Nav link
<a className="font-body text-sm font-semibold uppercase tracking-wide">
  Browse Directory
</a>
```

### Barcode Decoration

Use sparingly for industrial aesthetic.

```tsx
<span className="font-barcode text-2xl text-industrial-graphite-300">
  *FCS2025*
</span>
```

---

## Spacing Scale

Consistent vertical rhythm based on 4px base unit.

| Name | Size | CSS Variable              | Tailwind            |
| ---- | ---- | ------------------------- | ------------------- |
| xs   | 4px  | `--industrial-space-xs`   | `p-industrial-xs`   |
| sm   | 8px  | `--industrial-space-sm`   | `p-industrial-sm`   |
| md   | 12px | `--industrial-space-md`   | `p-industrial-md`   |
| base | 16px | `--industrial-space-base` | `p-industrial-base` |
| lg   | 24px | `--industrial-space-lg`   | `p-industrial-lg`   |
| xl   | 32px | `--industrial-space-xl`   | `p-industrial-xl`   |
| 2xl  | 48px | `--industrial-space-2xl`  | `p-industrial-2xl`  |
| 3xl  | 64px | `--industrial-space-3xl`  | `p-industrial-3xl`  |
| 4xl  | 96px | `--industrial-space-4xl`  | `p-industrial-4xl`  |

Use generous vertical spacing between major sections (4-6rem).

---

## Border Radius

Sharp corners — no pill buttons or excessive rounding.

| Name  | Size | CSS Variable                | Tailwind                   |
| ----- | ---- | --------------------------- | -------------------------- |
| sharp | 2px  | `--industrial-radius-sharp` | `rounded-industrial-sharp` |
| base  | 3px  | `--industrial-radius-base`  | `rounded-industrial-base`  |

---

## Border Width

Heavy borders for structural emphasis.

| Name     | Size | CSS Variable                   | Tailwind                       |
| -------- | ---- | ------------------------------ | ------------------------------ |
| thin     | 1px  | `--industrial-border-thin`     | `border-industrial-thin`       |
| base     | 2px  | `--industrial-border-base`     | `border-industrial-base`       |
| thick    | 3px  | `--industrial-border-thick`    | `border-industrial-thick`      |
| category | 4px  | `--industrial-border-category` | `border-l-industrial-category` |

---

## Component Guidelines

### Buttons

```tsx
// Primary button
<button className="
  font-body text-sm font-semibold uppercase tracking-wide
  bg-industrial-orange text-white
  px-8 py-4 rounded-industrial-sharp
  hover:bg-industrial-orange-500
  transition-all duration-200
">
  Get Started
</button>

// Secondary button
<button className="
  font-body text-sm font-semibold uppercase tracking-wide
  bg-transparent text-industrial-graphite-500
  border-industrial-base border-industrial-graphite-400
  px-8 py-4 rounded-industrial-sharp
  hover:border-industrial-graphite-600 hover:text-industrial-graphite-600
  transition-all duration-200
">
  Learn More
</button>
```

### Cards

```tsx
<div
  className="
  bg-industrial-bg-card
  border border-industrial-graphite-200
  border-l-industrial-category border-l-industrial-orange
  rounded-industrial-base
  shadow-sm
  hover:shadow-md hover:-translate-y-0.5
  transition-all duration-200
"
>
  <div className="p-5">
    <h3 className="font-display text-2xl uppercase">Company Name</h3>
    <p className="font-body text-sm text-industrial-graphite-400 mt-1">
      Est. 1985
    </p>
  </div>
  <div className="px-5 py-3 bg-industrial-graphite-100 border-t border-industrial-graphite-200">
    <span className="font-body text-xs font-semibold uppercase tracking-wide">
      View Profile
    </span>
  </div>
</div>
```

### Form Inputs

```tsx
<div>
  <label
    className="
    font-body text-xs font-semibold uppercase tracking-widest
    text-industrial-graphite-400
    mb-2 block
  "
  >
    Email Address
  </label>
  <input
    type="email"
    className="
      font-body text-base
      w-full px-4 py-3
      border-industrial-base border-industrial-graphite-300
      rounded-industrial-sharp
      bg-industrial-bg-card
      focus:border-industrial-orange focus:outline-none
      transition-colors duration-200
    "
    placeholder="you@company.com"
  />
</div>
```

### Navigation

```tsx
<nav className="flex justify-between items-center py-6 border-b-industrial-thick border-industrial-graphite-600">
  <a
    href="/"
    className="font-display text-2xl tracking-wide text-industrial-graphite-600"
  >
    CONSTRUCTION DIRECTORY
  </a>
  <div className="flex gap-8">
    <a
      className="
      font-body text-sm font-semibold uppercase tracking-wide
      text-industrial-graphite-500
      border-b-industrial-base border-transparent
      hover:border-industrial-orange
      transition-colors
    "
    >
      Browse Directory
    </a>
  </div>
</nav>
```

---

## Do's and Don'ts

### DO

- Use bold, condensed Bebas Neue for headlines (always uppercase)
- Keep backgrounds warm cream (`#FAF7F2`), not pure white
- Use sharp corners (2-3px border-radius max)
- Use left-border accents for category color coding
- Use barcode font for subtle decorative elements
- Let typography create hierarchy
- Use heavy rules/borders for structure
- Keep cards clean with subtle shadows
- Use 0.2s ease transitions — nothing bouncy

### DON'T

- Use purple, teal, or gradient backgrounds
- Use pill-shaped or heavily rounded buttons
- Mix multiple color families in one component
- Put gradient bands on every card (use sparingly)
- Use Inter, Roboto, Poppins, or system fonts
- Use floating blob backgrounds or abstract illustrations
- Use excessive drop shadows
- Make things look like a typical SaaS landing page
- Add bouncy or playful animations

---

## File Structure

```plaintext
lib/design-system/
├── README.md          # This documentation
├── colors.ts          # Color palette constants
├── typography.ts      # Typography constants
└── index.ts           # Central re-exports
```

---

## Related Files

- **CSS Variables:** `app/globals.css` (search for "INDUSTRIAL DESIGN SYSTEM")
- **Tailwind Config:** `tailwind.config.ts` (search for "industrial")
- **Font Loading:** `app/layout.tsx` (Bebas Neue, Barlow, Libre Barcode)
- **Design Specs:** `docs/features/active/ui-update.md`
- **Feature Spec:** `docs/features/active/010-industrial-design-system.md`
