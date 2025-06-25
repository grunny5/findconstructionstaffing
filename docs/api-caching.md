# API Caching Strategy

## Overview

The agencies API endpoint implements HTTP caching to improve performance and reduce database load.

## Cache Headers

### Successful Responses (200 OK)
- `Cache-Control: public, max-age=300, must-revalidate`
- `ETag: {md5-hash-of-response}`
- `Vary: Accept-Encoding`

### Error Responses (4xx, 5xx)
- `Cache-Control: no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`

## ETag Implementation

ETags are generated using MD5 hash of the JSON response:
```typescript
const etag = createHash('md5').update(responseString).digest('hex');
```

## Conditional Requests

The API supports conditional requests using `If-None-Match` header:

- **304 Not Modified**: Returned when client ETag matches current response
- **200 OK**: Returned when content has changed or no ETag provided

## Cache Duration

- **Max Age**: 300 seconds (5 minutes)
- **Policy**: Public caching (CDNs and browsers can cache)
- **Revalidation**: Must check with server after expiration

## Benefits

1. **Reduced Database Load**: Cached responses avoid unnecessary database queries
2. **Faster Response Times**: Browsers and CDNs serve cached content
3. **Bandwidth Savings**: 304 responses contain no body
4. **Scalability**: Reduces server load during high traffic

## Implementation Details

### Cache Key Factors
ETags change when:
- Agency data changes
- Pagination parameters change
- Query results change

### Cache Invalidation
- Automatic: After 5 minutes (max-age)
- Manual: Server returns new ETag when data changes

### Error Handling
Error responses are never cached to ensure:
- Fresh error information
- Proper debugging capability
- No stale error states

## Testing

Cache functionality is tested in:
- `app/api/agencies/__tests__/caching.test.ts`

Test coverage includes:
- Header presence and values
- ETag generation consistency
- Conditional request behavior
- Error response non-caching