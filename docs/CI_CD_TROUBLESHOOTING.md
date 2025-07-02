# CI/CD Troubleshooting Guide

This guide helps resolve common issues with the GitHub Actions CI/CD pipeline.

## Common CI/CD Issues

### 1. TypeScript Compilation Failures

**Symptom**: `npm run type-check` fails in CI

**Common Causes & Solutions**:

#### Missing Type Definitions

```bash
# Error: Cannot find type definition file for 'jest'
npm install --save-dev @types/jest

# Error: Property 'toBeInTheDocument' does not exist
# Ensure jest.setup.js imports @testing-library/jest-dom
```

#### Strict Mode Violations

```typescript
// Error: Object is possibly 'null'
// Add null checks:
if (data) {
  // use data
}

// Or use non-null assertion (use carefully):
data!.property;
```

#### Environment Type Issues

```typescript
// Error: Cannot assign to 'NODE_ENV' because it is a read-only property
// Use type assertion in tests:
(process.env as any).NODE_ENV = 'test';
```

### 2. ESLint Failures

**Symptom**: `npm run lint` fails in CI

**Common Issues**:

#### React Unescaped Entities

```jsx
// Error: `'` can be escaped with `&apos;`
// Bad:
<p>It's working</p>

// Good:
<p>It&apos;s working</p>
// Or:
<p>{`It's working`}</p>
```

#### Missing Display Names

```jsx
// Error: Component definition is missing display name
// Add display name to anonymous components:
const MyComponent = React.forwardRef((props, ref) => {
  // ...
});
MyComponent.displayName = 'MyComponent';
```

#### Next.js Image Optimization

```jsx
// Warning: Using `<img>` could result in slower LCP
// Use Next.js Image component:
import Image from 'next/image';

<Image src="/logo.png" alt="Logo" width={100} height={100} />;
```

### 3. Prettier Formatting Failures

**Symptom**: `npm run format:check` fails in CI

**Solution**:

```bash
# Auto-fix all formatting issues locally
npm run format

# Check specific files
npx prettier --check "src/**/*.ts"

# Fix specific files
npx prettier --write "src/**/*.ts"
```

### 4. Test Failures

**Symptom**: Tests pass locally but fail in CI

**Common Causes**:

#### Environment Variables

```javascript
// Ensure test environment variables are set
// Check jest.setup.js includes:
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
```

#### Timing Issues

```javascript
// Use waitFor for async operations
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

#### Mock Inconsistencies

```javascript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 5. Security Scanning Failures

**Symptom**: `npm audit` fails in CI

**Solutions**:

#### Fix Vulnerabilities

```bash
# Try automatic fix
npm audit fix

# For breaking changes
npm audit fix --force

# Update specific package
npm update package-name
```

#### Temporary Workaround (use carefully)

```bash
# For non-critical dev dependencies
npm audit --production
```

### 6. Build Failures

**Symptom**: `npm run build` fails in CI

**Common Issues**:

#### Missing Environment Variables

```bash
# Ensure build-time env vars are in GitHub Secrets:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Import Errors

```typescript
// Ensure all imports exist
// Check case sensitivity (CI is case-sensitive)
import Component from './Component'; // not './component'
```

## CI Pipeline Debugging

### View Detailed Logs

1. Go to Actions tab in GitHub
2. Click on the failed workflow run
3. Click on the failed job
4. Expand the failed step

### Re-run Failed Jobs

1. In the failed workflow run
2. Click "Re-run failed jobs"
3. Or "Re-run all jobs" if needed

### Running CI Checks Locally

Simulate the CI environment:

```bash
# Run all checks in sequence (like CI)
npm run type-check && npm run lint && npm run format:check && npm test && npm run build
```

### Debug Specific Job

#### Quality Checks Job

```bash
npm ci                    # Clean install
npm run type-check       # TypeScript
npm run lint            # ESLint
npm run format:check    # Prettier
```

#### Test Job

```bash
npm ci                          # Clean install
npm test -- --coverage --ci    # Jest with coverage
```

#### Security Job

```bash
npm ci                    # Clean install
npm audit --audit-level=moderate
npm audit --production
```

#### Build Job

```bash
npm ci                    # Clean install
npm run build            # Next.js build
```

## Branch Protection Issues

### Can't Merge Despite Green Checks

**Possible Causes**:

1. Branch not up to date with main
   - Solution: Merge or rebase main into your branch
2. Required review not approved
   - Solution: Request review from team member
3. Status check names don't match
   - Solution: Verify job names in workflow match protection rules

### Setting Up Branch Protection

If branch protection isn't working:

```bash
# Use the provided script
./scripts/setup-branch-protection.sh

# Or PowerShell on Windows
./scripts/setup-branch-protection.ps1
```

## Performance Issues

### Slow CI Pipeline

**Optimizations**:

1. Check cache hit rates in logs
2. Ensure `cache: 'npm'` is set in actions/setup-node
3. Run jobs in parallel where possible
4. Use `npm ci` instead of `npm install`

### Timeout Issues

If jobs timeout:

1. Check for infinite loops in tests
2. Add timeout to long-running operations
3. Split large test suites

## Getting Help

1. Check workflow logs for specific error messages
2. Review this troubleshooting guide
3. Check GitHub Actions documentation
4. Ask in team chat with:
   - Link to failed workflow run
   - Error message
   - What you've tried

## Preventive Measures

1. **Always run checks locally before pushing**:

   ```bash
   npm run type-check && npm run lint && npm run format:check && npm test
   ```

2. **Keep dependencies updated**:

   ```bash
   npm outdated
   npm update
   ```

3. **Fix issues immediately**:
   - Don't ignore TypeScript errors
   - Address ESLint warnings
   - Keep code formatted

4. **Monitor CI performance**:
   - Track pipeline duration
   - Optimize slow steps
   - Maintain good cache hit rates

## Deployment Issues

### Preview Deployment Failed

**Error**: "Project not found"

```
Error: Project not found
```

**Solution**:

1. Verify VERCEL_PROJECT_ID in GitHub secrets
2. Ensure project exists in Vercel organization
3. Check organization permissions

---

**Error**: "Invalid token"

```
Error: Invalid token
```

**Solution**:

1. Regenerate token in Vercel dashboard
2. Update VERCEL_TOKEN in GitHub secrets
3. Ensure token has proper scopes

---

### Production Deployment Not Triggering

**Issue**: Merge to main doesn't deploy

**Solution**:

1. Check if CI workflow passed:
   ```bash
   gh run list --workflow=ci.yml
   ```
2. Verify deployment workflow status:
   ```bash
   gh run list --workflow=deploy.yml
   ```
3. Check check-ci-status job logs

---

### Alias Creation Failed

**Error**: "Alias already exists"

**Solution**:

1. Manually remove old alias:
   ```bash
   vercel alias rm findconstructionstaffing-pr-123
   ```
2. Check for stuck deployments in Vercel dashboard

## Related Documentation

- [Development Workflow](./development-workflow.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
