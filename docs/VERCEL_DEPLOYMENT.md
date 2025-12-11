# Vercel Deployment Guide

This guide explains how automated deployments work with Vercel in our CI/CD pipeline.

## Overview

Our deployment pipeline automatically deploys to Vercel in two scenarios:

1. **Preview Deployments**: Every pull request gets a unique preview URL
2. **Production Deployments**: Merges to `main` branch deploy to production

## Architecture

```
Pull Request → GitHub Actions → Vercel CLI → Preview Deployment
                                          ↓
                                    PR-specific alias
                                (findconstructionstaffing-pr-123)

Main Branch → CI Checks Pass → GitHub Actions → Vercel CLI → Production
                                              ↓
                                        Production domain
```

## Preview Deployments

### How It Works

1. Developer creates a pull request
2. GitHub Actions workflow triggers
3. Vercel CLI builds and deploys the preview
4. Unique alias created: `findconstructionstaffing-pr-{PR_NUMBER}.vercel.app`
5. Preview URL posted as PR comment
6. Preview automatically cleaned up when PR is closed

### Features

- **Unique URLs**: Each PR gets its own subdomain
- **Automatic Updates**: New commits trigger new deployments
- **Environment Isolation**: Preview uses preview environment variables
- **Cleanup**: Aliases removed when PR closes
- **Deployment Tracking**: GitHub deployment API integration
- **Status Checks**: Preview status shown in PR checks
- **Protection Gates**: Resource management for large PRs and forks

### Example Preview URL

```
https://findconstructionstaffing-pr-123.vercel.app
```

## Production Deployments

### How It Works

1. PR merged to `main` branch
2. CI workflow must pass all checks
3. Deploy workflow triggers automatically
4. Production build created with prod environment
5. Deployment status recorded in GitHub

### Safety Features

- **CI Gate**: Deployment only runs if all CI checks pass
- **Rollback**: Vercel maintains deployment history for instant rollback
- **Status Tracking**: GitHub deployment API tracks all deployments
- **Health Checks**: Automatic verification 30 seconds post-deployment
- **Notifications**: PR comments and issue creation on failures
- **Deployment Summary**: Detailed information in workflow logs

## Configuration

### Required Secrets

Set in GitHub repository settings → Secrets and variables → Actions:

- `VERCEL_TOKEN`: Personal access token from Vercel
- `VERCEL_ORG_ID`: Organization ID from Vercel dashboard
- `VERCEL_PROJECT_ID`: Project ID from Vercel project settings

### Environment Variables

Vercel automatically provides environment variables based on deployment context:

- Preview deployments use preview environment
- Production deployments use production environment

## Workflows

### deploy.yml

Main deployment workflow handling both preview and production deployments.

### preview-alias.yml

Manages preview deployment aliases and cleanup.

### preview-protection.yml

Implements resource protection for preview deployments.

### preview-deployment-status.yml

Updates deployment status and PR checks.

### production-health-check.yml

Verifies production deployment health and creates issues on failure.

### production-rollback.yml

Manual workflow for emergency production rollbacks.

## Preview Deployment Protection

To manage resources efficiently, preview deployments have protection gates:

### Automatic Deployment

- PRs from the main repository deploy automatically
- Small to medium PRs deploy without approval

### Manual Approval Required

- **Fork PRs**: Add `deploy-preview` label
- **Large PRs**: >1000 changes need `deploy-preview` label
- **Resource Conservation**: Helps manage Vercel build minutes

### Enabling Preview Deployment

1. Add `deploy-preview` label to PR
2. Push new commit or re-run workflow
3. Check PR comments for deployment URL

## Troubleshooting

### Preview Deployment Failed

1. Check GitHub Actions logs for errors
2. Verify Vercel secrets are correctly set
3. Ensure build commands succeed locally
4. Check Vercel dashboard for deployment logs

### Production Deployment Not Triggering

1. Verify CI checks passed
2. Check if push was to `main` branch
3. Review check-ci-status job output
4. Ensure all required secrets are set

### Alias Creation Failed

1. Check if PR number is available
2. Verify Vercel token has alias permissions
3. Check for conflicting alias names

## Common Issues

### "Project not found"

- Verify `VERCEL_PROJECT_ID` matches your Vercel project
- Ensure project exists in the organization

### "Invalid token"

- Regenerate Vercel token
- Update `VERCEL_TOKEN` secret in GitHub

### Build failures

- Test build locally with `vercel build`
- Check environment variable availability
- Review build logs in GitHub Actions

## Best Practices

1. **Test Locally**: Run `vercel build` before pushing
2. **Environment Variables**: Keep sensitive data in Vercel dashboard
3. **Preview Testing**: Always test preview deployments before merging
4. **Monitor Performance**: Check build times in Vercel dashboard

## CLI Commands

### Local Testing

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Build locally
vercel build

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

### Debugging

```bash
# Check project settings
vercel project ls

# View deployment logs
vercel logs [deployment-url]

# List aliases
vercel alias ls
```

## Integration with CI/CD

The deployment workflow integrates with our CI pipeline:

1. **Quality Checks**: Must pass before production deploy
2. **Test Coverage**: Verified before deployment
3. **Security Scans**: No vulnerabilities allowed
4. **Build Success**: Next.js build must complete

## Monitoring

### Vercel Dashboard

- View all deployments
- Check build logs
- Monitor performance
- Manage domains

### GitHub Integration

- Deployment status on commits
- PR deployment comments
- Actions workflow logs
- Deployment history

## Related Documentation

- [CI/CD Pipeline](./CI_CD_TROUBLESHOOTING.md)
- [Development Workflow](./development-workflow.md)
- [Vercel Configuration](./deployment/vercel-configuration.md)
