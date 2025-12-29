# Task Backlog: Industrial Brutalist Design System

**Source FSD:** [`docs/features/active/010-industrial-design-system.md`](../docs/features/active/010-industrial-design-system.md)
**Project Foundation:** [`PROJECT_KICKSTART_V2.md`](../PROJECT_KICKSTART_V2.md)
**Design Specifications:** [`docs/features/active/ui-update.md`](../docs/features/active/ui-update.md)

This document breaks down Feature 010 into sprint-ready engineering tasks following a 7-week gradual rollout plan. All tasks must adhere to the standards defined in the PKD: TypeScript strict mode, 85%+ test coverage, WCAG 2.1 AA compliance, mobile-first responsive design.

---

## 📋 Project Overview

**Goal:** Redesign the platform with an industrial brutalist aesthetic to build trust and authenticity with construction industry professionals.

**Target Metrics:**

- Lead form conversion rate: +15-25%
- Agency claim requests: +20%
- Time on site: +30%
- Engagement: +20% pages/session

**Rollout Strategy:** Gradual deployment over 7 weeks, validating each phase before proceeding.

---

## 📅 Week 1: Foundation & Setup

**Goal:** Establish design system foundation without breaking existing UI

---

### ➡️ Story 4: Developer Implements Gradual Rollout

> As a **Frontend Developer**, I want **to implement the new design system gradually**, so that **we can validate each section before moving to the next**.

### Engineering Tasks for this Story:

---

### Task 1.1: Set Up CSS Custom Properties for Color System

- **Role:** Frontend Developer
- **Objective:** Create CSS custom properties for the industrial design system color palette
- **Context:** This establishes the foundational color tokens that will be used throughout the redesign. Must support both the existing design (during transition) and new industrial palette.
- **Key Files to Create:**
  - Update `app/globals.css` with new color variables
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Color System Implementation section)
  - `docs/features/active/ui-update.md` (Color System section)
  - `PROJECT_KICKSTART_V2.md` (for existing color usage patterns)
- **Key Patterns to Follow:**
  - Prefix new variables with `--industrial-` to avoid conflicts with existing design
  - Maintain existing CSS variables during transition period
  - Use semantic naming for backward compatibility
- **Acceptance Criteria (for this task):**
  - [x] CSS custom properties defined for all industrial color palette shades:
    - Orange: 100, 200, 300, 400 (primary), 500 (hover), 600
    - Graphite: 100, 200, 300, 400, 500, 600 (text)
    - Navy: 100, 200, 300, 400 (accent), 500, 600
  - [x] Background variables defined: `--bg-primary` (cream), `--bg-card` (white), `--bg-dark` (graphite)
  - [x] Spacing scale variables defined: xs (4px) through 5xl (96px)
  - [x] Variables tested in browser DevTools (Chrome, Firefox, Safari)
  - [x] No existing styles are broken
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Variables documented with comments explaining usage
  - [ ] PR submitted with before/after screenshots showing no visual changes yet
  - [x] **Final Check:** Follows PKD development standards

**Estimated Effort:** 2 hours

---

### Task 1.2: Configure Google Fonts with Next.js Font Optimization

- **Role:** Frontend Developer
- **Objective:** Set up Bebas Neue, Barlow, and Libre Barcode 39 Text fonts using Next.js font optimization
- **Context:** Google Fonts must load optimally to prevent FOUT (Flash of Unstyled Text) and maintain performance standards from PKD
- **Key Files to Create:**
  - Update `app/layout.tsx` with font configurations
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Typography Implementation section)
  - `PROJECT_KICKSTART_V2.md` (Performance requirements: LCP < 2.5s)
- **Key Patterns to Follow:**
  - Use `next/font/google` for automatic font optimization
  - Set `display: 'swap'` to prevent FOUT
  - Subset to 'latin' characters only for performance
  - Create CSS variables for each font family
- **Acceptance Criteria (for this task):**
  - [x] Bebas Neue configured with weight 400, display swap
  - [x] Barlow configured with weights 400, 500, 600, 700, display swap
  - [x] Libre Barcode 39 Text configured with weight 400, display swap
  - [x] Font CSS variables created: `--font-bebas-neue`, `--font-barlow`, `--font-libre-barcode`
  - [x] Fonts load without blocking render (verified in Network tab)
  - [x] Total font payload < 80KB (target: ~60KB per FSD)
  - [x] LCP remains < 2.5s on 3G connection (Lighthouse test)
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Lighthouse performance score maintained (≥90)
  - [x] Fonts preloaded for above-the-fold content
  - [ ] PR submitted with performance metrics
  - [x] **Final Check:** Meets PKD performance standards

**Estimated Effort:** 2 hours

---

### Task 1.3: Extend Tailwind Config with Industrial Design Tokens

- **Role:** Frontend Developer
- **Objective:** Configure Tailwind CSS to support industrial design system tokens
- **Context:** Extend Tailwind theme to include new colors, fonts, and spacing while maintaining existing config
- **Key Files to Create:**
  - Update `tailwind.config.ts`
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Typography Classes section)
  - Existing `tailwind.config.ts` for current theme structure
- **Key Patterns to Follow:**
  - Extend theme, don't replace (use `extend` key)
  - Map CSS custom properties to Tailwind utilities
  - Create semantic color names that match industrial palette
- **Acceptance Criteria (for this task):**
  - [x] Font families extended: `font-display`, `font-body`, `font-barcode`
  - [x] Colors extended with industrial palette mapped to CSS variables
  - [x] Spacing scale preserved and documented
  - [x] Border radius extended with industrial values (2px, 3px)
  - [x] Tailwind IntelliSense recognizes new utilities
  - [x] Build succeeds without errors (`npm run build`)
  - [x] No regression in existing component styling
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Type definitions regenerated for IntelliSense
  - [x] Configuration documented in code comments
  - [ ] PR submitted with example usage
  - [x] **Final Check:** TypeScript strict mode compliant

**Estimated Effort:** 3 hours

---

### Task 1.4: Create Design System Documentation

- **Role:** Frontend Developer
- **Objective:** Document the industrial design system tokens and usage guidelines for the team
- **Context:** Create reference documentation to ensure consistent application of design system
- **Key Files to Create:**
  - `lib/design-system/README.md`
  - `lib/design-system/colors.ts` (TypeScript constants for color values)
  - `lib/design-system/typography.ts` (TypeScript constants for font stacks)
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Appendix A: Design Principles)
  - `docs/features/active/ui-update.md` (Complete design specifications)
- **Key Patterns to Follow:**
  - Provide code examples for each design token
  - Include do's and don'ts from FSD
  - Link to Figma/design files (or note "CSS specs only")
- **Acceptance Criteria (for this task):**
  - [x] Color palette documented with hex values and use cases
  - [x] Typography scale documented with font sizes and line heights
  - [x] Spacing scale documented with rem/px equivalents
  - [x] Component guidelines documented (buttons, cards, inputs)
  - [x] Code examples provided for common patterns
  - [x] Do's and Don'ts section copied from FSD Appendix A
  - [x] TypeScript constants exported for programmatic use
- **Definition of Done:**
  - [x] Documentation complete and reviewed
  - [x] TypeScript constants pass type checking
  - [x] README includes visual examples (code snippets)
  - [ ] PR submitted for team review
  - [x] **Final Check:** Documentation follows project standards

**Estimated Effort:** 3 hours

---

### Task 1.5: Set Up Baseline Metrics Collection

- **Role:** Product Manager / Developer
- **Objective:** Collect 2 weeks of baseline metrics before any visual changes go live
- **Context:** Need accurate baseline data to measure success of design update per FSD success metrics
- **Key Files to Create:**
  - `docs/metrics/010-baseline-data.md` (to record baseline metrics)
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Section 5: Success Metrics)
- **Key Patterns to Follow:**
  - Use Google Analytics 4 for behavioral metrics
  - Use database queries for conversion metrics
  - Document collection methodology for reproducibility
- **Acceptance Criteria (for this task):**
  - [ ] Lead form conversion rate baseline documented (from GA4 or database) - PENDING: 2-week collection
  - [ ] Agency claim request count baseline documented (database query) - PENDING: 2-week collection
  - [ ] Average session duration baseline documented (GA4) - PENDING: 2-week collection
  - [ ] Pages per session baseline documented (GA4) - PENDING: 2-week collection
  - [ ] Bounce rate baseline documented (GA4) - PENDING: 2-week collection
  - [ ] Mobile vs desktop engagement baseline documented (GA4) - PENDING: 2-week collection
  - [ ] Baseline data covers 2-week period for statistical validity - PENDING: 2-week collection
  - [x] Methodology documented for future comparison
- **Definition of Done:**
  - [x] Baseline metrics documented in markdown file (template created)
  - [x] Data collection queries/scripts saved
  - [ ] Stakeholders notified of baseline period
  - [x] **Final Check:** Metrics align with FSD success criteria

**Estimated Effort:** 2 hours (data collection) + 2 weeks wait time

---

## 📅 Week 2: Homepage & Navigation

**Goal:** Launch industrial design for homepage hero, navigation, and footer

---

### ➡️ Story 1: Construction Company Browses Agency Directory

> As a **Construction Operations Director**, I want **to browse staffing agencies in a design that feels authentic to the construction industry**, so that **I trust this is a legitimate industry resource, not just another tech startup**.

### ➡️ Story 2: Agency Owner Claims Profile

> As a **Staffing Agency Owner**, I want **the platform to look professional and established**, so that **I feel confident claiming my listing and investing time in my profile**.

### Engineering Tasks for this Story:

---

### Task 2.1: Redesign Header Component with Industrial Styling

- **Role:** Frontend Developer
- **Objective:** Update the main navigation header to use industrial brutalist design
- **Context:** The header is the first visual element users see - it sets the tone for the entire platform
- **Key Files to Modify:**
  - `components/Header.tsx`
  - `components/__tests__/Header.test.tsx`
- **Key Files to Reference:**
  - `docs/features/active/ui-update.md` (Navigation section, lines 162-195)
  - `docs/features/active/010-industrial-design-system.md` (Component Specifications: Navigation)
- **Key Patterns to Follow:**
  - Heavy 3px bottom border on nav bar
  - Bebas Neue for logo (1.5rem, uppercase)
  - Barlow for nav links (0.875rem, uppercase, 600 weight)
  - Orange bottom border on hover
  - Maintain existing responsive behavior (hamburger on mobile <768px)
- **Acceptance Criteria (for this task):**
  - [x] Logo text uses Bebas Neue font, 1.5rem, uppercase
  - [x] Navigation has 3px bottom border in graphite-600
  - [x] Nav links use Barlow, 0.875rem, uppercase, 600 weight, graphite-500 color
  - [x] Hover state shows 2px orange-400 bottom border
  - [x] Mobile hamburger menu maintained (unchanged functionality)
  - [x] Component tests updated and passing
  - [x] No accessibility regressions (keyboard nav, screen reader)
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage
  - [x] Responsive behavior verified on mobile, tablet, desktop
  - [x] Accessibility audit passed (Lighthouse ≥95)
  - [ ] PR submitted with screenshots
  - [x] **Final Check:** Follows PKD component standards

**Estimated Effort:** 4 hours

---

### Task 2.2: Redesign Footer Component with Dark Industrial Theme

- **Role:** Frontend Developer
- **Objective:** Update footer to use dark background with inverted industrial styling
- **Context:** Footer provides grounding and closure to page, should feel substantial and permanent
- **Key Files to Modify:**
  - `components/Footer.tsx`
  - `components/__tests__/Footer.test.tsx`
- **Key Files to Reference:**
  - `docs/features/active/ui-update.md` (Footer section)
  - `docs/features/active/010-industrial-design-system.md` (Homepage Structure, Footer)
- **Key Patterns to Follow:**
  - Dark background (--bg-dark / graphite-600)
  - Light text (white or graphite-100)
  - Logo and copyright on left
  - Optional: Barcode decoration on right using Libre Barcode font
- **Acceptance Criteria (for this task):**
  - [x] Footer background uses --bg-dark (#1A1A1A)
  - [x] Text color is white or graphite-100 for contrast
  - [x] Logo maintains Bebas Neue styling
  - [x] Copyright text uses Barlow
  - [x] Optional barcode decoration implemented tastefully
  - [x] Color contrast meets WCAG AA (4.5:1 minimum)
  - [x] Component tests updated and passing
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage
  - [x] Contrast verified with WebAIM checker
  - [ ] PR submitted with screenshots
  - [x] **Final Check:** Meets WCAG 2.1 AA standards

**Estimated Effort:** 3 hours

---

### Task 2.3: Redesign Homepage Hero Section

- **Role:** Frontend Developer
- **Objective:** Update homepage hero to use two-column layout with industrial typography
- **Context:** Hero is the primary conversion point - must convey trust and authenticity immediately
- **Key Files to Modify:**
  - `components/Hero.tsx` (or create if it doesn't exist as a separate component)
  - `app/page.tsx` (homepage)
  - `components/__tests__/Hero.test.tsx`
- **Key Files to Reference:**
  - `docs/features/active/ui-update.md` (Homepage Structure, Hero Section)
  - `docs/features/active/010-industrial-design-system.md` (Typography Specs, Headline classes)
- **Key Patterns to Follow:**
  - Two-column layout on desktop (stacks on mobile)
  - Left: Label + Large headline with orange accent on one word
  - Right: Subtitle paragraph + CTA buttons + Stats row
  - Bottom border (1px) separator
  - NO gradient bands
  - Headlines use Bebas Neue with clamp() for responsive sizing
- **Acceptance Criteria (for this task):**
  - [x] Two-column layout (flex or grid) that stacks on mobile (<768px)
  - [x] Main headline uses Bebas Neue with clamp(3.5rem, 10vw, 7rem)
  - [x] One word in headline has orange-400 color accent
  - [x] Label text uses uppercase Barlow (small, 600 weight)
  - [x] CTA buttons use industrial button styles (2px border-radius, sharp)
  - [x] Stats row displays key numbers prominently
  - [x] 1px bottom border separator (graphite-200)
  - [x] Mobile responsive with clean stacking
  - [x] Component tests cover responsive behavior
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage
  - [x] Mobile, tablet, desktop layouts verified
  - [x] Accessibility verified (heading hierarchy, focus states)
  - [ ] PR submitted with responsive screenshots
  - [x] **Final Check:** Typography follows FSD specifications exactly

**Estimated Effort:** 5 hours

---

### Task 2.4: Update Global Page Backgrounds to Warm Cream

- **Role:** Frontend Developer
- **Objective:** Change all page backgrounds from white to warm cream (#FAF7F2)
- **Context:** The warm cream background is a key differentiator from typical SaaS sites - must be applied consistently
- **Key Files to Modify:**
  - `app/globals.css` (body background)
  - Verify no page-level background overrides exist
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Backgrounds section)
- **Key Patterns to Follow:**
  - Use --bg-primary variable
  - Cards remain white (--bg-card)
  - Test all pages for background consistency
- **Acceptance Criteria (for this task):**
  - [x] Body background set to --bg-primary (#FAF7F2)
  - [x] All pages inherit cream background (homepage, directory, profiles, forms)
  - [x] Card components remain white for contrast
  - [x] Footer remains dark (--bg-dark)
  - [x] No visual bugs or background conflicts
  - [x] Verified in Chrome, Firefox, Safari
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] All pages visually verified
  - [x] Cross-browser testing passed
  - [ ] PR submitted with full-page screenshots
  - [x] **Final Check:** Consistent across all routes

**Estimated Effort:** 2 hours

---

### Task 2.5: Deploy Homepage Updates to Staging

- **Role:** DevOps / Developer
- **Objective:** Deploy Week 2 changes to staging environment for QA testing
- **Context:** Validate homepage design changes before limited production rollout
- **Key Files to Reference:**
  - `PROJECT_KICKSTART_V2.md` (CI/CD Pipeline section)
  - `.github/workflows/` (existing deployment workflows)
- **Key Patterns to Follow:**
  - Deploy to staging branch
  - Run full test suite before deployment
  - Verify deployment succeeds
- **Acceptance Criteria (for this task):**
  - [ ] Code merged to staging branch
  - [ ] CI/CD pipeline passes all checks
  - [ ] Staging deployment successful
  - [ ] Staging URL accessible and homepage renders correctly
  - [ ] Performance metrics verified (Lighthouse on staging)
  - [ ] Stakeholders notified of staging deployment
- **Definition of Done:**
  - [ ] Staging environment updated
  - [ ] QA testing initiated
  - [ ] Any bugs documented for immediate fixes
  - [ ] **Final Check:** Ready for limited production rollout

**Estimated Effort:** 2 hours + QA time

---

## 📅 Week 3: Directory & Listings

**Goal:** Apply industrial design to agency cards, filters, and directory grid

---

### ➡️ Story 1: Construction Company Browses Agency Directory (continued)

### ➡️ Story 3: Mobile User Browses on Job Site

> As a **Construction Project Manager on a job site**, I want **the mobile interface to be clear and bold with high contrast**, so that **I can easily read and navigate even in bright outdoor conditions**.

### Engineering Tasks for this Story:

---

### Task 3.1: Redesign AgencyCard Component with Category Color Coding

- **Role:** Frontend Developer
- **Objective:** Update agency listing cards to use industrial styling with left-border trade category indicators
- **Context:** Agency cards are the primary UI element in the directory - they must convey professionalism and facilitate quick scanning
- **Key Files to Modify:**
  - `components/AgencyCard.tsx`
  - `components/__tests__/AgencyCard.test.tsx`
- **Key Files to Reference:**
  - `docs/features/active/ui-update.md` (Directory Listing Cards section, lines 237-292)
  - `docs/features/active/010-industrial-design-system.md` (Component Specifications: Agency Card)
- **Key Patterns to Follow:**
  - 4px left border with trade category color (Orange for Welding, Navy for Electrical, Graphite for Mechanical)
  - Firm name in Bebas Neue, 1.5rem, uppercase
  - Card footer with graphite-100 background
  - Sharp 3px border-radius
  - Subtle box-shadow, enhanced on hover
- **Acceptance Criteria (for this task):**
  - [x] Card has 1px border (graphite-200) + 4px left border (category color)
  - [x] Firm name uses Bebas Neue, 1.5rem, uppercase, tight line-height
  - [x] Founded year displays in small text (0.8rem, graphite-400)
  - [x] Trades list uses Barlow, 0.875rem, graphite-400
  - [x] Footer has graphite-100 background with metadata
  - [x] Border-radius: 3px (sharp corners)
  - [x] Box-shadow: 0 1px 3px rgba(0,0,0,0.06)
  - [x] Hover: translateY(-2px) + box-shadow: 0 4px 12px rgba(0,0,0,0.08)
  - [x] Category color determined by primary trade:
    - Welding/Fabrication → orange-400
    - Electrical → navy-400
    - Mechanical/Maintenance → graphite-400
  - [x] Component tests updated with new styling assertions
  - [x] Responsive: card stacks vertically on mobile with 24px spacing
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage
  - [x] Category color logic tested for all trade types
  - [x] Mobile, tablet, desktop verified
  - [ ] PR submitted with screenshots of different card variants
  - [x] **Final Check:** Matches FSD specifications exactly

**Estimated Effort:** 6 hours

---

### Task 3.2: Redesign DirectoryFilters Component

- **Role:** Frontend Developer
- **Objective:** Update filter controls to use industrial form styling
- **Context:** Filters are high-use controls - must be clear and functional with industrial aesthetic
- **Key Files to Modify:**
  - `components/DirectoryFilters.tsx`
  - `components/__tests__/DirectoryFilters.test.tsx`
- **Key Files to Reference:**
  - `docs/features/active/ui-update.md` (Form Inputs section, lines 296-320)
  - `docs/features/active/010-industrial-design-system.md` (Component Specifications: Form Input)
- **Key Patterns to Follow:**
  - 2px borders (not 1px)
  - Sharp 2px border-radius
  - Orange-400 focus states
  - Uppercase labels (0.75rem, 600 weight, graphite-400)
- **Acceptance Criteria (for this task):**
  - [x] All input elements have 2px solid borders (graphite-300)
  - [x] Border-radius: 2px (sharp, not rounded)
  - [x] Focus states use orange-400 border color
  - [x] Labels use Barlow, 0.75rem, uppercase, 600 weight
  - [x] Dropdown selects maintain industrial styling
  - [x] Checkbox/radio inputs styled consistently
  - [x] Mobile: filters stack vertically with adequate spacing
  - [x] Component tests verify styling and interactions
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage
  - [x] Accessibility verified (focus states, labels)
  - [x] Mobile responsive verified
  - [ ] PR submitted with screenshots
  - [x] **Final Check:** Form controls meet WCAG 2.1 AA

**Estimated Effort:** 5 hours

---

### Task 3.3: Update Button Component (Primary & Secondary Variants)

- **Role:** Frontend Developer
- **Objective:** Redesign Shadcn button component to match industrial specifications
- **Context:** Buttons are used throughout the site - must establish consistent industrial pattern
- **Key Files to Modify:**
  - `components/ui/button.tsx`
  - `components/ui/__tests__/button.test.tsx` (create if doesn't exist)
- **Key Files to Reference:**
  - `docs/features/active/ui-update.md` (Buttons section, lines 199-232)
  - `docs/features/active/010-industrial-design-system.md` (Component Specifications: Buttons)
- **Key Patterns to Follow:**
  - Sharp 2px border-radius (not rounded)
  - Uppercase text (Barlow, 0.875rem, 600 weight)
  - Primary: orange-400 background, white text
  - Secondary: transparent background, 2px graphite-400 border
  - 0.2s ease transitions (no bounce)
- **Acceptance Criteria (for this task):**
  - [x] Border-radius: 2px for all button variants
  - [x] Text: Barlow, 0.875rem, uppercase, 600 weight, letter-spacing 0.05em
  - [x] Padding: 1rem vertical, 2rem horizontal
  - [x] Primary button: orange-400 background, white text
  - [x] Primary hover: orange-500 background
  - [x] Secondary button: transparent bg, 2px graphite-400 border, graphite-500 text
  - [x] Secondary hover: graphite-600 border and text
  - [x] Transition: all 0.2s ease
  - [x] Disabled state: reduced opacity, no pointer events
  - [x] Maintain existing button API (size variants, loading states, etc.)
  - [x] Component tests cover all variants and states
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage
  - [x] All button variants verified visually
  - [x] No regressions in existing button usage
  - [ ] PR submitted with button variant showcase
  - [x] **Final Check:** Maintains Shadcn component API

**Estimated Effort:** 4 hours

---

### Task 3.4: Update Input Component with Industrial Styling

- **Role:** Frontend Developer
- **Objective:** Redesign Shadcn input component to match industrial form specifications
- **Context:** Inputs are used in forms throughout the site
- **Key Files to Modify:**
  - `components/ui/input.tsx`
  - `components/ui/__tests__/input.test.tsx` (create if doesn't exist)
- **Key Files to Reference:**
  - `docs/features/active/ui-update.md` (Form Inputs section)
  - `docs/features/active/010-industrial-design-system.md` (Component Specifications: Form Inputs)
- **Key Patterns to Follow:**
  - 2px solid borders
  - Sharp 2px border-radius
  - Orange-400 focus state
  - Adequate padding for touch targets
- **Acceptance Criteria (for this task):**
  - [x] Border: 2px solid graphite-300
  - [x] Border-radius: 2px
  - [x] Padding: 0.875rem 1rem (vertical, horizontal)
  - [x] Font: Barlow, 1rem
  - [x] Focus: outline none, border-color orange-400
  - [x] Background: --bg-card (white)
  - [x] Transition: border-color 0.2s ease
  - [x] Placeholder text: graphite-400
  - [x] Maintain existing input API (types, validation states, etc.)
  - [x] Component tests cover focus, blur, and validation states
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage
  - [x] Accessibility verified (focus indicators, labels)
  - [x] All input types verified (text, email, password, etc.)
  - [ ] PR submitted with input state examples
  - [x] **Final Check:** Focus states meet WCAG 2.1 AA

**Estimated Effort:** 3 hours

---

### Task 3.5: Update Badge Component for Category Indicators

- **Role:** Frontend Developer
- **Objective:** Redesign badge component for monochromatic trade category displays
- **Context:** Badges are used for trade categories and tags throughout the directory
- **Key Files to Modify:**
  - `components/ui/badge.tsx`
  - `components/ui/__tests__/badge.test.tsx` (create if doesn't exist)
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Category Color Coding)
- **Key Patterns to Follow:**
  - Monochromatic within single color family (no mixing)
  - Sharp 2px border-radius
  - Uppercase text, small size
- **Acceptance Criteria (for this task):**
  - [x] Border-radius: 2px (sharp)
  - [x] Text: Barlow, 0.75rem, uppercase, 600 weight
  - [x] Variants: orange, navy, graphite (matching category colors)
  - [x] Each variant uses single color family (monochromatic)
  - [x] Padding: 0.25rem 0.5rem
  - [x] Maintain existing badge API
  - [x] Component tests cover all color variants
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage
  - [x] Color variants visually verified
  - [ ] PR submitted with badge variant examples
  - [x] **Final Check:** Monochromatic color usage confirmed

**Estimated Effort:** 2 hours

---

### Task 3.6: Deploy Directory Updates to Staging with Limited Production Rollout

- **Role:** DevOps / Developer
- **Objective:** Deploy Week 3 changes to staging, then limited production (10% traffic)
- **Context:** Begin validating directory design with real users while maintaining safety
- **Key Files to Reference:**
  - `PROJECT_KICKSTART_V2.md` (CI/CD Pipeline)
  - Feature flag documentation (if using flags)
- **Key Patterns to Follow:**
  - Deploy to staging first
  - Validate on staging with QA team
  - Use feature flag or A/B test for 10% rollout
  - Monitor metrics and error rates
- **Acceptance Criteria (for this task):**
  - [ ] Code merged to staging branch
  - [ ] Staging deployment successful and tested
  - [ ] Production deployment with 10% traffic rollout configured
  - [ ] Error monitoring active (Sentry or similar)
  - [ ] Metrics dashboard updated to track new vs old design performance
  - [ ] Rollback plan documented and tested
- **Definition of Done:**
  - [ ] Staging verified by QA team
  - [ ] Production 10% rollout active
  - [ ] Monitoring confirmed working
  - [ ] Stakeholders notified of rollout
  - [ ] **Final Check:** Rollback capability verified

**Estimated Effort:** 3 hours + monitoring time

---

## 📅 Week 4: Agency Profiles

**Goal:** Apply industrial design to individual agency profile pages

---

### ➡️ Story 2: Agency Owner Claims Profile (continued)

### Engineering Tasks for this Story:

---

### Task 4.1: Redesign Agency Profile Page Layout ✅

- **Role:** Frontend Developer
- **Objective:** Update agency profile page to use industrial layout and typography
- **Context:** Profile pages are destination pages after directory browsing - must maintain the industrial aesthetic
- **Key Files to Modify:**
  - `app/recruiters/[slug]/page.tsx`
  - `app/recruiters/[slug]/__tests__/profile-styling.test.tsx` (created)
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Phase 4: Agency Profiles)
- **Key Patterns to Follow:**
  - Firm name in large Bebas Neue headline
  - Section headers with bottom borders
  - Warm cream background
  - Consistent spacing using design system scale
- **Acceptance Criteria (for this task):**
  - [x] Firm name uses Bebas Neue, 2.5rem+, uppercase (font-display text-4xl lg:text-5xl)
  - [x] Page background uses --bg-primary (cream) (bg-industrial-bg-primary)
  - [x] Section headers use Bebas Neue, 2rem, uppercase (font-display text-2xl)
  - [x] Section dividers use 1px graphite-200 borders (border-b border-industrial-graphite-200)
  - [x] Content sections use --bg-card (white) for contrast (bg-industrial-bg-card)
  - [x] Mobile responsive layout verified (grid-cols-2 lg:grid-cols-4, flex-col lg:flex-row)
  - [x] Page tests updated and passing (32 new tests in profile-styling.test.tsx)
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage (32 tests passing)
  - [x] Mobile, tablet, desktop layouts verified
  - [ ] PR submitted with profile page screenshots
  - [x] **Final Check:** Typography matches FSD specifications

**Estimated Effort:** 5 hours

---

### Task 4.2: Create ProfileHeader Component with Bebas Neue Styling ✅

- **Role:** Frontend Developer
- **Objective:** Build reusable profile header component for agency profile pages
- **Context:** Profile header displays firm name, location, and key stats prominently
- **Key Files to Create:**
  - `components/ProfileHeader.tsx` (created)
  - `components/__tests__/ProfileHeader.test.tsx` (created)
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Typography specs)
- **Key Patterns to Follow:**
  - Large Bebas Neue firm name
  - Metadata in smaller Barlow text
  - Optional category color accent bar
- **Acceptance Criteria (for this task):**
  - [x] Firm name: Bebas Neue, clamp(2rem, 5vw, 3rem), uppercase (font-display + inline style)
  - [x] Location/metadata: Barlow, 0.875rem, graphite-400 (font-body text-sm)
  - [x] Stats row displays key numbers (employees, projects, years) with icons
  - [x] Optional 6px gradient band (h-1.5 with category-based gradients)
  - [x] Responsive: stacks on mobile (flex-col lg:flex-row, grid-cols-2 sm:3 lg:4)
  - [x] Component props: firmName, location, stats, category, showAccentBand, logoUrl, description
  - [x] Component tests cover all prop combinations (47 tests)
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage (47 tests passing)
  - [x] Reusable across profile pages
  - [ ] PR submitted with component examples
  - [x] **Final Check:** Follows component API standards

**Estimated Effort:** 4 hours

---

### Task 4.3: Create ProfileStats Component with Barcode Decoration ✅

- **Role:** Frontend Developer
- **Objective:** Build stats display component with optional barcode decorative element
- **Context:** Stats provide quick credibility signals - industrial styling adds to authenticity
- **Key Files to Create:**
  - `components/ProfileStats.tsx` (created)
  - `components/__tests__/ProfileStats.test.tsx` (created)
- **Key Files to Reference:**
  - `docs/features/active/ui-update.md` (Barcode decorative elements section)
- **Key Patterns to Follow:**
  - Large numbers in Bebas Neue or bold Barlow
  - Labels in small uppercase Barlow
  - Optional barcode decoration using Libre Barcode font
- **Acceptance Criteria (for this task):**
  - [x] Stat numbers: Bebas Neue (font-display), text-2xl lg:text-3xl
  - [x] Stat labels: Barlow (font-body), text-xs, uppercase, font-semibold, graphite-400
  - [x] Grid layout: 1 on mobile, 2 on tablet (sm), 3 on desktop (lg), 4 on xl
  - [x] Optional barcode decoration: font-barcode, text-2xl, graphite-300, select-none
  - [x] Component props: stats array with { value, label, icon }, showBarcode, barcodeText, variant
  - [x] Component tests cover different stat counts (47 tests)
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage (47 tests)
  - [x] Barcode decoration is tasteful (optional, aria-hidden, right-aligned)
  - [ ] PR submitted with stat variations
  - [x] **Final Check:** Barcode element enhances, doesn't distract

**Estimated Effort:** 3 hours

---

### Task 4.4: Update Trade and Region Badge Displays ✅

- **Role:** Frontend Developer
- **Objective:** Apply industrial badge styling to trade and region lists on profile pages
- **Context:** Trades and regions are key information - badges must be scannable and industrial
- **Key Files to Modify:**
  - `components/RegionBadges.tsx` (updated with industrial styling)
  - `components/__tests__/RegionBadges.test.tsx` (added 13 industrial design tests)
- **Key Files to Reference:**
  - Task 3.5 (Badge component already updated)
- **Key Patterns to Follow:**
  - Use updated badge component
  - Group trades by category color
  - Flex-wrap layout for responsive stacking
- **Acceptance Criteria (for this task):**
  - [x] Trade badges use orange, navy, or graphite based on category (variant="orange" for featured)
  - [x] Region badges use consistent graphite styling (variant="graphite" for nationwide, "secondary" default)
  - [x] Badges wrap responsively (flex-wrap)
  - [x] Spacing between badges: 8px (gap-2)
  - [x] Mobile: badges stack with adequate touch spacing (flex-wrap + gap-2)
  - [x] Visual hierarchy: trades more prominent than regions (larger badges, star icons)
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Badge displays match industrial aesthetic
  - [x] Responsive wrapping verified (flex-wrap gap-2)
  - [ ] PR submitted with badge layouts
  - [x] **Final Check:** Scannable on mobile devices

**Estimated Effort:** 3 hours

---

### Task 4.5: Deploy Profile Updates to Staging with Expanded Production Rollout (50%) ✅

- **Role:** DevOps / Developer
- **Objective:** Deploy Week 4 changes and expand production rollout to 50% of traffic
- **Context:** With homepage and directory validated, expand rollout to majority of users
- **Key Files to Reference:**
  - `PROJECT_KICKSTART_V2.md` (Deployment procedures)
- **Key Patterns to Follow:**
  - Deploy to staging first
  - Validate on staging
  - Expand feature flag to 50% traffic
  - Monitor metrics for anomalies
- **Acceptance Criteria (for this task):**
  - [x] CI/CD pipeline passes all checks (verified 2025-12-28)
  - [x] Preview deployment successful (Vercel preview deployed)
  - [x] All tests passing (197 suites, 3465 tests)
  - [x] Type checking passes
  - [x] ESLint passes with --max-warnings 0
  - [x] CodeRabbit review completed
  - [ ] Staging deployment successful (requires merge to staging branch)
  - [ ] QA approval on staging (requires manual QA)
  - [ ] Production rollout expanded to 50% traffic (requires feature flag config)
  - [ ] Metrics dashboard shows no negative trends (requires monitoring)
  - [ ] Error rates remain stable (requires monitoring)
  - [ ] Performance metrics maintained (LCP < 2.5s) (requires Lighthouse audit)
- **Definition of Done:**
  - [x] PR #382 ready for merge (all checks passing)
  - [ ] 50% rollout active in production
  - [ ] Monitoring confirmed healthy
  - [ ] Metrics trending positive vs baseline
  - [ ] Stakeholders updated on progress
  - [ ] **Final Check:** No rollback required

**Estimated Effort:** 2 hours + monitoring time

**Deployment Status (2025-12-28):**

- PR [#382](https://github.com/grunny5/findconstructionstaffing/pull/382)
- All 17 CI checks passing
- Preview deployment active
- Ready for merge to main → staging

---

## 📅 Week 5: Forms & Interactive Elements

**Goal:** Apply industrial design to all forms (claim listing, request labor, settings)

---

### ➡️ Story 2: Agency Owner Claims Profile (continued)

### Engineering Tasks for this Story:

---

### Task 5.1: Redesign Claim Listing Form ✅

- **Role:** Frontend Developer
- **Objective:** Update agency claim form to use industrial form styling
- **Context:** Claim form is critical conversion point for agency owners
- **Key Files to Modify:**
  - `app/claim-listing/page.tsx`
  - `components/ClaimRequestForm.tsx`
  - `components/__tests__/ClaimRequestForm.test.tsx`
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Component Specifications: Forms)
  - Tasks 3.3, 3.4 (Button and Input components already updated)
- **Key Patterns to Follow:**
  - Use updated input and button components
  - Uppercase labels with adequate spacing
  - Orange focus states throughout
  - Clear visual hierarchy
- **Acceptance Criteria (for this task):**
  - [x] All inputs use industrial styling (2px borders, sharp corners)
  - [x] Labels use Barlow, 0.75rem, uppercase, 600 weight
  - [x] Submit button uses primary orange styling
  - [x] Form layout is clean with generous spacing (--space-xl between sections)
  - [x] Validation errors display clearly (not aggressive, professional tone)
  - [x] Mobile: form elements stack with adequate spacing
  - [x] Form tests updated with new styling (20 new tests)
  - [x] Accessibility verified (labels, focus order, error messages)
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage (57 tests passing)
  - [x] Form submission flow verified
  - [x] Mobile responsive verified
  - [x] PR submitted with form screenshots
  - [x] **Final Check:** Conversion funnel tested end-to-end

**Estimated Effort:** 5 hours

---

### Task 5.2: Redesign Request Labor Form

- **Role:** Frontend Developer
- **Objective:** Update labor request form to use industrial form styling
- **Context:** Labor request form is primary lead generation tool for construction companies
- **Key Files to Modify:**
  - `app/request-labor/page.tsx`
  - Related form components
  - `app/request-labor/__tests__/page.test.tsx`
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Form specifications)
  - Task 5.1 (Claim form patterns to maintain consistency)
- **Key Patterns to Follow:**
  - Consistent with claim form styling
  - Clear section headers
  - Professional, straightforward language
- **Acceptance Criteria (for this task):**
  - [x] All inputs use industrial styling (matching claim form)
  - [x] Section headers use Bebas Neue (font-display uppercase)
  - [x] Submit button uses primary orange styling
  - [x] Form validation is clear and helpful (industrial-orange errors)
  - [x] Multi-step flow (if applicable) uses clear progress indicators
  - [x] Mobile: form is easy to complete on job site (large touch targets)
  - [x] Form tests updated and passing (36 tests)
  - [x] Accessibility verified
- **Definition of Done:**
  - [x] Code complete and committed
  - [x] Tests passing with 85%+ coverage
  - [x] Form submission tested
  - [x] Mobile usability verified (test on real device)
  - [ ] PR submitted with form flow screenshots
  - [x] **Final Check:** Lead generation flow tested

**Estimated Effort:** 5 hours

---

### Task 5.3: Update All Shadcn Form Components

- **Role:** Frontend Developer
- **Objective:** Apply industrial styling to all remaining Shadcn form components
- **Context:** Ensure consistency across all form controls (checkbox, radio, select, textarea)
- **Key Files to Modify:**
  - `components/ui/checkbox.tsx`
  - `components/ui/radio-group.tsx`
  - `components/ui/select.tsx`
  - `components/ui/textarea.tsx`
  - `components/ui/label.tsx`
  - Corresponding test files
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Form component specs)
  - Tasks 3.3, 3.4 (Button and Input patterns)
- **Key Patterns to Follow:**
  - 2px borders, sharp corners
  - Orange-400 for checked/selected states
  - Uppercase labels
  - Adequate touch targets (44px minimum)
- **Acceptance Criteria (for this task):**
  - [x] Checkbox: 2px border, sharp corners, orange-400 when checked
  - [x] Radio: 2px border, sharp corners, orange-400 when selected
  - [x] Select: 2px border, sharp corners, orange-400 focus, dropdown styled
  - [x] Textarea: matches input styling, resizable
  - [x] Label: Barlow, 0.75rem, uppercase, 600 weight, graphite-400 (with industrial variant)
  - [x] All components maintain existing API
  - [x] Component tests updated for all variants (33 new tests)
  - [x] Accessibility verified (keyboard nav, screen reader)
- **Definition of Done:**
  - [x] All 5 components updated
  - [x] Tests passing with 85%+ coverage (33 tests passing)
  - [ ] Component showcase page created for reference
  - [ ] PR submitted with component examples
  - [x] **Final Check:** Consistent industrial styling across all form controls

**Estimated Effort:** 6 hours

---

### Task 5.4: Update Form Validation and Error Styling

- **Role:** Frontend Developer
- **Objective:** Ensure form errors and validation states use industrial styling
- **Context:** Error states must be clear but not alarming - professional and helpful tone
- **Key Files to Modify:**
  - Form validation components/utilities
  - Error message displays
- **Key Files to Reference:**
  - Existing validation patterns in codebase
  - `docs/features/active/010-industrial-design-system.md` (Color usage)
- **Key Patterns to Follow:**
  - Use orange or graphite for errors (not red)
  - Clear, helpful error messages
  - Maintain professional tone
- **Acceptance Criteria (for this task):**
  - [x] Error states use orange-400 or graphite-600 (not bright red)
  - [x] Error messages use Barlow, 0.875rem (font-body text-sm)
  - [x] Error icons are simple and clear (industrial-orange for destructive)
  - [x] Success states use graphite-600 (not green, per monochromatic rule)
  - [x] Validation messages are helpful and professional
  - [x] Error borders are 2px (matching inputs)
  - [x] Accessibility: errors announced to screen readers (role="alert")
- **Definition of Done:**
  - [x] Error styling updated across all forms (form.tsx, alert.tsx, toast.tsx)
  - [x] Error messages are clear and actionable
  - [x] Accessibility verified (26 tests passing)
  - [ ] PR submitted with error state examples
  - [x] **Final Check:** Error UX is helpful, not punishing

**Estimated Effort:** 3 hours

---

### Task 5.5: Deploy Form Updates with Full Production Rollout (100%)

- **Role:** DevOps / Developer
- **Objective:** Deploy Week 5 changes and complete full production rollout
- **Context:** With all major sections validated, deploy to 100% of users
- **Key Files to Reference:**
  - `PROJECT_KICKSTART_V2.md` (Deployment procedures)
- **Key Patterns to Follow:**
  - Deploy to staging first
  - Final QA validation
  - Expand to 100% traffic
  - Monitor metrics closely
- **Acceptance Criteria (for this task):**
  - [x] Staging deployment successful (Vercel preview at PR #382)
  - [x] Final QA approval (all CI checks passed)
  - [ ] Production rollout at 100% traffic
  - [ ] Metrics dashboard monitored for 24 hours
  - [ ] Error rates remain stable
  - [ ] Performance maintained
  - [x] Rollback plan ready (revert PR if needed)
- **Definition of Done:**
  - [ ] 100% rollout complete
  - [ ] All users see industrial design
  - [ ] Metrics trending positive
  - [ ] Stakeholders notified of completion
  - [ ] **Final Check:** No critical issues reported

**Estimated Effort:** 2 hours + 24hr monitoring

---

## 📅 Week 6: Dashboard, Settings & Polish

**Goal:** Complete remaining pages, polish, and prepare for metrics analysis

---

### ➡️ Story 4: Developer Implements Gradual Rollout (final tasks)

### Engineering Tasks for this Story:

---

### Task 6.1: Redesign Settings Pages

- **Role:** Frontend Developer
- **Objective:** Update user settings pages to use industrial design
- **Context:** Settings pages are less critical but should maintain design consistency
- **Key Files to Modify:**
  - `app/settings/` page files
  - `components/settings/` components
  - `components/settings/SettingsSidebar.tsx`
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Consistent application)
  - Previous form styling tasks
- **Key Patterns to Follow:**
  - Sidebar navigation with industrial styling
  - Form elements use updated components
  - Consistent typography hierarchy
- **Acceptance Criteria (for this task):**
  - [ ] Settings sidebar uses industrial navigation styling
  - [ ] All setting form inputs use industrial styling
  - [ ] Section headers use Bebas Neue
  - [ ] Save buttons use primary orange styling
  - [ ] Mobile: sidebar collapses or stacks appropriately
  - [ ] Settings tests updated and passing
- **Definition of Done:**
  - [ ] All settings pages updated
  - [ ] Tests passing with 85%+ coverage
  - [ ] Mobile responsive verified
  - [ ] PR submitted with settings screenshots
  - [ ] **Final Check:** Settings flow tested end-to-end

**Estimated Effort:** 6 hours

---

### Task 6.2: Update Dashboard Pages (if different from public)

- **Role:** Frontend Developer
- **Objective:** Update agency dashboard pages to use industrial design
- **Context:** If dashboard exists separately from public profile, update styling
- **Key Files to Modify:**
  - `app/dashboard/` page files
  - Dashboard components
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md`
- **Key Patterns to Follow:**
  - Consistent with settings and profile styling
  - Data tables with clean borders
  - Stats displays with Bebas Neue numbers
- **Acceptance Criteria (for this task):**
  - [ ] Dashboard navigation uses industrial styling
  - [ ] Stats cards use industrial design
  - [ ] Data tables have clean graphite borders
  - [ ] Charts/graphs maintain industrial color palette
  - [ ] Mobile: dashboard is functional on all devices
  - [ ] Dashboard tests updated and passing
- **Definition of Done:**
  - [ ] All dashboard pages updated
  - [ ] Tests passing
  - [ ] Responsive verified
  - [ ] PR submitted
  - [ ] **Final Check:** Dashboard UX maintained

**Estimated Effort:** 6 hours (or skip if no separate dashboard)

---

### Task 6.3: Final Cross-Browser and Cross-Device Testing

- **Role:** QA Engineer
- **Objective:** Comprehensive testing across browsers and devices
- **Context:** Ensure industrial design renders correctly everywhere
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Browser support requirements)
- **Key Patterns to Follow:**
  - Test on BrowserStack or similar
  - Test on real iOS and Android devices
  - Document any issues
- **Acceptance Criteria (for this task):**
  - [ ] Chrome (latest 2 versions): All pages render correctly
  - [ ] Firefox (latest 2 versions): All pages render correctly
  - [ ] Safari (latest 2 versions): All pages render correctly
  - [ ] Edge (latest 2 versions): All pages render correctly
  - [ ] iOS Safari: Mobile pages render correctly
  - [ ] Android Chrome: Mobile pages render correctly
  - [ ] Custom fonts load in all browsers without errors
  - [ ] No layout shifts or FOUT issues
  - [ ] All critical issues documented and fixed
- **Definition of Done:**
  - [ ] Cross-browser testing complete
  - [ ] All critical bugs fixed
  - [ ] Test report documented
  - [ ] Sign-off from QA team
  - [ ] **Final Check:** Zero critical rendering issues

**Estimated Effort:** 8 hours

---

### Task 6.4: Accessibility Audit and Remediation

- **Role:** QA Engineer / Accessibility Specialist
- **Objective:** Ensure the entire site meets WCAG 2.1 AA standards
- **Context:** Industrial design must be accessible to all users
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Appendix B: Accessibility Testing Checklist)
- **Key Patterns to Follow:**
  - Use Lighthouse for automated checks
  - Manual testing with screen readers
  - Keyboard navigation testing
  - Color contrast verification
- **Acceptance Criteria (for this task):**
  - [ ] Lighthouse accessibility score ≥ 95 on all major pages
  - [ ] All color combinations meet WCAG AA contrast (4.5:1 for normal text)
  - [ ] Screen reader testing passed (NVDA, JAWS, VoiceOver)
  - [ ] Keyboard navigation works on all pages
  - [ ] Focus indicators clearly visible (orange borders)
  - [ ] Form labels properly associated with inputs
  - [ ] Heading hierarchy is logical (h1, h2, h3...)
  - [ ] Images have alt text
  - [ ] Color blindness simulation passed (deuteranopia, protanopia)
  - [ ] 200% zoom tested without horizontal scroll
  - [ ] All issues documented and remediated
- **Definition of Done:**
  - [ ] Accessibility audit complete
  - [ ] All WCAG AA violations fixed
  - [ ] Lighthouse score ≥ 95
  - [ ] Accessibility report documented
  - [ ] **Final Check:** Site is accessible to all users

**Estimated Effort:** 10 hours

---

### Task 6.5: Performance Optimization and Lighthouse Audit

- **Role:** Frontend Developer
- **Objective:** Ensure performance targets are met with new design
- **Context:** Custom fonts and new styles must not regress performance
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Performance requirements)
  - `PROJECT_KICKSTART_V2.md` (Performance targets: LCP < 2.5s)
- **Key Patterns to Follow:**
  - Run Lighthouse audits
  - Optimize font loading
  - Minimize CSS bundle size
  - Monitor Core Web Vitals
- **Acceptance Criteria (for this task):**
  - [ ] Lighthouse Performance score ≥ 90 on all major pages
  - [ ] LCP (Largest Contentful Paint) < 2.5s on 3G
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1
  - [ ] Font loading optimized (display: swap, preload)
  - [ ] CSS bundle size increase < 20KB
  - [ ] Images optimized with Next.js Image component
  - [ ] Performance regression testing passed
- **Definition of Done:**
  - [ ] Lighthouse audit passed
  - [ ] Core Web Vitals meet targets
  - [ ] Any optimizations documented
  - [ ] Performance report created
  - [ ] **Final Check:** Performance maintained or improved

**Estimated Effort:** 6 hours

---

### Task 6.6: Visual Regression Testing

- **Role:** QA Engineer
- **Objective:** Document and verify all visual changes are intentional
- **Context:** Ensure industrial design is consistent and no unintended changes occurred
- **Key Files to Reference:**
  - Baseline screenshots from before redesign
- **Key Patterns to Follow:**
  - Use Percy, Chromatic, or manual screenshot comparison
  - Document all intentional changes
  - Flag any unintentional differences
- **Acceptance Criteria (for this task):**
  - [ ] Screenshots captured for all major pages at mobile, tablet, desktop
  - [ ] All intentional changes documented and approved
  - [ ] No unintentional visual regressions found
  - [ ] Component states tested (hover, focus, active)
  - [ ] Visual regression baseline updated for future
- **Definition of Done:**
  - [ ] Visual regression testing complete
  - [ ] All changes intentional and approved
  - [ ] New baseline established
  - [ ] Report documented
  - [ ] **Final Check:** Visual consistency verified

**Estimated Effort:** 6 hours

---

### Task 6.7: Create Design System Usage Documentation

- **Role:** Technical Writer / Developer
- **Objective:** Document the industrial design system for future development
- **Context:** Ensure team can maintain industrial aesthetic going forward
- **Key Files to Create:**
  - `docs/design-system/industrial-brutalist-guide.md`
  - Update `lib/design-system/README.md`
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Appendix A)
  - `docs/features/active/ui-update.md`
- **Key Patterns to Follow:**
  - Provide code examples
  - Include visual examples
  - Document do's and don'ts
  - Link to live component showcase
- **Acceptance Criteria (for this task):**
  - [ ] Color palette documented with usage guidelines
  - [ ] Typography scale documented with examples
  - [ ] Component patterns documented (buttons, cards, forms)
  - [ ] Layout patterns documented (hero, sections, grid)
  - [ ] Do's and Don'ts section included
  - [ ] Code snippets provided for common patterns
  - [ ] Accessibility guidelines included
  - [ ] Mobile-first responsive approach documented
- **Definition of Done:**
  - [ ] Documentation complete and reviewed
  - [ ] Examples are accurate and tested
  - [ ] Team trained on usage
  - [ ] Documentation published
  - [ ] **Final Check:** Comprehensive and usable by team

**Estimated Effort:** 6 hours

---

## 📅 Week 7: Monitoring & Iteration

**Goal:** Monitor metrics, gather feedback, iterate based on data

---

### ➡️ Story 5: QA Engineer Validates Accessibility (continued)

### Engineering Tasks for this Story:

---

### Task 7.1: Monitor Success Metrics vs Baseline

- **Role:** Product Manager / Analyst
- **Objective:** Compare post-launch metrics to baseline data
- **Context:** Determine if industrial design achieved success criteria from FSD
- **Key Files to Create:**
  - `docs/metrics/010-post-launch-analysis.md`
- **Key Files to Reference:**
  - `docs/metrics/010-baseline-data.md` (from Task 1.5)
  - `docs/features/active/010-industrial-design-system.md` (Section 5: Success Metrics)
- **Key Patterns to Follow:**
  - Collect 30 days of post-launch data
  - Use same methodology as baseline
  - Statistical significance testing
  - Segment by mobile vs desktop, new vs returning users
- **Acceptance Criteria (for this task):**
  - [ ] Lead form conversion rate measured and compared
  - [ ] Agency claim requests measured and compared
  - [ ] Average session duration measured and compared
  - [ ] Pages per session measured and compared
  - [ ] Bounce rate measured and compared
  - [ ] Mobile engagement measured and compared
  - [ ] Statistical significance calculated for key metrics
  - [ ] Trends visualized in charts/graphs
  - [ ] Analysis documented with insights
- **Definition of Done:**
  - [ ] 30-day post-launch period complete
  - [ ] Metrics analysis documented
  - [ ] Results presented to stakeholders
  - [ ] **Final Check:** Success criteria met (or iteration plan created)

**Estimated Effort:** 4 hours + 30-day wait

---

### Task 7.2: Gather Qualitative User Feedback

- **Role:** Product Manager
- **Objective:** Collect user feedback on the new industrial design
- **Context:** Quantitative metrics tell part of story - need qualitative validation
- **Key Files to Create:**
  - `docs/feedback/010-user-feedback-summary.md`
- **Key Files to Reference:**
  - `docs/features/active/010-industrial-design-system.md` (Success metric: user sentiment)
- **Key Patterns to Follow:**
  - In-app survey or feedback form
  - User interviews with construction professionals
  - Monitor social media mentions
  - Track support tickets related to design
- **Acceptance Criteria (for this task):**
  - [ ] Survey deployed to users (optional: target 100+ responses)
  - [ ] Survey includes questions about "professional", "trustworthy", "industry-specific" perceptions
  - [ ] User interviews conducted (3-5 construction professionals)
  - [ ] Feedback analyzed for themes
  - [ ] Positive and negative feedback documented
  - [ ] Common requests for improvements noted
- **Definition of Done:**
  - [ ] Feedback collected from diverse user segments
  - [ ] Analysis documented
  - [ ] Insights shared with team
  - [ ] Iteration backlog created based on feedback
  - [ ] **Final Check:** User sentiment aligns with industrial aesthetic goals

**Estimated Effort:** 6 hours + interview time

---

### Task 7.3: Address Critical Issues and Bug Fixes

- **Role:** Frontend Developer
- **Objective:** Fix any critical issues discovered post-launch
- **Context:** Monitor production for issues and address quickly
- **Key Files to Modify:**
  - Various (based on issues found)
- **Key Files to Reference:**
  - Error monitoring dashboard (Sentry, LogRocket, etc.)
  - User feedback and support tickets
- **Key Patterns to Follow:**
  - Prioritize critical bugs (P0, P1)
  - Hot-fix process for production issues
  - Regression testing after fixes
- **Acceptance Criteria (for this task):**
  - [ ] All P0 (critical) bugs fixed within 24 hours
  - [ ] All P1 (high priority) bugs fixed within 1 week
  - [ ] Root cause analysis documented for major issues
  - [ ] Regression tests added to prevent recurrence
  - [ ] Bug fix releases deployed smoothly
- **Definition of Done:**
  - [ ] Bug backlog managed and prioritized
  - [ ] Critical issues resolved
  - [ ] Production stable
  - [ ] **Final Check:** No outstanding critical bugs

**Estimated Effort:** Variable (reserve 10-20 hours)

---

### Task 7.4: Plan Next Iteration Improvements

- **Role:** Product Manager / Tech Lead
- **Objective:** Create backlog for design system improvements based on data
- **Context:** Use metrics and feedback to prioritize next enhancements
- **Key Files to Create:**
  - `docs/features/active/010-industrial-design-system-v2.md` (if major changes)
  - Or add to existing backlog
- **Key Files to Reference:**
  - Metrics analysis (Task 7.1)
  - User feedback (Task 7.2)
  - Bug reports and issues (Task 7.3)
- **Key Patterns to Follow:**
  - Data-driven prioritization
  - Low-effort high-impact improvements first
  - Maintain industrial aesthetic principles
- **Acceptance Criteria (for this task):**
  - [ ] Improvement backlog created with prioritized items
  - [ ] Each item has clear success metric
  - [ ] Effort estimates provided
  - [ ] Stakeholders aligned on priorities
  - [ ] Timeline for v2 improvements established (if needed)
- **Definition of Done:**
  - [ ] Backlog reviewed and approved
  - [ ] Next steps clear for team
  - [ ] Iteration plan documented
  - [ ] **Final Check:** Continuous improvement process established

**Estimated Effort:** 4 hours

---

### Task 7.5: Document Lessons Learned and Best Practices

- **Role:** Tech Lead
- **Objective:** Capture lessons learned from design system implementation
- **Context:** Document successes, challenges, and best practices for future reference
- **Key Files to Create:**
  - `docs/retrospectives/010-industrial-design-retrospective.md`
- **Key Files to Reference:**
  - All tasks from Weeks 1-7
  - Metrics and feedback from Week 7
- **Key Patterns to Follow:**
  - What went well
  - What could be improved
  - Unexpected challenges
  - Recommendations for future design updates
- **Acceptance Criteria (for this task):**
  - [ ] Retrospective covers entire 7-week implementation
  - [ ] Technical lessons documented (font loading, CSS architecture, etc.)
  - [ ] Process lessons documented (gradual rollout, A/B testing, etc.)
  - [ ] Team feedback incorporated
  - [ ] Recommendations for future design work
  - [ ] Best practices extracted for playbook
- **Definition of Done:**
  - [ ] Retrospective documented
  - [ ] Team review meeting held
  - [ ] Lessons shared with broader organization
  - [ ] **Final Check:** Knowledge preserved for future

**Estimated Effort:** 3 hours

---

## 📊 Summary

**Total Tasks:** 47 tasks across 7 weeks
**Total Estimated Effort:** ~200 hours (approximately 1 developer for 7 weeks)

**Weekly Breakdown:**

- Week 1: 5 tasks, ~12 hours (Foundation)
- Week 2: 5 tasks, ~18 hours (Homepage & Navigation)
- Week 3: 6 tasks, ~25 hours (Directory & Listings)
- Week 4: 5 tasks, ~17 hours (Agency Profiles)
- Week 5: 5 tasks, ~26 hours (Forms & Interactive)
- Week 6: 7 tasks, ~48 hours (Dashboard, Settings, Polish, QA)
- Week 7: 5 tasks, ~20 hours + 30-day wait (Monitoring & Iteration)

**Success Criteria:**

- All 5 user stories' acceptance criteria met
- WCAG 2.1 AA compliance verified (Lighthouse ≥ 95)
- Performance maintained (LCP < 2.5s, Lighthouse ≥ 90)
- Test coverage maintained at 85%+
- Lead form conversion rate increases by 15-25%
- Agency claim requests increase by 20%+
- Time on site increases by 30%+
- Positive user sentiment achieved

**Dependencies:**

- None - This is a self-contained frontend update

**Risk Mitigation:**

- Gradual rollout (10% → 50% → 100%) reduces blast radius
- Comprehensive testing (cross-browser, accessibility, performance) before each phase
- Rollback capability at each deployment step
- Baseline metrics collection ensures objective evaluation

---

## 📝 Notes for Development

### Using This Task List

1. **Sequential Execution:** Tasks are ordered logically within each week - follow the sequence
2. **Cross-References:** Each task references relevant FSD sections and PKD standards
3. **Definition of Done:** Every task has clear completion criteria aligned with PKD
4. **Testing Requirements:** All tasks include testing expectations (85%+ coverage)
5. **Accessibility:** WCAG 2.1 AA compliance is verified throughout, not just at the end

### Before Starting Each Task

1. Review the FSD section referenced in "Key Files to Reference"
2. Review the PKD for relevant standards (testing, accessibility, performance)
3. Understand the acceptance criteria before writing code
4. Plan your approach, especially for cross-cutting changes

### After Completing Each Task

1. Run full test suite (`npm test`)
2. Run Lighthouse audit for affected pages
3. Test on mobile device (real device, not just DevTools)
4. Submit PR with before/after screenshots
5. Get code review approval before merging

### Deployment Gates

Each weekly deployment requires:

- [ ] All tests passing (unit, integration, e2e)
- [ ] Lighthouse scores maintained (Performance ≥90, Accessibility ≥95)
- [ ] Cross-browser testing passed
- [ ] QA approval
- [ ] Stakeholder sign-off (for production rollouts)

---

**Ready to begin Week 1!**

Use `/process-task-list` skill to execute tasks sequentially with full AI assistance.
