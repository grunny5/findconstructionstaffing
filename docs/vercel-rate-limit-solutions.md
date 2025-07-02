# Vercel Rate Limit Solutions

## Problem

Vercel's free tier has a limit of 100 deployments per day. When you exceed this limit, you'll see:

```
Error: Resource is limited - try again in 3 hours (more than 100, code: "api-deployments-free-per-day").
```

## Solutions

### 1. Immediate Solutions

#### Wait for Rate Limit Reset
- The limit resets on a rolling 24-hour window
- Usually takes 3-4 hours for the oldest deployments to roll off

#### Deploy Manually
If you need to deploy urgently:

```bash
# Install Vercel CLI locally
npm i -g vercel

# Deploy manually
vercel --prod  # for production
vercel         # for preview
```

### 2. Reduce Deployment Frequency

#### Use the Optimized Workflow
Replace your current deployment workflow with the optimized version:

```yaml
# .github/workflows/deploy-vercel-optimized.yml
```

This workflow:
- Only deploys when source code changes (not docs/tests)
- Skips draft PRs
- Cancels duplicate deployments
- Implements retry logic with delays

#### Batch Your Changes
- Group related commits together
- Use draft PRs while working, convert to ready when done
- Avoid pushing every small change

### 3. Configure Deployment Triggers

#### Only Deploy Significant Changes
Add path filters to your workflow:

```yaml
on:
  push:
    paths:
      - 'app/**'
      - 'components/**'
      - 'lib/**'
      - 'package.json'
    paths-ignore:
      - '**.md'
      - 'docs/**'
      - '__tests__/**'
```

#### Use Manual Deployments for Development
```yaml
on:
  workflow_dispatch:  # Allow manual trigger
  push:
    branches: [main]  # Auto-deploy only main
```

### 4. Long-term Solutions

#### Upgrade to Vercel Pro
- Unlimited deployments
- $20/month per member
- Additional performance benefits

#### Alternative CI/CD Strategies

1. **Deploy only on merge to main**
   ```yaml
   on:
     push:
       branches: [main]
   ```

2. **Use GitHub Environments**
   - Create a "preview" environment with deployment protection rules
   - Require approval for preview deployments

3. **Self-host Preview Environments**
   - Use GitHub Actions to deploy to your own infrastructure
   - Use Docker + a VPS for preview environments

### 5. Monitoring Deployment Count

Create a GitHub Action to track deployments:

```yaml
name: Monitor Vercel Deployments

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  check-limit:
    runs-on: ubuntu-latest
    steps:
      - name: Check deployment count
        run: |
          # Use Vercel API to check deployment count
          # Alert if approaching limit
```

## Recommended Approach

For most projects:

1. **Use the optimized workflow** to reduce unnecessary deployments
2. **Enable path filtering** to skip non-code changes  
3. **Use draft PRs** during development
4. **Consider Vercel Pro** if you frequently hit limits

## Environment Variables for CI/CD

Make sure these are set in your GitHub repository secrets:

- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

## Debugging Deployment Issues

If deployments fail with rate limits:

1. Check recent deployment history:
   ```bash
   vercel ls
   ```

2. Check your current usage:
   - Visit Vercel dashboard → Settings → Usage

3. Clean up old deployments:
   ```bash
   vercel rm [deployment-url] --yes
   ```

## Alternative: Netlify

If rate limits are a persistent issue, consider Netlify:
- 300 build minutes/month on free tier
- No deployment count limit
- Similar features to Vercel

```yaml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```