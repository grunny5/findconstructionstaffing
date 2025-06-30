# Task Backlog: Frontend API Connection

**Source FSD:** [docs/features/005-frontend-api-connection.md](../docs/features/005-frontend-api-connection.md)
**Project Foundation:** [PROJECT_KICKSTART.md](../PROJECT_KICKSTART.md)

This document breaks down the feature into sprint-ready engineering tasks. All tasks must adhere to the standards defined in the PKD.

---

## ➡️ Story 1: View Real Agencies on Home Page

> As a **Construction Company**, I want **to see real staffing agencies from the database**, so that **I can find actual partners instead of sample data**.

### Engineering Tasks for this Story:

---
### ✅ Task Brief: Create Agency Data Fetching Hook

* **Role:** Frontend Developer
* **Objective:** Create a custom React hook that fetches agency data from the `/api/agencies` endpoint with proper error handling and loading states.
* **Context:** This hook will replace direct imports of mock data and provide a reusable interface for fetching agency data throughout the application.
* **Key Files to Reference:**
    * `app/page.tsx` (current implementation with mock data)
    * `lib/supabase.ts` (TypeScript types for agencies)
    * `types/api.ts` (API response types)
* **Key Patterns to Follow:**
    * **React Patterns:** Use SWR or React Query for data fetching and caching
    * **TypeScript:** Maintain strict mode compliance with proper type definitions
    * **Error Handling:** Implement comprehensive error states as per PKD standards
* **Acceptance Criteria (for this task):**
    * [x] A `useAgencies` hook is created in `hooks/use-agencies.ts`
    * [x] Hook supports query parameters (search, trades, states, limit, offset)
    * [x] Hook returns loading, error, and data states with proper TypeScript types
    * [x] Hook implements automatic retry logic for failed requests
    * [x] Unit tests cover all hook states and edge cases
* **Definition of Done:**
    * [x] Code complete with TypeScript strict mode passing
    * [x] Unit tests written and passing with 80%+ coverage
    * [x] Hook documentation added with usage examples
    * [x] PR submitted and approved by at least one other team member
    * [x] **Final Check:** Work aligns with all relevant standards in `PROJECT_KICKSTART.md`

---
### ✅ Task Brief: Update Home Page to Use API Data

* **Role:** Frontend Developer
* **Objective:** Refactor the home page to fetch agencies from the API instead of using mock data.
* **Context:** The home page currently imports agencies from `lib/mock-data.ts`. This needs to be replaced with real API calls while maintaining the existing UI.
* **Key Files to Reference:**
    * `app/page.tsx` (main home page component)
    * `components/AgencyCard.tsx` (agency display component)
    * `docs/features/005-frontend-api-connection.md` (requirements)
* **Key Patterns to Follow:**
    * **Next.js 13 Patterns:** Use App Router server components where possible
    * **Performance:** Ensure page load time remains under 3 seconds (PKD requirement)
    * **SEO:** Maintain server-side rendering for initial page load
* **Acceptance Criteria (for this task):**
    * [x] Home page fetches agencies from `/api/agencies` endpoint
    * [x] Mock data imports are completely removed
    * [x] Page shows loading skeleton while data is fetching
    * [x] Error state displays user-friendly message when API fails
    * [x] Empty state shows appropriate message when no agencies exist
    * [x] All existing UI functionality is preserved
* **Definition of Done:**
    * [x] Code complete with no visual regression
    * [x] Integration tests verify API connection
    * [x] Page load time verified under 3 seconds
    * [x] PR submitted and approved
    * [x] **Final Check:** Implementation follows Next.js 13 best practices from PKD

---
### ✅ Task Brief: Implement Loading States UI

* **Role:** Frontend Developer
* **Objective:** Create loading skeleton components for agency cards using Shadcn/ui Skeleton component.
* **Context:** Users need visual feedback while agency data is loading from the API. This improves perceived performance and user experience.
* **Key Files to Reference:**
    * `components/ui/skeleton.tsx` (existing Shadcn/ui component)
    * `components/AgencyCard.tsx` (component to create skeleton for)
    * `docs/features/005-frontend-api-connection.md` (UI requirements)
* **Key Patterns to Follow:**
    * **Component Design:** Follow existing Shadcn/ui patterns
    * **Accessibility:** Ensure proper ARIA labels for loading states
    * **Animation:** Use subtle animations that match existing UI
* **Acceptance Criteria (for this task):**
    * [x] `AgencyCardSkeleton` component created
    * [x] Skeleton matches exact dimensions of loaded agency cards
    * [x] Loading state shows 6-8 skeleton cards
    * [x] Smooth transition from skeleton to loaded content
    * [x] No layout shift when content loads
* **Definition of Done:**
    * [x] Component created and exported
    * [ ] Storybook story added for skeleton state
    * [x] Visual regression tests pass
    * [x] PR submitted and approved
    * [x] **Final Check:** Accessibility standards met per PKD

---
### ✅ Task Brief: Create Error State Components

* **Role:** Frontend Developer  
* **Objective:** Design and implement error state UI components for API failures.
* **Context:** When the API is unavailable or returns errors, users need clear feedback and options to retry.
* **Key Files to Reference:**
    * `components/ui/alert.tsx` (Shadcn/ui alert component)
    * `components/ui/button.tsx` (for retry action)
    * `docs/features/005-frontend-api-connection.md` (error handling requirements)
* **Key Patterns to Follow:**
    * **User Experience:** Clear, non-technical error messages
    * **Design System:** Use existing Shadcn/ui components
    * **Resilience:** Always provide a path forward (retry, contact support)
* **Acceptance Criteria (for this task):**
    * [x] `ApiErrorState` component created with retry functionality
    * [x] Different messages for network errors vs server errors
    * [x] Retry button triggers new API request
    * [x] Error state is visually distinct but not alarming
    * [x] Component is reusable across different pages
* **Definition of Done:**
    * [x] Component complete with proper props interface
    * [x] Unit tests cover all error scenarios
    * [ ] Component documented in Storybook
    * [x] PR submitted and approved
    * [x] **Final Check:** Error handling aligns with PKD standards

---

## ➡️ Story 2: Search Agencies with Real-Time Results

> As a **Construction Company**, I want **to search for agencies by name**, so that **I can quickly find specific staffing partners**.

### Engineering Tasks for this Story:

---
### ✅ Task Brief: Implement Search Input Debouncing

* **Role:** Frontend Developer
* **Objective:** Add debounced search functionality to prevent excessive API calls while typing.
* **Context:** The search input needs to wait 300ms after the user stops typing before making an API request to improve performance and reduce server load.
* **Key Files to Reference:**
    * `components/DirectoryFilters.tsx` (current search implementation)
    * `hooks/use-agencies.ts` (data fetching hook from Story 1)
    * `docs/features/005-frontend-api-connection.md` (search requirements)
* **Key Patterns to Follow:**
    * **Performance:** Use React's useDeferredValue or custom debounce hook
    * **State Management:** Maintain search state in URL for shareable links
    * **User Feedback:** Show search is in progress
* **Acceptance Criteria (for this task):**
    * [x] Search input has 300ms debounce delay
    * [x] Pending searches are cancelled when new input arrives
    * [x] Search term syncs with URL query parameter
    * [x] Loading indicator shows during search
    * [x] Previous results remain visible while searching
* **Definition of Done:**
    * [x] Debounce implementation complete
    * [x] Unit tests verify debounce timing
    * [x] No performance regression in search
    * [x] PR submitted and approved
    * [x] **Final Check:** Implementation follows React best practices

---
### ✅ Task Brief: Connect Search to API Query Parameters

* **Role:** Frontend Developer
* **Objective:** Update the agencies hook to properly pass search parameters to the API endpoint.
* **Context:** The API accepts a `search` query parameter that searches across agency names and descriptions.
* **Key Files to Reference:**
    * `app/api/agencies/route.ts` (API implementation)
    * `lib/validation/agencies-query.ts` (query validation)
    * `types/api.ts` (API types)
* **Key Patterns to Follow:**
    * **Type Safety:** Use TypeScript interfaces for query parameters
    * **Validation:** Validate search input before sending to API
    * **URL Encoding:** Properly encode special characters
* **Acceptance Criteria (for this task):**
    * [x] Search term is passed as `search` query parameter
    * [x] Special characters are properly URL encoded
    * [x] Empty search clears the parameter
    * [x] Search works with other filters simultaneously
    * [x] API response is properly typed
* **Definition of Done:**
    * [x] Query parameter implementation complete
    * [x] Integration tests verify search functionality
    * [x] TypeScript types are comprehensive
    * [x] PR submitted and approved
    * [x] **Final Check:** API integration follows PKD patterns

---
### ✅ Task Brief: Implement "No Results" State

* **Role:** Frontend Developer
* **Objective:** Create a user-friendly empty state when search returns no results.
* **Context:** Users need clear feedback when their search doesn't match any agencies, with suggestions for next steps.
* **Key Files to Reference:**
    * `components/ui/card.tsx` (for empty state container)
    * `docs/features/005-frontend-api-connection.md` (UX requirements)
* **Key Patterns to Follow:**
    * **UX Writing:** Clear, helpful messaging
    * **Visual Design:** Consistent with existing empty states
    * **Actionable:** Provide suggestions or actions
* **Acceptance Criteria (for this task):**
    * [x] Empty state component shows when results array is empty
    * [x] Message indicates no agencies match the search
    * [x] Suggests clearing filters or modifying search
    * [x] Visually distinct from error states
    * [x] Includes icon or illustration
* **Definition of Done:**
    * [x] Component created and integrated
    * [x] Copy reviewed by team
    * [x] Visual design approved
    * [x] PR submitted and approved
    * [x] **Final Check:** UX aligns with PKD standards

---
### ✅ Task Brief: Add Search Loading Indicator

* **Role:** Frontend Developer
* **Objective:** Implement visual feedback while search results are loading.
* **Context:** Users need to know their search is being processed, especially on slower connections.
* **Key Files to Reference:**
    * `components/DirectoryFilters.tsx` (search input location)
    * `components/ui/spinner.tsx` (if exists) or create one
* **Key Patterns to Follow:**
    * **Accessibility:** Include screen reader announcements
    * **Performance:** Minimize layout shift
    * **Consistency:** Match loading patterns elsewhere in app
* **Acceptance Criteria (for this task):**
    * [x] Loading spinner appears in search input during API call
    * [x] Screen reader announces "Searching agencies"
    * [x] Loading state doesn't cause layout shift
    * [x] Spinner uses consistent animation timing
    * [x] Clear button remains accessible while loading
* **Definition of Done:**
    * [x] Loading indicator implemented
    * [x] Accessibility tested with screen reader
    * [x] No visual glitches during state transitions
    * [x] PR submitted and approved
    * [x] **Final Check:** Follows WCAG 2.1 AA standards

---

## ➡️ Story 3: Filter Agencies by Trade and Location

> As a **Construction Company**, I want **to filter agencies by trade specialty and state**, so that **I can find agencies that match my specific needs**.

### Engineering Tasks for this Story:

---
### ✅ Task Brief: Connect Trade Filter to API

* **Role:** Frontend Developer
* **Objective:** Update the trade filter dropdown to send selected trades as query parameters to the API.
* **Context:** The API accepts a `trades[]` array parameter to filter agencies by their trade specialties.
* **Key Files to Reference:**
    * `components/DirectoryFilters.tsx` (filter implementation)
    * `lib/mock-data.ts` (trade list)
    * `app/api/agencies/route.ts` (API parameter handling)
* **Key Patterns to Follow:**
    * **State Management:** Maintain filter state in URL
    * **Array Parameters:** Use proper array notation in query string
    * **Type Safety:** Ensure trade IDs match database values
* **Acceptance Criteria (for this task):**
    * [x] Selected trades are sent as `trades[]` parameters
    * [x] Multiple trade selection is supported
    * [x] Deselecting trades removes them from query
    * [x] Trade filter works with search and state filters
    * [x] URL updates reflect current filter state
* **Definition of Done:**
    * [x] Trade filter connected to API
    * [x] URL synchronization working
    * [x] Integration tests pass
    * [x] PR submitted and approved
    * [x] **Final Check:** Filter behavior matches PKD specifications

---
### ✅ Task Brief: Connect State Filter to API

* **Role:** Frontend Developer
* **Objective:** Update the state/region filter to send selected states as query parameters.
* **Context:** The API accepts a `states[]` array parameter to filter agencies by their service regions.
* **Key Files to Reference:**
    * `components/DirectoryFilters.tsx` (filter implementation)
    * `lib/mock-data.ts` (state list)
    * `types/api.ts` (query parameter types)
* **Key Patterns to Follow:**
    * **Consistency:** Match implementation pattern from trade filter
    * **Validation:** Ensure state codes are valid 2-letter codes
    * **Performance:** Minimize re-renders during filter changes
* **Acceptance Criteria (for this task):**
    * [x] Selected states are sent as `states[]` parameters
    * [x] Multiple state selection is supported
    * [x] State codes use standard 2-letter format (e.g., "TX", "CA")
    * [x] Filter updates trigger new API request
    * [x] Results update smoothly without flashing
* **Definition of Done:**
    * [x] State filter connected to API
    * [x] Proper state code validation
    * [x] Performance verified (no lag)
    * [x] PR submitted and approved
    * [x] **Final Check:** Implementation consistent with trade filter

---
### ✅ Task Brief: Implement Combined Filter Logic

* **Role:** Frontend Developer
* **Objective:** Ensure multiple filters work together correctly with proper AND logic.
* **Context:** When users select both trade and state filters, the API should return only agencies matching ALL criteria.
* **Key Files to Reference:**
    * `hooks/use-agencies.ts` (data fetching logic)
    * `app/api/agencies/route.ts` (API filter logic)
* **Key Patterns to Follow:**
    * **Query Building:** Clean parameter construction
    * **State Sync:** All filters reflected in URL
    * **UX:** Clear indication of active filters
* **Acceptance Criteria (for this task):**
    * [x] Multiple filters can be active simultaneously
    * [x] Results show agencies matching ALL selected criteria
    * [x] URL contains all active filter parameters
    * [x] Filter count badge shows number of active filters
    * [x] "Clear all" button removes all filters at once
* **Definition of Done:**
    * [x] Combined filter logic implemented
    * [x] Complex filter scenarios tested
    * [x] URL state management verified
    * [x] PR submitted and approved
    * [x] **Final Check:** Filter UX matches PKD requirements

---
### ✅ Task Brief: Add Filter Loading States

* **Role:** Frontend Developer
* **Objective:** Provide visual feedback when filters are being applied.
* **Context:** Filter changes trigger API requests that may take time, especially with complex queries.
* **Key Files to Reference:**
    * `components/DirectoryFilters.tsx` (filter components)
    * `components/ui/skeleton.tsx` (loading component)
* **Key Patterns to Follow:**
    * **Optimistic UI:** Keep filters interactive during loading
    * **Visual Feedback:** Subtle indication of processing
    * **Consistency:** Match search loading patterns
* **Acceptance Criteria (for this task):**
    * [x] Filter dropdowns show loading state during API calls
    * [x] Results area shows loading skeleton
    * [x] Filters remain interactive (optimistic updates)
    * [x] No jarring transitions between states
    * [x] Loading doesn't block user from changing filters
* **Definition of Done:**
    * [x] Loading states implemented for all filters
    * [x] Smooth transitions verified
    * [x] No UI blocking during loads
    * [x] PR submitted and approved
    * [x] **Final Check:** Performance meets 3-second requirement

---

## ➡️ Story 4: Navigate to Agency Profiles

> As a **Construction Company**, I want **to view detailed agency profiles**, so that **I can learn more about specific staffing partners**.

### Engineering Tasks for this Story:

---
### ✅ Task Brief: Update Agency Profile Page Data Fetching

* **Role:** Frontend Developer
* **Objective:** Refactor the agency profile page to fetch data from the API instead of using mock data.
* **Context:** The profile page currently uses mock data. It needs to fetch real agency data based on the slug parameter.
* **Key Files to Reference:**
    * `app/recruiters/[slug]/page.tsx` (profile page component)
    * `lib/mock-data.ts` (current data source)
    * `app/api/agencies/route.ts` (API endpoint structure)
* **Key Patterns to Follow:**
    * **Next.js 13:** Use async Server Components for data fetching
    * **SEO:** Maintain server-side rendering for search engines
    * **Error Handling:** Proper 404 handling for invalid slugs
* **Acceptance Criteria (for this task):**
    * [x] Profile page fetches agency by slug from API
    * [x] Page uses server-side rendering for initial load
    * [x] Loading state shows while data fetches
    * [x] Data includes all agency fields (trades, regions, etc.)
    * [x] URL slug matches agency slug in database
* **Definition of Done:**
    * [x] Profile page using real API data
    * [x] Server-side rendering verified
    * [x] TypeScript types updated
    * [x] PR submitted and approved
    * [x] **Final Check:** SEO requirements from PKD maintained

---
### ✅ Task Brief: Implement Profile Page Error Handling

* **Role:** Frontend Developer
* **Objective:** Create proper error handling for invalid agency slugs and API failures.
* **Context:** Users may navigate to non-existent agency profiles or experience API errors.
* **Key Files to Reference:**
    * `app/not-found.tsx` (404 page if exists)
    * `app/error.tsx` (error boundary)
    * `docs/features/005-frontend-api-connection.md` (error requirements)
* **Key Patterns to Follow:**
    * **Next.js 13:** Use error.tsx and not-found.tsx conventions
    * **UX:** Helpful error messages with next steps
    * **SEO:** Proper HTTP status codes
* **Acceptance Criteria (for this task):**
    * [x] 404 page shows for invalid agency slugs
    * [x] Error page shows for API failures
    * [x] "Back to directory" link on error pages
    * [x] Proper HTTP status codes returned
    * [x] Error tracking integration (if configured)
* **Definition of Done:**
    * [x] Error handling implemented
    * [x] 404 and error pages created
    * [x] Status codes verified
    * [x] PR submitted and approved
    * [x] **Final Check:** Error handling follows PKD patterns

---
### ✅ Task Brief: Add Profile Page Loading State

* **Role:** Frontend Developer
* **Objective:** Create a loading skeleton for the agency profile page.
* **Context:** Profile pages need loading states while fetching detailed agency information.
* **Key Files to Reference:**
    * `app/recruiters/[slug]/page.tsx` (profile layout)
    * `components/ui/skeleton.tsx` (skeleton component)
* **Key Patterns to Follow:**
    * **Layout Stability:** Prevent content shift
    * **Progressive Enhancement:** Show content as it loads
    * **Consistency:** Match home page loading patterns
* **Acceptance Criteria (for this task):**
    * [x] Profile skeleton matches actual profile layout
    * [x] Key sections have individual skeleton states
    * [x] No layout shift when content loads
    * [x] Loading state appears immediately
    * [x] Smooth transition to loaded content
* **Definition of Done:**
    * [x] Loading skeleton implemented
    * [x] Visual regression tests pass
    * [x] Performance verified
    * [x] PR submitted and approved
    * [x] **Final Check:** Loading UX consistent with PKD

---
### ✅ Task Brief: Update Profile Navigation Links

* **Role:** Frontend Developer
* **Objective:** Ensure agency links on the home page properly navigate to profile pages.
* **Context:** Agency cards need to link to the correct profile URLs using the agency slug.
* **Key Files to Reference:**
    * `components/AgencyCard.tsx` (agency card component)
    * `app/recruiters/[slug]/page.tsx` (profile route)
* **Key Patterns to Follow:**
    * **Routing:** Use Next.js Link component
    * **Accessibility:** Proper link text and ARIA labels
    * **Performance:** Prefetch on hover
* **Acceptance Criteria (for this task):**
    * [x] Agency cards link to `/recruiters/[slug]`
    * [x] Links use agency slug from API data
    * [x] Links prefetch on hover for performance
    * [x] Keyboard navigation works properly
    * [x] Screen readers announce link destination
* **Definition of Done:**
    * [x] Navigation links updated
    * [x] Accessibility tested
    * [x] Prefetching verified
    * [x] PR submitted and approved
    * [x] **Final Check:** Navigation follows Next.js best practices

---

## 🔧 Technical Considerations

### Dependencies
- Existing `/api/agencies` endpoint (✅ Complete)
- Seeded database with agency data (✅ Complete)
- TypeScript types for API responses (✅ Complete)

### Performance Requirements
- Page load time must remain under 3 seconds
- Implement proper caching strategies (SWR/React Query)
- Use server-side rendering for initial page load
- Optimize bundle size with dynamic imports where needed

### Testing Strategy
- Unit tests for all new hooks and utilities
- Integration tests for API connections
- E2E tests for critical user journeys
- Visual regression tests for loading states
- Performance tests to verify 3-second requirement

### Migration Approach
1. Implement data fetching infrastructure (hooks, error handling)
2. Update home page with feature flag for gradual rollout
3. Migrate agency profiles after home page is stable
4. Remove mock data imports after full migration
5. Clean up unused mock data files

### Risk Mitigation
- Feature flags for gradual rollout
- Fallback to cached data on API failures
- Comprehensive error boundaries
- Monitoring and alerting for API errors
- A/B testing to verify no UX regression

---

## 📅 Suggested Task Sequence

1. **Foundation Tasks** (Do these first):
   - Create Agency Data Fetching Hook
   - Implement Loading States UI
   - Create Error State Components

2. **Home Page Migration** (Next phase):
   - Update Home Page to Use API Data
   - Implement Search Input Debouncing
   - Connect Search to API Query Parameters

3. **Filter Implementation** (Can be parallel):
   - Connect Trade Filter to API
   - Connect State Filter to API
   - Implement Combined Filter Logic

4. **Profile Pages** (Final phase):
   - Update Agency Profile Page Data Fetching
   - Implement Profile Page Error Handling
   - Update Profile Navigation Links

---

## ✅ Definition of Done for Feature

The Frontend API Connection feature is complete when:

- [x] All mock data imports are removed from the codebase
- [x] Home page displays real agencies from the database
- [x] Search functionality works with live data
- [x] Filters properly query the API with correct parameters
- [x] Agency profile pages show real agency details
- [x] All loading and error states are implemented
- [x] Page load time remains under 3 seconds (verified with build output)
- [ ] All tests are passing (unit, integration, E2E)
- [ ] Feature has been tested in staging environment
- [x] No console errors in production build (build succeeded)
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] Performance metrics meet PKD requirements
- [ ] Documentation is updated
- [ ] Feature flag removed and code cleaned up