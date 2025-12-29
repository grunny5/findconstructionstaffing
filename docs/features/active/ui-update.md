# Claude Code Prompt: Industrial Staffing Directory Design Update

## Project Overview

Update the design of an industrial skilled trades staffing directory site. The aesthetic should feel like 1970s industrial equipment manuals meets Swiss Brutalist design — bold, confident, no-frills. This is NOT a typical SaaS or startup site. The target audience is operations directors, HR managers at manufacturing plants, and construction project managers. They respect clarity and confidence, and are suspicious of anything that looks too slick or startup-y.

---

## Design Philosophy

**Aesthetic Direction:** Industrial Brutalist / Swiss Modernism

Key principles:

- Bold, condensed typography that feels like factory signage
- Warm cream backgrounds (not sterile white)
- Sharp corners — no pill buttons or excessive rounding
- Monochromatic color accents — never mix multiple color families in one component
- Subtle industrial details like barcode-style fonts for decorative elements
- Let typography do the heavy lifting, not gradients or illustrations

---

## Color System

### Primary: Industrial Orange

Use for primary CTAs, accent text, and welding/fabrication category indicators.

```
--orange-100: #FFF4E6
--orange-200: #FFD699
--orange-300: #FF9F1C
--orange-400: #E07B00  /* Primary accent */
--orange-500: #B85C00  /* Hover states */
--orange-600: #8A4400
```

### Secondary: Graphite

The workhorse neutral. Use for text, borders, and mechanical/general trade category indicators.

```
--graphite-100: #F5F5F5
--graphite-200: #D4D4D4
--graphite-300: #9A9A9A
--graphite-400: #5C5C5C
--graphite-500: #333333
--graphite-600: #1A1A1A  /* Primary text */
```

### Accent: Deep Navy

Use sparingly for electrical trade category indicators and secondary emphasis.

```
--navy-100: #E8EDF2
--navy-200: #B8C9D9
--navy-300: #4A6B8A
--navy-400: #2D4A63  /* Category accent */
--navy-500: #1B3A4F
--navy-600: #0F2535
```

### Backgrounds

```
--bg-primary: #FAF7F2  /* Warm cream - use for page background, NOT pure white */
--bg-card: #FFFFFF     /* Cards only */
--bg-dark: #1A1A1A     /* Footer, inverse sections */
```

### Category Color Coding

Apply as a 4px left border on listing cards:

- Welding & Fabrication: `--orange-400`
- Electrical: `--navy-400`
- Mechanical/Maintenance: `--graphite-400`

---

## Typography

### Font Stack

```css
/* Display/Headlines - Bebas Neue */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

/* Body - Barlow */
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap');

/* Decorative barcodes - Libre Barcode 39 Text */
@import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Text&display=swap');
```

### Typography Specs

**Headlines (Bebas Neue):**

- Always uppercase
- Letter-spacing: 0.02em
- Line-height: 0.85-1.0

```css
.headline-xl {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(3.5rem, 10vw, 7rem);
  letter-spacing: 0.02em;
  line-height: 0.85;
  text-transform: uppercase;
  color: var(--graphite-600);
}

.headline-lg {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(2rem, 5vw, 2.5rem);
  letter-spacing: 0.02em;
  line-height: 0.95;
  text-transform: uppercase;
}

.headline-md {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.5rem;
  letter-spacing: 0.02em;
  line-height: 1;
  text-transform: uppercase;
}
```

**Body (Barlow):**

```css
body {
  font-family: 'Barlow', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-weight: 400;
  color: var(--graphite-600);
}
```

**Labels:**

```css
.label {
  font-family: 'Barlow', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--graphite-400);
}
```

**Barcode decorative elements:**

```css
.barcode {
  font-family: 'Libre Barcode 39 Text', cursive;
  font-size: 1.5rem;
  color: var(--graphite-300);
}
```

---

## Component Specifications

### Navigation

```css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 3px solid var(--graphite-600); /* Heavy bottom border */
}

.nav-logo {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.5rem;
  letter-spacing: 0.02em;
  color: var(--graphite-600);
  text-decoration: none;
}

.nav-link {
  font-family: 'Barlow', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--graphite-500);
  text-decoration: none;
  padding-bottom: 0.25rem;
  border-bottom: 2px solid transparent;
}

.nav-link:hover {
  border-bottom-color: var(--orange-400);
}
```

### Buttons

```css
.btn {
  font-family: 'Barlow', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 1rem 2rem;
  border-radius: 2px; /* Sharp, not rounded */
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--orange-400);
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: var(--orange-500);
}

.btn-secondary {
  background-color: transparent;
  color: var(--graphite-500);
  border: 2px solid var(--graphite-400);
}

.btn-secondary:hover {
  border-color: var(--graphite-600);
  color: var(--graphite-600);
}
```

### Directory Listing Cards

```css
.firm-card {
  background: var(--bg-card);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--graphite-200);
  border-left: 4px solid var(--orange-400); /* Category color */
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.firm-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-content {
  padding: 1.25rem;
}

.firm-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.5rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1;
  color: var(--graphite-600);
}

.firm-year {
  font-size: 0.8rem;
  color: var(--graphite-400);
  margin-top: 0.25rem;
}

.firm-trades {
  font-size: 0.875rem;
  color: var(--graphite-400);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1.25rem;
  background: var(--graphite-100);
  border-top: 1px solid var(--graphite-200);
}

.card-meta {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--graphite-500);
}
```

### Form Inputs

```css
.input {
  font-family: 'Barlow', sans-serif;
  font-size: 1rem;
  padding: 0.875rem 1rem;
  border: 2px solid var(--graphite-300);
  border-radius: 2px;
  background: var(--bg-card);
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--orange-400);
}

.input-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--graphite-400);
  margin-bottom: 0.5rem;
}
```

### Section Headers

```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--graphite-200);
}

.section-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
```

---

## Homepage Structure

The homepage should have a clean, direct structure:

### 1. Navigation

- Logo on left
- Nav links on right
- Heavy 3px bottom border

### 2. Hero Section

- Two-column layout on desktop (stacks on mobile)
- Left column: Label + Large headline (use orange accent on one word like "WORKFORCE")
- Right column: Subtitle paragraph + CTA buttons + Stats row
- Bottom border (1px) to separate from content
- NO gradient bands in hero

### 3. Featured/Directory Listings

- Section header with title and optional barcode decoration
- Grid of listing cards (auto-fill, min 340px)
- Cards use left-border color coding for trade categories
- "View all" link at bottom

### 4. CTA Section (optional)

- Simple horizontal layout: headline + description on left, button on right
- Light top border separator

### 5. Footer

- Dark background (--graphite-600)
- Logo and copyright on left
- Barcode decoration on right

---

## Layout Specifications

```css
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Responsive padding */
@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
}
```

### Spacing Scale

```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
```

Use generous vertical spacing between major sections (4-6rem).

---

## Gradient Bands (Use Sparingly)

Gradient bands should be reserved for special emphasis only — NOT on every component. Use for:

- One featured listing to highlight it
- Marketing page heroes
- Section dividers on long-form pages

When used, keep them thin (6px) and use 3 shades from light to dark within ONE color family:

```css
.gradient-band {
  display: flex;
  height: 6px;
}

.gradient-band span {
  flex: 1;
}

/* Orange variant */
.gradient-band.orange span:nth-child(1) {
  background: var(--orange-300);
}
.gradient-band.orange span:nth-child(2) {
  background: var(--orange-400);
}
.gradient-band.orange span:nth-child(3) {
  background: var(--orange-500);
}
```

---

## Do's and Don'ts

### DO:

- Use bold, condensed Bebas Neue for headlines (always uppercase)
- Keep backgrounds warm cream (#FAF7F2), not pure white
- Use sharp corners (2-3px border-radius max)
- Use left-border accents for category color coding
- Use barcode font for subtle decorative elements
- Let typography create hierarchy
- Use heavy rules/borders for structure
- Keep cards clean with subtle shadows

### DON'T:

- Use purple, teal, or gradient backgrounds
- Use pill-shaped or heavily rounded buttons
- Mix multiple color families in one component
- Put gradient bands on every card
- Use Inter, Roboto, Poppins, or system fonts
- Use floating blob backgrounds or abstract illustrations
- Use excessive drop shadows
- Make things look like a typical SaaS landing page

---

## File References

The design is demonstrated in an HTML preview file. Key visual patterns to replicate:

- Hero with split layout and orange accent word
- Listing cards with left-border category indicators
- Clean card footer with metadata and barcode
- Heavy nav border, light section dividers
- Dark footer with inverted colors

---

## Implementation Notes

1. Start by setting up CSS custom properties for all colors and typography
2. Import the three Google Fonts (Bebas Neue, Barlow, Libre Barcode 39 Text)
3. Set body background to --bg-primary (#FAF7F2)
4. Build mobile-first, then enhance for larger screens
5. The directory grid should use CSS Grid with auto-fill and minmax for responsive behavior
6. All transitions should be 0.2s ease — nothing bouncy or playful
7. Focus states should use --orange-400 for accessibility

The goal is a site that looks established and industrial — like it's been the industry standard for years, not a startup trying to disrupt anything.
