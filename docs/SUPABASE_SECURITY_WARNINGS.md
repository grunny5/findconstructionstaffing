# Supabase Security Warnings Remediation Guide

This document tracks the security warnings from Supabase Database Linter and provides remediation steps.

**Last Updated:** January 7, 2026

---

## ✅ Resolved Issues

### 1. Function Search Path Mutable

**Status:** ✅ **FIXED** via migration `20260121_001_fix_function_search_path.sql`

**Issue:**
- Function `public.get_admin_integrations_summary` had `SECURITY DEFINER` without explicit `search_path`
- This makes it vulnerable to search path manipulation attacks
- **Severity:** WARNING (SECURITY)

**Resolution:**
- Added `SET search_path = public` to function definition
- Explicitly qualified table reference as `public.agencies`
- Function now protected against search path attacks

**Verification:**
After applying the migration, run Supabase Database Linter again. The warning should be resolved.

---

## ⚠️ Manual Configuration Required

The following warnings require changes in the Supabase Dashboard and cannot be fixed via SQL migrations.

### 2. Auth OTP Long Expiry

**Status:** ⚠️ **REQUIRES DASHBOARD CONFIGURATION**

**Issue:**
- Email OTP expiry is set to more than 1 hour
- Recommended: Less than 1 hour for security
- **Severity:** WARNING (SECURITY)

**Resolution Steps:**
1. Go to Supabase Dashboard → **Authentication** → **Email Auth**
2. Find the **OTP Expiry** setting
3. Change from current value to **3600 seconds (1 hour)** or less
4. Recommended value: **900 seconds (15 minutes)**
5. Click **Save**

**References:**
- [Supabase Going to Production - Security](https://supabase.com/docs/guides/platform/going-into-prod#security)

**Impact:**
- Reduces the window for OTP code reuse/interception
- Improves security for password reset and email verification flows

---

### 3. Leaked Password Protection Disabled

**Status:** ⚠️ **REQUIRES DASHBOARD CONFIGURATION**

**Issue:**
- Password breach detection is currently disabled
- Supabase Auth can check passwords against HaveIBeenPwned.org database
- **Severity:** WARNING (SECURITY)

**Resolution Steps:**
1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Find **Password Strength** settings
3. Enable **"Check for leaked passwords"** toggle
4. This integrates with HaveIBeenPwned API to reject compromised passwords
5. Click **Save**

**References:**
- [Password Strength and Leaked Password Protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

**Impact:**
- Prevents users from using passwords that have been leaked in data breaches
- Improves account security
- No performance impact (checked during signup/password reset only)

---

### 4. Vulnerable Postgres Version

**Status:** ⚠️ **REQUIRES PLATFORM UPGRADE**

**Issue:**
- Current version: `supabase-postgres-15.8.1.100`
- Security patches available in newer version
- **Severity:** WARNING (SECURITY)

**Resolution Steps:**
1. Go to Supabase Dashboard → **Settings** → **Infrastructure**
2. Check for available database upgrades
3. Schedule maintenance window for upgrade
4. Click **Upgrade database**
5. Verify application after upgrade

**References:**
- [Upgrading your Postgres database](https://supabase.com/docs/guides/platform/upgrading)

**Impact:**
- Applies critical security patches
- May include performance improvements
- Requires brief downtime during upgrade

**Recommended Timing:**
- Schedule during low-traffic period
- Announce maintenance window to users if applicable
- Have rollback plan ready

---

## Summary

| Issue | Status | Action Required | Priority |
|-------|--------|-----------------|----------|
| Function Search Path Mutable | ✅ Fixed | None - Migration applied | - |
| Auth OTP Long Expiry | ⚠️ Manual | Dashboard config change | Medium |
| Leaked Password Protection | ⚠️ Manual | Dashboard config change | High |
| Vulnerable Postgres Version | ⚠️ Manual | Database upgrade | High |

---

## Verification

After applying all fixes:

1. **Run Database Linter:**
   ```bash
   # Via Supabase CLI (if available)
   supabase db lint
   ```

2. **Or check in Dashboard:**
   - Go to **Database** → **Reports** → **Database Health**
   - Review security warnings

3. **Expected Result:**
   - ✅ Function search path warning: **RESOLVED**
   - ⚠️ Auth warnings: Will remain until dashboard changes applied
   - ⚠️ Postgres version: Will remain until upgrade completed

---

## Notes

- The function search path fix is idempotent and safe to re-run
- Auth configuration changes take effect immediately
- Database upgrade requires maintenance window
- All changes are reversible if needed

For questions or issues, refer to [Supabase Documentation](https://supabase.com/docs).
