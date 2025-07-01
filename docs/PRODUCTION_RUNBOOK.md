# Production Deployment Runbook

This runbook covers production deployment procedures, monitoring, and incident response for FindConstructionStaffing.

## Table of Contents
1. [Normal Deployment Process](#normal-deployment-process)
2. [Deployment Monitoring](#deployment-monitoring)
3. [Health Checks](#health-checks)
4. [Rollback Procedures](#rollback-procedures)
5. [Incident Response](#incident-response)
6. [Post-Deployment Verification](#post-deployment-verification)

## Normal Deployment Process

### Automatic Deployment Flow

1. **PR Merged to Main**
   - Developer merges approved PR to main branch
   - CI/CD pipeline triggers automatically

2. **CI Checks Run**
   - TypeScript compilation
   - ESLint and Prettier checks
   - Jest tests with coverage
   - Security scanning
   - Build verification

3. **Production Deployment**
   - Only runs if all CI checks pass
   - Vercel CLI builds production artifacts
   - Deploys to production environment
   - Creates deployment record in GitHub

4. **Post-Deployment**
   - Health checks run automatically
   - Deployment notification posted to PR
   - Summary generated in workflow

### Manual Deployment Trigger

If needed, trigger deployment manually:
```bash
gh workflow run deploy.yml --ref main
```

## Deployment Monitoring

### Real-time Monitoring

1. **GitHub Actions**
   - Watch deployment progress: [Actions Tab](https://github.com/findconstructionstaffing/findconstructionstaffing/actions)
   - Check deployment logs in real-time
   - Monitor for any errors or warnings

2. **Vercel Dashboard**
   - View deployment status
   - Check build logs
   - Monitor function logs
   - Review analytics

3. **Application Logs**
   - Check browser console for client-side errors
   - Monitor API response times
   - Review error tracking service

### Automated Monitoring

- **Health Checks**: Run 30 seconds after deployment
- **Status Updates**: GitHub deployment API tracks status
- **Notifications**: PR comments and issue creation on failure

## Health Checks

### Automated Health Checks

The system automatically checks:
1. **Main Page** - HTTP 200 response
2. **API Endpoint** - `/api/agencies` availability
3. **Critical Pages** - `/recruiters` accessibility

### Manual Health Verification

```bash
# Check main page
curl -I https://findconstructionstaffing.com

# Check API
curl https://findconstructionstaffing.com/api/agencies

# Check specific page
curl -I https://findconstructionstaffing.com/recruiters
```

### Health Check Failures

If health checks fail:
1. GitHub issue created automatically
2. Deployment marked as failed
3. Team notified via issue mention
4. Consider immediate rollback

## Rollback Procedures

### Automatic Rollback Trigger

Use the GitHub Actions UI:
1. Go to [Actions → Production Rollback](../../actions/workflows/production-rollback.yml)
2. Click "Run workflow"
3. Enter rollback reason
4. Optionally specify deployment ID

### Manual Rollback via CLI

```bash
# List recent deployments
vercel list --prod

# Rollback to specific deployment
vercel promote [deployment-id] --yes

# Or rollback to previous
vercel rollback
```

### Rollback via Vercel Dashboard

1. Navigate to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select FindConstructionStaffing project
3. Go to Deployments tab
4. Find previous stable deployment
5. Click "..." → "Promote to Production"

## Incident Response

### Severity Levels

**P0 - Critical**
- Site completely down
- Data loss occurring
- Security breach
- Immediate rollback required

**P1 - High**
- Major functionality broken
- Performance severely degraded
- Affecting majority of users
- Rollback within 1 hour

**P2 - Medium**
- Some features not working
- Performance degraded
- Affecting subset of users
- Fix forward or rollback

**P3 - Low**
- Minor issues
- Cosmetic problems
- Not affecting core functionality
- Fix in next deployment

### Response Procedures

#### 1. Assess the Situation
```bash
# Check deployment status
gh run view

# Check application health
curl -I https://findconstructionstaffing.com

# Review recent changes
git log --oneline -10
```

#### 2. Communicate
- Create incident issue in GitHub
- Notify team via Slack/Discord
- Update status page if available

#### 3. Take Action
- **P0/P1**: Immediate rollback
- **P2**: Assess rollback vs hotfix
- **P3**: Plan fix for next release

#### 4. Document
- Record timeline of events
- Document root cause
- Create post-mortem for P0/P1

## Post-Deployment Verification

### Immediate Checks (0-5 minutes)

1. **Automated Health Checks**
   - Wait for health check workflow
   - Verify all endpoints return 200

2. **Visual Inspection**
   - Load main page
   - Check critical user flows
   - Verify styling is correct

3. **API Verification**
   ```bash
   # Test API endpoints
   curl https://findconstructionstaffing.com/api/agencies
   curl https://findconstructionstaffing.com/api/agencies?trade=Electrician
   ```

### Extended Monitoring (5-30 minutes)

1. **Performance Metrics**
   - Page load times
   - API response times
   - Error rates

2. **User Flows**
   - Search functionality
   - Filter operations
   - Form submissions

3. **Cross-browser Testing**
   - Chrome, Firefox, Safari
   - Mobile responsiveness
   - Different screen sizes

### Success Criteria

Deployment is considered successful when:
- ✅ All health checks pass
- ✅ No increase in error rates
- ✅ Performance metrics stable
- ✅ Core functionality verified
- ✅ No user complaints

## Common Issues and Solutions

### Build Failures
```bash
# Check build logs
vercel logs [deployment-url]

# Common fixes:
npm install
npm run build
```

### Environment Variable Issues
- Verify in Vercel dashboard
- Check for typos in variable names
- Ensure secrets are set in GitHub

### Cache Issues
```bash
# Clear build cache
vercel --force

# Clear CDN cache
# (Done automatically on new deployment)
```

### Performance Degradation
1. Check bundle size
2. Review recent code changes
3. Check database queries
4. Monitor API response times

## Emergency Contacts

- **On-call Engineer**: Check rotation schedule
- **Vercel Support**: support@vercel.com
- **GitHub Status**: https://www.githubstatus.com/

## Useful Commands

```bash
# Deployment Management
vercel list --prod          # List production deployments
vercel inspect [id]         # Inspect deployment details
vercel logs [url]          # View deployment logs
vercel rollback            # Rollback to previous

# Monitoring
gh run list --workflow=deploy.yml        # Recent deployments
gh run view                              # View specific run
curl -I https://findconstructionstaffing.com  # Quick health check

# Debugging
vercel env pull            # Pull environment variables
vercel dev                 # Run locally with Vercel env
npm run build             # Test build locally
```

## Related Documentation

- [CI/CD Troubleshooting](./CI_CD_TROUBLESHOOTING.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Development Workflow](./development-workflow.md)
- [Deployment Checklist](./deployment/deployment-checklist.md)