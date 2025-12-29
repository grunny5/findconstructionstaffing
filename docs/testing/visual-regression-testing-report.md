# Visual Regression Testing Report

## Feature: 010 - Industrial Design System

## Task: 6.6 - Visual Regression Testing

**Date:** 2025-12-29
**Tester:** \_\_\_\_\_\_
**Build Version:** \_\_\_\_\_\_

---

## Executive Summary

This document provides a comprehensive visual regression testing framework for the Industrial Brutalist Design System implementation. It serves as both a testing checklist and a baseline documentation for future visual regression tests.

### Testing Methodology

- **Manual Screenshot Comparison:** Capture screenshots at multiple viewport sizes
- **Component State Testing:** Verify hover, focus, and active states
- **Cross-Browser Validation:** Test across Chrome, Firefox, Safari, and Edge
- **Accessibility Verification:** Ensure visual changes maintain WCAG 2.1 AA compliance

---

## Viewport Testing Matrix

| Viewport | Width  | Height | Use Case                     |
| -------- | ------ | ------ | ---------------------------- |
| Mobile S | 320px  | 568px  | iPhone SE, small devices     |
| Mobile L | 414px  | 896px  | iPhone 11 Pro Max            |
| Tablet   | 768px  | 1024px | iPad, Android tablets        |
| Desktop  | 1024px | 768px  | Standard laptop              |
| Wide     | 1400px | 900px  | Large monitors, workstations |

---

## Page Testing Checklist

### Public Pages

#### Homepage (`/`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

**Design Elements to Verify:**

- [ ] Hero section uses Bebas Neue uppercase headings
- [ ] Warm cream background (#FAF8F5) applied
- [ ] 4px orange bottom border on header
- [ ] Agency cards display with industrial styling
- [ ] Footer uses graphite background with proper contrast

---

#### Directory (`/recruiters`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

**Design Elements to Verify:**

- [ ] Filter controls use industrial styling
- [ ] Agency cards have sharp corners (2-3px radius)
- [ ] Pagination uses industrial button styling
- [ ] Search input has 2px borders

---

#### Agency Profile (`/recruiters/[slug]`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

**Design Elements to Verify:**

- [ ] Agency name uses Bebas Neue display font
- [ ] Stats cards have industrial styling
- [ ] Trade badges use proper colors
- [ ] Contact buttons use orange primary color
- [ ] "Claim This Listing" button properly styled

---

#### Claim Listing (`/claim-listing`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

**Design Elements to Verify:**

- [ ] Hero section has graphite background with orange border
- [ ] Form cards have proper industrial styling
- [ ] Input fields have 2px borders
- [ ] Labels use uppercase styling
- [ ] Error states use industrial orange color

---

#### Request Labor (`/request-labor`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

**Design Elements to Verify:**

- [ ] Form layout uses industrial card styling
- [ ] Trade selection uses industrial checkboxes
- [ ] Submit button uses primary orange styling
- [ ] Validation errors display correctly

---

### Authentication Pages

#### Login (`/login`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

**Design Elements to Verify:**

- [ ] Form container uses industrial card styling
- [ ] Email/password inputs properly styled
- [ ] Primary button uses orange color
- [ ] Links use proper hover states

---

#### Signup (`/signup`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

---

#### Forgot Password (`/forgot-password`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

---

#### Reset Password (`/reset-password`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

---

### Settings Pages

#### Settings Main (`/settings`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

**Design Elements to Verify:**

- [ ] Sidebar uses industrial styling
- [ ] Active state uses orange indicator
- [ ] Cards have sharp corners

---

#### Settings Notifications (`/settings/notifications`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

**Design Elements to Verify:**

- [ ] Switch components use industrial orange when active
- [ ] Labels use proper typography

---

### Dashboard Pages (Authenticated)

#### Agency Dashboard (`/dashboard/agency/[slug]`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

**Design Elements to Verify:**

- [ ] Sidebar navigation uses industrial styling
- [ ] Stats cards have proper industrial design
- [ ] Profile completion widget uses industrial colors
- [ ] Charts/graphs follow color system
- [ ] Action buttons use proper styling

---

### Messages Pages

#### Messages Inbox (`/messages`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

---

#### Conversation Thread (`/messages/conversations/[id]`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

---

### Admin Pages

#### Admin Claims (`/admin/claims`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

---

#### Admin Users (`/admin/users`)

| Viewport | Industrial Styling Applied | Layout Correct | No Visual Regressions | Notes |
| -------- | -------------------------- | -------------- | --------------------- | ----- |
| Mobile S | [ ]                        | [ ]            | [ ]                   |       |
| Mobile L | [ ]                        | [ ]            | [ ]                   |       |
| Tablet   | [ ]                        | [ ]            | [ ]                   |       |
| Desktop  | [ ]                        | [ ]            | [ ]                   |       |
| Wide     | [ ]                        | [ ]            | [ ]                   |       |

---

## Component States Testing

### Buttons

| Component          | Default | Hover | Focus | Active | Disabled | Notes |
| ------------------ | ------- | ----- | ----- | ------ | -------- | ----- |
| Primary Button     | [ ]     | [ ]   | [ ]   | [ ]    | [ ]      |       |
| Secondary Button   | [ ]     | [ ]   | [ ]   | [ ]    | [ ]      |       |
| Outline Button     | [ ]     | [ ]   | [ ]   | [ ]    | [ ]      |       |
| Ghost Button       | [ ]     | [ ]   | [ ]   | [ ]    | [ ]      |       |
| Destructive Button | [ ]     | [ ]   | [ ]   | [ ]    | [ ]      |       |

**Verification Points:**

- [ ] Hover state shows darker orange (#C56A00)
- [ ] Focus state shows orange ring (`ring-industrial-orange`)
- [ ] Active state provides visual feedback
- [ ] Disabled state shows reduced opacity

---

### Form Inputs

| Component  | Default | Focus | Error | Disabled | Filled | Notes |
| ---------- | ------- | ----- | ----- | -------- | ------ | ----- |
| Text Input | [ ]     | [ ]   | [ ]   | [ ]      | [ ]    |       |
| Textarea   | [ ]     | [ ]   | [ ]   | [ ]      | [ ]    |       |
| Select     | [ ]     | [ ]   | [ ]   | [ ]      | [ ]    |       |
| Checkbox   | [ ]     | [ ]   | N/A   | [ ]      | [ ]    |       |
| Radio      | [ ]     | [ ]   | N/A   | [ ]      | [ ]    |       |
| Switch     | [ ]     | [ ]   | N/A   | [ ]      | [ ]    |       |

**Verification Points:**

- [ ] Focus ring uses `ring-industrial-orange`
- [ ] Error state uses industrial orange for border/text
- [ ] 2px solid borders on all inputs
- [ ] Checked states use industrial orange

---

### Navigation Elements

| Component       | Default | Hover | Active | Focus | Notes |
| --------------- | ------- | ----- | ------ | ----- | ----- |
| Header Nav Link | [ ]     | [ ]   | [ ]    | [ ]   |       |
| Sidebar Item    | [ ]     | [ ]   | [ ]    | [ ]   |       |
| Footer Link     | [ ]     | [ ]   | N/A    | [ ]   |       |
| Breadcrumb      | [ ]     | [ ]   | [ ]    | [ ]   |       |

**Verification Points:**

- [ ] Hover states show color change
- [ ] Active states show orange indicator
- [ ] Focus states visible for keyboard navigation

---

### Cards & Containers

| Component       | Default | Hover | Selected | Notes |
| --------------- | ------- | ----- | -------- | ----- |
| Agency Card     | [ ]     | [ ]   | N/A      |       |
| Stats Card      | [ ]     | N/A   | N/A      |       |
| Form Card       | [ ]     | N/A   | N/A      |       |
| Dialog/Modal    | [ ]     | N/A   | N/A      |       |
| Sheet (Sidebar) | [ ]     | N/A   | N/A      |       |

**Verification Points:**

- [ ] Sharp corners (2-3px radius)
- [ ] 2px borders where applicable
- [ ] Proper shadow elevation
- [ ] Hover effects on interactive cards

---

### Tabs & Toggles

| Component   | Default | Hover | Active | Focus | Notes |
| ----------- | ------- | ----- | ------ | ----- | ----- |
| Tab Item    | [ ]     | [ ]   | [ ]    | [ ]   |       |
| Toggle Item | [ ]     | [ ]   | [ ]    | [ ]   |       |

**Verification Points:**

- [ ] Active tab shows orange styling
- [ ] Focus ring uses industrial orange
- [ ] Toggle active state uses industrial orange

---

## Industrial Design System Verification

### Color Palette Application

| Element              | Expected Color | Verified | Notes |
| -------------------- | -------------- | -------- | ----- |
| Primary buttons      | #E07B00        | [ ]      |       |
| Primary button hover | #C56A00        | [ ]      |       |
| Page backgrounds     | #FAF8F5        | [ ]      |       |
| Card backgrounds     | #FFFFFF        | [ ]      |       |
| Dark sections        | #1A1A1A        | [ ]      |       |
| Body text            | #1A1A1A        | [ ]      |       |
| Secondary text       | #4A4A4A        | [ ]      |       |
| Muted text           | #757575        | [ ]      |       |
| Borders              | #D1D1D1        | [ ]      |       |
| Focus rings          | #E07B00        | [ ]      |       |
| Error states         | #E07B00        | [ ]      |       |

---

### Typography Application

| Element            | Font          | Weight | Style     | Verified | Notes |
| ------------------ | ------------- | ------ | --------- | -------- | ----- |
| H1 Headings        | Bebas Neue    | 400    | Uppercase | [ ]      |       |
| H2 Headings        | Bebas Neue    | 400    | Uppercase | [ ]      |       |
| H3 Headings        | Bebas Neue    | 400    | Uppercase | [ ]      |       |
| Body Text          | Barlow        | 400    | Normal    | [ ]      |       |
| Button Text        | Barlow        | 600    | Uppercase | [ ]      |       |
| Labels             | Barlow        | 500    | Uppercase | [ ]      |       |
| Decorative (Logos) | Libre Barcode | 400    | Normal    | [ ]      |       |

---

### Border & Corner Verification

| Element   | Border Width | Border Radius | Verified | Notes |
| --------- | ------------ | ------------- | -------- | ----- |
| Buttons   | N/A          | 2-3px         | [ ]      |       |
| Inputs    | 2px          | 2-3px         | [ ]      |       |
| Cards     | 2px (accent) | 2-3px         | [ ]      |       |
| Header    | 4px bottom   | 0             | [ ]      |       |
| Nav items | 3px bottom   | 0             | [ ]      |       |

---

## Intentional Changes Documentation

### Summary of Design Changes

The following visual changes were intentionally made as part of the Industrial Brutalist Design System:

| Change Category | Before           | After                         | Intentional |
| --------------- | ---------------- | ----------------------------- | ----------- |
| Typography      | Inter/Roboto     | Bebas Neue + Barlow           | Yes         |
| Background      | Pure white       | Warm cream (#FAF8F5)          | Yes         |
| Corners         | Rounded (8-12px) | Sharp (2-3px)                 | Yes         |
| Borders         | 1px subtle       | 2px bold                      | Yes         |
| Primary Color   | Blue/Generic     | Industrial Orange (#E07B00)   | Yes         |
| Headings        | Mixed case       | Uppercase with tight tracking | Yes         |
| Focus States    | Browser default  | Orange ring                   | Yes         |

---

## Issues Found

| #   | Page/Component | Description | Severity | Status | Resolution |
| --- | -------------- | ----------- | -------- | ------ | ---------- |
| 1   |                |             |          |        |            |
| 2   |                |             |          |        |            |
| 3   |                |             |          |        |            |

**Severity Levels:**

- **Critical:** Prevents core functionality or major visual breakage
- **Major:** Significant visual inconsistency
- **Minor:** Small visual discrepancy
- **Cosmetic:** Stylistic preference

---

## Visual Regression Baseline

This report establishes the visual baseline for the Industrial Brutalist Design System as of 2025-12-29. All future visual regression tests should compare against this baseline.

### Baseline Screenshots Location

Screenshots should be captured and stored in:
`/docs/testing/screenshots/industrial-design-baseline/`

### Recommended Directory Structure

```plaintext
screenshots/
├── industrial-design-baseline/
│   ├── homepage/
│   │   ├── mobile-320.png
│   │   ├── mobile-414.png
│   │   ├── tablet-768.png
│   │   ├── desktop-1024.png
│   │   └── wide-1400.png
│   ├── directory/
│   │   └── ...
│   ├── agency-profile/
│   │   └── ...
│   └── ... (other pages)
└── component-states/
    ├── buttons/
    ├── inputs/
    └── navigation/
```

---

## Sign-Off

| Role      | Name | Date | Signature |
| --------- | ---- | ---- | --------- |
| QA Tester |      |      |           |
| QA Lead   |      |      |           |
| Designer  |      |      |           |
| Tech Lead |      |      |           |

---

## Appendix: Automated Testing Setup (Future Enhancement)

### Recommended Tools

1. **Percy (by BrowserStack):** Visual testing and review platform
2. **Chromatic (by Storybook):** Visual regression for component libraries
3. **Playwright:** End-to-end testing with screenshot capabilities
4. **BackstopJS:** Visual regression testing with configurable viewports

### Playwright Screenshot Script (Example)

```typescript
// scripts/visual-regression/capture-baseline.ts
import { chromium, devices } from 'playwright';

const viewports = [
  { name: 'mobile-320', ...devices['iPhone SE'] },
  { name: 'tablet-768', viewport: { width: 768, height: 1024 } },
  { name: 'desktop-1024', viewport: { width: 1024, height: 768 } },
  { name: 'wide-1400', viewport: { width: 1400, height: 900 } },
];

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'directory', path: '/recruiters' },
  { name: 'claim-listing', path: '/claim-listing' },
  { name: 'request-labor', path: '/request-labor' },
  { name: 'login', path: '/login' },
  { name: 'signup', path: '/signup' },
];

async function captureBaseline() {
  const browser = await chromium.launch();

  for (const viewport of viewports) {
    const context = await browser.newContext(viewport);
    const page = await context.newPage();

    for (const pageConfig of pages) {
      await page.goto(`http://localhost:3000${pageConfig.path}`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `docs/testing/screenshots/industrial-design-baseline/${pageConfig.name}/${viewport.name}.png`,
        fullPage: true,
      });
    }

    await context.close();
  }

  await browser.close();
}

captureBaseline();
```

---

## Notes

- This document should be updated whenever significant visual changes are made
- All component states should be tested during major UI updates
- Visual regression tests should be run before each production deployment
- Screenshots should be versioned alongside code changes
