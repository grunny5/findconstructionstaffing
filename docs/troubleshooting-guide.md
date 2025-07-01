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
```text
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
```text
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
2. Check Supabase status: <https://status.supabase.com>
3. Test with curl:
   ```bash
   curl https://your-project-id.supabase.co/rest/v1/
   ```

### Database Issues

#### Table Does Not Exist
```text
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
```text
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

## CI/CD Issues

For CI/CD pipeline and GitHub Actions issues, see:
- [CI/CD Troubleshooting Guide](./CI_CD_TROUBLESHOOTING.md)

Common CI/CD problems:
- TypeScript compilation errors
- ESLint/Prettier failures
- Test failures in CI but not locally
- Build failures
- Branch protection issues

## Getting Help

### Before Asking for Help
1. Run all diagnostic scripts
2. Check error messages carefully
3. Review recent changes
4. Search existing issues
5. Check CI/CD logs if applicable

### Information to Provide
- Full error message
- Environment (OS, Node version)
- Steps to reproduce
- What you've already tried
- Link to failed CI run (if applicable)

### Support Channels
1. GitHub Issues: Project repository
2. Supabase Discord: <https://discord.supabase.com>
3. Team Slack: #backend channel

## Emergency Procedures

### Database Corruption
1. **Stop all write operations immediately**
   ```bash
   # Set your app to maintenance mode
   npm run maintenance:enable
   
   # Or manually disable write endpoints in your API
   ```

2. **Check database status in Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_REF]/database/backups
   - Check latest backup timestamp
   - Note the backup ID for potential restore

3. **Contact Supabase support urgently**
   - **Email**: support@supabase.io
   - **Dashboard**: Click "Support" button in your project dashboard
   - **Discord**: <https://discord.supabase.com> (for immediate community help)
   - Include: Project ref, time of corruption, last known good state

4. **Restore from backup**
   ```sql
   -- Via Supabase Dashboard: Database > Backups > Restore
   -- Or contact support with backup ID for assistance
   ```

5. **Verify data integrity after restore**
   ```sql
   -- Check row counts
   SELECT 'agencies' as table_name, COUNT(*) as row_count FROM agencies
   UNION ALL
   SELECT 'trades', COUNT(*) FROM trades
   UNION ALL
   SELECT 'regions', COUNT(*) FROM regions;
   ```

### Security Breach
1. **Rotate all API keys immediately**
   ```bash
   # 1. Generate new keys in Supabase Dashboard
   # Settings > API > Regenerate anon key
   # Settings > API > Regenerate service role key
   
   # 2. Update .env.local immediately
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_new_service_key
   
   # 3. Deploy changes
   npm run build && npm run deploy
   ```

2. **Review access logs**
   ```sql
   -- Check recent authentication attempts
   SELECT 
     created_at,
     ip,
     user_agent,
     email
   FROM auth.audit_log_entries
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   
   -- Check for suspicious API usage
   SELECT 
     path,
     method,
     ip,
     created_at
   FROM storage.api_logs  -- if logging is enabled
   WHERE created_at > NOW() - INTERVAL '24 hours'
   AND status_code NOT IN (200, 201, 204);
   ```

3. **Enable emergency RLS policies**
   ```sql
   -- Temporarily block all anonymous access
   ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
   ALTER TABLE agencies FORCE ROW LEVEL SECURITY;
   
   -- Create emergency lockdown policy
   CREATE POLICY "emergency_lockdown" ON agencies
     FOR ALL
     TO authenticated
     USING (false);
   ```

4. **Audit recent changes**
   ```bash
   # Check git history for unauthorized commits
   git log --oneline -20
   
   # Check for modified files
   git status
   git diff
   ```

5. **Report the breach**
   - **Supabase Security**: security@supabase.io
   - Document: Time of discovery, affected systems, actions taken

### Performance Crisis
1. **Check current connections and active queries**
   ```sql
   -- Current connection count
   SELECT count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
   FROM pg_stat_activity;
   
   -- Long-running queries
   SELECT 
     pid,
     now() - pg_stat_activity.query_start AS duration,
     query,
     state
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '2 minutes'
   AND state = 'active'
   ORDER BY duration DESC;
   ```

2. **Kill problematic queries**
   ```sql
   -- Kill specific query by PID
   SELECT pg_terminate_backend(12345); -- replace with actual PID
   
   -- Kill all queries running longer than 5 minutes
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
   AND state = 'active'
   AND pid <> pg_backend_pid();
   
   -- Kill all connections from a specific IP
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE client_addr = '1.2.3.4'::inet;
   ```

3. **Emergency performance optimizations**
   ```sql
   -- Disable expensive views temporarily
   ALTER VIEW expensive_view RENAME TO expensive_view_disabled;
   
   -- Create emergency simplified view
   CREATE VIEW expensive_view AS
   SELECT id, name FROM agencies WHERE is_active = true;
   
   -- Analyze tables to update statistics
   ANALYZE agencies;
   ANALYZE trades;
   ANALYZE regions;
   ```

4. **Scale up resources (if needed)**
   - Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_REF]/settings/billing
   - Upgrade compute resources temporarily
   - Contact support for immediate scaling: support@supabase.io

5. **Monitor recovery**
   ```sql
   -- Monitor connection recovery
   SELECT count(*) FROM pg_stat_activity;
   
   -- Check query performance
   SELECT * FROM pg_stat_statements 
   ORDER BY total_time DESC 
   LIMIT 10;
   ```

### Emergency Contacts
- **Supabase Support Email**: support@supabase.io
- **Supabase Status Page**: https://status.supabase.com
- **Discord Community**: https://discord.supabase.com
- **Enterprise Support** (if applicable): Check your support agreement
- **Project Dashboard Support**: Click "Support" button in dashboard

---

**Last Updated**: 2025-06-25
**Version**: 1.0.0