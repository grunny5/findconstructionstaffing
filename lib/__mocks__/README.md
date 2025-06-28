# Manual Mocks

This directory contains manual mock implementations for modules in the `lib` directory.

## Supabase Mock (`supabase.ts`)

The consolidated Supabase mock provides a comprehensive mock implementation with:

### Features
- **Factory Function**: `createMockSupabase()` for creating fresh mock instances
- **Complete Method Coverage**: All Supabase query builder methods
- **Method Chaining**: Proper chainable API matching Supabase's interface
- **Type Safety**: Comprehensive TypeScript types for all methods
- **Reset Function**: `resetSupabaseMock()` for clearing mock state between tests

### Usage

```typescript
// The mock is automatically used when you import from @/lib/supabase
import { supabase } from '@/lib/supabase';

// In your test
describe('My Test', () => {
  beforeEach(() => {
    // Clear all mock calls between tests
    jest.clearAllMocks();
  });

  it('should query data', async () => {
    // The mock is already set up with chainable methods
    const result = await supabase
      .from('agencies')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    // Result will be { data: [], error: null, count: null }
  });
});
```

### Advanced Usage

For tests that need custom behavior:

```typescript
import { createMockSupabase } from '@/lib/__mocks__/supabase';

// Create a custom mock instance
const customMock = createMockSupabase();

// Override specific behavior
customMock.order.mockResolvedValue({
  data: [{ id: '1', name: 'Test Agency' }],
  error: null,
  count: 1
});
```

### Related Mocks

For more advanced mocking scenarios, see:
- `__tests__/utils/supabase-mock.ts` - Centralized mock with error simulation and runtime configuration
- `__mocks__/@supabase/supabase-js.ts` - Low-level Supabase client mock

## Best Practices

1. **Always clear mocks** between tests using `jest.clearAllMocks()`
2. **Use the factory function** when you need isolated mock instances
3. **Prefer the default export** for most tests to maintain consistency
4. **Check method calls** using Jest's mock assertions:
   ```typescript
   expect(supabase.from).toHaveBeenCalledWith('agencies');
   expect(supabase.eq).toHaveBeenCalledWith('is_active', true);
   ```