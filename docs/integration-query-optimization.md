# Integration Query Optimization

## Problem Statement

The original implementation performs three separate database queries:

1. Fetch all companies
2. Fetch all configs
3. Fetch all sync logs

Then processes the data in JavaScript to combine them. This approach has several issues:

- Multiple round trips to the database
- Transferring potentially large amounts of unnecessary data
- Client-side processing overhead
- Poor scalability with growing data

## Solution Options

### Option 1: Single Query with Joins

Using Supabase's relationship features to fetch related data in one query:

```typescript
const { data: integrationsData, error } = await supabase
  .from('companies')
  .select(
    `
    id,
    name,
    created_at,
    roaddog_jobs_configs!left (
      company_id,
      is_active,
      last_sync_at,
      created_at,
      updated_at
    )
  `
  )
  .order('name');
```

**Pros:**

- Single database round trip for main data
- Uses Supabase's built-in relationship handling
- Reduces data transfer

**Cons:**

- Still needs a second query for latest sync logs
- Complex to get only the latest sync log per company

### Option 2: Database Function (RPC) - Recommended

Create a PostgreSQL function that handles all the logic:

```sql
CREATE OR REPLACE FUNCTION get_admin_integrations_summary()
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_at TIMESTAMPTZ,
  config_is_active BOOLEAN,
  config_last_sync_at TIMESTAMPTZ,
  config_created_at TIMESTAMPTZ,
  config_updated_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_sync_logs AS (
    SELECT DISTINCT ON (company_id)
      company_id,
      status,
      created_at AS sync_created_at
    FROM roaddog_jobs_sync_logs
    ORDER BY company_id, created_at DESC
  )
  SELECT
    c.id,
    c.name,
    c.created_at,
    cfg.is_active,
    cfg.last_sync_at,
    cfg.created_at,
    cfg.updated_at,
    lsl.status,
    lsl.sync_created_at
  FROM companies c
  LEFT JOIN roaddog_jobs_configs cfg ON c.id = cfg.company_id
  LEFT JOIN latest_sync_logs lsl ON c.id = lsl.company_id
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql STABLE;
```

Then use it in the application:

```typescript
const { data: integrations, error } = await supabase.rpc(
  'get_admin_integrations_summary'
);
```

**Pros:**

- Single database round trip
- All processing done in PostgreSQL (much faster)
- Optimal use of indexes
- Returns only needed data
- Easy to maintain and update logic

**Cons:**

- Requires database migration to add function
- Logic is in database rather than application code

## Performance Comparison

### Original Approach

- 3 database round trips
- Transfer all companies, configs, and sync logs
- O(n\*m) client-side processing for matching
- Network latency: ~30ms × 3 = 90ms minimum

### Optimized RPC Approach

- 1 database round trip
- Transfer only final result set
- O(n) database processing with indexes
- Network latency: ~30ms × 1 = 30ms

### Expected Performance Improvement

For a typical dataset:

- 1000 companies
- 500 configs
- 10,000 sync logs

**Original approach:**

- Data transfer: ~2MB
- Processing time: ~100ms client-side
- Total time: ~200ms

**RPC approach:**

- Data transfer: ~200KB
- Processing time: ~5ms database-side
- Total time: ~35ms

**Result: ~5-6x performance improvement**

## Implementation Steps

1. Create the database function using the provided SQL
2. Add appropriate indexes:

   ```sql
   CREATE INDEX idx_sync_logs_company_created
   ON roaddog_jobs_sync_logs(company_id, created_at DESC);

   CREATE INDEX idx_companies_name
   ON companies(name);
   ```

3. Update the page component to use the RPC call

4. Test and monitor performance

## Additional Optimizations

1. **Pagination**: For very large datasets, add pagination:

   ```sql
   CREATE OR REPLACE FUNCTION get_admin_integrations_summary(
     page_size INT DEFAULT 50,
     page_offset INT DEFAULT 0
   )
   ```

2. **Caching**: Add Redis caching for frequently accessed data

3. **Real-time updates**: Use Supabase real-time subscriptions for live updates

4. **Filtering**: Add filter parameters to the function for searching

## Security and Authorization

### Admin Authorization Implementation

The admin integrations pages now include authorization checks to ensure only authorized users can access integration data. The current implementation uses email-based authorization as a temporary security measure:

```typescript
// Check if user is admin
// TODO: Implement proper role-based authorization with profiles table
// For now, using email-based check as a security measure
const adminEmails = [
  'admin@findconstructionstaffing.com',
  'devops@findconstructionstaffing.com',
  // Add more admin emails as needed
];

if (!user.email || !adminEmails.includes(user.email)) {
  redirect('/');
  return null; // Ensure we don't continue execution in tests
}
```

### Migration to Role-Based Authorization

To properly implement role-based authorization:

1. **Create a profiles table** with user roles:

   ```sql
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT,
     role TEXT CHECK (role IN ('admin', 'user', 'viewer')),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Create RLS policies** for the profiles table:

   ```sql
   -- Users can read their own profile
   CREATE POLICY "Users can view own profile"
   ON profiles FOR SELECT
   USING (auth.uid() = id);

   -- Only admins can update profiles
   CREATE POLICY "Admins can update profiles"
   ON profiles FOR UPDATE
   USING (
     EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid() AND role = 'admin'
     )
   );
   ```

3. **Update the authorization check** in the admin pages:

   ```typescript
   // Fetch user profile to check role
   const { data: profile } = await supabase
     .from('profiles')
     .select('role')
     .eq('id', user.id)
     .single();

   if (!profile || profile.role !== 'admin') {
     redirect('/');
     return null;
   }
   ```

4. **Create a database trigger** to automatically create profiles:

   ```sql
   CREATE OR REPLACE FUNCTION handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO profiles (id, email, role)
     VALUES (
       NEW.id,
       NEW.email,
       CASE
         WHEN NEW.email IN ('admin@findconstructionstaffing.com', 'devops@findconstructionstaffing.com')
         THEN 'admin'
         ELSE 'user'
       END
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW
   EXECUTE FUNCTION handle_new_user();
   ```

### Transition Plan

1. **Phase 1**: Current email-based check (implemented)
2. **Phase 2**: Create profiles table and migration scripts
3. **Phase 3**: Update authorization logic to use roles
4. **Phase 4**: Remove email-based checks

This approach ensures proper security while maintaining backward compatibility during the transition.
