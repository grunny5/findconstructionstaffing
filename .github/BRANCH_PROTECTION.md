# Branch Protection Rules Configuration

This document provides instructions for setting up branch protection rules on GitHub to enforce CI/CD checks.

## Required Configuration for `main` Branch

### Access Settings
1. Go to Settings → Branches in your GitHub repository
2. Click "Add rule" or edit existing rule for `main` branch

### Protection Rules

#### 1. Require Pull Request Reviews
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: 1
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require review from CODEOWNERS** (if applicable)

#### 2. Require Status Checks
- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  
Required status checks (add these):
- `Code Quality Checks`
- `Run Tests`
- `Security Scanning`
- `Build Application`

#### 3. Additional Settings
- ✅ **Include administrators** (recommended for consistency)
- ✅ **Restrict who can dismiss pull request reviews** (optional)
- ❌ **Allow force pushes** (should be disabled)
- ❌ **Allow deletions** (should be disabled)

## Automated Setup Script

You can use GitHub CLI to configure branch protection:

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Configure branch protection for main
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Code Quality Checks","Run Tests","Security Scanning","Build Application"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## Verification

After setup, verify the protection rules:

1. Create a test PR
2. Confirm all CI checks are required
3. Verify merge is blocked until:
   - All status checks pass
   - At least 1 approval is received
   - Branch is up to date with main

## Status Check Names

The status check names must match exactly with the job names in `.github/workflows/ci.yml`:
- `Code Quality Checks` (from `quality-checks` job)
- `Run Tests` (from `test` job)
- `Security Scanning` (from `security` job)
- `Build Application` (from `build` job)

## Troubleshooting

### Status checks not appearing
- Push a commit to trigger the workflow
- Wait for the workflow to complete at least once
- Refresh the branch protection settings page

### Can't find status check names
- Go to a recent PR
- Look at the "Checks" tab
- Use the exact names shown there

## For Repository Admins

Even with "Include administrators" enabled, admins can:
- Temporarily disable protection if needed
- Force merge in emergencies (not recommended)

Always follow the standard PR process unless absolutely necessary.