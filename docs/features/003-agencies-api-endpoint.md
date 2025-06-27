# FSD: Agencies API Endpoint

* **ID:** 003
* **Status:** Draft
* **Related Epic (from PKD):** Sprint 0: Build the First Feature Slice
* **Author:** Engineering Team
* **Last Updated:** 2024-12-26
* **Designs:** N/A - Backend API
* **Implementation:** Planned

## 1. Problem & Goal

### Problem Statement
Construction companies need a way to search for and discover staffing agencies through our platform. Currently, the frontend displays mock data that cannot be searched or filtered dynamically. We need a real API endpoint that connects to our Supabase database to enable the core search functionality described in our Sprint 0 user story.

### Goal & Hypothesis
We believe that by building a **GET /api/agencies endpoint** for **Construction Companies**, we will enable them to search for staffing agencies by trade specialty and location. We will know this is true when we can successfully query agencies from the database with sub-100ms response times and display real results in the UI.

## 2. User Stories & Acceptance Criteria

### Story 1: Search Agencies by Name
> As a **Construction Company**, I want to **search for agencies by name**, so that **I can find specific staffing partners I've heard about**.

**Acceptance Criteria:**
* [ ] **Given** a search term, **When** I query the API with `?search=term`, **Then** agencies with matching names or descriptions are returned
* [ ] **Given** a partial name match, **When** I search for "Industrial", **Then** "Industrial Staffing Solutions" is included in results
* [ ] **Given** no search term, **When** I query the API, **Then** all active agencies are returned

### Story 2: Filter Agencies by Trade Specialty
> As a **Construction Company**, I want to **filter agencies by trade specialty**, so that **I can find agencies that provide the specific skilled workers I need**.

**Acceptance Criteria:**
* [ ] **Given** a trade filter, **When** I query with `?trades[]=electrician`, **Then** only agencies offering electrician services are returned
* [ ] **Given** multiple trade filters, **When** I query with `?trades[]=electrician&trades[]=plumber`, **Then** agencies offering ANY of those trades are returned (OR logic)
* [ ] **Given** an invalid trade, **When** I query with `?trades[]=invalid`, **Then** an empty result set is returned

### Story 3: Filter Agencies by State/Region
> As a **Construction Company**, I want to **filter agencies by state**, so that **I can find local staffing partners for my projects**.

**Acceptance Criteria:**
* [ ] **Given** a state filter, **When** I query with `?states[]=TX`, **Then** only agencies serving Texas are returned
* [ ] **Given** multiple state filters, **When** I query with `?states[]=TX&states[]=CA`, **Then** agencies serving ANY of those states are returned
* [ ] **Given** combined filters, **When** I query with `?states[]=TX&trades[]=electrician`, **Then** only agencies in Texas offering electricians are returned

### Story 4: Paginate Results
> As a **Platform Administrator**, I want **results to be paginated**, so that **the API performs well even with many agencies**.

**Acceptance Criteria:**
* [ ] **Given** no pagination params, **When** I query the API, **Then** the first 20 agencies are returned
* [ ] **Given** a limit parameter, **When** I query with `?limit=10`, **Then** only 10 agencies are returned
* [ ] **Given** an offset parameter, **When** I query with `?offset=20&limit=10`, **Then** agencies 21-30 are returned
* [ ] **Given** any query, **When** results are returned, **Then** the total count is included in the response

## 3. Technical & Design Requirements

### API Design

**Endpoint:** `GET /api/agencies`

**Query Parameters:**
- `search` (string): Free text search across agency name and description
- `trades[]` (array): Filter by trade specialties (slug format)
- `states[]` (array): Filter by state codes (e.g., "TX", "CA")
- `limit` (number): Number of results per page (default: 20, max: 100)
- `offset` (number): Number of results to skip (default: 0)

**Response Format:**
```typescript
{
  data: Agency[],
  pagination: {
    total: number,
    limit: number,
    offset: number,
    hasMore: boolean
  }
}
```

**Error Response:**
```typescript
{
  error: {
    message: string,
    code: string
  }
}
```

### Technical Impact Analysis

**File Location:** `app/api/agencies/route.ts` (Next.js 13+ App Router convention)

**Dependencies:**
- Supabase client from `lib/supabase.ts`
- TypeScript types from `lib/supabase.ts`
- Existing data model (agencies, trades, regions tables)

**Database Queries:**
1. **Base query**: Select agencies with related trades and regions
2. **Search filter**: Use PostgreSQL full-text search on name and description
3. **Trade filter**: Join through agency_trades table
4. **State filter**: Join through agency_regions table
5. **Pagination**: Apply limit and offset after filters

**Performance Requirements:**
- Response time < 100ms for typical queries
- Implement database indexes on searchable fields
- Use Supabase's query builder for optimal SQL generation

**Security Considerations:**
- Sanitize all query parameters
- Use parameterized queries (handled by Supabase)
- Apply rate limiting (future enhancement)
- No authentication required (public endpoint)

## 4. Scope

### In Scope
- GET endpoint with search and filtering
- Pagination support
- Include related trades and regions in response
- Error handling for invalid parameters
- TypeScript type safety

### Out of Scope
- Authentication/authorization (public endpoint for Sprint 0)
- Sorting options (default to alphabetical by name)
- Advanced search features (fuzzy matching, typo tolerance)
- Caching layer (rely on Supabase connection pooling)
- Agency claiming/management endpoints
- POST/PUT/DELETE operations

### Open Questions
* [ ] Should we implement result ranking/scoring for search results?
* [ ] Do we need to support filtering by other agency attributes (union, per diem)?
* [ ] Should the API return aggregate counts for filter options?
* [ ] What should be the exact structure for included trades/regions data?

## 5. Implementation Notes

### Query Building Strategy
```typescript
// Pseudo-code for query construction
let query = supabase
  .from('agencies')
  .select(`
    *,
    trades:agency_trades(trade:trades(*)),
    regions:agency_regions(region:regions(*))
  `)
  .eq('is_active', true);

// Apply search filter
if (search) {
  // Use full-text search on individual columns and ilike fallback
  query = query.or(`name.fts.${search},description.fts.${search},name.ilike.%${search}%,description.ilike.%${search}%`);
}

// Apply trade filter with subquery
if (trades?.length) {
  const { data: tradeData } = await supabase
    .from('trades')
    .select('id')
    .in('slug', trades);
  
  const tradeIds = tradeData.map(t => t.id);
  
  const { data: agencyTradeData } = await supabase
    .from('agency_trades')
    .select('agency_id')
    .in('trade_id', tradeIds);
  
  const agencyIds = [...new Set(agencyTradeData.map(at => at.agency_id))];
  
  query = query.in('id', agencyIds);
}
```

### Testing Strategy
- Unit tests for query parameter parsing
- Integration tests with test database
- Performance tests with 1000+ agencies
- Error case testing (invalid params, DB errors)

### Monitoring
- Log query performance metrics
- Track API usage patterns
- Monitor error rates
- Set up alerts for slow queries (>200ms)

## 6. Success Metrics
- API responds in <100ms for 95% of requests
- Zero 500 errors in production
- Frontend successfully displays real data
- Search functionality works as expected
- All acceptance criteria tests pass

## 7. Future Enhancements
- Add GraphQL endpoint for more flexible queries
- Implement caching with Redis
- Add search suggestions/autocomplete endpoint
- Support saved searches
- Add webhook for real-time updates
- Implement more advanced filtering options