# Staging Deployment Setup

This guide walks through setting up staging deployment for the FindConstructionStaffing project.

## Prerequisites

1. Vercel account (sign up at vercel.com)
2. GitHub repository connected
3. Supabase project for staging/development

## Initial Vercel Setup

### 1. Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`

### 2. Set Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

#### For All Environments:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### For Staging/Preview Only:

```
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### 3. Configure Git Branches

In Vercel Dashboard > Settings > Git:

- **Production Branch**: `main`
- **Preview Branches**: `staging`, `develop`, and all PR branches

## GitHub Secrets Setup

For automated deployments, add these secrets to your GitHub repository:

1. Go to Settings > Secrets and variables > Actions
2. Add the following secrets:

```
VERCEL_TOKEN          # Get from: https://vercel.com/account/tokens
VERCEL_ORG_ID         # Found in: .vercel/project.json after first deploy
VERCEL_PROJECT_ID     # Found in: .vercel/project.json after first deploy
STAGING_DOMAIN        # Your staging domain (e.g., staging.findconstructionstaffing.com)
```

### ⚠️ Security Warning for VERCEL_TOKEN

**VERCEL_TOKEN is highly sensitive and must be protected:**

- **Store Securely**: Use GitHub's encrypted secrets - never store in plain text
- **Minimal Permissions**: Create tokens with only the permissions needed for deployment
- **Regular Rotation**: Rotate tokens every 90 days or immediately if compromised
- **Never Commit**: Add `.env*` to `.gitignore` and never commit tokens to version control
- **Audit Access**: Regularly review who has access to your GitHub secrets
- **Use Scoped Tokens**: If possible, create project-specific tokens rather than account-wide tokens

### Getting Vercel IDs:

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel link` in your project
3. Check `.vercel/project.json` for the IDs

### Configuring Staging Domain:

The `STAGING_DOMAIN` secret allows the workflow to be reusable across different projects:

1. Choose your staging subdomain (e.g., `staging.yourproject.com`)
2. Add the domain in Vercel Dashboard > Settings > Domains
3. Add `STAGING_DOMAIN` secret in GitHub with this value
4. The deployment workflow will automatically alias deployments to this domain

## Deployment Workflows

### Automatic Deployments

- **Production**: Merges to `main` branch
- **Staging**: Pushes to `staging` or `develop` branches
- **Preview**: All pull requests

### Manual Deployment

```bash
# Deploy to staging
vercel --target staging

# Deploy preview
vercel
```

## Environment-Specific Configuration

### Staging Database

Use a separate Supabase project for staging:

1. Create a new Supabase project for staging
2. Apply database schema:

   ```bash
   # Option 1: Use Supabase Dashboard
   # Go to SQL Editor and run your schema creation scripts

   # Option 2: Use Supabase CLI (if migrations are set up)
   npx supabase db push --linked

   # Option 3: Create the migrate:staging script in package.json:
   # "migrate:staging": "npx supabase db push --db-url $STAGING_DATABASE_URL"
   ```

3. Seed test data:

   ```bash
   # Ensure SUPABASE_SERVICE_ROLE_KEY is set for your staging environment
   NEXT_PUBLIC_SUPABASE_URL=your-staging-url \
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key \
   SUPABASE_SERVICE_ROLE_KEY=your-staging-service-key \
   npm run seed

   # Or if you've configured .env.staging:
   npm run seed
   ```

   Available seed commands:
   - `npm run seed` - Seed database with mock data
   - `npm run seed:reset` - Clear and re-seed (destructive)
   - `npm run seed:verify` - Verify data integrity

   **Note**: To add custom migration scripts, update `package.json`:

   ```json
   {
     "scripts": {
       "migrate:staging": "npx supabase db push --db-url $STAGING_DATABASE_URL",
       "migrate:prod": "npx supabase db push --db-url $PRODUCTION_DATABASE_URL"
     }
   }
   ```

### Feature Flags

Use environment variables to control features:

```typescript
const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';

if (isStaging) {
  // Enable debug features
  // Show test banners
  // Use mock payment processor
}
```

## Staging URL Management

### Default Vercel URLs:

- Production: `your-project.vercel.app`
- Staging: `your-project-git-staging.vercel.app`
- Preview: `your-project-pr-123.vercel.app`

### Custom Domain (Optional):

1. Add domain in Vercel Dashboard > Domains
2. Configure DNS:
   - `staging.yourdomain.com` → Staging deployment
   - `preview.yourdomain.com` → Latest preview

## Monitoring Staging

### Health Checks

Add a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
}
```

### Deployment Notifications

The GitHub Action will:

- Comment on PRs with deployment URLs
- Add deployment summaries to workflow runs
- Send notifications on failures

## Best Practices

1. **Data Isolation**: Never use production data in staging
2. **Secret Management**: Use different API keys for staging
3. **Testing**: Run E2E tests against staging before production
4. **Monitoring**: Set up alerts for staging errors
5. **Access Control**: Restrict staging access if needed

## Troubleshooting

### Build Failures

1. Check build logs in Vercel Dashboard
2. Verify environment variables are set
3. Ensure dependencies are installed

### Environment Variables Not Working

1. Rebuild deployment after adding variables
2. Check variable names match exactly
3. Verify variables are set for correct environment

### Database Connection Issues

1. Check Supabase URL is correct
2. Verify anon key has proper permissions
3. Ensure staging database is running

## Next Steps

1. Set up production deployment workflow
2. Configure custom domains
3. Add E2E tests for staging
4. Set up monitoring and alerts
