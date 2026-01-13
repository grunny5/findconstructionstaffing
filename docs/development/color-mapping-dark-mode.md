# Dark Mode Color Mapping Reference

**Purpose**: Guide for converting hardcoded Tailwind colors to industrial design system variables that automatically support dark mode.

**Last Updated**: 2026-01-12

---

## How It Works

Industrial CSS variables automatically change when dark mode is toggled:

```css
/* Light mode (default) */
:root {
  --industrial-bg-card: #ffffff;
  --industrial-graphite-600: #1a1a1a;
}

/* Dark mode */
.dark {
  --industrial-bg-card: #1a1a1a;
  --industrial-graphite-600: #e5e5e5;
}
```

Using `bg-industrial-bg-card` automatically adapts, while `bg-white` stays white in both modes.

---

## Background Colors

### Solid Backgrounds

| Hardcoded Tailwind | Industrial Variable | Use Case |
|-------------------|---------------------|----------|
| `bg-white` | `bg-industrial-bg-card` | Cards, panels, elevated surfaces |
| `bg-gray-50` | `bg-industrial-graphite-100` | Subtle backgrounds, disabled states |
| `bg-gray-100` | `bg-industrial-graphite-100` | Input backgrounds, secondary surfaces |
| `bg-slate-50` | `bg-industrial-graphite-100` | Alternative subtle background |
| `bg-slate-100` | `bg-industrial-graphite-100` | Alternative secondary surface |
| `bg-gray-900` | `bg-industrial-graphite-600` | Dark backgrounds (inverted in dark mode) |
| `bg-slate-900` | `bg-industrial-graphite-600` | Dark text containers |

### Page Backgrounds

| Hardcoded Tailwind | Industrial Variable | Use Case |
|-------------------|---------------------|----------|
| `bg-[#FAF7F2]` | `bg-industrial-bg-primary` | Main page background (warm cream) |
| `bg-gray-50` | `bg-industrial-bg-primary` | Alternative page background |
| `bg-white` | `bg-industrial-bg-card` | Content sections, cards |

---

## Text Colors

### Body Text

| Hardcoded Tailwind | Industrial Variable | Use Case |
|-------------------|---------------------|----------|
| `text-gray-900` | `text-industrial-graphite-600` | Primary text, headings |
| `text-slate-900` | `text-industrial-graphite-600` | Alternative primary text |
| `text-gray-800` | `text-industrial-graphite-600` | Heavy text emphasis |
| `text-gray-700` | `text-industrial-graphite-500` | Secondary text, labels |
| `text-slate-700` | `text-industrial-graphite-500` | Alternative secondary text |
| `text-gray-600` | `text-industrial-graphite-400` | Tertiary text, captions |
| `text-slate-600` | `text-industrial-graphite-400` | Alternative tertiary text |
| `text-gray-500` | `text-industrial-graphite-400` | Muted text, placeholders |
| `text-gray-400` | `text-industrial-graphite-300` | Very muted text, disabled |

### Special Text Colors

| Hardcoded Tailwind | Industrial Variable | Use Case |
|-------------------|---------------------|----------|
| `text-white` | `text-white` | Text on dark backgrounds (keep as-is) |
| `text-orange-500` | `text-industrial-orange` | Accent text, links, CTAs |
| `text-blue-600` | `text-industrial-navy` | Alternative accent (electrical) |

---

## Border Colors

| Hardcoded Tailwind | Industrial Variable | Use Case |
|-------------------|---------------------|----------|
| `border-gray-200` | `border-industrial-graphite-200` | Default borders, dividers |
| `border-gray-300` | `border-industrial-graphite-300` | Emphasized borders |
| `border-slate-200` | `border-industrial-graphite-200` | Alternative default border |
| `border-slate-300` | `border-industrial-graphite-300` | Alternative emphasized border |
| `border-gray-600` | `border-industrial-graphite-600` | Heavy borders (industrial accent) |
| `border-transparent` | `border-transparent` | Hidden borders (keep as-is) |

---

## Special Cases

### Buttons

Buttons already use industrial colors. Verify they have correct classes:

```tsx
// ✅ Correct - Primary button
<Button className="bg-industrial-orange text-white hover:bg-industrial-orange-500">

// ✅ Correct - Outline button
<Button variant="outline" className="border-2 border-industrial-graphite-300 text-industrial-graphite-500">

// ❌ Wrong - Hardcoded
<Button className="bg-blue-600 text-white">
```

### Icons

Icons inherit text color, so fixing text color fixes icons:

```tsx
// Before
<Mail className="h-4 w-4 text-gray-500" />

// After
<Mail className="h-4 w-4 text-industrial-graphite-400" />
```

### Hover States

Industrial variables work with hover modifiers:

```tsx
// Before
<div className="bg-white hover:bg-gray-50">

// After
<div className="bg-industrial-bg-card hover:bg-industrial-graphite-100">
```

### Gradients

For gradients, use industrial variables in Tailwind's gradient syntax:

```tsx
// Before
<div className="bg-gradient-to-r from-gray-50 to-white">

// After
<div className="bg-gradient-to-r from-industrial-graphite-100 to-industrial-bg-card">
```

---

## Migration Process

### Step 1: Find Hardcoded Colors

```bash
# Find bg-white usage
grep -r "bg-white" components/ComponentName.tsx

# Find text-gray usage
grep -r "text-gray-" components/ComponentName.tsx

# Find border colors
grep -r "border-gray-" components/ComponentName.tsx
```

### Step 2: Replace Using This Guide

1. Check the mapping table above
2. Replace hardcoded class with industrial equivalent
3. Remove any `dark:` variants (no longer needed)

### Step 3: Verify

```bash
# TypeScript check
npx tsc --noEmit

# Visual check in browser
npm run dev
# Toggle theme and verify colors change
```

---

## Common Patterns

### Card Component

```tsx
// Before
<Card className="bg-white border border-gray-200">
  <CardHeader>
    <h3 className="text-gray-900">Title</h3>
    <p className="text-gray-600">Description</p>
  </CardHeader>
</Card>

// After
<Card className="bg-industrial-bg-card border border-industrial-graphite-200">
  <CardHeader>
    <h3 className="text-industrial-graphite-600">Title</h3>
    <p className="text-industrial-graphite-400">Description</p>
  </CardHeader>
</Card>
```

### Header/Navigation

```tsx
// Before
<header className="bg-white border-b border-gray-200">
  <nav className="text-gray-700 hover:text-gray-900">

// After
<header className="bg-industrial-bg-card border-b border-industrial-graphite-200">
  <nav className="text-industrial-graphite-500 hover:text-industrial-graphite-600">
```

### Form Inputs

```tsx
// Before
<input className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400">

// After
<input className="bg-industrial-graphite-100 border-industrial-graphite-300 text-industrial-graphite-600 placeholder:text-industrial-graphite-400">
```

---

## Testing Checklist

After migrating a component:

- [ ] TypeScript compiles without errors
- [ ] Component renders in light mode
- [ ] Toggle to dark mode - colors change visibly
- [ ] Text is readable in both modes (WCAG AA: 4.5:1 ratio)
- [ ] Interactive elements visible in both modes (WCAG AA: 3:1 ratio)
- [ ] Focus indicators visible in both modes
- [ ] No jarring color jumps when toggling

---

## Industrial Color Palette Reference

### Orange (Primary Accent, Welding/Fabrication)

- `industrial-orange-100` - Lightest orange
- `industrial-orange-200` - Light orange
- `industrial-orange-300` - Medium orange
- `industrial-orange-400` - **Primary accent** (#E07B00)
- `industrial-orange-500` - Hover states
- `industrial-orange-600` - Darkest orange

### Graphite (Neutral, Mechanical)

- `industrial-graphite-100` - Very light gray
- `industrial-graphite-200` - Light gray
- `industrial-graphite-300` - Medium light gray
- `industrial-graphite-400` - Medium gray
- `industrial-graphite-500` - Dark gray
- `industrial-graphite-600` - **Primary text** (#1A1A1A in light, #E5E5E5 in dark)

### Navy (Secondary Accent, Electrical)

- `industrial-navy-100` - Lightest navy
- `industrial-navy-200` - Light navy
- `industrial-navy-300` - Medium navy
- `industrial-navy-400` - **Category accent** (#2D4A63)
- `industrial-navy-500` - Dark navy
- `industrial-navy-600` - Darkest navy

### Backgrounds

- `industrial-bg-primary` - Main page background (#FAF7F2 cream in light, #0A0A0A black in dark)
- `industrial-bg-card` - Card/panel background (#FFFFFF white in light, #1A1A1A dark gray in dark)
- `industrial-bg-dark` - Inverse sections (#1A1A1A in light, #FAF7F2 in dark)

---

## When NOT to Change

Keep these Tailwind classes as-is:

- **Layout**: `flex`, `grid`, `gap-*`, `p-*`, `m-*`, `w-*`, `h-*`
- **Typography**: `font-display`, `font-body`, `text-xl`, `uppercase`, `tracking-wide`
- **White text on dark**: `text-white` on buttons/badges (stays white in both modes)
- **Transparent**: `bg-transparent`, `border-transparent`
- **Opacity modifiers**: `bg-white/80`, `text-gray-900/50` (keep if intentional transparency)

---

## Questions?

If unsure about a color mapping:

1. Check this document first
2. Look at similar components already migrated (Header, AgencyCard)
3. Test both light and dark modes
4. Use DevTools to inspect industrial CSS variables

**Remember**: The goal is consistency and maintainability, not perfection. When in doubt, choose the most semantically appropriate industrial variable.
