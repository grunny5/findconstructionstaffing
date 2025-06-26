# Deployment Checklist

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript builds without errors (`npm run build`)
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

## Staging Deployment Steps

1. **Prepare Branch**
   ```bash
   git checkout staging
   git merge feature/your-feature
   git push origin staging
   ```

2. **Verify Environment Variables**
   - Check Vercel dashboard for staging environment
   - Ensure all required variables are set
   - Verify Supabase connection

3. **Deploy to Staging**
   - Automatic: Push to staging branch triggers deployment
   - Manual: `vercel --env preview`

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

2. **Create Release**
   ```bash
   git checkout main
   git merge staging
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin main --tags
   ```

3. **Monitor Deployment**
   - Watch Vercel dashboard
   - Check build logs
   - Verify deployment status

4. **Post-Deployment**
   - [ ] Verify production site
   - [ ] Check monitoring dashboards
   - [ ] Run smoke tests
   - [ ] Update status page

## Rollback Procedure

If issues are discovered:

1. **Immediate Rollback**
   - Vercel Dashboard > Deployments > Redeploy previous version
   - Or: `vercel rollback [deployment-url]`

2. **Fix Issues**
   - Create hotfix branch
   - Fix the issue
   - Test thoroughly
   - Deploy through normal process

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