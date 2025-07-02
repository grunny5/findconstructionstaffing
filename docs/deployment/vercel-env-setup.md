# Vercel Environment Variables Setup

## Quick Fix for Build Error

Your Vercel deployment is failing because environment variables are not configured. Here's how to fix it:

### Option 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI if not already installed:

   ```bash
   npm i -g vercel
   ```

2. Link your project:

   ```bash
   vercel link
   ```

3. Run the setup script:
   ```bash
   bash scripts/setup-vercel-env.sh
   ```

### Option 2: Using Vercel Dashboard

1. Go to your Vercel project: https://vercel.com/grunny5/findconstructionstaffing
2. Click on "Settings" tab
3. Navigate to "Environment Variables"
4. Add the following variables:

#### Required for Build (All Environments):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

#### Required for API Routes (Production/Preview):

- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `DATABASE_URL` - Your Supabase database connection string

#### Optional:

- `MONITORING_API_KEY` - For /api/metrics endpoint protection (Production only)

### Option 3: Quick Command Line Setup

If you have your `.env.local` file ready, you can manually add each variable:

```bash
# Add public variables (for all environments)
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development

# Add private variables (for production/preview only)
vercel env add SUPABASE_SERVICE_ROLE_KEY production preview
vercel env add DATABASE_URL production preview

# Add monitoring key (production only)
vercel env add MONITORING_API_KEY production
```

## Verify Setup

After adding environment variables:

1. Check they're configured:

   ```bash
   vercel env ls
   ```

2. Trigger a new deployment:
   ```bash
   vercel --prod
   ```

## Troubleshooting

- **Build still failing?** Make sure you added variables to the correct environments
- **Variables not showing?** You may need to redeploy after adding them
- **Wrong project?** Run `vercel link` to ensure you're connected to the right project

## Security Notes

- Never commit `.env.local` to git
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret - it has admin access
- Rotate keys regularly for production environments
