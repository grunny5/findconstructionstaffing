# PowerShell script to install Supabase CLI on Windows

Write-Host "🚀 Installing Supabase CLI for Windows" -ForegroundColor Cyan
Write-Host ""

# Check if scoop is installed
if (Get-Command scoop -ErrorAction SilentlyContinue) {
    Write-Host "✅ Scoop is installed" -ForegroundColor Green
    
    # Add Supabase bucket
    Write-Host "Adding Supabase bucket..." -ForegroundColor Yellow
    try {
        $LASTEXITCODE = 0
        scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to add Supabase bucket"
        }
    } catch {
        Write-Host "❌ Error adding Supabase bucket: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
        Write-Host "1. Check your internet connection" -ForegroundColor White
        Write-Host "2. Verify GitHub is accessible" -ForegroundColor White
        Write-Host "3. Try running: scoop update" -ForegroundColor White
        Write-Host "4. Check if bucket already exists: scoop bucket list" -ForegroundColor White
        exit 1
    }
    
    # Verify bucket was added
    $bucketCheck = scoop bucket list | Select-String "supabase"
    if (-not $bucketCheck) {
        Write-Host "❌ Supabase bucket was not added properly" -ForegroundColor Red
        $buckets = scoop bucket list
        Write-Host "Current buckets: $buckets" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Supabase bucket added successfully" -ForegroundColor Green
    
    # Install Supabase
    Write-Host "Installing Supabase CLI..." -ForegroundColor Yellow
    try {
        $LASTEXITCODE = 0
        scoop install supabase
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install Supabase CLI"
        }
    } catch {
        Write-Host "❌ Error installing Supabase CLI: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
        Write-Host "1. Try updating scoop: scoop update" -ForegroundColor White
        Write-Host "2. Check available versions: scoop search supabase" -ForegroundColor White
        Write-Host "3. Remove and re-add bucket:" -ForegroundColor White
        Write-Host "   scoop bucket rm supabase" -ForegroundColor Cyan
        Write-Host "   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git" -ForegroundColor Cyan
        Write-Host "4. Check scoop status: scoop status" -ForegroundColor White
        exit 1
    }
    
    # Verify installation
    if (Get-Command supabase -ErrorAction SilentlyContinue) {
        Write-Host "✅ Supabase CLI installed successfully!" -ForegroundColor Green
        Write-Host ""
        try {
            $version = supabase --version
            Write-Host "Installed version: $version" -ForegroundColor Cyan
        } catch {
            Write-Host "⚠️ Supabase CLI installed but version check failed: $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Supabase CLI installation failed - command not found" -ForegroundColor Red
        Write-Host "Try restarting your terminal or running: scoop reset supabase" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "❌ Scoop is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install Scoop, run this in PowerShell:" -ForegroundColor Yellow
    Write-Host 'irm get.scoop.sh | iex' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing Scoop, run this script again."
    Write-Host ""
    Write-Host "Alternative: Download directly from GitHub" -ForegroundColor Yellow
    Write-Host "1. Visit: https://github.com/supabase/cli/releases" -ForegroundColor White
    Write-Host "2. Download: supabase_windows_amd64.tar.gz" -ForegroundColor White
    Write-Host "3. Extract and add to PATH" -ForegroundColor White
}