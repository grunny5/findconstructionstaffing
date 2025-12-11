# GitHub Actions Secrets Configuration

This repository requires the following secrets to be configured in GitHub Actions for the CI/CD pipeline to work correctly.

## Required Secrets

### 1. `NEXT_PUBLIC_SUPABASE_URL`

- **Description**: Your Supabase project URL
- **Example**: `https://xyzcompany.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Used by**: All workflows (CI, deployment, tests)

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Description**: Your Supabase anonymous key (public)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → anon public
- **Used by**: All workflows (CI, deployment, tests)

### 3. `SUPABASE_SERVICE_ROLE_KEY`

- **Description**: Your Supabase service role key (secret)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → service_role secret
- **Used by**: Database seeding, migrations
- **⚠️ Security**: This key has full admin access. Keep it secure!

## Optional Secrets

### 4. `VERCEL_TOKEN` (if using Vercel deployment)

- **Description**: Your Vercel deployment token
- **Where to find**: Vercel Dashboard → Settings → Tokens

### 5. `VERCEL_ORG_ID` (if using Vercel deployment)

- **Description**: Your Vercel organization ID
- **Where to find**: Vercel Dashboard → Settings → General

### 6. `VERCEL_PROJECT_ID` (if using Vercel deployment)

- **Description**: Your Vercel project ID
- **Where to find**: Vercel Dashboard → Project Settings → General

## Setting Up Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value

## Verifying Configuration

After adding the secrets, the CI workflow will check and report their status:

```
=== Checking CI Environment Variables ===
NEXT_PUBLIC_SUPABASE_URL is: set ✓
NEXT_PUBLIC_SUPABASE_ANON_KEY is: set ✓
SUPABASE_SERVICE_ROLE_KEY is: set ✓
```

If any are missing, you'll see:

```
⚠️  Warning: Supabase environment variables are not set!
Tests will run with mock values, but integration tests may fail.
```

## Security Notes

- Never commit these values to the repository
- Use different keys for development, staging, and production
- Rotate keys regularly through the Supabase Dashboard
- The service role key should only be used in secure server environments
