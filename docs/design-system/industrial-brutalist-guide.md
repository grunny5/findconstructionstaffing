# Industrial Brutalist Design System Guide

> **FindConstructionStaffing Platform Design Documentation**
> Version 1.0 | December 2025

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Layout Patterns](#layout-patterns)
5. [Component Patterns](#component-patterns)
6. [Accessibility Guidelines](#accessibility-guidelines)
7. [Mobile-First Responsive Design](#mobile-first-responsive-design)
8. [Do's and Don'ts](#dos-and-donts)
9. [Implementation Reference](#implementation-reference)

---

## Design Philosophy

### Aesthetic Direction: Industrial Brutalist / Swiss Modernism

The FindConstructionStaffing platform uses an industrial brutalist design aesthetic inspired by 1970s industrial equipment manuals and Swiss Brutalist design. This is intentionally **NOT** a typical SaaS or startup aesthetic.

### Target Audience

- **Construction Operations Directors** - Making high-stakes hiring decisions
- **HR Managers at Manufacturing Plants** - Need confidence in the platform
- **Construction Project Managers** - Often browsing on mobile devices in challenging conditions

### Core Principles

1. **Bold, condensed typography** that feels like factory signage
2. **Warm cream backgrounds** (not sterile white)
3. **Sharp corners** — no pill buttons or excessive rounding
4. **Monochromatic color accents** — never mix multiple color families in one component
5. **Subtle industrial details** like barcode-style fonts for decorative elements
6. **Let typography do the heavy lifting**, not gradients or illustrations
7. **Heavy borders and rules** for structural emphasis

### Why This Approach?

Our target audience respects clarity and confidence. They are suspicious of anything that looks too slick or startup-y. The industrial aesthetic conveys:

- **Authenticity** - We understand the construction industry
- **Reliability** - Solid, dependable platform
- **Professionalism** - Serious business tool, not a trendy app

---

## Color System

### Primary: Industrial Orange (`#E07B00`)

The primary accent color. Use for:

- Primary CTAs (buttons, links)
- Focus states and active indicators
- Welding/Fabrication trade category
- Error states (instead of red)

```tsx
// Primary button
<Button className="bg-industrial-orange hover:bg-industrial-orange-500">
  Get Started
</Button>

// Focus state
<Input className="focus:ring-industrial-orange focus:border-industrial-orange" />
```

| Shade   | Hex       | Usage                         |
| ------- | --------- | ----------------------------- |
| 100     | `#FFF4E6` | Light backgrounds, highlights |
| 200     | `#FFD699` | Subtle accents                |
| 300     | `#FF9F1C` | Bright accent                 |
| **400** | `#E07B00` | **Primary accent** (default)  |
| 500     | `#C56A00` | Hover states                  |
| 600     | `#8A4400` | Dark accent, active states    |

### Secondary: Graphite

The workhorse neutral. Use for:

- Primary text (`graphite-600`)
- Secondary text (`graphite-500`)
- Muted text (`graphite-400`)
- Borders (`graphite-200`)
- Mechanical/General trade category

| Shade   | Hex       | Usage                            |
| ------- | --------- | -------------------------------- |
| 100     | `#F5F5F5` | Card footers, subtle backgrounds |
| 200     | `#D1D1D1` | Borders, dividers                |
| 300     | `#9A9A9A` | Decorative elements              |
| 400     | `#757575` | Muted/disabled text (WCAG AA)    |
| 500     | `#4A4A4A` | Secondary text                   |
| **600** | `#1A1A1A` | **Primary text** (default)       |

### Accent: Deep Navy

Use sparingly for:

- Electrical trade category
- Secondary emphasis
- Alternative dark sections

| Shade   | Hex       | Usage                         |
| ------- | --------- | ----------------------------- |
| 100     | `#E8EDF2` | Light backgrounds             |
| 200     | `#B8C9D9` | Subtle accents                |
| 300     | `#4A6B8A` | Mid-tone                      |
| **400** | `#2D4A63` | **Category accent** (default) |
| 500     | `#1B3A4F` | Dark accent                   |
| 600     | `#0F2535` | Darkest                       |

### Background Colors

| Name    | Hex       | Tailwind Class             | Usage                        |
| ------- | --------- | -------------------------- | ---------------------------- |
| Primary | `#FAF8F5` | `bg-industrial-bg-primary` | Page background (warm cream) |
| Card    | `#FFFFFF` | `bg-industrial-bg-card`    | Cards, modals, overlays      |
| Dark    | `#1A1A1A` | `bg-industrial-bg-dark`    | Footer, inverse sections     |

### Trade Category Color Coding

Apply as a 4px left border on listing cards:

| Category               | Color             | Tailwind Class                              |
| ---------------------- | ----------------- | ------------------------------------------- |
| Welding & Fabrication  | Industrial Orange | `border-l-4 border-industrial-orange`       |
| Electrical             | Deep Navy         | `border-l-4 border-industrial-navy`         |
| Mechanical/Maintenance | Graphite          | `border-l-4 border-industrial-graphite-400` |

---

## Typography

### Font Families

| Font                  | Tailwind Class | Usage                                |
| --------------------- | -------------- | ------------------------------------ |
| Bebas Neue            | `font-display` | Headlines, titles (always uppercase) |
| Barlow                | `font-body`    | Body text, labels, buttons           |
| Libre Barcode 39 Text | `font-barcode` | Decorative industrial elements       |

### Headline Styles (Bebas Neue)

Always uppercase with tight letter-spacing.

```tsx
// Hero headline (largest)
<h1 className="font-display uppercase tracking-wide leading-[0.85]"
    style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)' }}>
  FIND YOUR WORKFORCE
</h1>

// Section title
<h2 className="font-display text-3xl lg:text-4xl uppercase tracking-wide">
  FEATURED AGENCIES
</h2>

// Card title
<h3 className="font-display text-xl lg:text-2xl uppercase tracking-wide">
  COMPANY NAME
</h3>
```

### Body Text (Barlow)

Normal case with relaxed line-height.

```tsx
// Lead paragraph
<p className="font-body text-lg lg:text-xl leading-relaxed text-industrial-graphite-500">
  Connect with premium staffing agencies...
</p>

// Standard paragraph
<p className="font-body text-base leading-relaxed">
  We help construction companies find skilled workers.
</p>

// Small text / captions
<span className="font-body text-sm text-industrial-graphite-400">
  Last updated: Dec 2025
</span>
```

### Labels

Uppercase with wide letter-spacing.

```tsx
// Form label
<Label className="font-body text-xs font-semibold uppercase tracking-widest text-industrial-graphite-400">
  Email Address
</Label>

// Nav link
<a className="font-body text-sm font-semibold uppercase tracking-wide">
  Browse Directory
</a>
```

---

## Layout Patterns

### Hero Section

Full-width with graphite background and orange accent border.

```tsx
<section className="bg-industrial-graphite-600 py-16 border-b-4 border-industrial-orange">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="max-w-4xl mx-auto text-center">
      <h1
        className="font-display text-white uppercase tracking-wide mb-6"
        style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
      >
        Page Title Here
      </h1>
      <p className="font-body text-xl md:text-2xl text-industrial-graphite-200">
        Subtitle or description text
      </p>
    </div>
  </div>
</section>
```

### Content Section

Warm cream background with generous vertical spacing.

```tsx
<section className="py-12 lg:py-16 bg-industrial-bg-primary">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="font-display text-3xl lg:text-4xl text-industrial-graphite-600 uppercase tracking-wide mb-8">
      Section Title
    </h2>
    {/* Content goes here */}
  </div>
</section>
```

### Card Grid

Responsive grid with consistent gaps.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <Card
      key={item.id}
      className="bg-industrial-bg-card border-industrial-graphite-200 rounded-industrial-base"
    >
      {/* Card content */}
    </Card>
  ))}
</div>
```

### Two-Column Layout

For forms and content with sidebar.

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div className="order-2 lg:order-1">{/* Main content */}</div>
  <div className="order-1 lg:order-2">{/* Sidebar/secondary content */}</div>
</div>
```

### Dashboard Layout

Sidebar navigation with main content area.

```tsx
<div className="flex min-h-screen">
  {/* Sidebar */}
  <aside className="hidden lg:block w-64 bg-industrial-bg-card border-r border-industrial-graphite-200">
    <nav className="p-4 space-y-1">{/* Navigation items */}</nav>
  </aside>

  {/* Main content */}
  <main className="flex-1 bg-industrial-bg-primary">
    <div className="p-6 lg:p-8">{/* Page content */}</div>
  </main>
</div>
```

### Container Widths

| Breakpoint   | Max Width | Usage                   |
| ------------ | --------- | ----------------------- |
| Default      | 100%      | Full width with padding |
| sm (640px)   | 640px     | Small content areas     |
| md (768px)   | 768px     | Medium content areas    |
| lg (1024px)  | 1024px    | Standard page content   |
| xl (1280px)  | 1280px    | Wide content areas      |
| 2xl (1400px) | 1400px    | Maximum content width   |

---

## Component Patterns

### Buttons

```tsx
// Primary button
<Button className="bg-industrial-orange hover:bg-industrial-orange-500 text-white font-body font-semibold uppercase tracking-wide">
  Get Started
</Button>

// Secondary/Outline button
<Button variant="outline" className="border-2 border-industrial-graphite-400 text-industrial-graphite-600 hover:border-industrial-graphite-600">
  Learn More
</Button>

// Ghost button
<Button variant="ghost" className="text-industrial-graphite-500 hover:bg-industrial-graphite-100">
  Cancel
</Button>
```

### Cards

```tsx
<Card className="bg-industrial-bg-card border border-industrial-graphite-200 border-l-4 border-l-industrial-orange rounded-industrial-base shadow-sm hover:shadow-md transition-shadow">
  <CardHeader className="border-b border-industrial-graphite-200">
    <CardTitle className="font-display text-xl uppercase text-industrial-graphite-600">
      Card Title
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-4">
    <p className="font-body text-industrial-graphite-500">
      Card content goes here.
    </p>
  </CardContent>
</Card>
```

### Form Inputs

```tsx
<div className="space-y-2">
  <Label className="font-body text-xs font-semibold uppercase tracking-widest text-industrial-graphite-400">
    Email Address <span className="text-industrial-orange">*</span>
  </Label>
  <Input
    type="email"
    className="border-2 border-industrial-graphite-300 rounded-industrial-sharp focus:border-industrial-orange focus:ring-industrial-orange"
    placeholder="you@company.com"
  />
</div>
```

### Navigation

```tsx
<header className="bg-industrial-bg-card border-b-4 border-industrial-orange">
  <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
    <a
      href="/"
      className="font-display text-2xl uppercase tracking-wide text-industrial-graphite-600"
    >
      FindConstructionStaffing
    </a>
    <div className="hidden md:flex gap-8">
      <a className="font-body text-sm font-semibold uppercase tracking-wide text-industrial-graphite-500 hover:text-industrial-orange transition-colors">
        Directory
      </a>
    </div>
  </nav>
</header>
```

### Badges

```tsx
// Default badge
<Badge className="bg-industrial-graphite-100 text-industrial-graphite-600 font-body text-xs uppercase">
  Electrician
</Badge>

// Accent badge
<Badge className="bg-industrial-orange-100 text-industrial-orange-600 font-body text-xs uppercase">
  Featured
</Badge>
```

---

## Accessibility Guidelines

### Color Contrast Requirements (WCAG 2.1 AA)

All text must meet minimum contrast ratios:

| Text Type     | Minimum Ratio | Recommended Combinations                         |
| ------------- | ------------- | ------------------------------------------------ |
| Normal text   | 4.5:1         | `graphite-600` on cream, `graphite-400` on white |
| Large text    | 3:1           | `graphite-500` on cream backgrounds              |
| UI components | 3:1           | Focus rings, borders, icons                      |

**Verified Color Combinations:**

| Foreground               | Background      | Contrast Ratio | Pass?      |
| ------------------------ | --------------- | -------------- | ---------- |
| `graphite-600` (#1A1A1A) | cream (#FAF8F5) | 15.8:1         | AAA        |
| `graphite-500` (#4A4A4A) | cream (#FAF8F5) | 7.2:1          | AAA        |
| `graphite-400` (#757575) | white (#FFFFFF) | 4.6:1          | AA         |
| `industrial-orange`      | white (#FFFFFF) | 3.1:1          | Large only |
| white (#FFFFFF)          | `graphite-600`  | 15.8:1         | AAA        |

### Focus States

All interactive elements must have visible focus indicators:

```tsx
// Standard focus ring
className =
  'focus:outline-none focus:ring-2 focus:ring-industrial-orange focus:ring-offset-2';

// Input focus
className =
  'focus:border-industrial-orange focus:ring-1 focus:ring-industrial-orange';
```

### Keyboard Navigation

- All interactive elements must be reachable via Tab key
- Focus order must follow logical reading order
- Skip links should be provided for main content areas
- Dropdown menus must support arrow key navigation

### Screen Reader Support

```tsx
// Use semantic HTML
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// Provide labels for icons
<button aria-label="Close menu">
  <X className="h-4 w-4" />
</button>

// Use sr-only for screen reader text
<span className="sr-only">Close</span>
```

### Touch Targets

Minimum touch target size: **44x44 pixels**

```tsx
// Ensure buttons meet minimum size
<Button className="min-h-[44px] px-6">Submit</Button>
```

---

## Mobile-First Responsive Design

### Breakpoint System

| Breakpoint | Min Width | Tailwind Prefix | Target Devices           |
| ---------- | --------- | --------------- | ------------------------ |
| Default    | 0px       | (none)          | Mobile phones (portrait) |
| sm         | 640px     | `sm:`           | Large phones (landscape) |
| md         | 768px     | `md:`           | Tablets                  |
| lg         | 1024px    | `lg:`           | Small laptops, tablets   |
| xl         | 1280px    | `xl:`           | Laptops, desktops        |
| 2xl        | 1400px    | `2xl:`          | Large monitors           |

### Mobile-First Approach

Always write base styles for mobile, then add larger breakpoint overrides:

```tsx
// CORRECT: Mobile-first
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
    Heading
  </h1>
</div>

// INCORRECT: Desktop-first (avoid)
<div className="lg:p-8 md:p-6 p-4">
  ...
</div>
```

### Responsive Typography

Use `clamp()` for fluid typography:

```tsx
<h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>Responsive Heading</h1>
```

| Element    | Mobile  | Tablet | Desktop  | Wide     |
| ---------- | ------- | ------ | -------- | -------- |
| Hero H1    | 2.5rem  | 4rem   | 5rem     | 7rem     |
| Section H2 | 1.75rem | 2rem   | 2.5rem   | 3rem     |
| Card H3    | 1.25rem | 1.5rem | 1.75rem  | 2rem     |
| Body text  | 1rem    | 1rem   | 1.125rem | 1.125rem |

### Responsive Layout Patterns

```tsx
// Stack on mobile, side-by-side on larger screens
<div className="flex flex-col lg:flex-row gap-6">
  <div className="w-full lg:w-1/2">Left column</div>
  <div className="w-full lg:w-1/2">Right column</div>
</div>

// Single column on mobile, grid on larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>

// Hide sidebar on mobile
<aside className="hidden lg:block w-64">
  {/* Sidebar content */}
</aside>
```

### Mobile Considerations

1. **Touch-friendly spacing** - Minimum 44px tap targets
2. **Readable text** - Minimum 16px body text on mobile
3. **No horizontal scrolling** - Content must fit viewport
4. **Simplified navigation** - Use hamburger menu on mobile
5. **Optimized images** - Use Next.js Image component with responsive sizes

---

## Do's and Don'ts

### DO

| Practice                                      | Example                                |
| --------------------------------------------- | -------------------------------------- |
| Use bold Bebas Neue for headlines (uppercase) | `font-display uppercase tracking-wide` |
| Keep backgrounds warm cream, not pure white   | `bg-industrial-bg-primary` (#FAF8F5)   |
| Use sharp corners (2-3px max)                 | `rounded-industrial-sharp`             |
| Use 4px left-border for category color coding | `border-l-4 border-industrial-orange`  |
| Use barcode font for decorative elements      | `font-barcode`                         |
| Let typography create hierarchy               | Bebas Neue headlines, Barlow body      |
| Use heavy rules/borders for structure         | `border-2`, `border-b-4`               |
| Use 0.2s ease transitions                     | `transition-all duration-200`          |
| Focus ring with industrial orange             | `focus:ring-industrial-orange`         |

### DON'T

| Anti-Pattern                                      | Why Not                            |
| ------------------------------------------------- | ---------------------------------- |
| Use purple, teal, or gradient backgrounds         | Doesn't match industrial aesthetic |
| Use pill-shaped or heavily rounded buttons        | Too soft, not industrial           |
| Mix multiple color families in one component      | Creates visual noise               |
| Put gradient bands on every card                  | Use sparingly if at all            |
| Use Inter, Roboto, Poppins, or system fonts       | Generic SaaS look                  |
| Use floating blob backgrounds                     | Too startup-y                      |
| Use excessive drop shadows                        | Keep it flat and industrial        |
| Make things look like a typical SaaS landing page | Our audience is suspicious of this |
| Add bouncy or playful animations                  | Keep it professional and direct    |

---

## Implementation Reference

### File Locations

| Resource             | Location                          |
| -------------------- | --------------------------------- |
| CSS Variables        | `app/globals.css`                 |
| Tailwind Config      | `tailwind.config.ts`              |
| Font Loading         | `app/layout.tsx`                  |
| Color Constants      | `lib/design-system/colors.ts`     |
| Typography Constants | `lib/design-system/typography.ts` |
| Design System Index  | `lib/design-system/index.ts`      |
| Technical README     | `lib/design-system/README.md`     |

### Related Documentation

- [FSD: Industrial Design System](../features/active/010-industrial-design-system.md)
- [UI Update Specifications](../features/active/ui-update.md)
- [Visual Regression Testing](../testing/visual-regression-testing-report.md)
- [Cross-Browser Testing](../testing/cross-browser-testing-checklist.md)

### Quick Reference: Tailwind Classes

```tsx
// Colors
bg - industrial - orange; // Primary orange (#E07B00)
bg - industrial - graphite - 600; // Dark graphite (#1A1A1A)
bg - industrial - navy; // Navy blue (#2D4A63)
bg - industrial - bg - primary; // Cream background (#FAF8F5)
bg - industrial - bg - card; // White card background

// Typography
font - display; // Bebas Neue (headlines)
font - body; // Barlow (body text)
font - barcode; // Libre Barcode (decorative)

// Borders & Corners
rounded - industrial - sharp; // 2px border radius
rounded - industrial - base; // 3px border radius
border - l - 4; // Category left border

// Spacing
p - industrial - lg; // 24px padding
m - industrial - xl; // 32px margin
```

---

## Version History

| Version | Date       | Changes                                     |
| ------- | ---------- | ------------------------------------------- |
| 1.0     | 2025-12-29 | Initial release with complete design system |

---

_This design system is part of Feature 010: Industrial Brutalist Design System for the FindConstructionStaffing platform._
