# CI/CD Performance Monitoring Guide

This guide explains how performance monitoring works in our CI/CD pipeline.

## Overview

Our CI/CD pipeline includes comprehensive performance monitoring to ensure we meet our <5 minute execution target.

## Performance Targets

- **Pipeline Duration**: < 5 minutes
- **Success Rate**: > 95%
- **Cache Hit Rate**: > 80%

## Monitoring Components

### 1. Real-time Performance Tracking

Every CI/CD run includes:
- Start timer job to record beginning timestamp
- Performance summary job that calculates total duration
- Job-level timing visible in GitHub Actions UI
- Performance metrics in job summaries

### 2. PR Comments

Pull requests receive automatic performance comments showing:
- Total pipeline duration
- Pass/fail status for 5-minute target
- Individual job statuses
- Performance comparison to target

### 3. Weekly Performance Reports

Automated weekly reports include:
- Average pipeline duration
- Success rate percentage
- Performance trends
- Recommendations for improvement
- Automatic issue creation if targets are missed

### 4. Performance Dashboard

Daily updated dashboard (docs/CI_CD_DASHBOARD.md) shows:
- 30-day performance trends
- Daily success rates
- Average durations over time
- Visual charts and graphs

## Accessing Performance Data

### GitHub Actions UI
1. Go to Actions tab
2. Click on any workflow run
3. View "Performance Summary" job
4. Check job summary for detailed metrics

### Performance Reports
- Weekly: Check issues labeled `ci/cd` and `performance`
- Daily: View docs/CI_CD_DASHBOARD.md
- Artifacts: Download performance-report-*.md from workflow runs

### Metrics API
Use GitHub Actions API to query performance data:
```bash
gh api repos/:owner/:repo/actions/runs \
  --jq '.workflow_runs[] | {created_at, updated_at, conclusion}'
```

## Performance Optimization Tips

### If Pipeline Exceeds 5 Minutes

1. **Check Cache Hit Rates**
   - View cache restoration steps in logs
   - Ensure cache keys are properly configured
   - Monitor cache size limits

2. **Review Parallel Execution**
   - Ensure jobs run concurrently where possible
   - Check for unnecessary dependencies between jobs

3. **Optimize Test Suite**
   - Run only affected tests on PRs
   - Use test sharding for large suites
   - Ensure Jest cache is working

4. **Monitor Individual Jobs**
   - Identify slowest job in the pipeline
   - Focus optimization efforts there

## Alerts and Notifications

### Automatic Alerts
- GitHub issue created when average duration > 5 minutes
- GitHub issue created when success rate < 95%
- PR comments on every run showing performance

### Manual Monitoring
- Check weekly performance reports
- Review dashboard trends
- Monitor cache effectiveness

## Troubleshooting Slow Pipelines

### 1. Dependency Installation
- Check npm cache hit rate
- Verify package-lock.json is committed
- Consider using npm ci instead of npm install

### 2. Test Execution
- Verify Jest cache is working
- Check for tests that don't use cache
- Look for slow individual tests

### 3. Build Process
- Check Next.js cache effectiveness
- Monitor build artifact sizes
- Review webpack bundle analysis

### 4. Network Issues
- Check for slow artifact uploads
- Monitor GitHub Actions status page
- Review regional performance differences

## Metrics Storage

Performance metrics are stored in:
1. GitHub Actions run metadata
2. Workflow artifacts (performance reports)
3. Git repository (dashboard updates)
4. GitHub issues (performance alerts)

## Continuous Improvement

1. **Weekly Review**: Check performance reports every Monday
2. **Trend Analysis**: Monitor dashboard for degradation
3. **Optimization Sprints**: Address performance issues promptly
4. **Team Training**: Share performance best practices

## Related Documentation

- [CI/CD Troubleshooting Guide](./CI_CD_TROUBLESHOOTING.md)
- [Development Workflow](./development-workflow.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)