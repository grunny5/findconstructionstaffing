# Responsive Testing Checklist

**Phase 4: Mobile & Performance**
**Last Updated**: 2026-01-12

## Overview

Comprehensive checklist for testing responsive layouts across all breakpoints, orientations, and zoom levels. Ensures WCAG 2.1 AA compliance for responsive design and mobile accessibility.

## Test Matrix

| Viewport | Width | Breakpoint | Priority | Test Focus |
|----------|-------|------------|----------|------------|
| Mobile S | 320px | < sm | High | Minimum viable layout |
| Mobile M | 375px | < sm | Critical | Standard mobile (iPhone) |
| Mobile L | 425px | < sm | High | Large mobile (Android) |
| Tablet | 768px | md | High | Tablet portrait |
| Laptop | 1024px | lg | Medium | Laptop |
| Desktop | 1440px | xl | Medium | Large desktop |
| 4K | 2560px | 2xl | Low | High-res displays |

## Critical Test Scenarios

### 1. Mobile Touch Interactions ✅

**MobileFilterSheet Component**:
- [x] Bottom sheet opens from bottom on mobile
- [x] Touch target meets 44x44px minimum
- [x] Filter button visible only on mobile (md:hidden)
- [x] Sheet content scrollable in 85vh container
- [x] Industrial design styling applied

**Button Touch Targets**:
- [x] All buttons meet 44px minimum on mobile
- [x] Icon buttons: 44x44px (min-h-[44px] min-w-[44px])
- [x] Default buttons: 44px height minimum
- [x] Large buttons: 44px+ height
- [x] Responsive sizing: larger on mobile, can be smaller on desktop

**Test Commands**:
```bash
# Run mobile component tests
npm test -- __tests__/components/MobileFilterSheet.test.tsx

# Verify button sizes
grep -r "min-h-\[44px\]" components/ui/button.tsx
```

### 2. Image Optimization ✅

**Agency Logos**:
- [x] Uses next/image with fill prop
- [x] Sizes attribute: `(max-width: 768px) 64px, 64px`
- [x] Lazy loading enabled
- [x] Error handling with fallback initials
- [x] No layout shift during image load

**Test Commands**:
```bash
# Verify image optimization
grep -A5 "next/image" components/AgencyCard.tsx | grep "sizes"
```

### 3. Layout Stability (CLS Prevention) ✅

**Loading States**:
- [x] Root loading.tsx exists with skeleton UI
- [x] Skeleton dimensions match actual content
- [x] Header and Footer included in loading state
- [x] Grid layout preserved during load

**Reserved Space**:
- [x] Images have defined width/height
- [x] Loading skeletons match content dimensions
- [x] No unexpected layout shifts on data load

### 4. Horizontal Scroll Prevention

**Test at Each Breakpoint**:
- [ ] 320px: No horizontal scroll
- [ ] 375px: No horizontal scroll
- [ ] 425px: No horizontal scroll
- [ ] 768px: No horizontal scroll
- [ ] 1024px: No horizontal scroll
- [ ] 1440px: No horizontal scroll
- [ ] 2560px: No horizontal scroll

**Common Causes to Check**:
- [ ] Fixed-width elements exceeding viewport
- [ ] Padding/margin overflow
- [ ] Images without max-width
- [ ] Tables without overflow-x-auto
- [ ] Pre/code blocks without wrapping

**Test Commands**:
```bash
# Check for fixed widths that might overflow
grep -r "w-\[" app/ components/ | grep -v "max-w"
```

### 5. Orientation Changes

**Portrait to Landscape**:
- [ ] Mobile: 375x667 → 667x375
- [ ] Tablet: 768x1024 → 1024x768
- [ ] Layout adapts without breaking
- [ ] Touch targets remain accessible
- [ ] No content clipping

**Landscape to Portrait**:
- [ ] Smooth transition
- [ ] Filters remain accessible
- [ ] Agency cards reflow correctly

### 6. Browser Zoom Levels

Test at zoom levels: **100%, 150%, 200%**

**At 150% Zoom**:
- [ ] All text readable
- [ ] Touch targets still 44px+
- [ ] No horizontal scroll
- [ ] Layout remains usable

**At 200% Zoom**:
- [ ] Critical functionality accessible
- [ ] Text doesn't overlap
- [ ] Buttons remain clickable
- [ ] Forms still usable

**WCAG 2.1 Requirement**: Content must be readable and functional up to 200% zoom without loss of information or functionality.

### 7. Breakpoint-Specific Features

**Mobile (< 768px)**:
- [ ] MobileFilterSheet shown (block md:hidden)
- [ ] Desktop filters hidden (hidden md:block)
- [ ] Touch targets 44px minimum
- [ ] Full-width filter button
- [ ] Bottom sheet opens correctly

**Tablet (768px - 1023px)**:
- [ ] Desktop filters shown
- [ ] Mobile sheet hidden
- [ ] 2-column layout for agency cards
- [ ] Filters displayed inline

**Desktop (1024px+)**:
- [ ] 3-column layout for agency cards
- [ ] All filters visible
- [ ] Hover states work correctly
- [ ] Optimal reading width

## Performance Testing

### Core Web Vitals Targets

**Desktop**:
- [ ] LCP < 2.5s (Largest Contentful Paint)
- [ ] INP < 200ms (Interaction to Next Paint)
- [ ] CLS < 0.1 (Cumulative Layout Shift)

**Mobile**:
- [ ] LCP < 4.0s (target < 3.0s)
- [ ] INP < 200ms
- [ ] CLS < 0.1

**Test with Chrome DevTools**:
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Mobile" or "Desktop"
4. Run audit
5. Check Performance score > 90
6. Verify Core Web Vitals in "good" range

### Network Throttling

**Simulate 3G Network**:
```
Network: Fast 3G
Download: 1.6 Mbps
Upload: 750 Kbps
Latency: 562.5ms
```

**Test Checklist**:
- [ ] Page loads within 5 seconds on 3G
- [ ] Progressive loading shows content incrementally
- [ ] Loading skeletons appear immediately
- [ ] Images lazy load below fold
- [ ] Critical CSS loads first

**Chrome DevTools Steps**:
1. Open DevTools > Network tab
2. Select "Fast 3G" from throttling dropdown
3. Hard refresh page (Cmd+Shift+R / Ctrl+Shift+R)
4. Verify page remains usable during load

## Accessibility Testing

### Touch Target Size (WCAG 2.1 AA)

**Minimum Requirements**:
- [ ] All interactive elements: 44x44px minimum
- [ ] Buttons: min-h-[44px] min-w-[44px]
- [ ] Links: Adequate padding for 44px target
- [ ] Form inputs: Height 44px+ on mobile

**Visual Inspection**:
```bash
# Check button component for touch targets
cat components/ui/button.tsx | grep "min-h"
```

### Keyboard Navigation on Mobile

- [ ] Tab key navigates through interactive elements
- [ ] Focus indicators visible at 200% zoom
- [ ] No keyboard traps
- [ ] Skip links work on mobile

### Screen Reader Testing

**iOS VoiceOver**:
- [ ] All headings announced correctly
- [ ] Form labels associated
- [ ] Dynamic content changes announced
- [ ] Touch gestures work with VoiceOver

**Android TalkBack**:
- [ ] Navigation landmarks clear
- [ ] Buttons have accessible names
- [ ] ARIA live regions work
- [ ] Swipe gestures functional

## Manual Testing Procedure

### Step 1: Visual Inspection

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Test each breakpoint from Test Matrix
4. Check for:
   - Layout breaks
   - Overlapping elements
   - Clipped content
   - Horizontal scroll

### Step 2: Interactive Testing

1. Test touch interactions:
   - Tap filter button (mobile)
   - Open filter sheet
   - Select filters
   - Clear filters

2. Test forms:
   - Focus input fields
   - Submit forms
   - Check validation errors

3. Test navigation:
   - Click agency cards
   - Navigate between pages
   - Use browser back button

### Step 3: Performance Testing

1. Run Lighthouse audit
2. Check Core Web Vitals
3. Test on throttled network
4. Verify loading states

### Step 4: Accessibility Testing

1. Test keyboard navigation
2. Check focus indicators
3. Test with screen reader (if available)
4. Verify touch target sizes

## Browser Testing Matrix

| Browser | Mobile | Tablet | Desktop | Priority |
|---------|--------|--------|---------|----------|
| Chrome | ✓ | ✓ | ✓ | Critical |
| Safari | ✓ | ✓ | ✓ | Critical |
| Firefox | - | - | ✓ | High |
| Edge | - | - | ✓ | Medium |

**Note**: Focus on Chrome and Safari for mobile testing as they represent 95%+ of mobile traffic.

## Automated Testing

### Component Tests

```bash
# Run all mobile component tests
npm test -- __tests__/components/MobileFilterSheet.test.tsx

# Run button component tests
npm test -- components/ui/button

# Run with coverage
npm test -- --coverage
```

### Visual Regression Testing

```bash
# Capture baseline screenshots (requires Playwright or Percy)
# npm run test:visual:baseline

# Compare against baseline
# npm run test:visual:compare
```

## Success Criteria

### Critical (Must Pass Before PR Merge)

- [x] All touch targets meet 44px minimum on mobile
- [x] MobileFilterSheet component created and tested
- [x] No horizontal scroll at any breakpoint
- [ ] Lighthouse Performance score > 90
- [x] All images optimized with sizes attribute
- [x] Loading states prevent layout shift

### High Priority

- [ ] Core Web Vitals in "good" range
- [ ] Page loads in < 5s on 3G
- [ ] Zoom up to 200% functional
- [ ] All automated tests pass

### Medium Priority

- [ ] Visual regression tests pass
- [ ] Cross-browser testing complete
- [ ] Screen reader testing documented

## Known Issues

None currently identified.

## Future Improvements

1. **Progressive Web App (PWA)**: Add service worker for offline support
2. **Image CDN**: Use image CDN for automatic optimization
3. **Code Splitting**: Implement route-based code splitting
4. **Prefetching**: Add link prefetching for faster navigation
5. **Web Vitals Monitoring**: Implement real user monitoring (RUM)

## References

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aaa)
- [Core Web Vitals](https://web.dev/vitals/)
- [Mobile Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Responsive Images](https://nextjs.org/docs/app/building-your-application/optimizing/images)
