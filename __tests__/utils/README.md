# Test Utilities

This directory contains shared utilities for testing.

## Supabase Mock

The `supabase-mock.ts` file provides comprehensive mocking for Supabase operations.

### Two Approaches to Mocking

#### 1. Module-Level Mock (Default)

The module is automatically mocked when you import from `@/lib/supabase`. This is the recommended approach for most tests.

```typescript
// In your test file - no setup needed!
import { supabase } from '@/lib/supabase';

describe('My Test', () => {
  it('should work with default mock', () => {
    // supabase is already mocked
    expect(supabase.from).toBeDefined();
  });
});
```

#### 2. Runtime Mock (Dynamic)

Use `setupSupabaseMockRuntime()` when you need to:

- Change mock behavior during test execution
- Set up different mocks for different tests in the same file
- Dynamically configure mock responses

```typescript
import { setupSupabaseMockRuntime } from '@/__tests__/utils/supabase-mock';

describe('Dynamic Mock Test', () => {
  afterEach(() => {
    jest.resetModules(); // Important for runtime mocks
  });

  it('should use custom data', () => {
    const mockSupabase = setupSupabaseMockRuntime({
      defaultData: [{ id: '1', name: 'Test' }],
    });

    // Must require AFTER setting up the mock
    const { supabase } = require('@/lib/supabase');

    // Use your mock...
  });
});
```

### Mock Configuration

Both approaches support configuration:

```typescript
interface SupabaseMockConfig {
  throwError?: boolean;
  error?: Error | { message: string; code?: string };
  defaultData?: any;
  defaultCount?: number;
}
```

### Helper Functions

- `createSupabaseMock(config?)` - Creates a configured mock instance
- `resetSupabaseMock(mock)` - Resets a mock to default state
- `configureSupabaseMock(mock, config)` - Reconfigures an existing mock

### Best Practices

1. **Use module-level mocking** for most tests (it's simpler and faster)
2. **Use runtime mocking** only when you need dynamic behavior
3. **Always call `jest.resetModules()`** between runtime mock tests
4. **Require modules after** setting up runtime mocks

### Common Pitfalls

1. **Don't use `jest.mock()` inside functions** - It won't work due to hoisting
2. **Don't forget `jest.resetModules()`** when using runtime mocks
3. **Don't import before runtime mock setup** - Use `require()` after setup
