# API Trade Filtering

## Overview

The agencies API endpoint supports filtering by trade specialties, allowing construction companies to find agencies that provide specific types of skilled workers.

## Trade Filtering Implementation

### Query Parameter Format

The API accepts trade filters using array notation:
- Single trade: `?trades[]=electricians`
- Multiple trades: `?trades[]=electricians&trades[]=plumbers`
- Alternative format: `?trades=electricians` (automatically converted to array)

### Filter Logic

**OR Logic**: When multiple trades are specified, agencies matching ANY of the trades are returned.
- Example: `?trades[]=electricians&trades[]=plumbers` returns agencies offering electricians OR plumbers

### Database Structure

Trade filtering uses the junction table approach:
```sql
agencies -> agency_trades -> trades
```

The filtering is implemented using efficient subqueries:
```typescript
query.in('id',
  supabase
    .from('agency_trades')
    .select('agency_id')
    .in('trade_id', 
      supabase
        .from('trades')
        .select('id')
        .in('slug', trades)
    )
)
```

## API Usage Examples

### Filter by Single Trade
```http
GET /api/agencies?trades[]=electricians
```

Response includes only agencies offering electrician staffing:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Elite Electrical Staffing",
      "trades": [
        {
          "id": "uuid",
          "name": "Electricians",
          "slug": "electricians"
        }
      ]
    }
  ],
  "pagination": {...}
}
```

### Filter by Multiple Trades
```http
GET /api/agencies?trades[]=electricians&trades[]=plumbers&trades[]=hvac-technicians
```

Returns agencies offering ANY of the specified trades.

### Combined with Other Filters
```http
GET /api/agencies?search=construction&trades[]=carpenters&limit=10
```

Applies all filters together:
- Search for "construction" in name/description
- Must offer carpenter staffing
- Return max 10 results

## Trade Validation

### Valid Trade Slugs
Trade slugs must match existing trades in the database. Invalid trades are silently ignored to provide graceful degradation.

### Parameter Limits
- Maximum 10 trades per request (prevents query complexity)
- Empty trade values are filtered out
- Whitespace is trimmed from trade slugs

### Validation Errors
```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid query parameters",
    "details": {
      "issues": [
        {
          "path": "trades",
          "message": "Too many trade filters"
        }
      ]
    }
  }
}
```

## Performance Considerations

### Database Indexes
Optimized indexes ensure fast trade filtering:
- `idx_agency_trades_agency_id` - Fast agency lookups
- `idx_agency_trades_trade_id` - Fast trade lookups
- `idx_trades_slug` - Fast slug matching

### Query Optimization
- Subqueries are optimized by PostgreSQL query planner
- Junction table joins are efficient with proper indexes
- Trade details are included in main query to avoid N+1 queries

### Pagination
Trade filters are applied before pagination:
1. Filter by trades (and other criteria)
2. Count total matching agencies
3. Apply pagination limits
4. Return paginated results

## Response Format

Filtered responses maintain the standard format with trade relationships:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Professional Staffing Solutions",
      "description": "Leading construction staffing agency",
      "trades": [
        {
          "id": "456e7890-e89b-12d3-a456-426614174001",
          "name": "Electricians",
          "slug": "electricians"
        },
        {
          "id": "567e8901-e89b-12d3-a456-426614174002",
          "name": "Plumbers",
          "slug": "plumbers"
        }
      ],
      // ... other agency fields
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## Common Trade Slugs

Example trade slugs in the system:
- `electricians`
- `plumbers`
- `carpenters`
- `hvac-technicians`
- `welders`
- `painters`
- `masons`
- `roofers`
- `general-laborers`

## Error Handling

### No Matching Trades
When no agencies match the specified trades:
- Returns 200 OK with empty data array
- Not an error condition
- Pagination shows total: 0

### Invalid Trade Slugs
When invalid trade slugs are provided:
- Invalid slugs are ignored
- Valid slugs are still processed
- If all slugs are invalid, returns all agencies

## Implementation Notes

### Code Locations
- Route handler: `app/api/agencies/route.ts`
- Parameter validation: `lib/validation/agencies-query.ts`
- Trade filtering logic: Lines 107-123 in route handler

### Filter Application Order
1. Active agencies filter (`is_active = true`)
2. Search filter (if provided)
3. Trade filter (if provided)
4. State filter (if provided)
5. Pagination

### Count Query
The same trade filter is applied to both:
- Main data query (for results)
- Count query (for pagination metadata)

This ensures accurate pagination when filters are applied.