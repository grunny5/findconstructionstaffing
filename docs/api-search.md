# API Search Functionality

## Overview

The agencies API endpoint implements sophisticated search capabilities using a combination of PostgreSQL full-text search and pattern matching for optimal results.

## Search Implementation

### Dual Search Strategy

The search implementation uses a hybrid approach combining:

1. **Full-Text Search (FTS)**: PostgreSQL's built-in full-text search for semantically relevant matches
2. **Pattern Matching (ILIKE)**: Case-insensitive partial string matching for flexible queries

### Search Query Structure

```sql
-- Combined search across name and description fields
name.fts.{search_term},description.fts.{search_term},name.ilike.%{search_term}%,description.ilike.%{search_term}%
```

### Search Features

#### Multi-Field Search

- Searches across both `name` and `description` fields
- Uses OR logic (matches in either field return results)

#### Input Sanitization

- Removes dangerous characters: `<>"'&`
- Trims whitespace and normalizes spaces
- Prevents SQL injection attacks

#### Search Types Supported

1. **Full Word Matching**
   - `?search=construction` → Matches "Construction Staffing Inc"
   - Uses FTS for semantically relevant results

2. **Partial Word Matching**
   - `?search=elect` → Matches "Electrical Contractors"
   - Uses ILIKE for substring matches

3. **Multi-Word Queries**
   - `?search=construction staffing` → Matches agencies with both terms
   - Preserves phrase structure for better relevance

4. **Case-Insensitive Search**
   - `?search=CONSTRUCTION` → Same results as `construction`
   - All searches are case-insensitive

## API Usage

### Basic Search

```http
GET /api/agencies?search=electrical
```

### Search with Pagination

```http
GET /api/agencies?search=construction&limit=10&offset=20
```

### Combined with Other Filters

```http
GET /api/agencies?search=plumbing&trades[]=plumbers&states[]=TX
```

## Search Response

Search results maintain the same response structure:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Electrical Contractors Inc",
      "description": "Premier electrical staffing solutions..."
      // ... other fields
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

## Performance Considerations

### Database Indexes

- Case-insensitive index on agency names: `idx_agencies_name_lower`
- Standard indexes on description field for FTS
- Composite indexes for filtered searches

### Query Optimization

- FTS queries use PostgreSQL's optimized text search
- ILIKE queries benefit from trigram indexes (if enabled)
- Combined strategy provides best of both approaches

### Caching

- Search results are cached using ETag headers
- Cache keys include search parameters
- 5-minute cache duration for search results

## Search Quality

### Relevance Ranking

1. **Exact matches** in name field (highest priority)
2. **FTS matches** using PostgreSQL's ranking
3. **Partial matches** in name field
4. **Description matches** (lower priority)

### Edge Cases Handled

- Empty search terms → Returns all results
- Only whitespace → Treated as empty search
- Special characters → Sanitized and searched
- No results → Returns empty array (not error)

## Implementation Details

### Code Location

- Main implementation: `app/api/agencies/route.ts`
- Validation: `lib/validation/agencies-query.ts`
- Input sanitization: `sanitizeSearchInput()` function

### Search Logic Flow

1. Parse query parameters with Zod validation
2. Sanitize search input if provided
3. Build Supabase query with FTS + ILIKE conditions
4. Apply same search to count query for pagination
5. Execute queries and return results

### Error Handling

- Invalid search parameters → 400 Bad Request
- Database errors → 500 Internal Server Error
- Empty results → 200 OK with empty array
- Malformed input → Sanitized automatically

## Future Enhancements

### Planned Improvements

- Search result highlighting
- Search analytics and logging
- Fuzzy search for typo tolerance
- Search suggestions/autocomplete
- Advanced ranking algorithms

### Performance Optimizations

- Full-text search indexes on description
- Search result caching layer
- Query performance monitoring
- Search term analytics for optimization
