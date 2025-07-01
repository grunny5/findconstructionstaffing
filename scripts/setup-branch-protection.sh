#!/bin/bash

# Script to configure branch protection rules using GitHub CLI
# Requires: gh CLI installed and authenticated

set -e

# Function to handle API errors
handle_api_error() {
    echo "❌ Failed to configure branch protection rules."
    echo "Common causes:"
    echo "  - Repository not found or no admin access"
    echo "  - Branch 'main' does not exist"
    echo "  - Invalid status check names"
    echo "  - GitHub CLI not authenticated"
    exit 1
}

echo "🔒 Setting up branch protection rules for main branch..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

# Get repository info
REPO_INFO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO_INFO"

# Configure branch protection for main branch
echo "⚙️  Configuring protection rules..."

gh api "repos/$REPO_INFO/branches/main/protection" \
  --method PUT \
  --field required_status_checks='{
    "strict": true,
    "contexts": [
      "Code Quality Checks",
      "Run Tests", 
      "Security Scanning",
      "Build Application"
    ]
  }' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  }' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field block_creations=false \
  --field required_conversation_resolution=false \
  --field lock_branch=false \
  --field allow_fork_syncing=false || handle_api_error

echo "✅ Branch protection rules configured successfully!"
echo ""
echo "📋 Summary of protection rules:"
echo "  - Require PR reviews: Yes (1 approval required)"
echo "  - Dismiss stale reviews: Yes"
echo "  - Require status checks: Yes (strict mode)"
echo "  - Require up-to-date branch: Yes"
echo "  - Include administrators: Yes"
echo "  - Allow force pushes: No"
echo "  - Allow deletions: No"
echo ""
echo "🔍 Required status checks:"
echo "  - Code Quality Checks"
echo "  - Run Tests"
echo "  - Security Scanning"
echo "  - Build Application"
echo ""
echo "✨ Branch protection is now active on 'main' branch!"