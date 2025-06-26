# Testing Configuration

## Jest Setup for Next.js API Routes

This project uses Jest for testing with specific configuration for Next.js API routes.

### Configuration Files

- `jest.config.js` - Main Jest configuration using Next.js preset
- `jest.setup.js` - Test setup file with testing library imports
- `__tests__/utils/api-mocks.ts` - Utilities for mocking API route objects

### Test Structure

```
/app/api/
  ├── agencies/
  │   ├── route.ts
  │   └── __tests__/
  │       └── route.test.ts
  └── ...
```

### Mocking Utilities

The `api-mocks.ts` file provides utilities for:
- Creating mock NextRequest objects
- Mocking NextResponse
- Creating mock Supabase query chains
- Environment variable mocking

### Example Usage

```typescript
import { createMockNextRequest } from '@/__tests__/utils/api-mocks';

const mockRequest = createMockNextRequest({
  url: 'http://localhost:3000/api/test',
  searchParams: { limit: '10' }
});
```

### Running Tests

- All tests: `npm test`
- API route tests: `npm test app/api`
- Specific test file: `npm test path/to/test.test.ts`
- Watch mode: `npm test:watch`

### Notes

- API routes run in Node.js environment
- Frontend components would use jsdom environment
- Mocks are reset between tests automatically