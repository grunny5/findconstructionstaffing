# Cross-Browser Testing Checklist

## Feature: 010 - Industrial Design System

## Task: 6.3 - Final Cross-Browser and Cross-Device Testing

**Date:** 2025-12-29
**Tester:** **\*\***\_\_\_**\*\***
**Build Version:** **\*\***\_\_\_**\*\***

---

## Pre-Testing Verification (Automated)

| Check                                        | Status | Notes                     |
| -------------------------------------------- | ------ | ------------------------- |
| All 3,579 automated tests passing            | PASS   | Verified 2025-12-29       |
| Production build successful                  | PASS   | No errors                 |
| TypeScript type check passing                | PASS   | No type errors            |
| ESLint check passing                         | PASS   | No linting errors         |
| Font loading configured with `display: swap` | PASS   | Prevents FOUT             |
| Fonts self-hosted via Next.js                | PASS   | No external font requests |

---

## Browser Testing Matrix

### Desktop Browsers

#### Chrome (Latest 2 versions)

| Page                                   | Renders Correctly | Fonts Load | No Layout Shift | Notes |
| -------------------------------------- | ----------------- | ---------- | --------------- | ----- |
| Homepage (`/`)                         | [ ]               | [ ]        | [ ]             |       |
| Directory (`/recruiters`)              | [ ]               | [ ]        | [ ]             |       |
| Agency Profile (`/recruiters/[slug]`)  | [ ]               | [ ]        | [ ]             |       |
| Claim Listing (`/claim-listing`)       | [ ]               | [ ]        | [ ]             |       |
| Request Labor (`/request-labor`)       | [ ]               | [ ]        | [ ]             |       |
| Settings (`/settings`)                 | [ ]               | [ ]        | [ ]             |       |
| Dashboard (`/dashboard/agency/[slug]`) | [ ]               | [ ]        | [ ]             |       |
| Login/Signup                           | [ ]               | [ ]        | [ ]             |       |

#### Firefox (Latest 2 versions)

| Page                                   | Renders Correctly | Fonts Load | No Layout Shift | Notes |
| -------------------------------------- | ----------------- | ---------- | --------------- | ----- |
| Homepage (`/`)                         | [ ]               | [ ]        | [ ]             |       |
| Directory (`/recruiters`)              | [ ]               | [ ]        | [ ]             |       |
| Agency Profile (`/recruiters/[slug]`)  | [ ]               | [ ]        | [ ]             |       |
| Claim Listing (`/claim-listing`)       | [ ]               | [ ]        | [ ]             |       |
| Request Labor (`/request-labor`)       | [ ]               | [ ]        | [ ]             |       |
| Settings (`/settings`)                 | [ ]               | [ ]        | [ ]             |       |
| Dashboard (`/dashboard/agency/[slug]`) | [ ]               | [ ]        | [ ]             |       |
| Login/Signup                           | [ ]               | [ ]        | [ ]             |       |

#### Safari (Latest 2 versions)

| Page                                   | Renders Correctly | Fonts Load | No Layout Shift | Notes |
| -------------------------------------- | ----------------- | ---------- | --------------- | ----- |
| Homepage (`/`)                         | [ ]               | [ ]        | [ ]             |       |
| Directory (`/recruiters`)              | [ ]               | [ ]        | [ ]             |       |
| Agency Profile (`/recruiters/[slug]`)  | [ ]               | [ ]        | [ ]             |       |
| Claim Listing (`/claim-listing`)       | [ ]               | [ ]        | [ ]             |       |
| Request Labor (`/request-labor`)       | [ ]               | [ ]        | [ ]             |       |
| Settings (`/settings`)                 | [ ]               | [ ]        | [ ]             |       |
| Dashboard (`/dashboard/agency/[slug]`) | [ ]               | [ ]        | [ ]             |       |
| Login/Signup                           | [ ]               | [ ]        | [ ]             |       |

#### Edge (Latest 2 versions)

| Page                                   | Renders Correctly | Fonts Load | No Layout Shift | Notes |
| -------------------------------------- | ----------------- | ---------- | --------------- | ----- |
| Homepage (`/`)                         | [ ]               | [ ]        | [ ]             |       |
| Directory (`/recruiters`)              | [ ]               | [ ]        | [ ]             |       |
| Agency Profile (`/recruiters/[slug]`)  | [ ]               | [ ]        | [ ]             |       |
| Claim Listing (`/claim-listing`)       | [ ]               | [ ]        | [ ]             |       |
| Request Labor (`/request-labor`)       | [ ]               | [ ]        | [ ]             |       |
| Settings (`/settings`)                 | [ ]               | [ ]        | [ ]             |       |
| Dashboard (`/dashboard/agency/[slug]`) | [ ]               | [ ]        | [ ]             |       |
| Login/Signup                           | [ ]               | [ ]        | [ ]             |       |

---

### Mobile Browsers

#### iOS Safari (iPhone)

| Page                                   | Renders Correctly | Touch Works | Responsive | Notes |
| -------------------------------------- | ----------------- | ----------- | ---------- | ----- |
| Homepage (`/`)                         | [ ]               | [ ]         | [ ]        |       |
| Directory (`/recruiters`)              | [ ]               | [ ]         | [ ]        |       |
| Agency Profile (`/recruiters/[slug]`)  | [ ]               | [ ]         | [ ]        |       |
| Claim Listing (`/claim-listing`)       | [ ]               | [ ]         | [ ]        |       |
| Request Labor (`/request-labor`)       | [ ]               | [ ]         | [ ]        |       |
| Settings (`/settings`)                 | [ ]               | [ ]         | [ ]        |       |
| Dashboard (`/dashboard/agency/[slug]`) | [ ]               | [ ]         | [ ]        |       |
| Login/Signup                           | [ ]               | [ ]         | [ ]        |       |

#### Android Chrome

| Page                                   | Renders Correctly | Touch Works | Responsive | Notes |
| -------------------------------------- | ----------------- | ----------- | ---------- | ----- |
| Homepage (`/`)                         | [ ]               | [ ]         | [ ]        |       |
| Directory (`/recruiters`)              | [ ]               | [ ]         | [ ]        |       |
| Agency Profile (`/recruiters/[slug]`)  | [ ]               | [ ]         | [ ]        |       |
| Claim Listing (`/claim-listing`)       | [ ]               | [ ]         | [ ]        |       |
| Request Labor (`/request-labor`)       | [ ]               | [ ]         | [ ]        |       |
| Settings (`/settings`)                 | [ ]               | [ ]         | [ ]        |       |
| Dashboard (`/dashboard/agency/[slug]`) | [ ]               | [ ]         | [ ]        |       |
| Login/Signup                           | [ ]               | [ ]         | [ ]        |       |

---

## Industrial Design System Specific Checks

### Typography

| Check                                       | Chrome | Firefox | Safari | Edge | iOS | Android |
| ------------------------------------------- | ------ | ------- | ------ | ---- | --- | ------- |
| Bebas Neue loads for headings               | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Barlow loads for body text                  | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Libre Barcode loads for decorative elements | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Uppercase text displays correctly           | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Letter spacing is consistent                | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |

### Colors

| Check                                              | Chrome | Firefox | Safari | Edge | iOS | Android |
| -------------------------------------------------- | ------ | ------- | ------ | ---- | --- | ------- |
| Industrial orange (#E07B00) displays correctly     | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Graphite colors display correctly                  | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Navy accents display correctly                     | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Warm cream background (#FAF8F5) displays correctly | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |

### Borders & Corners

| Check                                         | Chrome | Firefox | Safari | Edge | iOS | Android |
| --------------------------------------------- | ------ | ------- | ------ | ---- | --- | ------- |
| 2px borders render correctly                  | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Sharp corners (2-3px radius) render correctly | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Card borders are consistent                   | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |

### Interactive Elements

| Check                              | Chrome | Firefox | Safari | Edge | iOS | Android |
| ---------------------------------- | ------ | ------- | ------ | ---- | --- | ------- |
| Orange focus states visible        | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Hover states work correctly        | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Button clicks are responsive       | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |
| Form inputs accept input correctly | [ ]    | [ ]     | [ ]    | [ ]  | [ ] | [ ]     |

---

## Performance Checks

| Metric                                   | Target  | Chrome | Firefox | Safari | Edge |
| ---------------------------------------- | ------- | ------ | ------- | ------ | ---- |
| LCP (Largest Contentful Paint)           | < 2.5s  |        |         |        |      |
| FID (First Input Delay)                  | < 100ms |        |         |        |      |
| CLS (Cumulative Layout Shift)            | < 0.1   |        |         |        |      |
| No visible FOUT (Flash of Unstyled Text) | Yes     | [ ]    | [ ]     | [ ]    | [ ]  |

---

## Issues Found

| #   | Browser | Page | Description | Severity | Status |
| --- | ------- | ---- | ----------- | -------- | ------ |
| 1   |         |      |             |          |        |
| 2   |         |      |             |          |        |
| 3   |         |      |             |          |        |

**Severity Levels:**

- **Critical:** Prevents core functionality
- **Major:** Significant visual or functional issue
- **Minor:** Small visual discrepancy
- **Cosmetic:** Stylistic preference

---

## Sign-Off

| Role      | Name | Date | Signature |
| --------- | ---- | ---- | --------- |
| QA Tester |      |      |           |
| QA Lead   |      |      |           |
| Developer |      |      |           |

---

## Notes

- All fonts use `display: swap` to prevent Flash of Unstyled Text (FOUT)
- Fonts are self-hosted via Next.js font optimization (no external font requests)
- CSS uses standard properties with wide browser support
- Tailwind CSS handles vendor prefixes automatically
- All interactive elements have proper focus states for accessibility

---

## Testing Tools Recommended

- **BrowserStack** - Cross-browser testing platform
- **Chrome DevTools** - Performance auditing, device emulation
- **Firefox Developer Tools** - CSS debugging
- **Safari Web Inspector** - iOS debugging
- **Lighthouse** - Performance and accessibility auditing
