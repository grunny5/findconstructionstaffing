// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.FORCE_TEST_MOCKS = 'true';
process.env.CI = 'true'; // Always set CI=true for tests

// Set up database connection to use postgres user, not root
process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/findconstructionstaffing_test';
process.env.PGUSER = 'postgres';
process.env.PGPASSWORD = 'postgres';
process.env.PGHOST = 'localhost';
process.env.PGDATABASE = 'findconstructionstaffing_test';
// Also set USER to prevent defaulting to system user
process.env.USER = 'postgres';

// Store original env for restoration
global.__ORIGINAL_ENV__ = { ...process.env };
