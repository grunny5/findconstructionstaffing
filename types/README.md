# Types Directory

This directory contains TypeScript type definitions used throughout the application.

## Files

### `api.ts`
Contains comprehensive type definitions for the agencies API endpoint, including:

- **Core Types**: `Agency`, `Trade`, `Region`
- **API Response Types**: `AgenciesApiResponse`, `AgencyResponse`, `PaginationMetadata`
- **Request Types**: `AgenciesQueryParams`
- **Error Types**: `ApiError`, `ErrorResponse`
- **Constants**: `API_CONSTANTS`, `HTTP_STATUS`, `ERROR_CODES`
- **Type Guards**: `isErrorResponse()`

## Usage

```typescript
import { 
  Agency, 
  AgenciesApiResponse, 
  AgenciesQueryParams,
  isErrorResponse 
} from '@/types/api';

// Use in API route handler
const response: AgenciesApiResponse = {
  data: agencies,
  pagination: {
    total: 100,
    limit: 20,
    offset: 0,
    hasMore: true
  }
};

// Check for errors
if (isErrorResponse(response)) {
  console.error(response.error.message);
}
```

## Type Safety

All types are designed to:
- Match the database schema exactly
- Provide full type safety for API consumers
- Support TypeScript strict mode
- Include comprehensive JSDoc documentation

## Testing

Types are tested in `__tests__/api.test.ts` to ensure:
- Type guards work correctly
- Constants have expected values
- Types allow valid data structures
- Optional fields work as expected