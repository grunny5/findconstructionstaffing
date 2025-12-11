# FSD: Frontend API Connection

- **ID:** 005
- **Status:** Draft
- **Related Epic (from PKD):** Sprint 0: Build the First Feature Slice
- **Author:** Development Team
- **Last Updated:** 2025-06-30
- **Designs:** N/A - Technical implementation

## 1. Problem & Goal

### Problem Statement

Construction companies visiting our platform are currently viewing static mock data that doesn't reflect real agencies in our database. Despite having a fully functional API endpoint and seeded database with 12 agencies, the frontend continues to display hardcoded mock data, preventing users from experiencing the true search and filter capabilities of our platform.

### Goal & Hypothesis

We believe that by connecting the frontend to the real `/api/agencies` endpoint for **Construction Companies**, we will enable them to search and discover actual staffing agencies with live data. We will know this is true when we see:

- Frontend successfully displays agencies from the database
- Search and filter functionality works with real data
- Page load time remains under 3 seconds (PKD requirement)
- No regression in user experience

## 2. User Stories & Acceptance Criteria

### Story 1: View Real Agencies on Home Page

> As a **Construction Company**, I want **to see real staffing agencies from the database**, so that **I can find actual partners instead of sample data**.

**Acceptance Criteria:**

- [ ] **Given** I visit the home page, **When** the page loads, **Then** I see agencies fetched from the `/api/agencies` endpoint.
- [ ] **Given** the API is unavailable, **When** the page loads, **Then** I see a user-friendly error message.
- [ ] **Given** agencies are loading, **When** I visit the page, **Then** I see a loading state (skeleton or spinner).
- [ ] **Given** no agencies exist in the database, **When** the page loads, **Then** I see an appropriate empty state message.

### Story 2: Search Agencies with Real-Time Results

> As a **Construction Company**, I want **to search for agencies by name**, so that **I can quickly find specific staffing partners**.

**Acceptance Criteria:**

- [ ] **Given** I type in the search box, **When** I enter a search term, **Then** the results update to show matching agencies from the API.
- [ ] **Given** I clear the search box, **When** the input is empty, **Then** all agencies are displayed again.
- [ ] **Given** no agencies match my search, **When** I search, **Then** I see a "no results" message.
- [ ] **Given** the search is in progress, **When** results are loading, **Then** I see a loading indicator.

### Story 3: Filter Agencies by Trade and Location

> As a **Construction Company**, I want **to filter agencies by trade specialty and state**, so that **I can find agencies that match my specific needs**.

**Acceptance Criteria:**

- [ ] **Given** I select a trade filter, **When** I apply it, **Then** only agencies offering that trade are shown.
- [ ] **Given** I select a state filter, **When** I apply it, **Then** only agencies serving that state are shown.
- [ ] **Given** I apply multiple filters, **When** the results load, **Then** agencies matching all criteria are shown.
- [ ] **Given** filters are applied, **When** I remove them, **Then** the full list of agencies is restored.

### Story 4: Navigate to Agency Profiles

> As a **Construction Company**, I want **to view detailed agency profiles**, so that **I can learn more about specific staffing partners**.

**Acceptance Criteria:**

- [ ] **Given** I'm viewing the agency list, **When** I click on an agency, **Then** I'm taken to their profile page.
- [ ] **Given** I'm on an agency profile page, **When** the page loads, **Then** I see data fetched from the database (not mock data).
- [ ] **Given** an invalid agency slug is used, **When** I visit the URL, **Then** I see a 404 error page.
- [ ] **Given** the database is unavailable, **When** I visit a profile, **Then** I see an error message with a way to go back.

## 3. Technical & Design Requirements

### UX/UI Requirements

- Maintain existing UI design and components
- Add loading states using existing Skeleton components from Shadcn/ui
- Add error states with retry functionality
- Ensure smooth transitions between states
- No visual regression from current design

### Technical Impact Analysis

- **Data Model:** No changes required - using existing agency data structure
- **API Endpoints:** Use existing `GET /api/agencies` endpoint with query parameters:
  - `search`: Text search across name and description
  - `trades[]`: Filter by trade specialties
  - `states[]`: Filter by state codes
  - `limit` & `offset`: Pagination parameters
- **Frontend Changes:**
  - Replace `mockAgencies` import with API call in `app/page.tsx`
  - Implement data fetching (server-side with Next.js 13 App Router)
  - Add loading and error states
  - Update agency profile pages to fetch from API
  - Ensure URL parameters sync with filter state
- **Non-Functional Requirements:**
  - Page load time must remain under 3 seconds (PKD requirement)
  - Implement proper error handling for network failures
  - Use TypeScript strict mode for type safety
  - Follow existing code patterns in the codebase

### Implementation Approach

1. **Server-Side Rendering (Recommended for SEO)**

   ```typescript
   // app/page.tsx
   async function getAgencies(searchParams) {
     const res = await fetch(
       `${process.env.NEXT_PUBLIC_APP_URL}/api/agencies?${searchParams}`
     );
     if (!res.ok) throw new Error('Failed to fetch agencies');
     return res.json();
   }
   ```

2. **Client-Side Interactivity**
   - Use React hooks for filter state management
   - Implement URL parameter synchronization
   - Add debouncing for search input (300ms)

3. **Error Handling**
   - Graceful degradation for API failures
   - User-friendly error messages
   - Retry mechanisms where appropriate

## 4. Scope

### In Scope

- Connect home page to real API endpoint
- Implement loading and error states
- Update agency profile pages to use real data
- Maintain existing search and filter functionality
- Ensure URL parameters work for shareable searches

### Out of Scope

- Authentication or user-specific features
- Agency management/editing capabilities
- Performance optimizations beyond basic requirements
- Changes to UI design or component structure
- Real-time updates (WebSocket connections)
- Offline functionality

### Open Questions

- [ ] Should we implement client-side caching for better performance?
- [ ] Do we need to handle pagination on the frontend (currently showing all agencies)?
- [ ] Should we add analytics tracking for search and filter usage?
- [ ] What's the preferred loading state pattern - skeleton screens or spinners?

## 5. Success Metrics

- Frontend successfully displays all 12 seeded agencies
- Search functionality returns correct results from database
- Filter functionality works with real data
- Page load time stays under 3 seconds
- Zero console errors in production
- All existing Cypress/Playwright tests continue to pass

## 6. Dependencies

- Functioning `/api/agencies` endpoint (✅ Complete)
- Seeded database with agency data (✅ Complete)
- Environment variables properly configured (✅ Complete)

## 7. Estimated Timeline

- Initial implementation: 4-6 hours
- Testing and debugging: 2-3 hours
- Code review and refinements: 1-2 hours
- **Total: 7-11 hours**

---

**Next Steps:**

1. Review and approve this FSD
2. Create detailed engineering tasks from the user stories
3. Begin implementation starting with the home page connection
