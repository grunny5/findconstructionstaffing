# API Pagination

## Overview

The agencies API endpoint implements offset-based pagination to efficiently handle large result sets and improve performance.

## Pagination Parameters

### Query Parameters

| Parameter | Type | Default | Min | Max | Description |
|-----------|------|---------|-----|-----|-------------|
| `limit` | integer | 20 | 1 | 100 | Number of results per page |
| `offset` | integer | 0 | 0 | - | Starting position in result set |

### Examples

```http
# Default pagination (first 20 results)
GET /api/agencies

# Custom page size
GET /api/agencies?limit=50

# Second page of results (items 21-40)
GET /api/agencies?offset=20&limit=20

# Third page with custom size
GET /api/agencies?offset=100&limit=50
```

## Pagination Response

### Response Structure

Every response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Metadata Fields

- **total**: Total number of agencies matching filters (before pagination)
- **limit**: Number of results requested per page
- **offset**: Starting position for this page
- **hasMore**: Boolean indicating if more results exist beyond this page

### hasMore Calculation

```typescript
hasMore = total > (offset + limit)
```

Examples:
- Total: 100, Offset: 0, Limit: 20 → hasMore: true
- Total: 100, Offset: 80, Limit: 20 → hasMore: false
- Total: 25, Offset: 20, Limit: 20 → hasMore: false

## Pagination with Filters

### Filter Application Order

Pagination is applied AFTER all filters:

1. Apply active filter (`is_active = true`)
2. Apply search filter (if provided)
3. Apply trade filter (if provided)
4. Apply state filter (if provided)
5. **Apply pagination** (limit/offset)
6. Return results

### Filtered Totals

The `total` count reflects filtered results:

```http
GET /api/agencies?trades[]=electricians&limit=10
```

Response:
```json
{
  "data": [...10 electrician agencies...],
  "pagination": {
    "total": 45,  // 45 total electrician agencies (not all agencies)
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

## Common Pagination Patterns

### Page Navigation

```javascript
// First page
const page1 = await fetch('/api/agencies?limit=20&offset=0');

// Next page
const page2 = await fetch('/api/agencies?limit=20&offset=20');

// Previous page
const prevPage = await fetch('/api/agencies?limit=20&offset=0');

// Last page (calculate offset)
const lastPageOffset = Math.floor(total / limit) * limit;
const lastPage = await fetch(`/api/agencies?limit=20&offset=${lastPageOffset}`);
```

### Load More Pattern

```javascript
let offset = 0;
const limit = 20;
let hasMore = true;
const allAgencies = [];

while (hasMore) {
  const response = await fetch(`/api/agencies?limit=${limit}&offset=${offset}`);
  const data = await response.json();
  
  allAgencies.push(...data.data);
  hasMore = data.pagination.hasMore;
  offset += limit;
}
```

### Page Number Calculation

```javascript
// Convert page number to offset
const pageNumber = 3;
const limit = 20;
const offset = (pageNumber - 1) * limit; // offset = 40

// Convert offset to page number
const currentPage = Math.floor(offset / limit) + 1;
const totalPages = Math.ceil(total / limit);
```

## Performance Considerations

### Efficient Queries

- Database indexes optimize count queries
- Offset/limit applied at database level
- No unnecessary data transferred
- Consistent performance across page sizes

### Recommended Limits

- **Default**: 20 - Good balance of performance and usability
- **Mobile**: 10-20 - Smaller payloads for mobile networks
- **Desktop**: 20-50 - Larger screens can display more
- **Max**: 100 - Prevents excessive server load

### Large Offsets

For very large offsets, consider:
- Cursor-based pagination (future enhancement)
- Search/filter to reduce result set
- Index optimization for common queries

## Validation Rules

### Limit Validation

- **Minimum**: 1 (at least one result)
- **Maximum**: 100 (prevents server overload)
- **Non-numeric**: Returns 400 Bad Request
- **Decimal**: Parsed to integer

### Offset Validation

- **Minimum**: 0 (start from beginning)
- **Maximum**: No hard limit
- **Negative**: Returns 400 Bad Request
- **Non-numeric**: Returns 400 Bad Request

### Validation Error Example

```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid query parameters",
    "details": {
      "issues": [
        {
          "path": "limit",
          "message": "Number must be greater than or equal to 1"
        }
      ]
    }
  }
}
```

## Edge Cases

### Empty Results

When no agencies match filters:
```json
{
  "data": [],
  "pagination": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Offset Beyond Total

When offset exceeds total results:
```json
{
  "data": [],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 100,  // Beyond total
    "hasMore": false
  }
}
```

### Exact Boundary

When results end exactly at page boundary:
```json
{
  "data": [...20 agencies...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 80,  // Items 81-100
    "hasMore": false
  }
}
```

## Combined with Other Features

### With Search
```http
GET /api/agencies?search=construction&limit=10&offset=20
```

### With Multiple Filters
```http
GET /api/agencies?search=elite&trades[]=electricians&states[]=TX&limit=5&offset=10
```

### With Caching
Pagination parameters are included in cache keys:
- Different pages have different ETags
- Each page can be cached independently
- Cache respects limit/offset combinations

## Client Implementation Examples

### React Hook
```typescript
function useAgencies(filters) {
  const [page, setPage] = useState(1);
  const limit = 20;
  
  const { data, error, isLoading } = useSWR(
    `/api/agencies?${buildQuery({
      ...filters,
      limit,
      offset: (page - 1) * limit
    })}`
  );
  
  return {
    agencies: data?.data || [],
    pagination: data?.pagination,
    page,
    setPage,
    totalPages: Math.ceil((data?.pagination?.total || 0) / limit)
  };
}
```

### Pagination Component
```jsx
function Pagination({ pagination, onPageChange }) {
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return (
    <div>
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      
      <span>Page {currentPage} of {totalPages}</span>
      
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!pagination.hasMore}
      >
        Next
      </button>
    </div>
  );
}
```

## Best Practices

1. **Always check hasMore** before showing "Next" button
2. **Cache pages** independently for better performance
3. **Show loading states** during page transitions
4. **Preserve filters** when changing pages
5. **Reset to page 1** when filters change
6. **Show total count** to users for context
7. **Use appropriate limit** based on UI design
8. **Handle errors** gracefully (network, validation)

## Future Enhancements

Potential improvements for pagination:
- Cursor-based pagination for better performance at scale
- Page size preferences per user
- Sorting options with pagination
- Jump to page functionality
- Infinite scroll support