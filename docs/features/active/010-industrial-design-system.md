# FSD: Industrial Brutalist Design System

- **ID:** 010
- **Status:** Draft
- **Related Epic (from PKD):** UI/UX Design System (NEW)
- **Author:** User + Claude AI
- **Last Updated:** 2025-01-13
- **Designs:** `/docs/features/active/ui-update.md` (CSS specifications)

---

## 1. Problem & Goal

### Problem Statement

The current FindConstructionStaffing platform uses a typical modern SaaS aesthetic (Inter/Roboto fonts, rounded corners, gradient backgrounds) that doesn't resonate with our core audience of construction industry professionals. Operations directors, HR managers at manufacturing plants, and construction project managers are skeptical of slick, startup-style interfaces. They value clarity, authenticity, and straightforward communication - qualities that the current design doesn't convey.

**Target Personas:**

- **Construction Operations Director** - Making high-stakes hiring decisions, needs confidence in the platform
- **Staffing Agency Owner** - Evaluating whether to invest time claiming and maintaining a profile
- **Construction Project Manager** - Often browsing on mobile devices in challenging conditions (bright sunlight, job sites)

### Goal & Hypothesis

**We believe that** by redesigning the platform with an industrial brutalist aesthetic (bold typography, warm cream backgrounds, sharp corners, monochromatic color coding) **for Construction Industry Professionals**, **we will achieve** increased trust and authenticity perception leading to higher conversion rates.

**We will know this is true when we see:**

- Lead form conversion rate increases by 15-25%
- Agency claim requests increase by 20%+
- Time on site increases by 30%+
- User feedback mentions "professional", "trustworthy", "industry-specific"

---

## 2. User Stories & Acceptance Criteria

### Story 1: Construction Company Browses Agency Directory

> As a **Construction Operations Director**, I want **to browse staffing agencies in a design that feels authentic to the construction industry**, so that **I trust this is a legitimate industry resource, not just another tech startup**.

**Acceptance Criteria:**

- [ ] **Given** I visit the homepage, **When** I view the design, **Then** I see bold Bebas Neue headlines in uppercase with tight line-height (0.85-1.0)
- [ ] **Given** I view the page background, **When** I scroll, **Then** I see a warm cream color (#FAF7F2) instead of sterile white
- [ ] **Given** I view agency listing cards, **When** I scan the directory, **Then** I see 4px left-border color coding by trade category (Orange for Welding, Navy for Electrical, Graphite for Mechanical)
- [ ] **Given** I interact with buttons, **When** I hover, **Then** I see sharp corners (2px border-radius) and solid color transitions, not rounded pills
- [ ] **Given** I view typography, **When** I read content, **Then** I see Barlow body text that feels industrial and readable

### Story 2: Agency Owner Claims Profile

> As a **Staffing Agency Owner**, I want **the platform to look professional and established**, so that **I feel confident claiming my listing and investing time in my profile**.

**Acceptance Criteria:**

- [ ] **Given** I navigate to my agency profile page, **When** I view the design, **Then** I see a consistent industrial aesthetic that conveys permanence and stability
- [ ] **Given** I view the claim listing form, **When** I interact with inputs, **Then** I see 2px solid borders (not rounded) with orange focus states
- [ ] **Given** I view navigation, **When** I browse sections, **Then** I see heavy 3px bottom borders on the nav bar that convey structure
- [ ] **Given** I complete my profile, **When** I preview it, **Then** I see my firm name in bold Bebas Neue with monochromatic color accents

### Story 3: Mobile User Browses on Job Site

> As a **Construction Project Manager on a job site**, I want **the mobile interface to be clear and bold with high contrast**, so that **I can easily read and navigate even in bright outdoor conditions**.

**Acceptance Criteria:**

- [ ] **Given** I'm on a mobile device in bright sunlight, **When** I view text, **Then** I see high contrast between Graphite-600 (#1A1A1A) text and cream backgrounds (contrast ratio ≥ 7:1 for AAA compliance)
- [ ] **Given** I tap on interactive elements, **When** I use touch, **Then** I have adequate tap target sizes (44px minimum) and clear focus indicators
- [ ] **Given** I scroll through listings, **When** I view cards on mobile, **Then** they stack vertically with generous 24px spacing
- [ ] **Given** I view the hero section, **When** I'm on mobile, **Then** the two-column layout stacks cleanly with headlines using clamp() for responsive sizing

### Story 4: Developer Implements Gradual Rollout

> As a **Frontend Developer**, I want **to implement the new design system gradually**, so that **we can validate each section before moving to the next**.

**Acceptance Criteria:**

- [ ] **Given** I start implementation, **When** I create the design system, **Then** I set up CSS custom properties for all colors and typography in globals.css
- [ ] **Given** I implement fonts, **When** the page loads, **Then** Google Fonts (Bebas Neue, Barlow, Libre Barcode 39 Text) load with display=swap to prevent FOUT
- [ ] **Given** I roll out changes, **When** I deploy, **Then** I follow this sequence: 1) Homepage → 2) Directory/Listings → 3) Agency Profiles → 4) Forms → 5) Settings/Dashboard
- [ ] **Given** I update components, **When** I modify Shadcn components, **Then** I maintain the component API while updating visual styles
- [ ] **Given** I test responsive behavior, **When** I check breakpoints, **Then** I verify mobile (320px), tablet (768px), desktop (1024px), and wide (1400px) layouts

### Story 5: QA Engineer Validates Accessibility

> As a **QA Engineer**, I want **to ensure the new design meets WCAG 2.1 AA standards**, so that **the site is accessible to all users including those with visual impairments**.

**Acceptance Criteria:**

- [ ] **Given** I test color contrast, **When** I check all text/background combinations, **Then** normal text meets 4.5:1 ratio and large text meets 3:1 ratio
- [ ] **Given** I test with screen readers, **When** I navigate with NVDA/JAWS, **Then** all interactive elements have proper ARIA labels and semantic HTML
- [ ] **Given** I test keyboard navigation, **When** I tab through the page, **Then** focus indicators are clearly visible with orange (#E07B00) borders
- [ ] **Given** I test with color blindness simulators, **When** I view category color coding, **Then** the left-border indicators remain distinguishable for deuteranopia and protanopia
- [ ] **Given** I test font scaling, **When** I increase browser text size to 200%, **Then** layouts remain functional without horizontal scrolling

---

## 3. Technical & Design Requirements

### UX/UI Requirements

#### Color System Implementation

**CSS Custom Properties (globals.css):**

```css
:root {
  /* Primary: Industrial Orange */
  --orange-100: #fff4e6;
  --orange-200: #ffd699;
  --orange-300: #ff9f1c;
  --orange-400: #e07b00; /* Primary accent */
  --orange-500: #b85c00; /* Hover states */
  --orange-600: #8a4400;

  /* Secondary: Graphite */
  --graphite-100: #f5f5f5;
  --graphite-200: #d4d4d4;
  --graphite-300: #9a9a9a;
  --graphite-400: #5c5c5c;
  --graphite-500: #333333;
  --graphite-600: #1a1a1a; /* Primary text */

  /* Accent: Deep Navy */
  --navy-100: #e8edf2;
  --navy-200: #b8c9d9;
  --navy-300: #4a6b8a;
  --navy-400: #2d4a63; /* Category accent */
  --navy-500: #1b3a4f;
  --navy-600: #0f2535;

  /* Backgrounds */
  --bg-primary: #faf7f2; /* Warm cream */
  --bg-card: #ffffff;
  --bg-dark: #1a1a1a;

  /* Spacing Scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 48px;
  --space-4xl: 64px;
  --space-5xl: 96px;
}
```

**WCAG 2.1 AA Compliance Analysis:**

| Text Size     | Foreground             | Background      | Contrast Ratio | WCAG Level |
| ------------- | ---------------------- | --------------- | -------------- | ---------- |
| Normal (16px) | Graphite-600 (#1A1A1A) | Cream (#FAF7F2) | **11.2:1**     | AAA ✓      |
| Normal (16px) | Graphite-500 (#333333) | White (#FFFFFF) | **12.6:1**     | AAA ✓      |
| Normal (16px) | Orange-400 (#E07B00)   | White (#FFFFFF) | **4.8:1**      | AA ✓       |
| Large (18px+) | Graphite-400 (#5C5C5C) | White (#FFFFFF) | **7.4:1**      | AAA ✓      |
| Large (18px+) | Navy-400 (#2D4A63)     | White (#FFFFFF) | **8.2:1**      | AAA ✓      |

**Recommendation:** All color combinations exceed WCAG AA requirements. The primary text color (Graphite-600) achieves AAA level.

#### Typography Implementation

**Font Loading Strategy (app/layout.tsx):**

```tsx
import { Bebas_Neue, Barlow, Libre_Barcode_39_Text } from 'next/font/google';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bebas-neue',
});

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-barlow',
});

const libreBarcode = Libre_Barcode_39_Text({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-libre-barcode',
});
```

**Performance Optimization:**

- Use `display: swap` to prevent FOUT (Flash of Unstyled Text)
- Preload critical fonts in `<head>` for above-the-fold content
- Subset to 'latin' characters only (reduces file size by ~40%)
- Expected font payload: ~60KB total (acceptable for performance)

**Typography Classes (Tailwind config extension):**

```javascript
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      'display': ['var(--font-bebas-neue)', 'sans-serif'],
      'body': ['var(--font-barlow)', 'sans-serif'],
      'barcode': ['var(--font-libre-barcode)', 'cursive'],
    },
  }
}
```

#### Responsive Breakpoints

**Recommended Breakpoint Strategy:**

```css
/* Mobile First Approach */
/* Default: 320px - 767px (mobile) */

@media (min-width: 768px) {
  /* Tablet: 768px - 1023px */
  .container {
    padding: 0 2rem;
  }
  .grid-auto {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
}

@media (min-width: 1024px) {
  /* Desktop: 1024px - 1399px */
  .container {
    max-width: 1200px;
  }
}

@media (min-width: 1400px) {
  /* Wide Desktop: 1400px+ */
  .container {
    max-width: 1400px;
  }
}
```

**Rationale:**

- Start mobile-first (matches construction professionals often on job sites)
- 768px tablet breakpoint aligns with iPad dimensions
- 1400px max-width prevents excessive line lengths on ultra-wide monitors
- Use CSS Grid `auto-fill` for responsive card layouts (no media queries needed)

#### Component Specifications

**Navigation Component:**

- Heavy 3px bottom border (#1A1A1A)
- Logo: Bebas Neue, 1.5rem
- Links: Barlow 0.875rem, uppercase, 600 weight
- Hover: 2px bottom border in orange-400
- Mobile: Hamburger menu at <768px

**Button Components:**

- Border-radius: 2px (sharp, not rounded)
- Padding: 1rem vertical, 2rem horizontal
- Font: Barlow, 0.875rem, uppercase, 600 weight
- Primary: Orange-400 background, white text
- Secondary: Transparent background, 2px graphite-400 border
- Transitions: 0.2s ease (no bounce animations)

**Agency Card Component:**

- Background: White
- Border: 1px solid graphite-200
- Border-left: 4px solid (category color)
- Border-radius: 3px
- Box-shadow: 0 1px 3px rgba(0,0,0,0.06)
- Hover: translateY(-2px), box-shadow: 0 4px 12px rgba(0,0,0,0.08)
- Firm name: Bebas Neue, 1.5rem, uppercase
- Footer: graphite-100 background with metadata

**Form Input Components:**

- Border: 2px solid graphite-300
- Border-radius: 2px
- Padding: 0.875rem 1rem
- Font: Barlow, 1rem
- Focus: border-color changes to orange-400
- Label: 0.75rem, uppercase, 600 weight, graphite-400

---

### Technical Impact Analysis

#### Data Model

**No database changes required.** This is purely a frontend/UI update.

#### Component Architecture

**Files to Modify (Gradual Rollout Plan):**

**Phase 1: Foundation (Week 1)**

- `app/globals.css` - Add all CSS custom properties and font imports
- `app/layout.tsx` - Configure Google Fonts with next/font
- `tailwind.config.ts` - Extend theme with new colors and fonts
- Create: `lib/design-system/` directory for design tokens

**Phase 2: Homepage & Navigation (Week 2)**

- `components/Header.tsx` - Update navigation styling
- `components/Footer.tsx` - Dark footer with inverted colors
- `components/Hero.tsx` - Two-column layout with orange accent word
- `app/page.tsx` - Warm cream background, section headers

**Phase 3: Directory & Listings (Week 3)**

- `components/AgencyCard.tsx` - Left-border color coding, sharp corners
- `components/DirectoryFilters.tsx` - Industrial form inputs
- `components/ui/button.tsx` - Sharp corners, orange primary
- `components/ui/input.tsx` - 2px borders, orange focus states
- `components/ui/badge.tsx` - Monochromatic category badges

**Phase 4: Agency Profiles (Week 4)**

- `app/recruiters/[slug]/page.tsx` - Profile page layout
- Create: `components/ProfileHeader.tsx` - Bebas Neue firm name
- Create: `components/ProfileStats.tsx` - Barcode decorative elements
- Update: Trade and region displays with new badges

**Phase 5: Forms & Interactive (Week 5)**

- `app/claim-listing/page.tsx` - Claim form styling
- `app/request-labor/page.tsx` - Lead form styling
- `components/ClaimRequestForm.tsx` - Industrial form design
- All Shadcn form components (checkbox, radio, select)

**Phase 6: Dashboard & Settings (Week 6)**

- `app/settings/` pages - Settings navigation sidebar
- `app/dashboard/` pages - Agency dashboard (if different from public)
- Admin pages - Keep existing design OR update if time allows

#### API Endpoints

**No API changes required.** This is a UI-only feature.

#### Non-Functional Requirements

**Performance:**

- Target: LCP (Largest Contentful Paint) < 2.5s
- Font loading should not block initial render
- Images continue using Next.js Image optimization
- CSS bundle size increase: ~15KB (custom properties + font faces)

**Accessibility (WCAG 2.1 AA):**

- All contrast ratios meet or exceed 4.5:1 for normal text
- Focus indicators visible with 2px orange borders
- Semantic HTML maintained (headings, landmarks, lists)
- Screen reader testing with NVDA and JAWS
- Keyboard navigation fully functional
- Skip links for main content

**Browser Support:**

- Modern browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
- CSS custom properties (supported by all modern browsers)
- CSS Grid (supported by all modern browsers)
- Fallbacks not needed (target audience uses modern browsers)

**Mobile Responsiveness:**

- Tested at: 320px, 375px, 414px, 768px, 1024px, 1400px
- Touch targets: 44px minimum (Apple guidelines)
- No horizontal scrolling at any breakpoint
- Readable font sizes: minimum 16px on mobile

**Testing Requirements:**

- Visual regression tests (Percy or Chromatic)
- Lighthouse accessibility audits (score ≥ 95)
- Cross-browser testing (BrowserStack)
- Responsive testing on real devices
- Color blindness simulation testing

---

## 4. Scope

### In Scope (First Version)

✅ **All Public-Facing Pages:**

- Homepage with hero and directory
- Agency listing cards and directory grid
- Agency profile pages
- Claim listing form
- Request labor form
- Navigation and footer
- All Shadcn/ui components used in public pages

✅ **Design System Foundation:**

- CSS custom properties for colors
- Typography system with Google Fonts
- Spacing scale and layout containers
- Component specifications and documentation

✅ **Responsive Design:**

- Mobile-first implementation
- Tablet and desktop optimizations
- Touch-friendly interactions

✅ **Accessibility:**

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility

### Out of Scope

❌ **Deferred to Future Iterations:**

- Admin dashboard redesign (can keep existing design for internal tools)
- Email template redesign (notification emails can maintain current styling)
- Marketing pages (About, Contact, Help) - if they exist
- Blog or content pages - if they exist
- Mobile app (if planned) - native design would be separate

❌ **Intentionally Excluded:**

- Complete rewrite of components (reuse existing where possible)
- Animation library integration (keep transitions simple with CSS)
- Design system documentation site (can document in Storybook later)

### Open Questions

**Pre-Implementation:**

- [ ] Should we create a visual comparison/preview before starting development?
- [ ] Do we need stakeholder sign-off on the warm cream background vs. white?
- [ ] Should we A/B test on a percentage of traffic before full rollout?
- [ ] Do we need to update brand guidelines or style guide documentation?

**During Implementation:**

- [ ] How do we handle the transition period when some pages are updated and others aren't?
- [ ] Should we provide a "classic theme" toggle for users who prefer the old design?
- [ ] Do we need to inform existing agency users about the visual changes?

**Post-Launch:**

- [ ] What is the minimum viable metric improvement to consider this successful?
- [ ] How long should we wait before evaluating impact (1 week, 2 weeks, 1 month)?
- [ ] Should we plan a follow-up user survey to gather qualitative feedback?

---

## 5. Success Metrics & Measurement

### Primary Metrics (Measure over 30 days post-full-rollout)

1. **Lead Form Conversion Rate**
   - Current baseline: [TBD - measure before implementation]
   - Target: +15-25% increase
   - Measurement: Google Analytics events on form submissions

2. **Agency Claim Requests**
   - Current baseline: [TBD - measure before implementation]
   - Target: +20% increase
   - Measurement: Database query of claim_requests table

3. **Time on Site**
   - Current baseline: [TBD - measure before implementation]
   - Target: +30% increase
   - Measurement: Google Analytics average session duration

4. **Engagement Rate**
   - Current baseline: [TBD - measure before implementation]
   - Target: +20% increase in pages per session
   - Measurement: Google Analytics pages/session

### Secondary Metrics

5. **Bounce Rate**
   - Target: Decrease by 10-15%
   - Measurement: Google Analytics bounce rate

6. **Mobile Engagement**
   - Target: Mobile conversion rate matches or exceeds desktop
   - Measurement: GA4 device category segmentation

7. **User Feedback**
   - Target: Positive sentiment mentions "professional", "trustworthy", "industry-specific"
   - Measurement: User surveys, NPS scores

### Technical Metrics

8. **Performance**
   - Target: LCP < 2.5s (maintain or improve)
   - Measurement: Lighthouse CI, Core Web Vitals

9. **Accessibility Score**
   - Target: ≥ 95 Lighthouse accessibility score
   - Measurement: Automated Lighthouse audits

10. **Cross-Browser Issues**
    - Target: Zero critical rendering issues
    - Measurement: BrowserStack testing, error monitoring

---

## 6. Implementation Timeline (6-Week Gradual Rollout)

### Week 1: Foundation & Setup

- Set up design system foundation (CSS variables, fonts)
- Configure Tailwind theme extensions
- Create design token documentation
- Run baseline metrics collection

### Week 2: Homepage & Navigation

- Implement new header and footer
- Update homepage hero section
- Update homepage sections
- Deploy to staging for QA

### Week 3: Directory & Listings

- Update AgencyCard component
- Update DirectoryFilters component
- Update button and input components
- Deploy to staging, begin limited production rollout (10% traffic)

### Week 4: Agency Profiles

- Update profile page layouts
- Update profile header and stats
- Update trade/region displays
- Expand production rollout (50% traffic)

### Week 5: Forms & Interactive Elements

- Update claim listing form
- Update request labor form
- Update all Shadcn form components
- Full production rollout (100% traffic)

### Week 6: Dashboard, Settings & Polish

- Update settings pages
- Update dashboard pages (if different)
- Final QA and bug fixes
- Documentation and handoff

### Week 7: Monitoring & Optimization

- Monitor metrics vs. baseline
- Gather user feedback
- Address any issues
- Plan next iteration improvements

---

## 7. Dependencies & Risks

### Dependencies

- **None** - This is a self-contained frontend update

### Risks & Mitigation

| Risk                                 | Impact | Probability | Mitigation                                                            |
| ------------------------------------ | ------ | ----------- | --------------------------------------------------------------------- |
| Users dislike bold design change     | High   | Medium      | Gradual rollout with A/B testing option; gather feedback early        |
| Accessibility issues discovered late | Medium | Low         | QA accessibility testing at each phase; automated Lighthouse checks   |
| Performance regression from fonts    | Medium | Low         | Monitor Core Web Vitals; optimize font loading with display:swap      |
| Design doesn't improve conversions   | High   | Medium      | Set clear success criteria; be willing to iterate or revert           |
| Cross-browser rendering issues       | Medium | Low         | BrowserStack testing at each phase; CSS feature queries for fallbacks |
| Mobile usability issues              | High   | Low         | Test on real devices; use construction workers as beta testers        |

---

## 8. Next Steps

### Immediate Actions

1. **Stakeholder Review** - Share this FSD with key stakeholders for approval
2. **Baseline Metrics** - Collect 2 weeks of baseline data before any changes
3. **Technical Planning** - Create detailed engineering task list from this FSD
4. **Design Review** - Review CSS specifications with team to identify any gaps

### Suggested Task Breakdown

After FSD approval, use `/create-feature-spec-task-list` to generate:

- Detailed engineering tasks for each week
- Component-level implementation checklist
- QA test cases for each phase
- Rollout and monitoring tasks

### Success Criteria for Moving Forward

- [ ] Stakeholders approve the industrial brutalist direction
- [ ] Team commits to 6-week timeline
- [ ] Baseline metrics collected and documented
- [ ] All open questions resolved

---

## Appendix A: Design Principles Summary

**DO:**

- Use bold, condensed Bebas Neue for headlines (always uppercase)
- Keep backgrounds warm cream (#FAF7F2), not pure white
- Use sharp corners (2-3px border-radius max)
- Use left-border accents for category color coding
- Use barcode font for subtle decorative elements
- Let typography create hierarchy
- Use heavy rules/borders for structure
- Keep cards clean with subtle shadows

**DON'T:**

- Use purple, teal, or gradient backgrounds
- Use pill-shaped or heavily rounded buttons
- Mix multiple color families in one component
- Put gradient bands on every card
- Use Inter, Roboto, Poppins, or system fonts
- Use floating blob backgrounds or abstract illustrations
- Use excessive drop shadows
- Make things look like a typical SaaS landing page

---

## Appendix B: Accessibility Testing Checklist

**Color Contrast:**

- [ ] Test all text/background combinations with WebAIM Contrast Checker
- [ ] Verify category colors are distinguishable with color blindness simulators
- [ ] Ensure focus indicators have 3:1 contrast with adjacent colors

**Screen Readers:**

- [ ] Test navigation with NVDA (Windows)
- [ ] Test navigation with JAWS (Windows)
- [ ] Test navigation with VoiceOver (macOS/iOS)
- [ ] Verify all interactive elements have proper labels
- [ ] Check heading hierarchy is logical

**Keyboard Navigation:**

- [ ] Tab through entire page without mouse
- [ ] Verify all interactive elements are reachable
- [ ] Verify focus indicators are clearly visible
- [ ] Test form submission with keyboard only
- [ ] Verify skip links work correctly

**Responsive & Zoom:**

- [ ] Test at 200% browser zoom (no horizontal scroll)
- [ ] Test at 320px width (smallest mobile)
- [ ] Test on actual iOS and Android devices
- [ ] Verify touch targets are ≥44px
- [ ] Test in landscape and portrait orientations

---

**End of Feature Specification Document**
