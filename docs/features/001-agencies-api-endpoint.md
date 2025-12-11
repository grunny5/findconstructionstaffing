# FSD: Agencies Search API Endpoint

- **ID:** 001
- **Status:** Draft
- **Related Epic (from PKD):** Sprint 0: Build the First Feature Slice
- **Author:** Development Team
- **Last Updated:** 2025-06-25
- **Designs:** N/A - API Endpoint

## 1. Problem & Goal

### Problem Statement

Construction companies visiting our platform need a way to search for and discover staffing agencies that match their specific trade requirements and geographic preferences. Currently, the frontend is using mock data, preventing real-world usage and limiting our ability to scale.

### Goal & Hypothesis

We believe that by building a performant, filterable agencies API endpoint for **Construction Companies**, we will enable real-time agency discovery and prove our technical stack works end-to-end. We will know this is true when we see:

- API response times consistently under 100ms
- Successful integration with the existing frontend
- Zero errors in production logs
- Users successfully finding agencies by trade and location

## 2. User Stories & Acceptance Criteria

### Story 1: Basic Agency Retrieval

> As a **Construction Company**, I want **to retrieve a list of all active agencies**, so that **I can browse available staffing partners**.

**Acceptance Criteria:**

- [ ] **Given** the API endpoint exists, **When** I send a GET request to `/api/agencies`, **Then** I receive a JSON array of active agencies.
- [ ] **Given** agencies exist in the database, **When** I request the list, **Then** each agency includes: id, name, slug, description, logo_url, website, phone, email, trades, regions, and key attributes.
- [ ] **Given** an agency is marked as inactive, **When** I request the list, **Then** that agency is not included in the results.

### Story 2: Search by Agency Name

> As a **Construction Company**, I want **to search agencies by name**, so that **I can quickly find a specific agency I'm looking for**.

**Acceptance Criteria:**

- [ ] **Given** I provide a search parameter, **When** I send GET `/api/agencies?search=ABC`, **Then** I receive agencies where name or description contains "ABC" (case-insensitive).
- [ ] **Given** I search for a partial name, **When** the search executes, **Then** it matches agencies using full-text search capabilities.
- [ ] **Given** no agencies match my search, **When** I receive the response, **Then** I get an empty array with a 200 status code.

### Story 3: Filter by Trade Specialties

> As a **Construction Company**, I want **to filter agencies by trade specialties**, so that **I can find agencies that provide the specific skilled workers I need**.

**Acceptance Criteria:**

- [ ] **Given** I need electricians, **When** I send GET `/api/agencies?trades[]=electricians`, **Then** I only receive agencies that offer electrician staffing.
- [ ] **Given** I need multiple trades, **When** I send GET `/api/agencies?trades[]=electricians&trades[]=plumbers`, **Then** I receive agencies that offer ANY of the specified trades.
- [ ] **Given** an invalid trade is specified, **When** I make the request, **Then** that filter is ignored and other valid filters still apply.

### Story 4: Filter by Geographic Region

> As a **Construction Company**, I want **to filter agencies by state/region**, so that **I can find agencies that service my project location**.

**Acceptance Criteria:**

- [ ] **Given** I have a project in Texas, **When** I send GET `/api/agencies?states[]=TX`, **Then** I only receive agencies that service Texas.
- [ ] **Given** I have projects in multiple states, **When** I send GET `/api/agencies?states[]=TX&states[]=CA`, **Then** I receive agencies that service ANY of the specified states.
- [ ] **Given** a state code is invalid, **When** I make the request, **Then** that filter is ignored and other valid filters still apply.

### Story 5: Paginated Results

> As a **Construction Company**, I want **paginated results**, so that **the page loads quickly even with many agencies**.

**Acceptance Criteria:**

- [ ] **Given** no limit is specified, **When** I request agencies, **Then** I receive a maximum of 20 results.
- [ ] **Given** I specify offset=20, **When** I request agencies, **Then** I receive the next set of 20 results.
- [ ] **Given** I specify limit=50, **When** I request agencies, **Then** I receive up to 50 results (max allowed: 100).
- [ ] **Given** results are paginated, **When** I receive the response, **Then** it includes total count and pagination metadata.

## 3. Technical & Design Requirements

### API Endpoint Structure

```
GET /api/agencies

Query Parameters:
- search: string (optional) - Full-text search across name and description
- trades[]: string[] (optional) - Filter by trade slug(s)
- states[]: string[] (optional) - Filter by state code(s)
- limit: number (optional, default: 20, max: 100) - Results per page
- offset: number (optional, default: 0) - Pagination offset

Response Format:
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "description": "string",
      "logo_url": "string | null",
      "website": "string | null",
      "phone": "string | null",
      "email": "string | null",
      "is_claimed": boolean,
      "offers_per_diem": boolean,
      "is_union": boolean,
      "founded_year": number | null,
      "employee_count": "string | null",
      "headquarters": "string | null",
      "rating": number | null,
      "review_count": number,
      "project_count": number,
      "verified": boolean,
      "featured": boolean,
      "trades": [
        {
          "id": "uuid",
          "name": "string",
          "slug": "string"
        }
      ],
      "regions": [
        {
          "id": "uuid",
          "name": "string",
          "code": "string"
        }
      ]
    }
  ],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "hasMore": boolean
  }
}
```

### Technical Impact Analysis

- **Data Model:**
  - Leverages existing agencies, trades, regions tables
  - Uses agency_trades and agency_regions junction tables for relationships
  - No schema changes required
- **API Implementation:**
  - Use Next.js 13 App Router with Route Handlers
  - Implement using Supabase JavaScript client
  - Apply proper TypeScript types throughout
  - Use Supabase's query builder for efficient filtering
- **Performance Requirements:**
  - Response time < 100ms for typical queries
  - Implement database indexes on searchable fields (already done)
  - Use Supabase's built-in full-text search capabilities
  - Include proper caching headers for client-side caching

- **Security Requirements:**
  - Public endpoint (no authentication required for Sprint 0)
  - Validate and sanitize all query parameters
  - Implement rate limiting (future consideration)
  - Only return active agencies (is_active = true)

### Error Handling

```
Status Codes:
- 200: Success
- 400: Bad Request (invalid parameters)
- 500: Internal Server Error

Error Response Format:
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {} // optional
  }
}
```

## 4. Scope

### In Scope

- Basic GET endpoint with filtering
- Search by name/description
- Filter by trades and states
- Pagination support
- Include related trades and regions in response
- TypeScript types for all data structures
- Basic error handling

### Out of Scope

- Authentication/authorization (public endpoint for now)
- Sorting options (default to alphabetical by name)
- Advanced search features (distance-based, ratings filter)
- Caching layer (rely on browser caching)
- Write operations (POST, PUT, DELETE)
- GraphQL endpoint
- Webhook notifications
- API versioning strategy

### Open Questions

- [ ] Should we implement cursor-based pagination instead of offset-based for better performance at scale?
- [ ] Do we need to support filtering by multiple attributes (AND vs OR logic)?
- [ ] Should featured agencies always appear first regardless of other filters?
- [ ] What's the exact full-text search behavior we want (prefix matching, fuzzy search)?
- [ ] Should we return agency statistics (lead count, response rate) in this endpoint?

## 5. Implementation Notes

### Suggested Technical Approach

1. Create TypeScript interfaces matching the database schema
2. Use Supabase's query builder with proper joins
3. Implement query parameter validation using Zod
4. Add comprehensive error handling and logging
5. Write unit tests for query building logic
6. Write integration tests for various filter combinations

### Performance Considerations

- Use `.select()` to only fetch required fields
- Leverage database indexes (already created)
- Consider implementing response caching in the future
- Monitor query performance with Supabase dashboard

### Next Steps

1. Create the route handler at `app/api/agencies/route.ts`
2. Implement TypeScript types in `types/api.ts`
3. Add request validation middleware
4. Write comprehensive tests
5. Document API in OpenAPI/Swagger format
6. Set up monitoring for endpoint performance
