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
    * [ ] Home page fetches agencies from `/api/agencies` endpoint
    * [ ] Mock data imports are completely removed
    * [ ] Page shows loading skeleton while data is fetching
    * [ ] Error state displays user-friendly message when API fails
    * [ ] Empty state shows appropriate message when no agencies exist
    * [ ] All existing UI functionality is preserved
* **Definition of Done:**
    * [ ] Code complete with no visual regression
    * [ ] Integration tests verify API connection
    * [ ] Page load time verified under 3 seconds
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Implementation follows Next.js 13 best practices from PKD

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
    * [ ] `AgencyCardSkeleton` component created
    * [ ] Skeleton matches exact dimensions of loaded agency cards
    * [ ] Loading state shows 6-8 skeleton cards
    * [ ] Smooth transition from skeleton to loaded content
    * [ ] No layout shift when content loads
* **Definition of Done:**
    * [ ] Component created and exported
    * [ ] Storybook story added for skeleton state
    * [ ] Visual regression tests pass
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Accessibility standards met per PKD

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
    * [ ] `ApiErrorState` component created with retry functionality
    * [ ] Different messages for network errors vs server errors
    * [ ] Retry button triggers new API request
    * [ ] Error state is visually distinct but not alarming
    * [ ] Component is reusable across different pages
* **Definition of Done:**
    * [ ] Component complete with proper props interface
    * [ ] Unit tests cover all error scenarios
    * [ ] Component documented in Storybook
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Error handling aligns with PKD standards

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
    * [ ] Search input has 300ms debounce delay
    * [ ] Pending searches are cancelled when new input arrives
    * [ ] Search term syncs with URL query parameter
    * [ ] Loading indicator shows during search
    * [ ] Previous results remain visible while searching
* **Definition of Done:**
    * [ ] Debounce implementation complete
    * [ ] Unit tests verify debounce timing
    * [ ] No performance regression in search
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Implementation follows React best practices

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
    * [ ] Search term is passed as `search` query parameter
    * [ ] Special characters are properly URL encoded
    * [ ] Empty search clears the parameter
    * [ ] Search works with other filters simultaneously
    * [ ] API response is properly typed
* **Definition of Done:**
    * [ ] Query parameter implementation complete
    * [ ] Integration tests verify search functionality
    * [ ] TypeScript types are comprehensive
    * [ ] PR submitted and approved
    * [ ] **Final Check:** API integration follows PKD patterns

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
    * [ ] Empty state component shows when results array is empty
    * [ ] Message indicates no agencies match the search
    * [ ] Suggests clearing filters or modifying search
    * [ ] Visually distinct from error states
    * [ ] Includes icon or illustration
* **Definition of Done:**
    * [ ] Component created and integrated
    * [ ] Copy reviewed by team
    * [ ] Visual design approved
    * [ ] PR submitted and approved
    * [ ] **Final Check:** UX aligns with PKD standards

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
    * [ ] Loading spinner appears in search input during API call
    * [ ] Screen reader announces "Searching agencies"
    * [ ] Loading state doesn't cause layout shift
    * [ ] Spinner uses consistent animation timing
    * [ ] Clear button remains accessible while loading
* **Definition of Done:**
    * [ ] Loading indicator implemented
    * [ ] Accessibility tested with screen reader
    * [ ] No visual glitches during state transitions
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Follows WCAG 2.1 AA standards

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
    * [ ] Selected trades are sent as `trades[]` parameters
    * [ ] Multiple trade selection is supported
    * [ ] Deselecting trades removes them from query
    * [ ] Trade filter works with search and state filters
    * [ ] URL updates reflect current filter state
* **Definition of Done:**
    * [ ] Trade filter connected to API
    * [ ] URL synchronization working
    * [ ] Integration tests pass
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Filter behavior matches PKD specifications

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
    * [ ] Selected states are sent as `states[]` parameters
    * [ ] Multiple state selection is supported
    * [ ] State codes use standard 2-letter format (e.g., "TX", "CA")
    * [ ] Filter updates trigger new API request
    * [ ] Results update smoothly without flashing
* **Definition of Done:**
    * [ ] State filter connected to API
    * [ ] Proper state code validation
    * [ ] Performance verified (no lag)
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Implementation consistent with trade filter

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
    * [ ] Multiple filters can be active simultaneously
    * [ ] Results show agencies matching ALL selected criteria
    * [ ] URL contains all active filter parameters
    * [ ] Filter count badge shows number of active filters
    * [ ] "Clear all" button removes all filters at once
* **Definition of Done:**
    * [ ] Combined filter logic implemented
    * [ ] Complex filter scenarios tested
    * [ ] URL state management verified
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Filter UX matches PKD requirements

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
    * [ ] Filter dropdowns show loading state during API calls
    * [ ] Results area shows loading skeleton
    * [ ] Filters remain interactive (optimistic updates)
    * [ ] No jarring transitions between states
    * [ ] Loading doesn't block user from changing filters
* **Definition of Done:**
    * [ ] Loading states implemented for all filters
    * [ ] Smooth transitions verified
    * [ ] No UI blocking during loads
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Performance meets 3-second requirement

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
    * [ ] Profile page fetches agency by slug from API
    * [ ] Page uses server-side rendering for initial load
    * [ ] Loading state shows while data fetches
    * [ ] Data includes all agency fields (trades, regions, etc.)
    * [ ] URL slug matches agency slug in database
* **Definition of Done:**
    * [ ] Profile page using real API data
    * [ ] Server-side rendering verified
    * [ ] TypeScript types updated
    * [ ] PR submitted and approved
    * [ ] **Final Check:** SEO requirements from PKD maintained

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
    * [ ] 404 page shows for invalid agency slugs
    * [ ] Error page shows for API failures
    * [ ] "Back to directory" link on error pages
    * [ ] Proper HTTP status codes returned
    * [ ] Error tracking integration (if configured)
* **Definition of Done:**
    * [ ] Error handling implemented
    * [ ] 404 and error pages created
    * [ ] Status codes verified
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Error handling follows PKD patterns

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
    * [ ] Profile skeleton matches actual profile layout
    * [ ] Key sections have individual skeleton states
    * [ ] No layout shift when content loads
    * [ ] Loading state appears immediately
    * [ ] Smooth transition to loaded content
* **Definition of Done:**
    * [ ] Loading skeleton implemented
    * [ ] Visual regression tests pass
    * [ ] Performance verified
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Loading UX consistent with PKD

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
    * [ ] Agency cards link to `/recruiters/[slug]`
    * [ ] Links use agency slug from API data
    * [ ] Links prefetch on hover for performance
    * [ ] Keyboard navigation works properly
    * [ ] Screen readers announce link destination
* **Definition of Done:**
    * [ ] Navigation links updated
    * [ ] Accessibility tested
    * [ ] Prefetching verified
    * [ ] PR submitted and approved
    * [ ] **Final Check:** Navigation follows Next.js best practices

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

- [ ] All mock data imports are removed from the codebase
- [ ] Home page displays real agencies from the database
- [ ] Search functionality works with live data
- [ ] Filters properly query the API with correct parameters
- [ ] Agency profile pages show real agency details
- [ ] All loading and error states are implemented
- [ ] Page load time remains under 3 seconds
- [ ] All tests are passing (unit, integration, E2E)
- [ ] Feature has been tested in staging environment
- [ ] No console errors in production build
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] Performance metrics meet PKD requirements
- [ ] Documentation is updated
- [ ] Feature flag removed and code cleaned up