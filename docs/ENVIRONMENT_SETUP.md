# Environment Setup Guide

## Quick Environment Validation

Before running any database operations, validate your environment variables:

```bash
npm run validate:env
```

This will check that all Supabase credentials are correctly configured and match your project.

## Required Environment Variables

Your `.env.local` file must contain:

```bash
# Supabase Configuration (Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Configuration (Backend/Seeding)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Feature Flags
NEXT_PUBLIC_FEATURE_ADMIN_DASHBOARD=true

# Resend (Email notifications)
RESEND_WEBHOOK_SECRET=your-resend-secret
```

## Getting Your Supabase Keys

### 1. Find Your Project ID

Your project ID is in your Supabase URL: `https://<PROJECT_ID>.supabase.co`

### 2. Get Your Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Settings** → **API**
4. Copy the following keys:
   - **URL**: Use for both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public**: Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: Use for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### 3. Verify Configuration

```bash
npm run validate:env
```

You should see all green checkmarks (✅).

## Common Issues

### ❌ Project Mismatch Error

**Error**: `Project mismatch: Key is for 'xxx' but URL is 'yyy'`

**Cause**: Your service role key is from a different Supabase project.

**Fix**:
1. Check your `NEXT_PUBLIC_SUPABASE_URL` - note the project ID
2. Visit the correct project's API settings
3. Copy the matching `service_role` key
4. Update `.env.local`
5. Run `npm run validate:env` to confirm

### ❌ Missing Environment Variables

**Error**: `Missing from .env.local`

**Fix**: Add the missing variable to your `.env.local` file.

### ⚠️ URL Mismatch Warning

**Error**: `SUPABASE_URL !== NEXT_PUBLIC_SUPABASE_URL`

**Fix**: Both should be identical. Update `.env.local` so they match.

## Security Notes

- **NEVER** commit `.env.local` to version control
- The `service_role` key bypasses Row Level Security (RLS) and has full database access - **keep it secret**
- The `anon` key is intended for client-side use but is **NOT fully public**:
  - Only expose it when you have properly configured RLS policies on all tables
  - RLS policies enforce access control based on user authentication
  - Without RLS, the `anon` key could allow unauthorized data access
  - Never use `anon` key for operations that should require admin privileges
- In production, use environment variables (not `.env.local`)

## Database Seeding

Once your environment is validated:

```bash
# Seed with fresh data (destructive)
npm run seed:reset

# Verify seeded data
npm run seed:verify
```

## Troubleshooting Workflow

1. **Run validation first**:
   ```bash
   npm run validate:env
   ```

2. **Fix any ❌ failures** following the error messages

3. **Run validation again** to confirm fixes:
   ```bash
   npm run validate:env
   ```

4. **Proceed with database operations**:
   ```bash
   npm run seed:reset
   ```

## Need Help?

If validation passes but you still have issues:

1. Check Supabase project status (Settings → General)
2. Verify database is not paused
3. Check RLS policies are enabled
4. Review error logs in Supabase Dashboard

---

**Last Updated**: 2026-01-11
**Related Files**:
- `/scripts/validate-env.ts` - Validation script source
- `/.env.local` - Your local environment configuration (not in git)
