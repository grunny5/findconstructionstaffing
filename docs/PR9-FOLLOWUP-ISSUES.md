# PR #9 Follow-up Issues

This document tracks the remaining CodeRabbit review comments from PR #9 that should be addressed in future work.

**PR**: #9 - feat: implement CI/CD pipeline with GitHub Actions
**Status**: Merged
**Created**: 2025-12-11

## Priority: Medium

### 1. Improve CI Workflow Performance with node_modules Caching

**File**: `.github/workflows/ci.yml`
**Type**: Refactor Suggestion
**Impact**: Performance - Could reduce install time by ~70%

**Issue**:
The current setup uses `setup-node` cache which only caches npm registry tarballs, but doesn't cache `node_modules`. Every job still runs `npm ci` from scratch.

**Recommendation**:
Add `actions/cache` keyed on `package-lock.json` to restore `node_modules`:

```yaml
- name: Restore node_modules cache
  uses: actions/cache@v4
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Install dependencies
  run: npm ci
```

**Reference**: CodeRabbit comment on `.github/workflows/ci.yml`

---

### 2. Fix Brittle Vercel CLI Parsing in Rollback Workflow

**File**: `.github/workflows/production-rollback.yml`
**Type**: Refactor Suggestion
**Impact**: Reliability - Rollback may fail if Vercel CLI output format changes

**Issue**:
Parsing CLI output with `grep`, `sed`, and `awk` is error-prone:

```bash
vercel list | grep "Production" | sed -n '2p' | awk '{print $1}'
```

**Recommendation**:
Use `vercel deploy list --json` to get structured output and select the second-newest production deployment programmatically:

```bash
vercel deploy list --json | jq -r '
  [.[] | select(.state == "READY" and .target == "production")]
  | sort_by(.created)
  | reverse
  | .[1].url
'
```

**Reference**: CodeRabbit comment on `.github/workflows/production-rollback.yml` lines 41-45

---

## Priority: Low

### 3. Fix TypeScript Strict Mode Check in Test Workflow

**File**: `.github/workflows/__tests__/typescript-check.test.yml`
**Type**: Potential Issue
**Impact**: Test reliability

**Issue**:
Using `grep '\"strict\": true'` is fragile and breaks if:

- The flag is inherited via `extends`
- The key is on a different line or contains spaces
- The string appears in a comment

**Recommendation**:
Use `jq` for deterministic JSON parsing:

```yaml
- name: Verify TypeScript strict mode
  run: |
    echo "Checking tsconfig.json for strict mode..."
    jq -e '.compilerOptions.strict == true' tsconfig.json \
      && echo "✓ Strict mode enabled"
```

**Reference**: CodeRabbit comment on `.github/workflows/__tests__/typescript-check.test.yml` lines 31-34

---

### 4. Fix Always-Passing TypeScript Test

**File**: `.github/workflows/__tests__/typescript-check.test.yml`
**Type**: Potential Issue
**Impact**: Test effectiveness

**Issue**:
The test command always exits with code 0, making it useless:

```bash
npm run type-check || echo "TypeScript errors detected (expected for test)"
```

**Recommendation**:
Remove the `|| echo` so the workflow fails on actual errors:

```yaml
- name: Test TypeScript compilation (expect success)
  run: |
    echo "Running strict TypeScript check…"
    npm run type-check
```

**Reference**: CodeRabbit comment on `.github/workflows/__tests__/typescript-check.test.yml` lines 26-30

---

### 5. Fix Incomplete Cold Cache Simulation

**File**: `.github/workflows/__tests__/cache-performance.test.yml`
**Type**: Refactor Suggestion
**Impact**: Test accuracy

**Issue**:
The "Clear caches" step only echoes a message but doesn't actually clear caches. GitHub Actions cache persists across workflow runs with the same key.

**Recommendation**:
Actually clear the caches:

```yaml
- name: Clear caches
  run: |
    # Clear npm cache
    npm cache clean --force
    # Remove any existing cache directories
    rm -rf ~/.npm
    rm -rf node_modules
    rm -rf .jest-cache*
    echo "Caches cleared for cold run"
```

**Reference**: CodeRabbit comment on `.github/workflows/__tests__/cache-performance.test.yml` lines 24-27

---

### 6. Fix Incomplete Performance Dashboard Generation

**File**: `.github/workflows/performance-dashboard.yml`
**Type**: Potential Issue
**Impact**: Dashboard functionality

**Issue**:
The workflow generates the markdown template but doesn't populate it with collected metrics data. The metrics are collected but not used.

**Recommendation**:
Process metrics data and populate the table:

```yaml
- name: Generate dashboard
  env:
    METRICS_DATA: ${{ steps.collect.outputs.result }}
  run: |
    # Process the metrics data and populate the table
    node -e "
      const metrics = JSON.parse(process.env.METRICS_DATA || '{}');
      const dates = Object.keys(metrics).sort().reverse();

      let tableRows = '';
      dates.forEach(date => {
        const data = metrics[date];
        const successRate = data.runs > 0 ? ((data.successful / data.runs) * 100).toFixed(1) + '%' : 'N/A';
        const avgDuration = data.successful > 0 ? (data.totalDuration / data.successful).toFixed(1) + 'min' : 'N/A';
        tableRows += \`| \${date} | \${data.runs} | \${successRate} | \${avgDuration} |\n\`;
      });

      console.log(tableRows);
    " >> table_data.txt

    # Generate template...
    cat table_data.txt >> docs/CI_CD_DASHBOARD.md
```

**Reference**: CodeRabbit comment on `.github/workflows/performance-dashboard.yml` lines 66-84

---

## Documentation Issues

### 7. Create Missing CI_CD_DASHBOARD.md File

**File**: `docs/CI_CD_PERFORMANCE.md`
**Type**: Documentation
**Impact**: Broken link

**Issue**:
The file `docs/CI_CD_DASHBOARD.md` is referenced but doesn't exist, causing a 404.

**Recommendation**:
Either:

1. Create the `docs/CI_CD_DASHBOARD.md` file with initial content
2. Update the reference to point to an existing file
3. Add a note that the file is auto-generated by the workflow

**Reference**: CodeRabbit comment on `docs/CI_CD_PERFORMANCE.md` lines 44-48

---

### 8. Remove or Implement Quick-Mode Environment Variables

**File**: `docs/development-workflow.md`
**Type**: Documentation
**Impact**: User confusion

**Issue**:
The documentation advertises `SEED_QUICK_MODE`, `SEED_AGENCY_COUNT`, and `SEED_SKIP_RELATIONSHIPS`, but a note says these are "planned features" - not implemented.

**Recommendation**:
Either:

1. Implement the flags in `scripts/seed-database.ts`
2. Move this section to a roadmap/TODO list
3. Remove from main documentation

**Reference**: CodeRabbit comment on `docs/development-workflow.md` lines 21-33

---

## Security & Best Practices (Optional)

### 9. Pin GitHub Actions to Commit SHAs

**Files**: Various workflow files
**Type**: Security Best Practice
**Impact**: Supply chain security

**Issue**:
Using floating tags like `@v7` for actions could pull compromised versions.

**Recommendation**:
Pin actions to specific commit SHAs:

```yaml
# Instead of:
- uses: actions/github-script@v7

# Use:
- uses: actions/github-script@9c9f4b97b1b4b0e16f657279d4fb4b30c4e7230d # v7
```

**Note**: This is a best practice but may make maintenance harder. Consider using Dependabot to keep pinned versions updated.

**Reference**: Multiple CodeRabbit comments

---

## Notes

- **Total Issues**: 9 tracked
- **Priority Breakdown**:
  - Medium: 2 issues (performance and reliability improvements)
  - Low: 5 issues (test fixes and refinements)
  - Documentation: 2 issues
  - Optional: 1 issue (security best practice)

- **Recommendation**: Address medium-priority issues first as they improve CI performance and production rollback reliability.

- **Original PR**: All critical functionality works correctly. These are improvements and polish items.

---

## Issue Tracking

To create GitHub issues for these, use:

```bash
gh issue create --title "Improve CI workflow performance with node_modules caching" \
  --body "See docs/PR9-FOLLOWUP-ISSUES.md #1" \
  --label "enhancement,ci-cd"
```

Repeat for each issue with appropriate labels:

- `enhancement` - for refactor suggestions
- `bug` - for potential issues
- `documentation` - for doc fixes
- `ci-cd` - for workflow-related items
- `security` - for security improvements
