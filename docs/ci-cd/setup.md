# CI/CD Environment Variables Setup Guide

This guide explains how to properly configure environment variables for the CI/CD pipeline to fix database connection errors.

## Required Environment Variables

The following environment variables must be set as GitHub Secrets for the CI/CD pipeline to work correctly:

### 1. Supabase Configuration (Required)

| Variable                        | Description                    | Example                          |
| ------------------------------- | ------------------------------ | -------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL      | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key    | `eyJhbGciOi...` (JWT token)      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Your Supabase service role key | `eyJhbGciOi...` (JWT token)      |

### 2. Optional Variables

| Variable       | Description                         | Default                          |
| -------------- | ----------------------------------- | -------------------------------- |
| `SUPABASE_URL` | Same as NEXT_PUBLIC_SUPABASE_URL    | Uses NEXT_PUBLIC_SUPABASE_URL    |
| `DATABASE_URL` | Direct PostgreSQL connection string | Auto-generated from Supabase URL |

## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the required variables:

### NEXT_PUBLIC_SUPABASE_URL

- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Your Supabase project URL (e.g., `https://xyzcompany.supabase.co`)

### NEXT_PUBLIC_SUPABASE_ANON_KEY

- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon key (found in Supabase Dashboard → Settings → API)

### SUPABASE_SERVICE_ROLE_KEY

- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Your Supabase service_role key (found in Supabase Dashboard → Settings → API)
- **⚠️ Warning**: This key has full admin access. Keep it secure!

## Validation Requirements

The CI/CD pipeline validates these environment variables:

1. **URL Format**: Must start with `https://` and end with `.supabase.co`
2. **JWT Format**: Keys must be valid JWT tokens (three segments separated by dots)

## Test Environment

For test environments, the pipeline uses mock values when secrets are not available:

- URL: `https://test.supabase.co`
- Keys: `test-anon-key`, `test-service-role-key`

However, for integration tests that require actual database connections, real values must be provided.

## Troubleshooting

### Error: "Database configuration error"

- **Cause**: Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
- **Fix**: Add the required secrets to GitHub Actions

### Error: "Connection failed"

- **Cause**: Invalid Supabase URL or network issues
- **Fix**: Verify the URL is correct and accessible

### Error: "Process.exit called with code 1"

- **Cause**: Seed script validation failed
- **Fix**: Ensure SUPABASE_SERVICE_ROLE_KEY is a valid JWT token

## Local Development

For local development, create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Security Best Practices

1. **Never commit** `.env.local` or any file containing real keys
2. **Use different keys** for development, staging, and production
3. **Rotate keys regularly** through Supabase Dashboard
4. **Limit access** to service role keys to only necessary operations

## Verifying Configuration

After setting up the secrets, you can verify they're working by:

1. Re-running the failed CI/CD workflow
2. Checking the logs for successful database connections
3. Confirming tests pass without "Connection failed" errors

## Getting Your Supabase Keys

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Find:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: This is your `SUPABASE_SERVICE_ROLE_KEY`

Remember to keep these keys secure and never expose them in public repositories!
