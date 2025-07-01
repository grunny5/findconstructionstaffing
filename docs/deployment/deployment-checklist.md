# Deployment Checklist

## Pre-Deployment Checklist

### CI/CD Pipeline
- [ ] All GitHub Actions checks passing
- [ ] Branch is up to date with main
- [ ] PR has been approved by at least 1 reviewer
- [ ] No merge conflicts

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript builds without errors (`npm run type-check`)
- [ ] Code formatted with Prettier (`npm run format:check`)
- [ ] No console.log statements in production code
- [ ] No hardcoded secrets or API keys

### Performance
- [ ] Load tests pass performance targets (<100ms P95)
- [ ] Images are optimized
- [ ] Bundle size is reasonable
- [ ] No memory leaks identified

### Security
- [ ] Environment variables are properly configured
- [ ] API routes have proper authentication where needed
- [ ] Input validation is in place
- [ ] SQL injection prevention verified
- [ ] XSS protection implemented

### Database
- [ ] Migrations are up to date
- [ ] Indexes are created for performance
- [ ] Seed data is appropriate for environment
- [ ] Backup strategy is in place

### GitHub Secrets (for CI/CD)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is configured (for build step)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is configured (for build step)
- [ ] `VERCEL_TOKEN` is configured ✅
- [ ] `VERCEL_ORG_ID` is configured ✅
- [ ] `VERCEL_PROJECT_ID` is configured ✅
- [ ] Branch protection rules are active on main branch

### CI/CD Pipeline Checks
- [ ] TypeScript compilation successful
- [ ] ESLint checks pass with no errors
- [ ] Prettier formatting verified
- [ ] All tests pass with 80%+ coverage
- [ ] Security scan shows no vulnerabilities
- [ ] Build completes successfully
- [ ] Preview deployments working for PRs
- [ ] Production deployment configured

## Staging Deployment Steps

1. **Prepare Branch**
   ```bash
   git checkout staging
   git merge feature/your-feature
   git push origin staging
   ```

2. **Verify Environment Variables**
   
   **Required Variables:**
   
   - [ ] **`NEXT_PUBLIC_SUPABASE_URL`**
     - Format: `https://[project-ref].supabase.co`
     - Verify in Vercel: Settings → Environment Variables → Staging
     - Test: `curl -I [URL]/rest/v1/` should return 200 OK
   
   - [ ] **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
     - Format: JWT token (long string)
     - Verify: Should be different from production
     - Test: Use in API call to verify authentication works
   
   - [ ] **`SUPABASE_SERVICE_ROLE_KEY`** (if using server-side operations)
     - Format: JWT token (keep secret!)
     - Required for: Database seeding, admin operations
     - Verify: Never expose in client-side code
   
   - [ ] **`MONITORING_API_KEY`** (for production)
     - Format: Random secure string (min 32 chars)
     - Required for: `/api/monitoring/metrics` endpoint
     - Test: `curl -H "x-monitoring-key: [KEY]" [URL]/api/monitoring/metrics`
   
   - [ ] **`NEXT_PUBLIC_APP_URL`** (optional but recommended)
     - Format: `https://staging.findconstructionstaffing.com`
     - Used for: Absolute URLs, redirects, SEO
   
   - [ ] **`NEXT_PUBLIC_ENVIRONMENT`** (optional)
     - Value: `staging` or `production`
     - Used for: Environment-specific features/logging
   
   **Verification Steps:**
   
   1. **In Vercel Dashboard:**
      ```
      1. Go to Project Settings → Environment Variables
      2. Select "Staging" environment
      3. Verify all variables are present (not inherited from production)
      4. Check "Encrypted" toggle for sensitive values
      ```
   
   2. **Using Vercel CLI:**
      ```bash
      # List environment variables for staging
      vercel env ls staging
      ```
      
      <div style="border: 3px solid #ff0000; background-color: #ffe6e6; padding: 20px; margin: 20px 0; border-radius: 8px;">
      
      ### 🚨 **CRITICAL SECURITY WARNING** 🚨
      
      **The following command creates a file containing SENSITIVE CREDENTIALS:**
      
      ```bash
      vercel env pull .env.staging --environment=staging
      ```
      
      #### ⚠️ **IMMEDIATE ACTIONS REQUIRED:**
      
      1. **BEFORE running this command:**
         - [ ] Ensure you&apos;re in a secure, private environment
         - [ ] Verify `.env.staging` is in `.gitignore`
         - [ ] Check no screen sharing/recording is active
      
      2. **AFTER running this command:**
         - [ ] **Set restrictive file permissions immediately:**
           ```bash
           chmod 600 .env.staging  # Owner read/write only
           ```
         - [ ] **Never commit this file:**
           ```bash
           # Verify it&apos;s not staged
           git status
           # If accidentally staged, remove it
           git rm --cached .env.staging
           ```
      
      3. **SECURE HANDLING:**
         - [ ] **Delete immediately after use:**
           ```bash
           rm -f .env.staging
           # Verify deletion
           ls -la .env.staging  # Should show "No such file"
           ```
         - [ ] **If you must keep it temporarily:**
           - Store in an encrypted vault (1Password, Bitwarden, etc.)
           - Use full-disk encryption
           - Never store on shared/cloud drives
      
      4. **SAFER ALTERNATIVES:**
         - Use Vercel Dashboard (no local file created)
         - Use environment variable managers (direnv with encryption)
         - Access secrets directly from secure vaults via CLI
      
      #### 🛡️ **Security Best Practices:**
      - **Principle of Least Privilege:** Only pull secrets you absolutely need
      - **Time-Limited Access:** Delete credentials after each use
      - **Audit Trail:** Document who accessed credentials and when
      - **Regular Rotation:** Change credentials periodically
      
      #### ❌ **NEVER DO THIS:**
      - Commit `.env` files to Git (even in "private" repos)
      - Share credentials via email, Slack, or chat
      - Store credentials in plain text files long-term
      - Use production credentials in development
      
      </div>
   
   3. **Test Supabase Connection:**
      ```bash
      # Test API endpoint (should return agencies data)
      curl https://staging.your-domain.com/api/agencies
      
      # Test database URL directly
      curl -I "https://[project-ref].supabase.co/rest/v1/agencies" \
        -H "apikey: [ANON_KEY]" \
        -H "Authorization: Bearer [ANON_KEY]"
      ```
   
   4. **Verify No Production Keys in Staging:**
      - Staging should use separate Supabase project
      - API keys should be different from production
      - Service role keys must never be the same

3. **Deploy to Staging**
   - Automatic: Push to staging branch triggers deployment
   - Manual: `vercel`  # deploys a preview build

4. **Post-Deployment Verification**
   - [ ] Site loads without errors
   - [ ] API endpoints respond correctly
   - [ ] Database queries work
   - [ ] Search functionality works
   - [ ] Filters apply correctly
   - [ ] Pagination works
   - [ ] Performance monitoring active
   - [ ] Error tracking configured

5. **Run E2E Tests**
   ```bash
   STAGING_URL=https://your-staging-url.vercel.app npm run test:e2e
   ```

## Production Deployment Steps

1. **Final Checks**
   - [ ] Staging has been thoroughly tested
   - [ ] No critical bugs identified
   - [ ] Performance meets targets
   - [ ] Stakeholders have approved

2. **Merge to Main**
   ```bash
   git checkout main
   git merge staging  # or merge PR
   git push origin main
   ```

3. **Automatic Deployment**
   - CI/CD pipeline triggers automatically
   - All checks must pass before deployment
   - Monitor progress in GitHub Actions
   - Deployment to Vercel happens automatically

4. **Monitor Deployment**
   - [ ] Watch GitHub Actions progress
   - [ ] Check Vercel build logs
   - [ ] Monitor deployment status updates
   - [ ] Wait for health checks to complete

5. **Post-Deployment Verification**
   - [ ] Health checks pass (automatic)
   - [ ] Production site loads correctly
   - [ ] API endpoints responding
   - [ ] Check deployment notification in PR
   - [ ] Verify in Vercel dashboard
   - [ ] Monitor error rates

## Rollback Procedure

If issues are discovered:

1. **Automatic Rollback (Recommended)**
   ```bash
   # Use GitHub Actions workflow
   gh workflow run production-rollback.yml
   ```
   - Enter rollback reason when prompted
   - Optionally specify deployment ID

2. **Manual Rollback Options**
   
   **Via Vercel Dashboard:**
   - Go to Deployments tab
   - Find previous stable deployment
   - Click "..." → "Promote to Production"
   
   **Via CLI:**
   ```bash
   vercel rollback  # rolls back to previous
   # or
   vercel promote [deployment-id]  # specific deployment
   ```

3. **Post-Rollback Actions**
   - [ ] Verify site is stable
   - [ ] Check rollback issue created in GitHub
   - [ ] Notify team of rollback
   - [ ] Begin root cause analysis

4. **Fix and Redeploy**
   - Create hotfix branch
   - Fix the issue
   - Test thoroughly in preview
   - Deploy through normal PR process

## Environment-Specific Configurations

### Staging
- Uses staging Supabase database
- Debug logging enabled
- Test payment processor
- Relaxed rate limits

### Production
- Production Supabase database
- Error logging only
- Live payment processor
- Strict rate limits

## Monitoring Post-Deployment

### First Hour
- Monitor error rates
- Check performance metrics
- Watch for 500 errors
- Verify API response times

### First Day
- Review user feedback
- Check database performance
- Monitor resource usage
- Analyze traffic patterns

### First Week
- Review performance trends
- Check for memory leaks
- Analyze user behavior
- Plan optimizations

## Communication

### Before Deployment
- Notify team of deployment window
- Update status page if needed
- Prepare rollback plan

### After Deployment
- Announce successful deployment
- Share release notes
- Document any issues
- Update project documentation