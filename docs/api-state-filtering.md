# API State/Region Filtering

## Overview

The agencies API endpoint supports filtering by U.S. state codes, allowing construction companies to find staffing agencies that service specific geographic locations.

## State Filtering Implementation

### Query Parameter Format

The API accepts state filters using 2-letter state codes:
- Single state: `?states[]=TX`
- Multiple states: `?states[]=TX&states[]=CA&states[]=FL`
- Alternative format: `?states=TX` (automatically converted to array)

### State Code Requirements

- **Format**: 2-letter UPPERCASE state codes (ISO 3166-2:US)
- **Case**: Lowercase automatically converted to uppercase
- **Validation**: Must be exactly 2 characters
- **Examples**: TX, CA, NY, FL, AZ, etc.

### Filter Logic

**OR Logic**: When multiple states are specified, agencies servicing ANY of the states are returned.
- Example: `?states[]=TX&states[]=CA` returns agencies in Texas OR California

## Database Structure

State filtering uses the region-based approach:
```sql
agencies -> agency_regions -> regions (with state_code)
```

The filtering implementation:
```typescript
query.in('id',
  supabase
    .from('agency_regions')
    .select('agency_id')
    .in('region_id',
      supabase
        .from('regions')
        .select('id')
        .in('state_code', states)
    )
)
```

## API Usage Examples

### Filter by Single State
```http
GET /api/agencies?states[]=TX
```

Response includes only agencies servicing Texas:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Texas Construction Staffing",
      "regions": [
        {
          "id": "uuid",
          "name": "Dallas-Fort Worth",
          "code": "TX"
        },
        {
          "id": "uuid",
          "name": "Houston",
          "code": "TX"
        }
      ]
    }
  ],
  "pagination": {...}
}
```

### Filter by Multiple States
```http
GET /api/agencies?states[]=TX&states[]=CA&states[]=AZ
```

Returns agencies servicing ANY of Texas, California, or Arizona.

### Combined with Other Filters
```http
GET /api/agencies?search=staffing&trades[]=electricians&states[]=TX&limit=10
```

Applies all filters together:
- Search for "staffing" in name/description
- Must offer electrician staffing
- Must service Texas
- Return max 10 results

## Region vs State Mapping

### Region Structure
Regions represent metropolitan areas within states:
- Each region has a unique name and state code
- Agencies can service multiple regions
- Multiple regions can exist in the same state

Example regions:
```json
[
  { "name": "Dallas-Fort Worth", "code": "TX" },
  { "name": "Houston", "code": "TX" },
  { "name": "Austin", "code": "TX" },
  { "name": "Los Angeles", "code": "CA" },
  { "name": "San Francisco Bay Area", "code": "CA" }
]
```

### Multi-State Agencies
Agencies can service multiple states by having regions in different states:
```json
{
  "name": "National Staffing Solutions",
  "regions": [
    { "name": "Dallas-Fort Worth", "code": "TX" },
    { "name": "Los Angeles", "code": "CA" },
    { "name": "Phoenix", "code": "AZ" }
  ]
}
```

## State Code Validation

### Valid Examples
- `?states[]=TX` ✓
- `?states[]=tx` ✓ (converted to TX)
- `?states[]=CA&states[]=NY` ✓

### Invalid Examples
- `?states[]=TEXAS` ✗ (too long)
- `?states[]=T` ✗ (too short)
- `?states[]=123` ✗ (not letters)

### Validation Errors
```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid query parameters",
    "details": {
      "issues": [
        {
          "path": "states.0",
          "message": "State code must be 2 letters",
          "received": "TEXAS"
        }
      ]
    }
  }
}
```

## Performance Considerations

### Database Indexes
Optimized indexes for fast state filtering:
- `idx_agency_regions_agency_id` - Fast agency lookups
- `idx_agency_regions_region_id` - Fast region lookups
- `idx_regions_state_code` (if exists) - Fast state code matching

### Query Optimization
- Subqueries optimized by PostgreSQL
- Efficient junction table traversal
- Region details included in main query

### Pagination with State Filters
1. Apply state filter (and others)
2. Count total matching agencies
3. Apply pagination
4. Return results with accurate counts

## Common U.S. State Codes

### Continental United States
- **Northeast**: NY, NJ, PA, CT, MA, VT, NH, ME, RI
- **Southeast**: FL, GA, SC, NC, VA, WV, MD, DE
- **Midwest**: IL, IN, OH, MI, WI, MN, IA, MO
- **South**: TX, OK, AR, LA, MS, AL, TN, KY
- **West**: CA, WA, OR, NV, AZ, UT, ID, MT
- **Central**: CO, WY, NM, KS, NE, SD, ND

### Other
- **Alaska**: AK
- **Hawaii**: HI
- **DC**: DC (District of Columbia)

## Response Format

Filtered responses include region details:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Regional Construction Staffing",
      "description": "Serving the Southwest",
      "regions": [
        {
          "id": "456e7890",
          "name": "Phoenix",
          "code": "AZ"
        },
        {
          "id": "567e8901",
          "name": "Las Vegas",
          "code": "NV"
        }
      ],
      "trades": [...],
      // ... other agency fields
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

## Error Handling

### No Matching States
When no agencies service the specified states:
- Returns 200 OK with empty data array
- Not an error condition
- Pagination shows total: 0

### Invalid State Codes
- Invalid codes that don't pass validation return 400 error
- Multiple states with some invalid: all rejected

## Implementation Notes

### Code Locations
- Route handler: `app/api/agencies/route.ts`
- Parameter validation: `lib/validation/agencies-query.ts`
- State filtering logic: Lines 125-141 in route handler

### Filter Application Order
1. Active agencies filter
2. Search filter (if provided)
3. Trade filter (if provided)
4. State filter (if provided)
5. Pagination

### Count Query
State filter applied to both:
- Main data query (for results)
- Count query (for pagination metadata)

This ensures accurate counts when filtering.

## Common Use Cases

### Local Search
Find agencies in a specific state:
```http
GET /api/agencies?states[]=TX&trades[]=electricians
```

### Regional Search
Find agencies across multiple neighboring states:
```http
GET /api/agencies?states[]=TX&states[]=OK&states[]=AR&states[]=LA
```

### National Search
Search across major markets:
```http
GET /api/agencies?states[]=CA&states[]=TX&states[]=NY&states[]=FL&states[]=IL
```