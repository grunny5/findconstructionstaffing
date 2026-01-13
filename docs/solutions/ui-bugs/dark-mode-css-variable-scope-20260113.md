---
title: Dark mode toggle changes class but colors don't update due to CSS variable scope mismatch
date: 2026-01-13
category: ui-bugs
severity: high
component: globals.css
tags: [dark-mode, css-variables, theme-system, layer-scope, tailwind]
status: resolved
pr_number: 667
commit: 0bb385b
symptoms:
  - Theme toggle icon changes state correctly
  - HTML class switches between "light" and "dark"
  - Page colors remain in light mode despite dark class
  - DevTools shows dark mode variables present but not applied
root_cause: CSS specificity and layer ordering issue - light mode industrial variables defined outside @layer base (line 144) while dark mode overrides inside @layer base (lines 73-100), causing light mode to win specificity
solution: Moved all industrial CSS variables (--industrial-* color definitions) into @layer base :root scope to match dark mode variable placement
investigation_method: Browser DevTools inspection of HTML class changes and CSS variable computed values
related_files:
  - app/globals.css
---

# Dark mode toggle changes class but colors don't update due to CSS variable scope mismatch

## Symptom

When clicking the theme toggle button in the header:
- ✅ The toggle icon animates and changes state correctly
- ✅ Browser DevTools shows HTML element class changes from `<html class="">` to `<html class="dark">`
- ❌ **Page colors do not change** - all elements remain in light mode
- ❌ Background stays warm cream instead of changing to dark
- ❌ Text colors remain dark gray instead of changing to light

**User Quote**: "the homepage is still not turning to dark mode when i click the icon"

## Environment

- **Framework**: Next.js 13.5.1 with App Router
- **CSS Framework**: Tailwind CSS with `@layer base` directive
- **Theme System**: next-themes v0.2.1 with `attribute="class"`
- **Design System**: Industrial design system with CSS custom properties
- **Browser**: Tested in Chrome/Edge (Chromium-based)
- **Build Tool**: Next.js built-in PostCSS

## Root Cause

The dark mode toggle was correctly adding/removing the `.dark` class to the HTML element, but the page colors weren't changing because of a **CSS cascade layer and specificity mismatch**.

### Technical Explanation

The CSS variables were defined in two different scopes:

1. **Light mode industrial variables** (lines 144+): Defined in a `:root` block **OUTSIDE** the `@layer base` directive
2. **Dark mode overrides** (lines 73-100): Defined in `.dark` selectors **INSIDE** the `@layer base` directive

In Tailwind CSS's architecture, `@layer base` has lower specificity than regular CSS. When the industrial color variables were defined outside `@layer base`, they had higher specificity and couldn't be overridden by the `.dark` selector inside `@layer base`, regardless of class presence.

This is a subtle but critical issue with Tailwind's layering system where:
- Variables outside `@layer base` = higher specificity
- Variables inside `@layer base` = lower specificity
- Result: `.dark` overrides were ignored by the cascade

## Investigation Steps

### Step 1: Verified Toggle Functionality
```bash
# Confirmed the HTML class was being toggled correctly
# Used browser DevTools to inspect <html> element
# Observed: <html class="dark"> vs <html class="">
```
**Finding**: Toggle mechanism working correctly - HTML class changes as expected.

### Step 2: Inspected CSS Variable Application
```javascript
// Checked computed styles in DevTools Console
getComputedStyle(document.documentElement).getPropertyValue('--background')
getComputedStyle(document.documentElement).getPropertyValue('--primary')
```
**Finding**: Variables remained at light mode values even when `.dark` class was present.

### Step 3: Traced CSS Variable Definitions
- Located light mode variables at line 144+ in `app/globals.css`
- Located dark mode overrides at lines 73-100 in `app/globals.css`
- **Critical Discovery**: Light mode variables were in a separate `:root` block OUTSIDE `@layer base`
- Dark mode variables were INSIDE `@layer base`

### Step 4: Analyzed CSS Cascade Order
```css
/* HIGHER SPECIFICITY - Outside @layer base */
:root {
  --background: 0 0% 100%;  /* Always wins */
}

/* LOWER SPECIFICITY - Inside @layer base */
@layer base {
  .dark {
    --background: 222.2 84% 4.9%;  /* Never applied */
  }
}
```
**Finding**: CSS layer specificity prevented dark mode overrides from taking effect.

### Step 5: Validated Layer Architecture
```css
/* Tailwind's layer order */
@layer base { /* Lowest priority */ }
@layer components { /* Medium priority */ }
@layer utilities { /* Highest priority */ }
/* Regular CSS (no layer) */ /* Even higher priority */
```
**Finding**: Variables outside layers have higher specificity than those inside `@layer base`.

## Solution

**Move all CSS variable definitions into the same scope**: Place both light mode (`:root`) and dark mode (`.dark`) variable definitions inside the `@layer base` directive to ensure consistent specificity.

### Implementation Steps
1. Identify industrial color variables defined outside `@layer base` (original lines 144-171)
2. Move these variable definitions inside `@layer base` block (to lines 47-74)
3. Ensure `:root` and `.dark` selectors are siblings within the same layer
4. Delete the duplicate `:root` block that was outside the layer

## Code Changes

### Before: app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }

  /* Dark mode overrides - INSIDE @layer base */
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    /* Industrial Orange - Dark mode variants */
    --industrial-orange-100: #2d1f0a;
    --industrial-orange-200: #663a00;
    --industrial-orange-300: #995500;
    --industrial-orange-400: #e07b00;
    --industrial-orange-500: #ff9f1c;
    --industrial-orange-600: #ffd699;

    /* Graphite - Inverted for dark backgrounds */
    --industrial-graphite-100: #2d2d2d;
    --industrial-graphite-200: #3d3d3d;
    --industrial-graphite-300: #5c5c5c;
    --industrial-graphite-400: #9a9a9a;
    --industrial-graphite-500: #d4d4d4;
    --industrial-graphite-600: #e5e5e5;

    /* ... more dark mode variables ... */
  }
}

/* Light mode variables - OUTSIDE @layer base - WRONG! */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  /* Industrial Orange - Primary accent */
  --industrial-orange-100: #fff4e6;
  --industrial-orange-200: #ffd699;
  --industrial-orange-300: #ff9f1c;
  --industrial-orange-400: #e07b00;
  --industrial-orange-500: #b85c00;
  --industrial-orange-600: #8a4400;

  /* Graphite - Primary neutral */
  --industrial-graphite-100: #f5f5f5;
  --industrial-graphite-200: #d4d4d4;
  --industrial-graphite-300: #9a9a9a;
  --industrial-graphite-400: #5c5c5c;
  --industrial-graphite-500: #333333;
  --industrial-graphite-600: #1a1a1a;

  /* ... more light mode variables ... */
}
```

### After: app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Light mode variables - NOW INSIDE @layer base */
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    /* Industrial Orange - Primary accent */
    --industrial-orange-100: #fff4e6;
    --industrial-orange-200: #ffd699;
    --industrial-orange-300: #ff9f1c;
    --industrial-orange-400: #e07b00;
    --industrial-orange-500: #b85c00;
    --industrial-orange-600: #8a4400;

    /* Graphite - Primary neutral */
    --industrial-graphite-100: #f5f5f5;
    --industrial-graphite-200: #d4d4d4;
    --industrial-graphite-300: #9a9a9a;
    --industrial-graphite-400: #5c5c5c;
    --industrial-graphite-500: #333333;
    --industrial-graphite-600: #1a1a1a;

    /* ... more light mode variables ... */
  }

  /* Dark mode overrides - INSIDE @layer base (same scope) */
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    /* Industrial Orange - Dark mode variants */
    --industrial-orange-100: #2d1f0a;
    --industrial-orange-200: #663a00;
    --industrial-orange-300: #995500;
    --industrial-orange-400: #e07b00;
    --industrial-orange-500: #ff9f1c;
    --industrial-orange-600: #ffd699;

    /* Graphite - Inverted for dark backgrounds */
    --industrial-graphite-100: #2d2d2d;
    --industrial-graphite-200: #3d3d3d;
    --industrial-graphite-300: #5c5c5c;
    --industrial-graphite-400: #9a9a9a;
    --industrial-graphite-500: #d4d4d4;
    --industrial-graphite-600: #e5e5e5;

    /* ... more dark mode variables ... */
  }

  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* No more duplicate :root block outside @layer base */
```

### Diff Summary
- **Lines moved**: 47-74 (industrial color variables moved into `@layer base`)
- **Lines deleted**: 144-171 (duplicate `:root` block outside `@layer base`)
- **Net change**: ~58 lines of CSS reorganized for proper scope

## Verification

After applying the fix:

1. **✅ Visual Test**: Toggle dark mode switch - page immediately changes between light and dark themes
2. **✅ DevTools Test**: Inspect computed CSS variables - values now change when `.dark` class is toggled
3. **✅ Cascade Test**: Both `:root` and `.dark` selectors now have equal specificity within `@layer base`
4. **✅ Component Test**: All UI components (Header, buttons, cards) correctly adapt to dark mode
5. **✅ Build Test**: CSS compiles without errors, no 404s on static assets

## Prevention Strategies

### 1. Enforce Consistent CSS Variable Scope

**Strategy**: Establish a single source of truth for all CSS variable definitions within `@layer base`.

- **Centralized Definition**: All CSS custom properties should be defined within the `@layer base` directive in your global CSS file
- **Avoid Fragmentation**: Never mix variable definitions inside and outside of `@layer` directives
- **Theme Variants Together**: Keep light and dark mode variables in the same `@layer base` block for easy comparison

**Implementation Pattern**:
```css
/* ✅ CORRECT: All variables in @layer base */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
  }
}

/* ❌ INCORRECT: Mixed scopes */
:root {
  --some-variable: value;
}

@layer base {
  :root {
    --other-variable: value;
  }
}
```

### 2. Implement Automated Scope Validation

**Pre-commit Hook Example**:
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for CSS variables defined outside @layer base
if grep -rn "^[[:space:]]*:root\|^[[:space:]]*\.dark" --include="*.css" app/ components/ | grep -v "@layer base"; then
  echo "Error: CSS variables found outside @layer base"
  echo "All CSS variables must be defined within @layer base for proper theming"
  exit 1
fi
```

### 3. Code Review Checklist

When reviewing PRs that modify CSS variables:

- [ ] All CSS variables are defined within `@layer base`
- [ ] No CSS variables defined at global scope (outside layers)
- [ ] `:root` and `.dark` selectors are inside `@layer base`
- [ ] No duplicate variable definitions across files
- [ ] Every `:root` variable has a corresponding `.dark` override (if theme-dependent)
- [ ] Author tested theme toggle functionality manually
- [ ] Screenshots/videos show both light and dark modes

### 4. Best Practices for CSS File Organization

```css
/* globals.css structure */

/* 1. Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 2. ALL CSS variables in @layer base */
@layer base {
  /* 2a. Light mode (default) */
  :root {
    /* All light mode variables */
  }

  /* 2b. Dark mode overrides */
  .dark {
    /* All dark mode overrides */
  }

  /* 2c. Global element styles */
  * { }
  body { }
}

/* 3. Component styles */
@layer components { }

/* 4. Utility classes */
@layer utilities { }
```

## Related Documentation

### Primary Documentation Files

1. **Dark Mode Testing**: `/docs/testing/dark-mode-manual-test.md`
   - Testing procedures for dark mode proof of concept
   - Step-by-step manual verification checklist

2. **Color Mapping Guide**: `/docs/development/color-mapping-dark-mode.md`
   - Comprehensive color mapping reference guide
   - Maps hardcoded Tailwind colors to industrial design system variables

3. **Dark Mode Planning**: `/plans/dark-mode-fix-plan.md`
   - Strategic planning document for dark mode implementation
   - Compares 3 implementation approaches

4. **Industrial Design System**: `/docs/design-system/industrial-brutalist-guide.md`
   - Complete industrial design system specification
   - Color system, typography, layout patterns

5. **Related UI Bug**: `/docs/solutions/ui-bugs/theme-toggle-resolved-theme-20260112.md`
   - Documents `resolvedTheme` vs `theme` issue in ThemeToggle component
   - Different issue but related to dark mode system

## Related PRs

### Primary Dark Mode PRs

1. **PR #667** - "feat(dark-mode): Complete Systematic Dark Mode Expansion"
   - Status: MERGED (2026-01-13)
   - URL: https://github.com/grunny5/findconstructionstaffing/pull/667
   - **4 commits**:
     - `1007e97` - feat(dark-mode): Complete systematic dark mode expansion across site
     - `5f240b6` - fix(dark-mode): Remove opacity modifiers from @apply directive
     - `0bb385b` - **fix(dark-mode): Move industrial CSS variables into @layer base scope** ⭐
     - `68798c0` - fix(ui): Add hover feedback to .modern-button-secondary

2. **PR #666** - "feat(dark-mode): Proof of Concept - Header Component"
   - Status: MERGED (2026-01-13)
   - URL: https://github.com/grunny5/findconstructionstaffing/pull/666
   - Initial proof of concept for dark mode

3. **PR #663** - "feat(ui): Phase 2 - Industrial Design Completion & Dark Mode"
   - Status: MERGED (2026-01-12)
   - Implemented ThemeProvider and dark mode infrastructure

## Key Takeaways

1. **CSS Layer Specificity Matters**: Variables outside `@layer` declarations have higher specificity than those inside
2. **Scope Consistency**: Theme variables (light and dark) must be defined in the same CSS layer
3. **Tailwind Architecture**: When using Tailwind's `@layer base`, all base-level variable definitions should be within that layer
4. **Debug Strategy**: When CSS variables don't update, check both selector specificity AND layer positioning
5. **Prevention is Key**: Use pre-commit hooks and code review checklists to catch scope issues early

## References

- **Commit**: 0bb385b45df41d3ffb8b371c95a032fd3869c037
- **PR**: #667
- **Files Modified**: `app/globals.css`
- **Lines Changed**: Moved 58 lines from outside `@layer base` to inside
- **Date**: 2026-01-13
- **Author**: grunny5
- **Reviewer**: coderabbitai

---

**Lesson Learned**: In Tailwind CSS projects using `@layer base` with class-based dark mode, all CSS custom properties must be defined at the same specificity level within the layer system. Variables outside layers have higher specificity and will prevent dark mode overrides from taking effect, even when the `.dark` class is correctly applied to the HTML element.
