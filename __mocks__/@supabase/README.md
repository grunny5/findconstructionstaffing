# Enhanced Supabase Mock

This directory contains an enhanced mock for `@supabase/supabase-js` that provides comprehensive testing support with TypeScript interfaces, promise-like behavior, and realistic data responses.

## Features

### 1. **Full TypeScript Support**

- Comprehensive interfaces matching the actual Supabase client
- Type-safe query builder with proper return types
- Exported types for use in your tests

### 2. **Promise-Like Behavior**

The mock supports both promise patterns:

```typescript
// Using then/catch
const result = await supabase
  .from('agencies')
  .select('*')
  .then((res) => res.data)
  .catch((err) => console.error(err));

// Using async/await
const response = await supabase.from('agencies').select('*');
```

### 3. **Method Chaining**

All query builder methods support chaining:

```typescript
const query = supabase
  .from('agencies')
  .select('*')
  .eq('is_active', true)
  .order('name')
  .limit(10);
```

### 4. **Execution Methods**

- `single()` - Returns a single record
- `maybeSingle()` - Returns a single record or null
- `csv()` - Returns data in CSV format
- `execute()` - Explicitly executes the query

### 5. **Test Data Management**

The mock includes default test data and helper methods:

```typescript
// Use default test data
const response = await supabase.from('agencies').select('*');
// Returns 2 mock agencies

// Set custom data
supabase._setMockData([{ id: '1', name: 'Custom Agency' }]);

// Simulate errors
supabase._setMockError({
  message: 'Database error',
  code: 'DB_ERROR',
});
```

## Available Methods

### Query Building

- `from(table)` - Start a query
- `select(columns)` - Select columns
- `insert(data)` - Insert records
- `update(data)` - Update records
- `upsert(data)` - Upsert records
- `delete()` - Delete records

### Filters

- `eq(column, value)` - Equal
- `neq(column, value)` - Not equal
- `gt(column, value)` - Greater than
- `gte(column, value)` - Greater than or equal
- `lt(column, value)` - Less than
- `lte(column, value)` - Less than or equal
- `like(column, pattern)` - LIKE pattern
- `ilike(column, pattern)` - Case-insensitive LIKE
- `is(column, value)` - IS (for null checks)
- `in(column, array)` - IN array
- `contains(column, value)` - Contains
- `containedBy(column, value)` - Contained by
- `or(filters)` - OR condition
- `not(column, operator, value)` - NOT condition
- `match(query)` - Match object
- `filter(column, operator, value)` - Custom filter

### Modifiers

- `order(column, options)` - Order results
- `limit(count)` - Limit results
- `range(from, to)` - Select range

### Auth Methods

- `auth.signUp()` - Mock user registration
- `auth.signIn()` - Mock user login
- `auth.signOut()` - Mock user logout
- `auth.getUser()` - Get current user
- `auth.getSession()` - Get current session

### Storage Methods

- `storage.from(bucket)` - Access storage bucket
- `upload()` - Mock file upload
- `download()` - Mock file download
- `remove()` - Mock file deletion

### Functions

- `functions.invoke(name, options)` - Mock edge function calls

## Response Format

All queries return a consistent response format:

```typescript
interface PostgrestResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  count: number | null;
  status: number;
  statusText: string;
}
```

## Usage in Tests

```typescript
import { createClient } from '@supabase/supabase-js';

describe('My Test', () => {
  let supabase;

  beforeEach(() => {
    supabase = createClient('https://test.supabase.co', 'test-key');
  });

  it('should fetch data', async () => {
    const { data, error } = await supabase.from('agencies').select('*');

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });
});
```

## Limitations

While comprehensive, this mock has some limitations:

- Filter methods don't actually filter the returned data
- Transactions are not supported
- Real-time subscriptions are not implemented
- RLS (Row Level Security) policies are not simulated

For these advanced features, consider using Supabase's local development environment.
