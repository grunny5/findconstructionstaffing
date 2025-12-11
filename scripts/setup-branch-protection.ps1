# PowerShell script to configure branch protection rules using GitHub CLI
# Requires: gh CLI installed and authenticated

Write-Host "🔒 Setting up branch protection rules for main branch..." -ForegroundColor Cyan

# Check if gh CLI is installed
try {
    $null = gh --version
} catch {
    Write-Host "❌ GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
try {
    $null = gh auth status
} catch {
    Write-Host "❌ Not authenticated with GitHub CLI." -ForegroundColor Red
    Write-Host "Please run: gh auth login" -ForegroundColor Yellow
    exit 1
}

# Get repository info
$repoInfo = gh repo view --json nameWithOwner -q .nameWithOwner
Write-Host "📦 Repository: $repoInfo" -ForegroundColor Green

# Configure branch protection for main branch
Write-Host "⚙️  Configuring protection rules..." -ForegroundColor Yellow

$protection = @{
    required_status_checks = @{
        strict = $true
        contexts = @(
            "Code Quality Checks",
            "Run Tests",
            "Security Scanning",
            "Build Application"
        )
    }
    enforce_admins = $true
    required_pull_request_reviews = @{
        dismiss_stale_reviews = $true
        require_code_owner_reviews = $false
        required_approving_review_count = 1
        require_last_push_approval = $false
    }
    restrictions = $null
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_conversation_resolution = $false
    lock_branch = $false
    allow_fork_syncing = $false
} | ConvertTo-Json -Depth 10 -Compress

gh api "repos/$repoInfo/branches/main/protection" `
    --method PUT `
    --input - `
    <<< $protection

Write-Host "✅ Branch protection rules configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of protection rules:" -ForegroundColor Cyan
Write-Host "  - Require PR reviews: Yes (1 approval required)"
Write-Host "  - Dismiss stale reviews: Yes"
Write-Host "  - Require status checks: Yes (strict mode)"
Write-Host "  - Require up-to-date branch: Yes"
Write-Host "  - Include administrators: Yes"
Write-Host "  - Allow force pushes: No"
Write-Host "  - Allow deletions: No"
Write-Host ""
Write-Host "🔍 Required status checks:" -ForegroundColor Cyan
Write-Host "  - Code Quality Checks"
Write-Host "  - Run Tests"
Write-Host "  - Security Scanning"
Write-Host "  - Build Application"
Write-Host ""
Write-Host "✨ Branch protection is now active on 'main' branch!" -ForegroundColor Green