# Troubleshooting Guide

This guide helps resolve common issues when working with the FindConstructionStaffing Supabase infrastructure.

## Quick Diagnostics

Run this checklist first:
```bash
# 1. Test connection
node scripts/test-supabase-connection.js

# 2. Check environment variables
node scripts/validate-env.js

# 3. Run security tests
node scripts/security-tests.js
```

## Common Issues

### Connection Issues

#### Invalid API Key Error
```
Error: Invalid API key
```

**Causes:**
- Incorrect API key in `.env.local`
- Using service role key instead of anon key
- Extra spaces or line breaks in key

**Solutions:**
1. Get fresh key from Supabase dashboard:
   - Settings → API → Anon/Public key
2. Check `.env.local` formatting:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Remove any trailing spaces or newlines

#### Connection Timeout
```
Error: Connection timeout
```

**Causes:**
- Incorrect Supabase URL
- Network connectivity issues
- Supabase service downtime

**Solutions:**
1. Verify URL format:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   ```
2. Check Supabase status: https://status.supabase.com
3. Test with curl:
   ```bash
   curl https://your-project-id.supabase.co/rest/v1/
   ```

### Database Issues

#### Table Does Not Exist
```
Error: relation "agencies" does not exist
```

**Causes:**
- Migrations not run
- Wrong database/project
- Table names case mismatch

**Solutions:**
1. Run migrations in SQL Editor:
   ```sql
   -- Check existing tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
2. Re-run migration scripts
3. Verify connected to correct project

#### RLS Policy Blocking Access
```
Error: new row violates row-level security policy
```

**Causes:**
- RLS enabled without policies
- Policies too restrictive
- Using wrong authentication

**Solutions:**
1. Check RLS status:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
2. Review policies:
   ```sql
   SELECT * FROM pg_policies;
   ```
3. Test with service role key (dev only)

### Query Issues

#### Empty Results When Data Exists
**Causes:**
- RLS filtering out results
- Wrong query parameters
- Data not matching criteria

**Solutions:**
1. Check with SQL Editor:
   ```sql
   -- Bypass RLS to see all data
   SELECT * FROM agencies;
   ```
2. Verify active status:
   ```sql
   SELECT * FROM agencies WHERE is_active = true;
   ```
3. Check relationships:
   ```sql
   SELECT a.*, at.trade_id 
   FROM agencies a 
   LEFT JOIN agency_trades at ON a.id = at.agency_id;
   ```

#### Slow Query Performance
**Causes:**
- Missing indexes
- Complex joins
- Large result sets

**Solutions:**
1. Check query plan:
   ```sql
   EXPLAIN ANALYZE 
   SELECT * FROM agencies 
   WHERE name LIKE '%construction%';
   ```
2. Verify indexes exist:
   ```sql
   SELECT * FROM pg_indexes 
   WHERE tablename = 'agencies';
   ```
3. Add missing indexes:
   ```sql
   CREATE INDEX idx_agencies_name_search 
   ON agencies(name);
   ```

### Environment Issues

#### Environment Variables Not Loading
**Causes:**
- Wrong file location
- File permissions
- Next.js caching

**Solutions:**
1. Check file exists:
   ```bash
   ls -la .env.local
   ```
2. Verify contents:
   ```bash
   cat .env.local | grep SUPABASE
   ```
3. Restart dev server:
   ```bash
   # Kill all node processes
   pkill -f node
   npm run dev
   ```

#### Different Behavior Local vs Production
**Causes:**
- Different environment variables
- Database content differences
- Caching issues

**Solutions:**
1. Compare environments:
   ```javascript
   console.log({
     url: process.env.NEXT_PUBLIC_SUPABASE_URL,
     hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   });
   ```
2. Clear caches:
   ```bash
   rm -rf .next
   npm run build
   ```

### Security Test Failures

#### Anonymous Write Not Blocked
**Issue:** Security tests show write operations succeeding

**Solutions:**
1. Verify RLS is enabled:
   ```sql
   ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
   ```
2. Check no permissive policies exist:
   ```sql
   DROP POLICY IF EXISTS "Allow all" ON agencies;
   ```

#### SQL Injection Test Failures
**Issue:** Malicious queries not properly sanitized

**Solutions:**
1. Always use parameterized queries
2. Never concatenate user input
3. Update Supabase client:
   ```bash
   npm update @supabase/supabase-js
   ```

## Debug Scripts

### Connection Debug Script
Create `scripts/debug-connection.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');

console.log('Environment Check:');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  supabase.from('agencies').select('count').single()
    .then(({ data, error }) => {
      if (error) {
        console.error('Query failed:', error);
      } else {
        console.log('Connection successful!');
      }
    });
}
```

### Table Structure Debug
Create `scripts/debug-schema.js`:
```javascript
async function debugSchema() {
  const { data, error } = await supabase.rpc('get_schema_info');
  
  if (error) {
    // Fallback query
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    console.log('Tables:', tables);
  }
}
```

## Platform-Specific Issues

### Windows (WSL)
- Use forward slashes in paths
- Check line endings (LF vs CRLF)
- Ensure .env.local has Unix line endings

### macOS
- Check file permissions
- Verify homebrew installations
- Clear DNS cache if needed

### Linux
- Check firewall rules
- Verify PostgreSQL client installed
- Check SELinux permissions

## Getting Help

### Before Asking for Help
1. Run all diagnostic scripts
2. Check error messages carefully
3. Review recent changes
4. Search existing issues

### Information to Provide
- Full error message
- Environment (OS, Node version)
- Steps to reproduce
- What you've already tried

### Support Channels
1. GitHub Issues: Project repository
2. Supabase Discord: https://discord.supabase.com
3. Team Slack: #backend channel

## Emergency Procedures

### Database Corruption
1. Stop all write operations
2. Contact Supabase support
3. Restore from backup

### Security Breach
1. Rotate all API keys immediately
2. Review access logs
3. Enable additional RLS policies
4. Audit recent changes

### Performance Crisis
1. Check current connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```
2. Kill long-running queries:
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE query_time > interval '5 minutes';
   ```
3. Temporarily disable complex queries

---

**Last Updated**: 2025-06-25
**Version**: 1.0.0