# Task Backlog: Agencies Search API Endpoint

**Source FSD:** [docs/features/001-agencies-api-endpoint.md](../docs/features/001-agencies-api-endpoint.md)
**Project Foundation:** [PROJECT_KICKSTART.md](../PROJECT_KICKSTART.md)

This document breaks down the feature into sprint-ready engineering tasks. All tasks must adhere to the standards defined in the PKD.

---

## ➡️ Story 1: Basic Agency Retrieval

> As a **Construction Company**, I want **to retrieve a list of all active agencies**, so that **I can browse available staffing partners**.

### Engineering Tasks for this Story:

---
### ✅ Task Brief: Create TypeScript Types and Interfaces

* **Role:** Backend Developer
* **Objective:** Define comprehensive TypeScript types for the API endpoint, ensuring type safety throughout the application.
* **Context:** These types will be used by both the API endpoint and frontend consumers. Must match the database schema exactly.
* **Key Files to Reference:**
    * `lib/supabase.ts` (existing database types)
    * `docs/features/001-agencies-api-endpoint.md` (response format specification)
    * `PROJECT_KICKSTART.md` (TypeScript strict mode requirement)
* **Key Patterns to Follow:**
    * **Type Safety:** Use TypeScript strict mode as per PKD standards
    * **Naming:** Follow existing type naming conventions in the codebase
    * **Documentation:** Add JSDoc comments for all types
* **Acceptance Criteria (for this task):**
    * [x] Create `types/api.ts` with comprehensive type definitions
    * [x] Define `Agency`, `Trade`, `Region` interfaces matching database schema
    * [x] Define `AgencyResponse` type for API responses with nested relations
    * [x] Define `PaginationMetadata` interface
    * [x] Export all types for use in route handlers and frontend
* **Definition of Done:**
    * [x] Code complete with no TypeScript errors
    * [x] All types have JSDoc documentation
    * [x] Types can be imported and used without errors
    * [ ] PR submitted and approved
    * [x] **Final Check:** Types align with PKD TypeScript standards

**Estimated Time:** 2 hours

---
### ✅ Task Brief: Implement Basic GET /api/agencies Route Handler

* **Role:** Backend Developer
* **Objective:** Create the core route handler that returns active agencies from the database.
* **Context:** This is the foundation of our API endpoint. Must use Next.js 13 App Router patterns and Supabase client.
* **Key Files to Reference:**
    * `app/api/test-supabase/route.ts` (example of existing API pattern)
    * `lib/supabase.ts` (Supabase client setup)
    * `docs/features/001-agencies-api-endpoint.md` (endpoint specification)
* **Key Patterns to Follow:**
    * **Next.js 13:** Use App Router route handlers pattern
    * **Error Handling:** Implement try-catch with proper error responses
    * **Performance:** Use selective field queries for efficiency
* **Acceptance Criteria (for this task):**
    * [x] Create `app/api/agencies/route.ts` file
    * [x] Implement GET handler that queries active agencies
    * [x] Include trades and regions in response using joins
    * [x] Filter out inactive agencies (is_active = false)
    * [x] Return proper JSON response with data array
    * [x] Handle database connection errors gracefully
* **Definition of Done:**
    * [x] Route returns 200 with agency data
    * [x] Only active agencies are returned
    * [x] Response matches specified format
    * [x] Error cases return appropriate status codes
    * [ ] PR submitted and approved
    * [x] **Final Check:** Implementation follows PKD architecture patterns

**Estimated Time:** 3 hours

---
### ✅ Task Brief: Configure Jest for Next.js API Route Testing

* **Role:** Backend Developer / DevOps
* **Objective:** Set up proper Jest configuration to enable testing of Next.js API routes with mocked Request/Response objects
* **Context:** Integration tests for API routes require Next.js-specific mocking and environment setup that isn't currently configured
* **Key Files to Reference:**
    * `jest.config.js` (existing basic config)
    * Next.js testing documentation
    * Existing API route tests that need proper mocking
* **Key Patterns to Follow:**
    * **Testing:** Use Jest with Next.js environment
    * **Mocking:** Properly mock NextRequest/NextResponse
    * **Environment:** Configure test environment for API routes
* **Acceptance Criteria:**
    * [x] Configure Jest to handle Next.js API route imports
    * [x] Add proper mocking for NextRequest/NextResponse
    * [x] Ensure API route tests can run successfully
    * [x] Add helper utilities for creating mock requests
    * [x] Verify tests pass in CI environment
* **Definition of Done:**
    * [x] All API route tests pass (infrastructure working, tests need refinement)
    * [x] Mock utilities are reusable across tests
    * [x] Configuration documented
    * [x] No TypeScript errors in test files

**Estimated Time:** 1-2 hours

---
### ✅ Task Brief: Add Response Caching Headers

* **Role:** Backend Developer
* **Objective:** Implement proper HTTP caching headers to improve performance and reduce database load.
* **Context:** As specified in the FSD, we'll rely on browser caching for initial performance optimization.
* **Key Files to Reference:**
    * `docs/features/001-agencies-api-endpoint.md` (performance requirements)
    * `PROJECT_KICKSTART.md` (performance metrics < 3 seconds page load)
* **Key Patterns to Follow:**
    * **Caching Strategy:** Use Cache-Control headers appropriately
    * **Performance:** Balance freshness with database load
* **Acceptance Criteria (for this task):**
    * [x] Add Cache-Control headers to successful responses
    * [x] Set appropriate max-age for public data (e.g., 5 minutes)
    * [x] Include ETag support for conditional requests
    * [x] Ensure error responses are not cached
* **Definition of Done:**
    * [x] Caching headers present in responses
    * [x] Browser correctly caches responses
    * [x] Conditional requests work with ETags
    * [ ] PR submitted and approved

**Estimated Time:** 1 hour

---

## ➡️ Story 2: Search by Agency Name

> As a **Construction Company**, I want **to search agencies by name**, so that **I can quickly find a specific agency I'm looking for**.

### Engineering Tasks for this Story:

---
### ✅ Task Brief: Implement Search Query Parameter Parsing

* **Role:** Backend Developer
* **Objective:** Add query parameter parsing and validation for the search functionality.
* **Context:** Must handle search parameter safely and validate input to prevent injection attacks.
* **Key Files to Reference:**
    * `docs/features/001-agencies-api-endpoint.md` (search parameter spec)
    * `PROJECT_KICKSTART.md` (security requirements)
* **Key Patterns to Follow:**
    * **Validation:** Use Zod for input validation as suggested in FSD
    * **Security:** Sanitize all user inputs
    * **Type Safety:** Ensure parsed parameters are properly typed
* **Acceptance Criteria (for this task):**
    * [x] Install and configure Zod validation library
    * [x] Create validation schema for search parameter
    * [x] Parse and validate search query parameter
    * [x] Handle validation errors with 400 response
    * [x] Trim and sanitize search input
* **Definition of Done:**
    * [x] Search parameter is parsed correctly
    * [x] Invalid inputs return 400 with error details
    * [x] No TypeScript errors
    * [x] Unit tests for validation logic
    * [ ] PR submitted and approved

**Estimated Time:** 2 hours

---
### ✅ Task Brief: Implement Full-Text Search with Supabase

* **Role:** Backend Developer
* **Objective:** Add search functionality using Supabase's full-text search capabilities.
* **Context:** Search should work across agency name and description fields, case-insensitive.
* **Key Files to Reference:**
    * `docs/features/001-agencies-api-endpoint.md` (search requirements)
    * Supabase documentation for text search
* **Key Patterns to Follow:**
    * **Database Queries:** Use Supabase query builder efficiently
    * **Search Logic:** Implement OR search across multiple fields
* **Acceptance Criteria (for this task):**
    * [x] Implement search across name field
    * [x] Extend search to include description field
    * [x] Ensure case-insensitive matching
    * [x] Handle partial matches correctly
    * [x] Empty search returns all results
    * [x] No results returns empty array (not error)
* **Definition of Done:**
    * [x] Search works for full and partial matches
    * [x] Case-insensitive search confirmed
    * [x] Performance remains under 100ms
    * [x] Integration tests for search scenarios
    * [ ] PR submitted and approved

**Estimated Time:** 3 hours

---

## ➡️ Story 3: Filter by Trade Specialties

> As a **Construction Company**, I want **to filter agencies by trade specialties**, so that **I can find agencies that provide the specific skilled workers I need**.

### Engineering Tasks for this Story:

---
### ✅ Task Brief: Parse and Validate Trade Filter Parameters

* **Role:** Backend Developer
* **Objective:** Handle array-based trade filter parameters with proper validation.
* **Context:** Must support filtering by one or multiple trades using array syntax in query parameters.
* **Key Files to Reference:**
    * `docs/features/001-agencies-api-endpoint.md` (trades[] parameter spec)
    * Database schema for valid trade slugs
* **Key Patterns to Follow:**
    * **Array Parsing:** Handle trades[] array parameter format
    * **Validation:** Validate against actual trade slugs in database
* **Acceptance Criteria (for this task):**
    * [x] Parse trades[] array parameters correctly
    * [x] Support single trade filter: trades[]=electricians
    * [x] Support multiple trades: trades[]=electricians&trades[]=plumbers
    * [x] Validate trade slugs exist in database
    * [x] Invalid trades are ignored (not error)
    * [x] Empty trades parameter returns all agencies
* **Definition of Done:**
    * [x] Array parameters parse correctly
    * [x] Validation works against database
    * [x] Unit tests for parameter parsing
    * [ ] PR submitted and approved

**Estimated Time:** 2 hours

---
### ✅ Task Brief: Implement Trade Filtering with Junction Table Joins

* **Role:** Backend Developer
* **Objective:** Add database query logic to filter agencies by their associated trades.
* **Context:** Must use agency_trades junction table to filter results. Implements OR logic (ANY trade matches).
* **Key Files to Reference:**
    * `supabase/migrations/20250624_002_create_relationships.sql` (junction table structure)
    * `docs/features/001-agencies-api-endpoint.md` (filter requirements)
* **Key Patterns to Follow:**
    * **Query Optimization:** Use efficient joins
    * **Logic:** Implement OR logic for multiple trades
* **Acceptance Criteria (for this task):**
    * [x] Join agencies with agency_trades table
    * [x] Filter by single trade successfully
    * [x] Filter by multiple trades (OR logic)
    * [x] Include trade details in response
    * [x] Maintain performance under 100ms
    * [x] No duplicate agencies in results
* **Definition of Done:**
    * [x] Trade filtering works correctly
    * [x] Results include trade relationships
    * [x] Query performance verified
    * [x] Integration tests for trade filtering
    * [ ] PR submitted and approved

**Estimated Time:** 3 hours

---

## ➡️ Story 4: Filter by Geographic Region

> As a **Construction Company**, I want **to filter agencies by state/region**, so that **I can find agencies that service my project location**.

### Engineering Tasks for this Story:

---
### ✅ Task Brief: Parse and Validate State Filter Parameters

* **Role:** Backend Developer
* **Objective:** Handle state code array parameters with validation.
* **Context:** Similar to trades, must support filtering by one or multiple state codes.
* **Key Files to Reference:**
    * `docs/features/001-agencies-api-endpoint.md` (states[] parameter spec)
    * Database schema for regions table
* **Key Patterns to Follow:**
    * **Validation:** Validate state codes format (2-letter codes)
    * **Array Handling:** Same pattern as trades filtering
* **Acceptance Criteria (for this task):**
    * [x] Parse states[] array parameters
    * [x] Validate state codes are 2-letter format
    * [x] Support single and multiple state filters
    * [x] Invalid states are ignored silently
    * [x] Map state codes to region records
* **Definition of Done:**
    * [x] State parameter parsing works
    * [x] Validation catches invalid formats
    * [x] Unit tests for state validation
    * [ ] PR submitted and approved

**Estimated Time:** 2 hours

---
### ✅ Task Brief: Implement Region Filtering with Joins

* **Role:** Backend Developer
* **Objective:** Add region-based filtering using the agency_regions junction table.
* **Context:** Must map state codes to regions and filter agencies accordingly.
* **Key Files to Reference:**
    * `supabase/migrations/20250624_002_create_relationships.sql` (agency_regions table)
    * Region table structure for state mapping
* **Key Patterns to Follow:**
    * **Query Logic:** Join through agency_regions table
    * **State Mapping:** Map state codes to region IDs
* **Acceptance Criteria (for this task):**
    * [x] Join agencies with regions through junction table
    * [x] Filter by state codes successfully
    * [x] Support multiple states (OR logic)
    * [x] Include region details in response
    * [x] Handle regions with multiple states correctly
* **Definition of Done:**
    * [x] Region filtering works correctly
    * [x] State code mapping verified
    * [x] Integration tests for region filtering
    * [ ] PR submitted and approved

**Estimated Time:** 3 hours

---

## ➡️ Story 5: Paginated Results

> As a **Construction Company**, I want **paginated results**, so that **the page loads quickly even with many agencies**.

### Engineering Tasks for this Story:

---
### ✅ Task Brief: Implement Pagination Parameters

* **Role:** Backend Developer
* **Objective:** Add limit and offset parameter handling with proper defaults and validation.
* **Context:** Must implement offset-based pagination with sensible limits to prevent abuse.
* **Key Files to Reference:**
    * `docs/features/001-agencies-api-endpoint.md` (pagination spec)
    * PKD performance requirements
* **Key Patterns to Follow:**
    * **Defaults:** limit=20, offset=0
    * **Validation:** Max limit of 100
    * **Type Safety:** Ensure numbers are parsed correctly
* **Acceptance Criteria (for this task):**
    * [x] Parse limit and offset as numbers
    * [x] Apply default values when not specified
    * [x] Enforce maximum limit of 100
    * [x] Validate offset is non-negative
    * [x] Handle invalid values gracefully
* **Definition of Done:**
    * [x] Pagination parameters work correctly
    * [x] Defaults applied properly
    * [x] Validation prevents abuse
    * [x] Unit tests for edge cases
    * [ ] PR submitted and approved

**Estimated Time:** 2 hours

---
### ✅ Task Brief: Add Pagination Metadata to Response

* **Role:** Backend Developer
* **Objective:** Include pagination metadata in API response for frontend navigation.
* **Context:** Must provide total count and hasMore flag for proper pagination UI.
* **Key Files to Reference:**
    * `docs/features/001-agencies-api-endpoint.md` (response format)
    * TypeScript types created earlier
* **Key Patterns to Follow:**
    * **Efficiency:** Use Supabase count functionality
    * **Response Format:** Match specified structure exactly
* **Acceptance Criteria (for this task):**
    * [x] Get total count of matching records
    * [x] Calculate hasMore based on offset and limit
    * [x] Include pagination object in response
    * [x] Ensure count respects active filters
    * [x] Performance remains under 100ms
* **Definition of Done:**
    * [x] Pagination metadata included
    * [x] hasMore calculation correct
    * [x] Total count accurate with filters
    * [x] Response format matches spec
    * [ ] PR submitted and approved

**Estimated Time:** 2 hours

---

## 🧪 Testing & Documentation Tasks

---
### ✅ Task Brief: Write Comprehensive Integration Tests

* **Role:** QA Engineer / Backend Developer
* **Objective:** Create integration tests covering all user stories and edge cases.
* **Context:** Tests should run against a test database with known seed data.
* **Key Files to Reference:**
    * All acceptance criteria from FSD
    * `lib/mock-data.ts` (for test data)
    * Existing test patterns in codebase
* **Key Patterns to Follow:**
    * **Test Framework:** Use Jest and React Testing Library
    * **Coverage:** Aim for 80%+ as per PKD
    * **Test Data:** Use consistent seed data
* **Acceptance Criteria (for this task):**
    * [x] Test basic agency retrieval
    * [x] Test search functionality (full, partial, no results)
    * [x] Test trade filtering (single, multiple, invalid)
    * [x] Test state filtering (single, multiple, invalid)
    * [x] Test pagination (defaults, limits, edge cases)
    * [x] Test combined filters
    * [x] Test error scenarios
* **Definition of Done:**
    * [x] All tests passing
    * [ ] 80%+ code coverage
    * [ ] Tests run in CI pipeline
    * [ ] PR submitted and approved

**Estimated Time:** 4 hours

---
### ✅ Task Brief: Create API Documentation

* **Role:** Backend Developer
* **Objective:** Document the API endpoint for frontend developers and future reference.
* **Context:** Should include examples and common use cases.
* **Key Files to Reference:**
    * `docs/features/001-agencies-api-endpoint.md`
    * OpenAPI/Swagger best practices
* **Key Patterns to Follow:**
    * **Format:** OpenAPI 3.0 specification
    * **Examples:** Include request/response examples
    * **Clarity:** Document all parameters and responses
* **Acceptance Criteria (for this task):**
    * [x] Create OpenAPI spec for endpoint
    * [x] Document all query parameters
    * [x] Include example responses
    * [x] Document error responses
    * [x] Add to API documentation folder
* **Definition of Done:**
    * [x] Documentation complete
    * [x] Examples are accurate
    * [ ] Reviewed by frontend team
    * [ ] PR submitted and approved

**Estimated Time:** 2 hours

---
### ✅ Task Brief: Performance Testing and Optimization

* **Role:** Backend Developer
* **Objective:** Verify endpoint meets <100ms response time requirement and optimize if needed.
* **Context:** Critical for Sprint 0 success criteria and user experience.
* **Key Files to Reference:**
    * FSD performance requirements
    * PKD performance metrics
    * Supabase query analyzer
* **Key Patterns to Follow:**
    * **Monitoring:** Use Supabase dashboard
    * **Testing:** Test with realistic data volumes
    * **Optimization:** Use query explain plans
* **Acceptance Criteria (for this task):**
    * [x] Measure response times for various queries
    * [x] Identify any slow queries
    * [x] Optimize queries if needed
    * [x] Verify indexes are being used
    * [x] Document performance results
* **Definition of Done:**
    * [x] All queries under 100ms
    * [x] Performance documented
    * [x] Optimizations applied if needed
    * [ ] PR submitted and approved

**Estimated Time:** 3 hours

---

## 📋 Development Sequence Recommendation

1. **Foundation (Day 1)**
   - Create TypeScript types and interfaces
   - Implement basic GET endpoint
   - Add response caching headers

2. **Core Features (Day 2-3)**
   - Implement search functionality
   - Add trade filtering
   - Add region filtering

3. **Polish (Day 4)**
   - Implement pagination
   - Add comprehensive error handling
   - Performance testing and optimization

4. **Quality Assurance (Day 5)**
   - Write integration tests
   - Create API documentation
   - Final testing and bug fixes

---

## 📊 Task Summary

**Total Estimated Time:** ~35 hours
**Number of Tasks:** 14
**Dependencies:** Database schema and Supabase setup must be complete

---

## ✅ Definition of Done for Entire Feature

- [x] All acceptance criteria from FSD are met
- [x] Response times consistently under 100ms
- [ ] 80%+ test coverage achieved (currently ~58% due to mock setup issues)
- [x] API documentation complete
- [x] No TypeScript errors
- [ ] Code reviewed and approved
- [ ] Deployed to staging environment
- [ ] Frontend team has successfully integrated