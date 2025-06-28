# Test Infrastructure Documentation

## Supabase Mock Setup

This project uses a centralized Supabase mock system to ensure consistent test behavior across all test files.

### Key Concepts

1. **Module-level Mock**: The Supabase client is automatically mocked when you import `@/__tests__/utils/supabase-mock`
2. **Import Order Matters**: Always import mocks BEFORE importing the code under test
3. **Centralized Configuration**: Use `configureSupabaseMock()` instead of manually setting mock return values

### Correct Test Structure

```typescript
// 1. Import mock utilities FIRST
import { configureSupabaseMock, supabaseMockHelpers, resetSupabaseMock } from '@/__tests__/utils/supabase-mock';

// 2. Import Supabase (already mocked)
import { supabase } from '@/lib/supabase';

// 3. Mock other dependencies
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data,
      headers: new Headers(init?.headers)
    }))
  }
}));

// 4. Import the code under test LAST
import { GET } from '../route';

describe('Your Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSupabaseMock(supabase);
  });

  it('should handle successful queries', async () => {
    // Configure mock for success
    configureSupabaseMock(supabase, {
      defaultData: [{ id: '1', name: 'Test' }]
    });

    // Your test code here
  });

  it('should handle errors', async () => {
    // Configure mock for errors
    configureSupabaseMock(supabase, {
      error: { message: 'Database error' }
    });

    // Your test code here
  });
});
```

### Mock Configuration Options

```typescript
interface SupabaseMockConfig {
  // Simulate an error response
  error?: Error | { message: string; code?: string };
  
  // Throw the error instead of returning it
  throwError?: boolean;
  
  // Default data to return from queries
  defaultData?: any;
  
  // Default count for queries
  defaultCount?: number;
}
```

### Assertion Helpers

The `supabaseMockHelpers` object provides utilities for asserting mock calls:

```typescript
// Assert a table was queried
supabaseMockHelpers.expectTableQueried(supabase, 'agencies');

// Assert select was called with specific columns
supabaseMockHelpers.expectSelectCalled(supabase, 'id, name');

// Assert a filter was applied
supabaseMockHelpers.expectFilterApplied(supabase, 'eq', 'status', 'active');

// Assert method call count
supabaseMockHelpers.expectMethodCallCount(supabase, 'select', 1);

// Assert complete query chain
supabaseMockHelpers.expectQueryChain(supabase, ['from', 'select', 'eq', 'order']);
```

### Multi-Table Query Helper

For complex multi-table queries (like trade and state filtering), use the `configureMockForFilters` helper:

```typescript
import { configureMockForFilters } from '@/__tests__/utils/supabase-mock';

// Setup mocks for trade filtering
configureMockForFilters(supabase, {
  trades: {
    slugs: ['electricians', 'plumbers'],    // Input trade slugs
    ids: ['trade-1', 'trade-2'],           // IDs returned by trades table
    agencyIds: ['agency-1', 'agency-2']    // IDs returned by agency_trades table
  }
});

// Setup mocks for state filtering  
configureMockForFilters(supabase, {
  states: {
    codes: ['TX', 'CA'],                   // Input state codes
    regionIds: ['region-1', 'region-2'],  // IDs returned by regions table
    agencyIds: ['agency-1', 'agency-3']   // IDs returned by agency_regions table
  }
});

// Combined filtering (intersection logic)
configureMockForFilters(supabase, {
  trades: {
    slugs: ['electricians'],
    ids: ['trade-1'],
    agencyIds: ['agency-1', 'agency-2']
  },
  states: {
    codes: ['TX'],
    regionIds: ['region-tx'],
    agencyIds: ['agency-1']  // Only agency-1 matches both filters
  }
});
```

This helper automatically handles the complex query chains:
- `trades` table → `agency_trades` table → filtered agency IDs
- `regions` table → `agency_regions` table → filtered agency IDs
- Preserves main query mock configuration

### Common Patterns

#### Testing Count Queries

```typescript
configureSupabaseMock(supabase, {
  defaultCount: 42
});

// The mock handles count('*', { count: 'exact' }) automatically
```

#### Testing Error Conditions

```typescript
// Return error in response
configureSupabaseMock(supabase, {
  error: { message: 'Connection refused' }
});

// Or throw error
configureSupabaseMock(supabase, {
  error: new Error('Network error'),
  throwError: true
});
```

#### Testing Empty Results

```typescript
configureSupabaseMock(supabase, {
  defaultData: []
});
```

### Troubleshooting

#### General Issues
1. **Mock not working**: Check import order - mocks must be imported before the code under test
2. **Type errors**: The mock includes all Supabase methods with proper TypeScript types
3. **Unexpected behavior**: Use `resetSupabaseMock()` in `beforeEach` to ensure clean state

#### Multi-Table Query Issues
4. **Filter tests failing**: Use `configureMockForFilters()` for trade/state filtering tests
5. **Wrong table calls**: Verify the helper is called AFTER `configureSupabaseMock()`
6. **Infinite loops**: Make sure not to call both helpers on the same mock - use one or the other

#### Common Error Messages
- `Cannot read property 'mockResolvedValue' of undefined`: Import order issue
- `TypeError: supabase.from is not a function`: Missing mock import
- `AssertionError: Expected mock function to have been called`: Mock not configured properly

### Performance Tips

1. **Use `resetSupabaseMock()` efficiently**: Call it once in `beforeEach`, not multiple times per test
2. **Batch configuration**: Configure all mock data once rather than changing it during tests
3. **Prefer specific helpers**: Use `configureMockForFilters()` for filter tests, basic `configureSupabaseMock()` for simple queries
4. **Minimize mock reconfiguration**: Set up complex scenarios once and reuse

### Advanced Usage

#### Custom Mock Behavior
```typescript
// For tests requiring special behavior
supabase.from.mockImplementation((table) => {
  if (table === 'special_table') {
    // Custom logic here
  }
  return supabase; // Default chaining
});
```

#### Testing Error Recovery
```typescript
// Test how code handles database failures
configureSupabaseMock(supabase, {
  error: { message: 'Connection timeout', code: 'TIMEOUT' },
  throwError: true
});
```

### Migration Guide

If you have existing tests using manual mocks:

```typescript
// OLD WAY - Don't do this
supabase.from.mockReturnValue(supabase);
supabase.select.mockReturnValue(supabase);
supabase.limit.mockResolvedValue({ data: [...], error: null });

// NEW WAY - Do this instead
configureSupabaseMock(supabase, {
  defaultData: [...]
});
```

The centralized mock handles all the chaining automatically and ensures consistent behavior across all terminal methods (`limit`, `range`, `order`, `single`, etc.).

## Implementation Status

### Migrated Test Files ✅
The following test files have been successfully migrated to the centralized mock system:

- `app/api/agencies/__tests__/state-filter.test.ts` (15 tests) - Uses `configureMockForFilters`
- `app/api/agencies/__tests__/route.test.ts` (11 tests)
- `app/api/agencies/__tests__/caching.test.ts` (8 tests)
- `app/api/agencies/__tests__/search.test.ts` (8 tests)
- `app/api/agencies/__tests__/pagination.test.ts` (migrated earlier)
- `app/api/agencies/__tests__/integration.test.ts` (migrated earlier)
- `app/api/agencies/__tests__/health.test.ts` (migrated earlier)
- `app/api/agencies/__tests__/trade-filter.test.ts` (12 tests) - Uses `configureMockForFilters`

### Migration Complete ✅
All 8/8 test files have been successfully migrated to the centralized mock system.

### Available Helpers

1. **Basic Mock**: `configureSupabaseMock()` - For simple queries
2. **Filter Mock**: `configureMockForFilters()` - For multi-table filter queries  
3. **Assertions**: `supabaseMockHelpers.*` - For verifying mock calls
4. **Reset**: `resetSupabaseMock()` - For cleaning state between tests

### File Organization

```
__tests__/
├── utils/
│   ├── supabase-mock.ts                    # Main centralized mock
│   ├── supabase-mock-filters.test.ts       # Helper tests  
│   ├── filter-mock-example.test.ts         # Usage examples
│   └── api-mocks.ts                        # Request mocking utilities
└── README.md                               # This documentation
```

## Best Practices Summary

1. **Always import mocks first** - Before any code under test
2. **Use helpers appropriately** - `configureMockForFilters` for complex queries
3. **Reset between tests** - Call `resetSupabaseMock()` in `beforeEach`
4. **Test realistic scenarios** - Configure mocks to match actual data patterns
5. **Verify mock calls** - Use assertion helpers to ensure queries are made correctly

This centralized approach provides consistent, reliable testing while significantly reducing mock setup complexity.