# Task Backlog: HomePage Performance Optimization

**Source Analysis:** Performance testing revealed 424ms CI render time (exceeds 350ms threshold)
**Project Foundation:** `CLAUDE.md` (TypeScript strict mode, 85%+ test coverage, Shadcn/ui patterns)
**Performance Target:** Reduce CI initial render time from 424ms to <350ms

This document breaks down the HomePage performance optimization into sprint-ready engineering tasks. All tasks must adhere to project standards: TypeScript strict mode, maintain existing functionality, and achieve measurable performance improvements.

---

## 📦 Performance Issue Summary

**Current Status:**

- ✅ Local performance: ~20ms (excellent)
- ❌ CI performance: 424ms (fails 350ms threshold)
- ❌ Slowdown factor: 21x slower in CI vs local

**Root Causes:**

1. Heavy synchronous imports (1,851 lines of component code)
2. DirectoryFilters component (550 lines) - single largest bottleneck
3. 23+ lucide-react icons loaded eagerly
4. Footer component loaded but below fold
5. No code splitting or lazy loading

**Optimization Target:** Save 150-260ms to achieve <350ms in CI

---

## 📦 Phase 1: High-Impact Lazy Loading (Sprint 1)

**Goal:** Implement lazy loading for heavy components to defer non-critical code
**Estimated Duration:** 4-6 hours
**Dependencies:** None
**Expected Savings:** 150-200ms

---

### ➡️ Story 1.1: Extract Hero Components for Lazy Loading

> As a **Performance Engineer**, I want **to extract hero section components**, so that **icons and decorative content load asynchronously**.

### Engineering Tasks for this Story:

---

### Task 1.1.1: Create HeroStats Component

- **Role:** Frontend Developer
- **Objective:** Extract hero statistics section into standalone component
- **Context:** Hero stats section (lines 380-399 in app/page.tsx) contains 4 stat cards with icons. Currently loaded synchronously.
- **Key Files to Create:**
  - `components/HeroStats.tsx`
- **Key Files to Modify:**
  - `app/page.tsx` (remove lines 380-399, replace with lazy-loaded component)
- **Key Patterns to Follow:**
  - TypeScript strict mode
  - Use Shadcn/ui patterns for styling
  - Import icons: Building2, Users, Target, Clock
  - Export as default for lazy loading compatibility
- **Acceptance Criteria (for this task):**
  - [ ] HeroStats component created with 4 stat cards
  - [ ] Icons imported: Building2, Users, Target, Clock
  - [ ] Component accepts no props (statically defined stats)
  - [ ] Styling matches original implementation
  - [ ] TypeScript strict mode compliance
  - [ ] Component exported as default
- **Definition of Done:**
  - [ ] Component implemented in `components/HeroStats.tsx`
  - [ ] Original code removed from `app/page.tsx`
  - [ ] Component renders identically to original
  - [ ] No TypeScript errors
  - [ ] **Final Check:** Visual QA confirms no layout changes

**Estimated Effort:** 30 minutes

---

### Task 1.1.2: Create TrustIndicators Component

- **Role:** Frontend Developer
- **Objective:** Extract trust indicators section into standalone component
- **Context:** Trust indicators section (lines 558-619 in app/page.tsx) contains 4 trust cards with icons. Currently loaded synchronously.
- **Key Files to Create:**
  - `components/TrustIndicators.tsx`
- **Key Files to Modify:**
  - `app/page.tsx` (remove lines 558-619, replace with lazy-loaded component)
- **Key Patterns to Follow:**
  - TypeScript strict mode
  - Use Shadcn/ui Card component
  - Import icons: Star, TrendingUp, Award, Briefcase
  - Export as default for lazy loading compatibility
- **Acceptance Criteria (for this task):**
  - [ ] TrustIndicators component created with 4 cards
  - [ ] Icons imported: Star, TrendingUp, Award, Briefcase
  - [ ] Component accepts no props (statically defined content)
  - [ ] Styling matches original implementation
  - [ ] TypeScript strict mode compliance
  - [ ] Component exported as default
- **Definition of Done:**
  - [ ] Component implemented in `components/TrustIndicators.tsx`
  - [ ] Original code removed from `app/page.tsx`
  - [ ] Component renders identically to original
  - [ ] No TypeScript errors
  - [ ] **Final Check:** Visual QA confirms no layout changes

**Estimated Effort:** 30 minutes

---

### Task 1.1.3: Create DirectoryFiltersSkeleton Component

- **Role:** Frontend Developer
- **Objective:** Create loading skeleton for DirectoryFilters component
- **Context:** DirectoryFilters is the heaviest component (550 lines). Need skeleton to prevent layout shift during lazy loading.
- **Key Files to Create:**
  - `components/DirectoryFiltersSkeleton.tsx`
- **Key Patterns to Follow:**
  - Use Shadcn/ui Skeleton component
  - Match DirectoryFilters height and layout
  - Minimal implementation (no icons or heavy deps)
  - Export as default
- **Acceptance Criteria (for this task):**
  - [ ] Skeleton component created
  - [ ] Height matches DirectoryFilters component (~200px)
  - [ ] Shows placeholder for search bar, filters, sort dropdown
  - [ ] No layout shift when replaced by real component
  - [ ] Minimal dependencies (no icons)
  - [ ] TypeScript strict mode compliance
- **Definition of Done:**
  - [ ] Component implemented in `components/DirectoryFiltersSkeleton.tsx`
  - [ ] Skeleton height matches DirectoryFilters
  - [ ] No layout shift when DirectoryFilters loads
  - [ ] Component exported as default
  - [ ] **Final Check:** Smooth loading transition

**Estimated Effort:** 20 minutes

---

### ➡️ Story 1.2: Implement Lazy Loading in HomePage

> As a **Performance Engineer**, I want **to lazy load heavy components**, so that **initial bundle size is reduced**.

### Engineering Tasks for this Story:

---

### Task 1.2.1: Add Lazy Loading to HomePage

- **Role:** Frontend Developer
- **Objective:** Update HomePage to use React.lazy for heavy components
- **Context:** HomePage currently imports all components synchronously. Need to convert to lazy loading with Suspense boundaries.
- **Key Files to Modify:**
  - `app/page.tsx`
- **Key Patterns to Follow:**
  - Use React.lazy() for dynamic imports
  - Wrap with Suspense boundaries
  - Provide fallback components for loading states
  - Remove synchronous imports of heavy components
  - Remove unused icon imports
- **Acceptance Criteria (for this task):**
  - [ ] Import React.lazy and Suspense from 'react'
  - [ ] Lazy load DirectoryFilters: `lazy(() => import('@/components/DirectoryFilters'))`
  - [ ] Lazy load Footer: `lazy(() => import('@/components/Footer'))`
  - [ ] Lazy load HeroStats: `lazy(() => import('@/components/HeroStats'))`
  - [ ] Lazy load TrustIndicators: `lazy(() => import('@/components/TrustIndicators'))`
  - [ ] Remove synchronous imports of above components
  - [ ] Remove icon imports: Building2, Users, Target, Clock, Star, TrendingUp, Award, Briefcase
  - [ ] Keep only critical icons: Search, Filter, Loader2
  - [ ] Wrap HeroStats in Suspense with `<div className="h-32" />` fallback
  - [ ] Wrap DirectoryFilters in Suspense with DirectoryFiltersSkeleton fallback
  - [ ] Wrap TrustIndicators in Suspense with `<div className="h-96" />` fallback
  - [ ] Wrap Footer in Suspense with `<div className="h-96" />` fallback
  - [ ] All components render after lazy load
  - [ ] No layout shift during component loading
  - [ ] TypeScript compilation succeeds
  - [ ] All existing tests pass
- **Definition of Done:**
  - [ ] Lazy loading implemented for 4 components
  - [ ] Suspense boundaries added with proper fallbacks
  - [ ] Heavy imports removed (8 icons + 4 components)
  - [ ] No TypeScript errors
  - [ ] No ESLint errors
  - [ ] All tests pass
  - [ ] **Final Check:** Components load smoothly without layout shift

**Estimated Effort:** 1 hour

---

## 📦 Phase 2: Memoization Optimizations (Sprint 1)

**Goal:** Optimize state calculations and side effects
**Estimated Duration:** 1-2 hours
**Dependencies:** Phase 1 (optional - can be done in parallel)
**Expected Savings:** 20-40ms

---

### ➡️ Story 2.1: Optimize Render Performance

> As a **Performance Engineer**, I want **to memoize expensive calculations**, so that **re-renders are faster**.

### Engineering Tasks for this Story:

---

### Task 2.1.1: Memoize Active Filter Count

- **Role:** Frontend Developer
- **Objective:** Move active filter count calculation to useMemo
- **Context:** Active filter count is calculated inline in render (lines 413-441). Should be memoized to avoid recalculation.
- **Key Files to Modify:**
  - `app/page.tsx`
- **Key Patterns to Follow:**
  - Use React.useMemo hook
  - Add filters object as dependency
  - Keep same calculation logic
- **Acceptance Criteria (for this task):**
  - [ ] Create activeFilterCount useMemo before line 413
  - [ ] Move filter counting logic into useMemo callback
  - [ ] Add filters object to dependency array
  - [ ] Replace inline calculation with memoized value
  - [ ] Filter count displays correctly
  - [ ] TypeScript strict mode compliance
- **Definition of Done:**
  - [ ] useMemo implemented for activeFilterCount
  - [ ] Calculation only runs when filters change
  - [ ] Filter badges display correct count
  - [ ] All tests pass
  - [ ] **Final Check:** Verified with React DevTools Profiler

**Estimated Effort:** 15 minutes

---

### Task 2.1.2: Defer URL Updates with startTransition

- **Role:** Frontend Developer
- **Objective:** Wrap router.replace calls in startTransition to defer non-critical updates
- **Context:** router.replace in useEffect (lines 84-122) runs synchronously and can block rendering.
- **Key Files to Modify:**
  - `app/page.tsx`
- **Key Patterns to Follow:**
  - Import startTransition from 'react'
  - Wrap router.replace in startTransition callback
  - Maintain existing useEffect dependencies
- **Acceptance Criteria (for this task):**
  - [ ] Import startTransition from 'react'
  - [ ] Wrap router.replace call in startTransition
  - [ ] URL updates still work correctly
  - [ ] Filters still update URL on change
  - [ ] No infinite re-render loops
  - [ ] TypeScript strict mode compliance
- **Definition of Done:**
  - [ ] startTransition implemented in useEffect
  - [ ] URL updates are deferred
  - [ ] Filter interactions remain smooth
  - [ ] All tests pass
  - [ ] **Final Check:** No performance regressions

**Estimated Effort:** 15 minutes

---

## 📦 Phase 3: Performance Testing & Validation (Sprint 1)

**Goal:** Validate performance improvements and update thresholds
**Estimated Duration:** 1 hour
**Dependencies:** Phase 1 and Phase 2
**Expected Result:** CI render time <350ms

---

### ➡️ Story 3.1: Validate Performance Improvements

> As a **Performance Engineer**, I want **to measure performance improvements**, so that **I can verify we meet the target**.

### Engineering Tasks for this Story:

---

### Task 3.1.1: Run Performance Tests

- **Role:** QA / Performance Engineer
- **Objective:** Run performance tests locally and with CI flag to measure improvements
- **Context:** Need to validate that optimizations achieve <350ms target in CI environment.
- **Key Commands:**
  - `npm test -- app/__tests__/performance.test.tsx` (local)
  - `CI=true npm test -- app/__tests__/performance.test.tsx` (CI simulation)
- **Acceptance Criteria (for this task):**
  - [ ] Local performance test passes
  - [ ] Local render time ≤ 20ms (maintain current performance)
  - [ ] CI simulation test passes
  - [ ] CI render time < 350ms (target achieved)
  - [ ] No test failures introduced
  - [ ] All other tests still pass
- **Definition of Done:**
  - [ ] Performance tests run successfully
  - [ ] CI render time reduced from 424ms to <350ms
  - [ ] Documentation of before/after metrics
  - [ ] Screenshots/logs of test results
  - [ ] **Final Check:** Performance target achieved

**Estimated Effort:** 15 minutes

---

### Task 3.1.2: Update Performance Test Threshold

- **Role:** Frontend Developer
- **Objective:** Restore performance test threshold to 350ms (currently 500ms)
- **Context:** Threshold was increased to 500ms as temporary fix. Should be reduced to 350ms after optimizations.
- **Key Files to Modify:**
  - `app/__tests__/performance.test.tsx` (line 101)
- **Key Patterns to Follow:**
  - Only update if CI performance <350ms
  - Update comment to reflect optimization work
- **Acceptance Criteria (for this task):**
  - [ ] Threshold updated from 500ms to 350ms
  - [ ] Comment updated to reflect optimized state
  - [ ] Performance test passes with new threshold
  - [ ] CI test passes with new threshold
- **Definition of Done:**
  - [ ] Threshold changed: `const threshold = process.env.CI ? 350 : 100;`
  - [ ] Comment updated with optimization notes
  - [ ] All performance tests pass
  - [ ] **Final Check:** Future CI runs will catch regressions

**Estimated Effort:** 5 minutes

---

### Task 3.1.3: Write Performance Optimization Tests

- **Role:** Frontend Developer
- **Objective:** Add tests to verify lazy loading behavior
- **Context:** Need to ensure lazy-loaded components render correctly and don't cause layout shifts.
- **Key Files to Create:**
  - `components/__tests__/HeroStats.test.tsx`
  - `components/__tests__/TrustIndicators.test.tsx`
  - `components/__tests__/DirectoryFiltersSkeleton.test.tsx`
- **Key Patterns to Follow:**
  - Use React Testing Library
  - Test component rendering
  - Test that components match original implementation
  - 85%+ test coverage
- **Acceptance Criteria (for this task):**
  - [ ] HeroStats component tests written (verify 4 stats render)
  - [ ] TrustIndicators component tests written (verify 4 cards render)
  - [ ] DirectoryFiltersSkeleton tests written (verify skeleton renders)
  - [ ] All tests pass
  - [ ] Coverage ≥ 85%
  - [ ] TypeScript strict mode compliance
- **Definition of Done:**
  - [ ] 3 test files created with comprehensive coverage
  - [ ] All tests pass
  - [ ] Coverage metrics meet requirements
  - [ ] **Final Check:** Components tested in isolation

**Estimated Effort:** 1 hour

---

## 📦 Phase 4: Documentation & Cleanup (Sprint 1)

**Goal:** Document changes and create PR
**Estimated Duration:** 30 minutes
**Dependencies:** Phases 1, 2, and 3

---

### ➡️ Story 4.1: Document Performance Improvements

> As a **Developer**, I want **documentation of the optimization**, so that **future developers understand the changes**.

### Engineering Tasks for this Story:

---

### Task 4.1.1: Update Performance Documentation

- **Role:** Technical Writer / Developer
- **Objective:** Document the optimization work and results
- **Context:** Need to record performance improvements for future reference.
- **Key Files to Create/Modify:**
  - `docs/performance/HOMEPAGE_OPTIMIZATION.md` (new)
  - Update `CLAUDE.md` if needed
- **Acceptance Criteria (for this task):**
  - [ ] Document created with optimization details
  - [ ] Before/after metrics documented
  - [ ] List of optimizations implemented
  - [ ] Instructions for monitoring performance
  - [ ] Explanation of lazy loading approach
- **Definition of Done:**
  - [ ] Documentation written
  - [ ] Metrics included (before: 424ms, after: <350ms)
  - [ ] Future optimization opportunities noted
  - [ ] **Final Check:** Clear and comprehensive

**Estimated Effort:** 20 minutes

---

### Task 4.1.2: Create Pull Request

- **Role:** Developer
- **Objective:** Create PR with all optimization changes
- **Context:** Consolidate all performance optimization work into single PR.
- **Key Files Modified:**
  - `app/page.tsx`
  - `app/__tests__/performance.test.tsx`
  - `components/HeroStats.tsx` (new)
  - `components/TrustIndicators.tsx` (new)
  - `components/DirectoryFiltersSkeleton.tsx` (new)
  - Test files (new)
  - Documentation (new)
- **Acceptance Criteria (for this task):**
  - [ ] PR created with descriptive title
  - [ ] PR description includes:
    - Performance metrics (before/after)
    - List of optimizations
    - Testing performed
    - Screenshots of before/after if relevant
  - [ ] All CI checks pass
  - [ ] No breaking changes
  - [ ] Code review requested
- **Definition of Done:**
  - [ ] PR submitted
  - [ ] All CI checks green
  - [ ] Code review completed
  - [ ] PR approved and merged
  - [ ] **Final Check:** Performance improvement verified in production

**Estimated Effort:** 15 minutes

---

## 📊 Success Metrics

### Must Have ✅

1. CI initial render time < 350ms (currently 424ms)
2. All existing tests pass
3. No visible layout shifts during lazy loading
4. Components render correctly after lazy load
5. Test coverage maintained at 85%+

### Nice to Have 🎯

1. CI render time < 300ms (stretch goal)
2. Local render time < 15ms
3. Improved Lighthouse performance score
4. Reduced bundle size metrics

---

## 🚨 Risks & Mitigations

### Risk 1: Lazy Loading Introduces Layout Shift

- **Mitigation**: Use proper Suspense fallbacks with matching heights
- **Validation**: Visual QA and manual testing

### Risk 2: Optimizations Don't Achieve <350ms

- **Mitigation**: Have fallback plan (increase threshold to 450ms)
- **Validation**: Test with CI=true flag before committing

### Risk 3: Breaking Changes to Component Behavior

- **Mitigation**: Comprehensive test coverage
- **Validation**: All existing tests must pass

---

## 📈 Expected Performance Breakdown

| Component              | Before     | After       | Savings    |
| ---------------------- | ---------- | ----------- | ---------- |
| DirectoryFilters parse | 100-150ms  | 0ms (async) | 100-150ms  |
| Footer parse           | 30-50ms    | 0ms (async) | 30-50ms    |
| Icon imports           | 50-100ms   | 15-30ms     | 35-70ms    |
| UI components          | 40-80ms    | 30-50ms     | 10-30ms    |
| State init             | 30-50ms    | 25-40ms     | 5-10ms     |
| **TOTAL**              | **~424ms** | **~220ms**  | **~200ms** |

---

## 🔄 Alternative Approaches (If Primary Plan Fails)

### Option 1: Server Components

- Convert static sections to Next.js Server Components
- Reduces client-side JavaScript
- Requires Next.js 13+ App Router refactoring

### Option 2: Route Splitting

- Move filters to `/directory` route
- Keep `/` as lightweight landing page
- Requires routing changes

### Option 3: Increase Threshold

- Accept 424ms as acceptable for CI
- Update threshold to 450ms or 500ms
- Document performance limitation

---

## 📅 Total Time Estimate

- **Phase 1 (Lazy Loading)**: 2-3 hours
- **Phase 2 (Memoization)**: 30 minutes
- **Phase 3 (Testing)**: 1.5 hours
- **Phase 4 (Documentation)**: 30 minutes

**Total**: 4.5-5.5 hours (approximately 1 day)

**Confidence**: HIGH - Lazy loading is proven technique for performance optimization

---

## ✅ Task Completion Checklist

Before closing this task list, ensure:

- [ ] All Phase 1 tasks completed
- [ ] All Phase 2 tasks completed
- [ ] All Phase 3 tasks completed
- [ ] All Phase 4 tasks completed
- [ ] Performance target achieved (CI < 350ms)
- [ ] All tests passing
- [ ] PR merged
- [ ] Documentation updated
- [ ] Metrics tracked in performance monitoring

---

**Document Version**: 1.0
**Created**: 2025-12-14
**Last Updated**: 2025-12-14
**Status**: Ready for Implementation
