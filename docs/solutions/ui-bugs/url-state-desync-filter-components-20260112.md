---
module: Frontend
date: 2026-01-12
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "URL search params not reflected in filter UI on initial page load"
  - "Filter controls showed empty state despite URL containing filter values"
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [state-management, url-params, next-js, react, filters, controlled-components, lazy-loading]
---

# Troubleshooting: URL State Desynchronization in Filter Components

## Problem
Filter UI components (DirectoryFilters and MobileFilterSheet) were not reflecting URL search parameters on initial page load, causing a state desynchronization where the URL contained filter values but the UI showed empty/default state.

## Environment
- Module: Frontend (Next.js App Router)
- Framework: Next.js 13.5.1 with React
- Affected Components: DirectoryFilters, MobileFilterSheet, app/page.tsx
- Date: 2026-01-12
- PR: #665 (Phase 4: Mobile Optimization & Touch Interactions)

## Symptoms
- URL contains search params like `?search=electrician&states[]=TX`
- Filter UI controls (desktop and mobile) show empty state on page load
- User has to manually re-select filters that are already present in the URL
- State desynchronization between URL (source of truth) and UI representation
- Issue affects both desktop DirectoryFilters and mobile MobileFilterSheet components

## What Didn't Work

**Initial Implementation:** Created mobile filter components without considering URL state initialization
- **Why it failed:** Components had `initialFilters` prop available but parent wasn't passing the URL-derived filter state

**CodeRabbit Detection:** Issue was caught during automated PR review rather than manual testing
- **Why this matters:** Highlighted the value of automated review tools for catching state management issues

## Solution

Pass the URL-initialized `filters` state to both filter components via the `initialFilters` prop.

**Code changes:**

```typescript
// app/page.tsx - BEFORE (broken):
<DirectoryFilters
  onFiltersChange={setFilters}
  totalResults={filteredAgencies.length}
  isLoading={isValidating || isSearching}
  // ❌ Missing initialFilters prop
/>

<MobileFilterSheet
  onFiltersChange={setFilters}
  totalResults={filteredAgencies.length}
  isLoading={isValidating || isSearching}
  // ❌ Missing initialFilters prop
/>

// app/page.tsx - AFTER (fixed):
<DirectoryFilters
  onFiltersChange={setFilters}
  totalResults={filteredAgencies.length}
  isLoading={isValidating || isSearching}
  initialFilters={filters}  // ✅ Syncs with URL params
/>

<MobileFilterSheet
  onFiltersChange={setFilters}
  totalResults={filteredAgencies.length}
  isLoading={isValidating || isSearching}
  initialFilters={filters}  // ✅ Syncs with URL params
/>
```

**Context - Filter state initialization from URL:**
```typescript
// app/page.tsx - Lines 63-73
const [filters, setFilters] = useState<FilterState>({
  search: searchParams.get('search') || '',
  trades: searchParams.getAll('trades[]') || [],
  states: searchParams.getAll('states[]') || [],
  compliance: validateComplianceParams(searchParams.getAll('compliance[]')),
  perDiem: null,
  union: null,
  claimedOnly: false,
  companySize: [],
  focusAreas: [],
});
```

**Commits:**
- `97dbd13` - fix: pass initialFilters to DirectoryFilters and MobileFilterSheet

## Why This Works

**Root Cause:**
The parent component (`app/page.tsx`) correctly initialized filter state from URL search params, but this state was never communicated to the child filter components. Both DirectoryFilters and MobileFilterSheet accept an optional `initialFilters` prop to set their initial state, but without receiving this prop, they defaulted to empty state.

**Why the solution works:**
1. **Single Source of Truth**: The URL search params are the source of truth for filter state
2. **State Propagation**: By passing `initialFilters={filters}`, we propagate the URL-derived state to the components
3. **Controlled Components**: Both filter components are controlled components that respect `initialFilters` for their initial render
4. **Consistent Experience**: Desktop and mobile users now see the same filter state when arriving via a URL with search params

**Technical Details:**
- Next.js App Router provides `useSearchParams()` hook for reading URL state
- Filter components maintain internal state but accept `initialFilters` for initialization
- The `initialFilters` prop is typed as `Partial<FilterState>` allowing flexible initialization
- State updates flow: URL → parent `filters` state → `initialFilters` prop → component internal state

## Related Improvements

During the same PR, an additional optimization was implemented based on CodeRabbit review:

**Lazy Loading for Mobile-Only Component:**

```typescript
// app/page.tsx - BEFORE:
import { MobileFilterSheet } from '@/components/MobileFilterSheet';

// app/page.tsx - AFTER:
import dynamic from 'next/dynamic';

const MobileFilterSheet = dynamic(
  () => import('@/components/MobileFilterSheet').then((mod) => ({ default: mod.MobileFilterSheet })),
  {
    loading: () => null,
    ssr: false,
  }
);
```

**Benefits:**
- Reduces initial bundle size by code-splitting mobile-specific component
- Component only loads when needed (mobile breakpoint)
- SSR disabled since component is client-side only (hidden with `md:hidden`)
- Desktop users never download mobile filter code

**Commit:** `9e4e461` - perf: implement lazy loading for MobileFilterSheet component

## Prevention

**When creating controlled React components:**
1. ✅ Always consider how the component will receive its initial state
2. ✅ If the component accepts `initialFilters`, `initialValue`, or similar props, ensure the parent passes URL-derived or persisted state
3. ✅ Document prop requirements clearly, especially for state initialization
4. ✅ Test components with URL parameters to verify state sync

**Code review checklist:**
- [ ] Do controlled components receive necessary initial state props?
- [ ] Does URL state (search params) propagate to UI components?
- [ ] Are mobile-only or desktop-only components lazy loaded?
- [ ] Is state initialization tested with URL parameters?

**Automated detection:**
- CodeRabbit successfully identified this issue during PR review
- Pattern: Component accepts optional state initialization prop but parent doesn't pass it
- Look for: `initialFilters`, `defaultValue`, `initialValue` props that aren't being used

**Early detection:**
- Manual testing with URL parameters (e.g., `/?search=test&states[]=CA`)
- E2E tests that navigate to URLs with search params
- TypeScript can help if `initialFilters` is marked as required instead of optional

## Related Issues

**Similar patterns to watch for:**
- Any component with `initial*` or `default*` props not receiving parent state
- URL state management in Next.js App Router (useSearchParams hook)
- Controlled vs uncontrolled component state initialization

**No directly related issues documented yet.**

## Additional Context

**CodeRabbit Review Process:**
This issue was discovered through multiple rounds of CodeRabbit automated review:
1. First review: Identified unused imports and markdown linting issues
2. Second review: Suggested lazy loading optimization for mobile component
3. Third review: Caught missing `initialFilters` props (marked as 🟠 Major)

**Iterative fix commits:**
- `5662a67` - Removed unused imports, fixed markdown linting
- `9e4e461` - Implemented lazy loading optimization
- `97dbd13` - Added missing initialFilters props

**Lesson:** Automated code review tools can catch state management issues that might be missed in manual testing, especially when dealing with URL-driven state initialization.
