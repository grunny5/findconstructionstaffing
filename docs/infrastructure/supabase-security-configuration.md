# Supabase Security Configuration

This document tracks security and configuration items that require action in the Supabase dashboard (cannot be fixed via migrations).

## Configuration Items Requiring Action

### 1. Auth OTP Long Expiry ⚠️

**Status**: Warning
**Category**: Security
**Issue**: OTP expiry is set to more than 1 hour

**Current State**:
- Email provider is enabled with OTP expiry > 1 hour

**Recommendation**:
- Set OTP expiry to less than 1 hour (recommended: 15-30 minutes)

**How to Fix**:
1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Email OTP Expiry" setting
3. Set to recommended value: `1800` seconds (30 minutes)
4. Save changes

**Rationale**:
- Shorter OTP expiry reduces the window for token interception
- 30 minutes is sufficient for legitimate users while limiting security risk
- Aligns with OWASP authentication best practices

**Reference**: https://supabase.com/docs/guides/platform/going-into-prod#security

---

### 2. Leaked Password Protection Disabled ⚠️

**Status**: Warning
**Category**: Security
**Issue**: Leaked password protection is currently disabled

**Current State**:
- Password leak checking against HaveIBeenPwned.org is disabled

**Recommendation**:
- Enable leaked password protection to prevent use of compromised passwords

**How to Fix**:
1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Password Security" section
3. Enable "Leaked Password Protection"
4. Save changes

**Impact**:
- When enabled, Supabase checks new passwords against HaveIBeenPwned.org database
- Users cannot set passwords that have appeared in known data breaches
- Existing passwords are not affected until user changes password
- Minimal performance impact (async API call during registration/password change)

**Rationale**:
- Over 11 billion compromised passwords in HaveIBeenPwned database
- Prevents credential stuffing attacks using leaked passwords
- Industry best practice for authentication security
- Free service with no licensing concerns

**Reference**: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

### 3. Vulnerable Postgres Version ⚠️

**Status**: Warning
**Category**: Security / Compliance
**Issue**: Current Postgres version has outstanding security patches

**Current State**:
- Running: `supabase-postgres-15.8.1.100`
- Latest: Security patches available in newer version

**Recommendation**:
- Upgrade Postgres database to receive latest security patches

**How to Fix**:
1. Go to Supabase Dashboard → Settings → Infrastructure
2. Review available Postgres version upgrades
3. Schedule maintenance window for upgrade
4. **IMPORTANT**: Review breaking changes and test in staging first
5. Perform upgrade during low-traffic period

**Pre-Upgrade Checklist**:
- [ ] Review release notes for breaking changes
- [ ] Test application against new Postgres version in staging
- [ ] Backup database before upgrade
- [ ] Schedule maintenance window (recommend off-peak hours)
- [ ] Notify team/users of planned maintenance
- [ ] Have rollback plan ready

**Testing After Upgrade**:
- [ ] Verify all API endpoints return expected data
- [ ] Run automated test suite
- [ ] Check RLS policies still function correctly
- [ ] Verify database functions/triggers still work
- [ ] Monitor error rates and performance metrics

**Reference**: https://supabase.com/docs/guides/platform/upgrading

---

## Intentionally Permissive RLS Policies

The following RLS policies are flagged by linters but are **intentionally permissive** for business reasons:

### 1. "Anyone can submit labor requests" (labor_requests table)

**Policy**:
```sql
CREATE POLICY "Anyone can submit labor requests"
ON labor_requests FOR INSERT
TO anon
WITH CHECK (true);
```

**Why This Is Intentional**:
- Public-facing labor request form at `/request-labor`
- Anonymous users (anon role) must be able to submit requests
- Backend validation enforced by:
  - Table CHECK constraints (email format, name lengths)
  - API route validation using Zod schemas
  - Rate limiting to prevent abuse
  - Token-based confirmation system

**Security Measures**:
- Email validation: `CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')`
- Length constraints on all text fields
- Worker count: `CHECK (worker_count BETWEEN 1 AND 500)`
- Rate limiting in API middleware
- Confirmation token expires after 2 hours

**No Changes Needed**: This policy is working as intended.

---

### 2. "Anyone can add crafts to requests" (labor_request_crafts table)

**Policy**:
```sql
CREATE POLICY "Anyone can add crafts to requests"
ON labor_request_crafts FOR INSERT
TO anon
WITH CHECK (true);
```

**Why This Is Intentional**:
- Crafts are added as part of labor request submission
- Same anonymous user who creates labor_request needs to add crafts
- Transaction-based submission in API route ensures data consistency

**Security Measures**:
- Foreign key: `REFERENCES labor_requests(id) ON DELETE CASCADE`
- Foreign key: `REFERENCES trades(id) ON DELETE RESTRICT`
- Foreign key: `REFERENCES regions(id) ON DELETE RESTRICT`
- Start date validation: `CHECK (start_date >= CURRENT_DATE)`
- Duration validation: `CHECK (duration_days BETWEEN 1 AND 365)`
- Hours validation: `CHECK (hours_per_week BETWEEN 1 AND 168)`

**No Changes Needed**: This policy is working as intended.

---

## Multiple Permissive Policies (Performance Consideration)

Several tables have multiple permissive RLS policies for the same role/action combination. While this is flagged as a performance warning, these are necessary for proper authorization logic:

### agencies table - Multiple SELECT policies
- "Admins can view all agencies"
- "Public can view active agencies"

**Rationale**: Admins need full access, while public needs filtered access. These use OR logic (permissive policies), which is the correct approach.

### agency_compliance table - Multiple policies per action
Multiple policies for INSERT, SELECT, UPDATE, DELETE to differentiate between:
- Admin access (all records)
- Owner access (own agency only)
- Public access (active compliance only for SELECT)

**Performance Impact**: Minimal for current scale. PostgreSQL query planner optimizes these well. If performance becomes an issue at scale, consider:
1. Combining policies with OR conditions
2. Using RESTRICTIVE policies where appropriate
3. Adding indexes on commonly filtered columns

**No Changes Needed**: Current approach prioritizes clarity and maintainability over marginal performance gains.

---

## Migration Status

✅ **Completed**:
- Fixed function search_path for `update_labor_request_updated_at`
- Fixed function search_path for `match_agencies_to_craft`
- Optimized all RLS policies (wrapped auth functions in SELECT)

⚠️ **Requires Dashboard Action**:
- Auth OTP expiry configuration
- Leaked password protection enablement
- Postgres version upgrade

📝 **Documented as Intentional**:
- Permissive INSERT policies for public labor request form
- Multiple permissive policies for authorization logic

---

## Security Review Schedule

**Frequency**: Quarterly

**Next Review**: 2026-04-16

**Review Checklist**:
- [ ] Run Supabase Database Linter
- [ ] Review RLS policy effectiveness
- [ ] Check for new security patches
- [ ] Audit auth configuration settings
- [ ] Review API rate limits
- [ ] Check for deprecated features
- [ ] Update documentation with findings

---

## References

- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Row Level Security Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Function Search Path Security](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Auth RLS Performance](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
- [Going Into Production](https://supabase.com/docs/guides/platform/going-into-prod)

---

**Last Updated**: 2026-01-16
**Document Owner**: Engineering Team
**Status**: Active
